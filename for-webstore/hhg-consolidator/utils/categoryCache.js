// Category cache to avoid re-categorizing same items
class CategoryCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000; // Limit cache size to prevent memory issues
  }
  
  // Generate cache key from item properties
  getCacheKey(itemName, itemSize = 'no-size', modifiers = {}) {
    // Create a stable key from item properties
    const modifierKey = modifiers.riceSubstitution || '';
    return `${itemName}|${itemSize}|${modifierKey}`.toLowerCase();
  }
  
  get(itemName, itemSize, modifiers) {
    const key = this.getCacheKey(itemName, itemSize, modifiers);
    return this.cache.get(key);
  }
  
  set(itemName, itemSize, modifiers, categoryInfo) {
    // Implement simple LRU by removing oldest entries when at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const key = this.getCacheKey(itemName, itemSize, modifiers);
    this.cache.set(key, categoryInfo);
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

// Create singleton instance
const categoryCache = new CategoryCache();

// Make it available globally
if (typeof window !== 'undefined') {
  window.categoryCache = categoryCache;
}