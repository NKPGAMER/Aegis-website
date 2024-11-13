import { world, system } from '@minecraft/server';

/**
 * Configuration constants
 */
const CONFIG = {
    CHUNK_SIZE: 30000, // Maximum size of each chunk for storage
    DB_PREFIX: 'DB_', // Prefix for all database keys
    SAVE_DELAY: 2, // Delay in ticks (2 ticks = ~100ms)
    MAX_RETRIES: 3, // Maximum save retry attempts
    DEBUG: false // Enable/disable debug logging
};

/**
 * Error messages
 */
const ERRORS = {
    INVALID_KEY: 'Invalid key: Key must be a non-empty string',
    INVALID_NAME: 'Invalid database name: Name must be a non-empty string',
    SETUP_ERROR: 'Database setup error: Improper configuration detected',
    SAVE_ERROR: 'Failed to save database after maximum retries',
    LOAD_ERROR: 'Failed to load database data',
    SAVE_CANCELLED: 'Save operation was cancelled'
};

/**
 * Debug logging utility
 */
const debug = {
    log: (...args) => CONFIG.DEBUG && console.warn('[Database:Debug]', ...args),
    error: (...args) => console.error('[Database:Error]', ...args),
    warn: (...args) => console.warn('[Database:Warning]', ...args)
};

/**
 * Global storage for database instances
 */
const globalData = new Map();

/**
 * Database class for managing persistent data storage
 */
class Database {
    #name;
    #store;
    #taskQueue;
    #isProcessing;
    #pendingSave;
    #saveRunId;
    #saveRetries;
    #currentSaveController;
    #isSaving;
    #lastSaveTime;

    /**
     * Create or retrieve a Database instance
     * @param {string} name Database name
     * @throws {Error} If name is invalid
     */
    constructor(name) {
        if (!this.#isValidName(name)) {
            throw new Error(ERRORS.INVALID_NAME);
        }

        // Return existing instance if available
        if (globalData.has(name)) {
            return globalData.get(name);
        }

        // Initialize new instance
        this.#name = name;
        this.#taskQueue = [];
        this.#isProcessing = false;
        this.#pendingSave = false;
        this.#saveRetries = 0;
        this.#isSaving = false;
        this.#lastSaveTime = 0;
        this.#store = this.#getOrInitializeData();
        this.#currentSaveController = null;
        this.#saveRunId = null;

        // Register in global storage
        globalData.set(name, this);
    }

    /**
     * Validate database name
     * @private
     */
    #isValidName(name) {
        return typeof name === 'string' && name.trim().length > 0;
    }

    /**
     * Validate key
     * @private
     */
    #isValidKey(key) {
        return typeof key === 'string' && key.trim().length > 0;
    }

    /**
     * Get property key for world storage
     * @private
     */
    #getPropertyKey(index = '') {
        return `${CONFIG.DB_PREFIX}${this.#name}${index ? '_' + index : ''}`;
    }

    /**
     * Initialize or get existing database data
     * @private
     */
    #getOrInitializeData() {
        try {
            const length = world.getDynamicProperty(this.#getPropertyKey()) ?? 0;

            if (!Number.isInteger(length) || length < 0) {
                throw new Error(ERRORS.SETUP_ERROR);
            }

            if (length === 0) {
                const newData = new Map();
                return newData;
            }

            const chunks = Array.from(
                { length },
                (_, i) => world.getDynamicProperty(this.#getPropertyKey(i)) ?? ''
            );

            return new Map(JSON.parse(chunks.join('')));
        } catch (error) {
            debug.error(`Initialize ${this.#name}:`, error);
            return new Map();
        }
    }

    /**
     * Cancel current save operation
     * @private
     */
    #cancelCurrentSave() {
        if (this.#currentSaveController) {
            this.#currentSaveController.abort();
            this.#currentSaveController = null;
        }
        if (this.#saveRunId !== null) {
            system.clearRun(this.#saveRunId);
            this.#saveRunId = null;
        }
        this.#saveRetries = 0;
        this.#isSaving = false;
    }

    /**
     * Process task queue
     * @private
     */
    async #processQueue() {
        if (this.#isProcessing) return;

        this.#isProcessing = true;
        while (this.#taskQueue.length > 0) {
            const task = this.#taskQueue.shift();
            try {
                await task();
            } catch (error) {
                debug.error(`ProcessQueue ${this.#name}:`, error);
            }
        }
        this.#isProcessing = false;
    }

    /**
     * Add task to queue
     * @private
     */
    async #enqueue(task) {
        this.#taskQueue.push(task);
        if (!this.#isProcessing) {
            await this.#processQueue();
        }
    }

    /**
     * Schedule a save operation
     * @private
     */
    #scheduleSave() {
        if (this.#saveRunId !== null) {
            system.clearRun(this.#saveRunId);
        }

        this.#saveRunId = system.runTimeout(async () => {
            if (this.#pendingSave && !this.#isSaving) {
                await this.save();
                this.#pendingSave = false;
            }
        }, CONFIG.SAVE_DELAY);
    }

    /**
     * Save data to world storage
     * @public
     * @returns {Promise<void>}
     * @throws {Error} If save fails after maximum retries
     */
    async save() {
        // Prevent concurrent saves
        if (this.#isSaving) {
            debug.log(`${this.#name}: Save already in progress, cancelling current save`);
            this.#cancelCurrentSave();
        }

        this.#isSaving = true;
        this.#currentSaveController = new AbortController();
        const signal = this.#currentSaveController.signal;

        try {
            const serialized = JSON.stringify([...this.#store]);
            const chunks = serialized.match(new RegExp(`.{1,${CONFIG.CHUNK_SIZE}}`, 'g')) || [];

            if (signal.aborted) {
                throw new Error(ERRORS.SAVE_CANCELLED);
            }

            // Save length first
            world.setDynamicProperty(this.#getPropertyKey(), chunks.length);

            // Save chunks
            for (let i = 0; i < chunks.length; i++) {
                if (signal.aborted) {
                    throw new Error(ERRORS.SAVE_CANCELLED);
                }
                world.setDynamicProperty(this.#getPropertyKey(i), chunks[i]);
            }

            this.#lastSaveTime = Date.now();
            this.#saveRetries = 0;
            this.#isSaving = false;
            this.#currentSaveController = null;

            debug.log(`${this.#name}: Save completed successfully`);
        } catch (error) {
            if (error.message === ERRORS.SAVE_CANCELLED) {
                debug.log(`${this.#name}: Save operation cancelled`);
                this.#isSaving = false;
                return;
            }

            this.#saveRetries++;
            debug.error(`${this.#name} (Attempt ${this.#saveRetries}):`, error);

            if (this.#saveRetries < CONFIG.MAX_RETRIES) {
                this.#isSaving = false;
                this.#saveRunId = system.runTimeout(() => this.save(), CONFIG.SAVE_DELAY);
                return;
            } else {
                this.#saveRetries = 0;
                this.#isSaving = false;
                this.#currentSaveController = null;
                throw new Error(ERRORS.SAVE_ERROR);
            }
        }
    }

    /**
     * Clear all data
     * @public
     */
    clear() {
        this.#cancelCurrentSave();
        this.#store.clear();

        const prefix = this.#getPropertyKey();
        world.getDynamicPropertyIds()
            .filter(key => key.startsWith(prefix))
            .forEach(key => world.setDynamicProperty(key, undefined));

        world.setDynamicProperty(prefix, 0);
        debug.log(`${this.#name}: Database cleared`);
    }

    /**
     * Set a value
     * @public
     */
    async set(key, value) {
        if (!this.#isValidKey(key)) {
            throw new Error(ERRORS.INVALID_KEY);
        }

        return this.#enqueue(() => {
            const oldValue = this.#store.get(key);
            if (value !== oldValue) {
                this.#store.set(key, value);
                this.#pendingSave = true;
                this.#scheduleSave();
                debug.log(`${this.#name}: Set ${key} = ${value}`);
            }
        });
    }

    /**
     * Delete a value
     * @public
     */
    async delete(key) {
        if (!this.#isValidKey(key)) {
            throw new Error(ERRORS.INVALID_KEY);
        }

        return this.#enqueue(() => {
            const deleted = this.#store.delete(key);
            if (deleted) {
                this.#pendingSave = true;
                this.#scheduleSave();
                debug.log(`${this.#name}: Deleted ${key}`);
            }
            return deleted;
        });
    }

    /**
     * Get a value
     * @public
     */
    get(key) {
        return this.#store.get(key);
    }

    /**
     * Check if key exists
     * @public
     */
    has(key) {
        return this.#store.has(key);
    }

    /**
     * Get all keys
     * @public
     */
    keys() {
        return Array.from(this.#store.keys());
    }

    /**
     * Get all values
     * @public
     */
    values() {
        return Array.from(this.#store.values());
    }

    /**
     * Get all entries
     * @public
     */
    entries() {
        return Array.from(this.#store.entries());
    }

    /**
     * Get number of entries
     * @public
     */
    get size() {
        return this.#store.size;
    }

    /**
     * Get database name
     * @public
     */
    get name() {
        return this.#name;
    }

    /**
     * Get last save time
     * @public
     */
    get lastSaveTime() {
        return this.#lastSaveTime;
    }

    /**
     * Check if save is in progress
     * @public
     */
    get isSaving() {
        return this.#isSaving;
    }

    /**
     * Clear null/undefined values
     * @public
     */
    async clearVoid() {
        return this.#enqueue(() => {
            let hasChanges = false;
            for (const [key, value] of this.#store) {
                if (value == null) {
                    this.#store.delete(key);
                    hasChanges = true;
                }
            }
            if (hasChanges) {
                this.#pendingSave = true;
                this.#scheduleSave();
                debug.log(`${this.#name}: Cleared void values`);
            }
        });
    }

    /**
     * Iterate over entries
     * @public
     */
    forEach(callback) {
        this.#store.forEach(callback);
    }

    /**
     * Make database iterable
     * @public
     */
    *[Symbol.iterator]() {
        yield* this.#store;
    }
}

/**
 * Cleanup world dynamic properties
 * @public
 */
async function cleanupDynamicProperties() {
    const data = new Map();
    const dynamicPropertyIds = world.getDynamicPropertyIds();

    for (const id of dynamicPropertyIds) {
        const value = world.getDynamicProperty(id);
        if (value != null) {
            data.set(id, value);
        }
    }

    world.clearDynamicProperties();

    for (const [key, value] of data.entries()) {
        world.setDynamicProperty(key, value);
    }
}

export { Database, cleanupDynamicProperties };