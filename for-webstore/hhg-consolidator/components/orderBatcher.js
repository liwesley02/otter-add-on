console.log('[OrderBatcher.js] Script loaded at:', new Date().toISOString());

class OrderBatcher {
  constructor(itemMatcher) {
    this.itemMatcher = itemMatcher;
    this.batches = new Map();
    this.orders = new Map(); // Store full order data
  }

  addOrder(order) {
    // Store the full order data
    this.orders.set(order.id, order);
    
    order.items.forEach(item => {
      // Generate key with size, category, base name, and rice substitution
      const key = this.itemMatcher.generateItemKey(
        item.baseName || item.name, 
        item.size, 
        item.category,
        item.riceSubstitution
      );
      
      if (!this.batches.has(key)) {
        console.log(`[OrderBatcher] Creating new batch for key: ${key}`);
        console.log(`[OrderBatcher] Item categoryInfo:`, JSON.stringify(item.categoryInfo));
        this.batches.set(key, {
          name: item.baseName || item.name,
          fullName: item.name, // Full name with modifiers
          originalName: item.name,
          size: item.size || 'no-size',
          price: item.price,
          category: item.category,
          categoryInfo: item.categoryInfo, // Store full category info
          modifiers: item.modifiers || [], // Store modifiers
          isUrbanBowl: item.isUrbanBowl || false,
          isRiceBowl: item.isRiceBowl || false,
          riceSubstitution: item.riceSubstitution || null,
          orders: [],
          totalQuantity: 0
        });
        console.log(`[OrderBatcher] Batch created with categoryInfo:`, JSON.stringify(this.batches.get(key).categoryInfo));
      }
      
      const batch = this.batches.get(key);
      batch.orders.push({
        orderId: order.id,
        orderNumber: order.number,
        quantity: item.quantity || 1,
        timestamp: order.timestamp,
        isNew: order.isNew || false
      });
      batch.totalQuantity += (item.quantity || 1);
    });
  }
  
  getOrderById(orderId) {
    return this.orders.get(orderId);
  }
  
  getAllOrders() {
    return Array.from(this.orders.values());
  }

  getBatchedItems() {
    const batchedArray = Array.from(this.batches.values());
    
    return batchedArray.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return b.totalQuantity - a.totalQuantity;
    });
  }

  getBatchesByCategory() {
    const categorized = {};
    
    console.log('[OrderBatcher] Getting batches by category. Total batches:', this.batches.size);
    
    this.batches.forEach((batch, key) => {
      const category = batch.category || 'uncategorized';
      const categoryInfo = batch.categoryInfo;
      
      console.log('[OrderBatcher] Processing batch:', {
        key: key,
        name: batch.name,
        category: category,
        categoryInfo: categoryInfo,
        isRiceBowl: batch.isRiceBowl,
        topCategory: categoryInfo?.topCategory,
        subCategory: categoryInfo?.subCategory
      });
      
      // For hierarchical categories (food types with protein subcategories)
      if (categoryInfo && categoryInfo.subCategory && 
          ['riceBowls', 'urbanBowls', 'noodles', 'friedRice'].includes(category)) {
        // Create nested structure for food types
        if (!categorized[category]) {
          categorized[category] = {
            name: categoryInfo.topCategoryName,
            subcategories: {},
            items: [] // For items without subcategory
          };
        }
        
        const subcategory = categoryInfo.subCategory;
        if (!categorized[category].subcategories[subcategory]) {
          categorized[category].subcategories[subcategory] = {
            name: categoryInfo.subCategoryName,
            items: []
          };
        }
        
        categorized[category].subcategories[subcategory].items.push(batch);
        console.log('[OrderBatcher] Added to subcategory:', subcategory, 'in category:', category);
      } else {
        // Regular categories (non-hierarchical)
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(batch);
      }
    });
    
    // Sort items within categories and subcategories
    Object.keys(categorized).forEach(category => {
      if (Array.isArray(categorized[category])) {
        // Regular category
        categorized[category].sort((a, b) => b.totalQuantity - a.totalQuantity);
      } else {
        // Hierarchical category
        Object.keys(categorized[category].subcategories).forEach(subcategory => {
          categorized[category].subcategories[subcategory].items.sort(
            (a, b) => b.totalQuantity - a.totalQuantity
          );
        });
      }
    });
    
    return categorized;
  }
  
  getBatchesBySize() {
    const sizeGroups = {
      'small': { name: 'Small', categories: {} },
      'medium': { name: 'Medium', categories: {} },
      'large': { name: 'Large', categories: {} },
      'regular': { name: 'Regular', categories: {} },
      'no-size': { name: 'No Size', categories: {} }
    };
    
    this.batches.forEach((batch) => {
      const sizeKey = batch.size ? batch.size.toLowerCase() : 'no-size';
      const category = batch.category || 'uncategorized';
      
      if (!sizeGroups[sizeKey]) {
        sizeGroups[sizeKey] = { name: batch.size, categories: {} };
      }
      
      if (!sizeGroups[sizeKey].categories[category]) {
        sizeGroups[sizeKey].categories[category] = [];
      }
      
      sizeGroups[sizeKey].categories[category].push(batch);
    });
    
    // Sort items within each category by quantity
    Object.values(sizeGroups).forEach(sizeGroup => {
      Object.values(sizeGroup.categories).forEach(items => {
        items.sort((a, b) => b.totalQuantity - a.totalQuantity);
      });
    });
    
    return sizeGroups;
  }

  clearBatches() {
    this.batches.clear();
  }

  removeBatch(itemKey) {
    this.batches.delete(itemKey);
  }

  updateBatchQuantity(itemKey, orderId, newQuantity) {
    const batch = this.batches.get(itemKey);
    if (!batch) return;
    
    const orderIndex = batch.orders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return;
    
    const oldQuantity = batch.orders[orderIndex].quantity;
    batch.orders[orderIndex].quantity = newQuantity;
    batch.totalQuantity = batch.totalQuantity - oldQuantity + newQuantity;
    
    if (newQuantity === 0) {
      batch.orders.splice(orderIndex, 1);
      if (batch.orders.length === 0) {
        this.batches.delete(itemKey);
      }
    }
  }
  
  getAllOrders() {
    return Array.from(this.orders.values());
  }
}

// Make available globally
window.OrderBatcher = OrderBatcher;