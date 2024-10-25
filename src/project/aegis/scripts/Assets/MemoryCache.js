const DATA = new Map();

class MemoryCache {
  constructor(name) {
    this.name = name;
    this.memory = DATA.get(name) || DATA.set(name, new Map()).get(name);
  }
  
  set(key, value) {
    return this.memory.set(key, value);
  }
  
  get(key) {
    return this.memory.get(key);
  }
  
  has(key) {
    return this.memory.has(key);
  }
  
  delete(key) {
    return this.memory.delete(key);
  }
  
  clear() {
    return this.memory.clear();
  }
  
  keys() {
    return [...this.memory.keys()];
  }
  
  values() {
    return [...this.memory.values()];
  }
  
  entries() {
    return [...this.memory.entries()];
  }
  
  forEach(callback) {
    this.memory.forEach(callback);
  }
  
  toString() {
    return JSON.stringify([...this.memory]);
  }
  
  clearVoid() {
    for (const [key, value] of this.memory) {
      if (value === undefined) this.memory.delete(key);
    }
  }
}

export { MemoryCache };