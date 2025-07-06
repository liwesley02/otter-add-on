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
        this.batches.set(key, {
          name: item.baseName || item.name,
          fullName: item.name, // Full name with modifiers
          originalName: item.name,
          size: item.size || 'no-size',
          price: item.price,
          category: item.category,
          isUrbanBowl: item.isUrbanBowl || false,
          riceSubstitution: item.riceSubstitution || null,
          orders: [],
          totalQuantity: 0
        });
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
    
    this.batches.forEach((batch) => {
      const category = batch.category || 'uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(batch);
    });
    
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => b.totalQuantity - a.totalQuantity);
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