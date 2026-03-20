// In-memory cache (replaces Redis for dev simplicity)
const config = require('../config');

const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttl = config.cache.ttl) {
  store.set(key, {
    value,
    expiry: Date.now() + ttl,
  });
}

function del(key) {
  store.delete(key);
}

function clear() {
  store.clear();
}

module.exports = { get, set, del, clear };
