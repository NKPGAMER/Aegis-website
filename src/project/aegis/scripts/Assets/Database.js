import { world } from '@minecraft/server';

/**
 * Configuration constants
 */
const CONFIG = {
  CHUNK_SIZE: 30000,
  DB_PREFIX: 'DB_',
  SAVE_DELAY: 100, // ms
  MAX_RETRIES: 3
};

/**
 * Error messages
 */
const ERRORS = {
  INVALID_KEY: 'Invalid key: Key must be a non-empty string',
  INVALID_NAME: 'Invalid database name: Name must be a non-empty string',
  SETUP_ERROR: 'Database setup error: Improper configuration detected',
  SAVE_ERROR: 'Failed to save database after maximum retries',
  LOAD_ERROR: 'Failed to load database data'
};

/**
 * Global storage for sharing data between database instances
 */
const globalData = new Map();

/**
 * Database class for managing persistent data storage
 */
class Database {
  #name;
  #data;
  #taskQueue;
  #isProcessing;
  #pendingSave;
  #saveTimeout;
  #saveRetries;

  /**
   * Create a new Database instance
   * @param {string} name - The name of the database
   * @throws {Error} If name is invalid
   */
  constructor(name) {
    if (!this.#isValidName(name)) {
      throw new Error(ERRORS.INVALID_NAME);
    }

    this.#name = name;
    this.#taskQueue = [];
    this.#isProcessing = false;
    this.#pendingSave = false;
    this.#saveRetries = 0;
    this.#data = this.#getOrInitializeData();
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
    if (globalData.has(this.#name)) {
      return globalData.get(this.#name);
    }

    try {
      const length = world.getDynamicProperty(this.#getPropertyKey()) ?? 0;
      
      if (!Number.isInteger(length) || length < 0) {
        throw new Error(ERRORS.SETUP_ERROR);
      }

      if (length === 0) {
        const newData = new Map();
        globalData.set(this.#name, newData);
        return newData;
      }

      const chunks = Array.from(
        { length },
        (_, i) => world.getDynamicProperty(this.#getPropertyKey(i)) ?? ''
      );

      const data = new Map(JSON.parse(chunks.join('')));
      globalData.set(this.#name, data);
      return data;
      
    } catch (error) {
      console.warn(`[Database:initialize] ${this.#name}:`, error);
      this.clear();
      return globalData.get(this.#name);
    }
  }

  /**
   * Schedule a save operation
   * @private
   */
  #scheduleSave() {
    if (this.#saveTimeout) {
      clearTimeout(this.#saveTimeout);
    }

    this.#saveTimeout = setTimeout(() => {
      if (this.#pendingSave) {
        this.save();
        this.#pendingSave = false;
      }
    }, CONFIG.SAVE_DELAY);
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
   * Process queued tasks
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
        console.error(`[Database:processQueue] ${this.#name}:`, error);
      }
    }
    this.#isProcessing = false;
  }

  /**
   * Clear all data
   * @public
   */
  clear() {
    this.#data = new Map();
    globalData.set(this.#name, this.#data);

    const prefix = this.#getPropertyKey();
    world.getDynamicPropertyIds()
      .filter(key => key.startsWith(prefix))
      .forEach(key => world.setDynamicProperty(key, undefined));

    world.setDynamicProperty(prefix, 0);
  }

  /**
   * Save data to world storage
   * @public
   * @throws {Error} If save fails after maximum retries
   */
  save() {
    try {
      const serialized = JSON.stringify([...this.#data]);
      const chunks = serialized.match(new RegExp(`.{1,${CONFIG.CHUNK_SIZE}}`, 'g')) || [];

      world.setDynamicProperty(this.#getPropertyKey(), chunks.length);
      chunks.forEach((chunk, i) =>
        world.setDynamicProperty(this.#getPropertyKey(i), chunk)
      );

      this.#saveRetries = 0;
    } catch (error) {
      this.#saveRetries++;
      console.error(`[Database:save] ${this.#name} (Attempt ${this.#saveRetries}):`, error);

      if (this.#saveRetries < CONFIG.MAX_RETRIES) {
        setTimeout(() => this.save(), CONFIG.SAVE_DELAY);
      } else {
        this.#saveRetries = 0;
        throw new Error(ERRORS.SAVE_ERROR);
      }
    }
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
      this.#data.set(key, value);
      this.#pendingSave = true;
      this.#scheduleSave();
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
      const deleted = this.#data.delete(key);
      if (deleted) {
        this.#pendingSave = true;
        this.#scheduleSave();
      }
      return deleted;
    });
  }

  /**
   * Clear null/undefined values
   * @public
   */
  async clearVoid() {
    return this.#enqueue(() => {
      let hasChanges = false;
      for (const [key, value] of this.#data) {
        if (value == null) {
          this.#data.delete(key);
          hasChanges = true;
        }
      }
      if (hasChanges) {
        this.#pendingSave = true;
        this.#scheduleSave();
      }
    });
  }

  /**
   * Get database size
   * @public
   */
  get size() {
    return this.#data.size;
  }

  /**
   * Get database name
   * @public
   */
  get name() {
    return this.#name;
  }

  /**
   * Check if a key exists
   * @public
   */
  has(key) {
    return this.#data.has(key);
  }

  /**
   * Get a value
   * @public
   */
  get(key) {
    return this.#data.get(key);
  }

  /**
   * Get all keys
   * @public
   */
  keys() {
    return Array.from(this.#data.keys());
  }

  /**
   * Get all values
   * @public
   */
  values() {
    return Array.from(this.#data.values());
  }

  /**
   * Get all entries
   * @public
   */
  entries() {
    return Array.from(this.#data.entries());
  }

  /**
   * Iterate over entries
   * @public
   */
  forEach(callback) {
    this.#data.forEach(callback);
  }

  /**
   * Make database iterable
   * @public
   */
  *[Symbol.iterator]() {
    yield* this.#data;
  }

  /**
   * Clean up invalid dynamic properties
   * @public
   * @static
   */
  static async cleanupDynamicProperties() {
    const validProperties = world.getDynamicPropertyIds()
      .reduce((acc, id) => {
        const value = world.getDynamicProperty(id);
        if (value != null) {
          acc.set(id, value);
        }
        return acc;
      }, new Map());

    world.clearDynamicProperties();
    
    for (const [id, value] of validProperties) {
      world.setDynamicProperty(id, value);
    }
  }
}

export { Database };