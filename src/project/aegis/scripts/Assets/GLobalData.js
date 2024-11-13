class GlobalData {
  static instance = null;
  constructor() {
    if (GlobalData.instance) {
      return GlobalData.instance;
    }
    this.store = new Map();
    this.subscribers = new Map();
    GlobalData.instance = this;
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
  }

  unsubscribe(key, callback) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).delete(callback);
    }
  }

  notify(key, value) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(callback => callback(value));
    }
  }

  set(key, value) {
    this.store.set(key, value);
    this.notify(key, value);
  }

  get(key) {
    return this.store.get(key);
  }

  has(key) {
    return this.store.has(key);
  }

  delete(key) {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.notify(key, undefined);
    }
    return deleted;
  }

  clear() {
    this.store.clear();
    this.subscribers.clear();
  }

  size() {
    return this.store.size;
  }

  keys() {
    return this.store.keys();
  }

  values() {
    return this.store.values();
  }

  entries() {
    return this.store.entries();
  }

  forEach(callback) {
    this.store.forEach((value, key) => callback(value, key, this.store));
  }
}

export { GlobalData };