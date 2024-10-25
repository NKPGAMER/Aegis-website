import { world } from '@minecraft/server';

const globalData = new Map();
const chunkRegex = /.{1,30000}/g;

class Database {
  constructor(name) {
    this.name = name;
    this.data = globalData.get(name) || this.initializeData();
    this.taskQueue = [];
    this.isProcessing = false;
  }

  initializeData() {
    try {
      const length = world.getDynamicProperty(`DB_${this.name}`) || 0;
      if (typeof length !== 'number' || length < 0) throw new Error(`[DATABASE]: ${this.name}, improper setup! Resetting data.`);

      const result = Array.from({ length }, (_, i) => world.getDynamicProperty(`DB_${this.name}_${i}`) || '').join('');
      this.data = result ? new Map(JSON.parse(result)) : new Map();
    } catch (error) {
      console.error('[Database:initializeData] There was a problem initializing the database! Attempting to repair');
      this.clear();
    }
    return globalData.set(this.name, this.data).get(this.name);
  }

  clear() {
    this.data = new Map();
    world.getDynamicPropertyIds()
      .filter(key => key.startsWith(`DB_${this.name}`))
      .forEach(key => world.setDynamicProperty(key, undefined));
    world.setDynamicProperty(`DB_${this.name}`, 0);
  }

  save() {
    const chunks = JSON.stringify([...this.data]).match(chunkRegex) || [];
    world.setDynamicProperty(`DB_${this.name}`, chunks.length);
    chunks.forEach((data, i) => world.setDynamicProperty(`DB_${this.name}_${i}`, data));
  }

  async set(key, value) {
    return this.enqueue(() => {
      this.data.set(key, value);
      this.save();
    });
  }

  get(key) { return this.data.get(key); }
  keys() { return [...this.data.keys()]; }
  values() { return [...this.data.values()]; }
  entries() { return [...this.data.entries()]; }
  has(key) { return this.data.has(key); }
  forEach(callback) { this.data.forEach(callback); }
  *[Symbol.iterator]() { yield* this.data; }

  async delete(key) {
    return this.enqueue(() => {
      this.data.delete(key);
      this.save();
    });
  }

  async enqueue(task) {
    this.taskQueue.push(task);
    if (!this.isProcessing) await this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (this.taskQueue.length) {
      try {
        await this.taskQueue.shift()();
      } catch (error) {
        console.error('[Database:processQueue] Task execution failed:', error);
      }
    }
    this.isProcessing = false;
  }
  
  async clearVoid() {
    return this.enqueue(() => {
      for (const [key, value] of this.data) {
        if (value == null) this.data.delete(key);
      }
      this.save();
    });
  }
  
  static async cleanupDynamicProperties() {
    const validProperties = new Map(
      world.getDynamicPropertyIds()
        .map(id => [id, world.getDynamicProperty(id)])
        .filter(([, value]) => value != null)
    );
    
    world.clearDynamicProperties();
    validProperties.forEach((value, id) => world.setDynamicProperty(id, value));
  }
}

export { Database };