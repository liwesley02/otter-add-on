if (window.logger) {
  window.logger.log('[BatchManager.js] Script loaded at:', new Date().toISOString());
}

class BatchManager {
  // Order completion tracking
  static COMPLETED_ORDER_TIMEOUT = 30 * 1000; // 30 seconds
  constructor() {
    this.batches = [];
    this.completedBatches = [];
    this.autoBatchTimer = null;
    this.maxBatchCapacity = 5; // Default batch size is 5
    this.currentBatchIndex = 0;
    this.nextBatchNumber = 1;
    
    // FIFO batching - no time-based assignment
    // Orders stay in their original batch
    
    this.loadSettings();
    this.initializeBatches();
  }
  
  initializeBatches() {
    // Create first batch
    this.createNewBatch();
  }
  
  get currentBatch() {
    // Ensure we always have at least one batch
    if (this.batches.length === 0) {
      this.createNewBatch();
    }
    return this.batches[this.currentBatchIndex] || this.batches[0];
  }
  
  getBatchForOrder(order) {
    // FIFO: Always assign to current batch unless it's full or locked
    const currentBatch = this.currentBatch;
    
    // Check if current batch is full or locked
    if (currentBatch.locked || currentBatch.orders.size >= this.maxBatchCapacity) {
      // Find first unlocked batch with space
      for (const batch of this.batches) {
        if (!batch.locked && batch.orders.size < this.maxBatchCapacity) {
          return batch;
        }
      }
      // No unlocked batches with space, create new one
      return this.createNewBatch();
    }
    
    return currentBatch;
  }
  
  assignOrderToBatches(orders) {
    if (window.logger) {
      window.logger.log(`[BatchManager] Assigning ${orders.length} orders to batches`);
    }
    
    // Track which orders are already in batches
    const existingOrderIds = new Set();
    const currentOrderIds = new Set();
    
    // Get all current order IDs from incoming orders
    orders.forEach(order => currentOrderIds.add(order.id));
    
    this.batches.forEach(batch => {
      batch.orders.forEach((order, id) => {
        existingOrderIds.add(id);
        
        // Mark orders as completed if they're no longer in the current list
        if (!currentOrderIds.has(id) && !order.completed) {
          order.completed = true;
          order.completedAt = Date.now();
        }
      });
    });
    
    // Sort all orders by timestamp (oldest first) for true FIFO
    const sortedOrders = [...orders].sort((a, b) => {
      // First by timestamp if available
      if (a.timestamp && b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      // Then by wait time (higher wait time = older order)
      return (b.waitTime || 0) - (a.waitTime || 0);
    });
    
    // Clear items from all UNLOCKED batches only
    this.batches.forEach(batch => {
      if (!batch.locked) {
        const itemCount = batch.items.size;
        batch.items.clear();
        console.log(`[BatchManager] Cleared ${itemCount} items from unlocked batch ${batch.number}`);
      }
    });
    
    // Process orders
    sortedOrders.forEach(order => {
      let batch;
      
      // Check if order is already assigned to a batch
      let orderBatch = null;
      for (const b of this.batches) {
        if (b.orders.has(order.id)) {
          orderBatch = b;
          break;
        }
      }
      
      if (orderBatch) {
        // Order already assigned, keep it in same batch
        batch = orderBatch;
        // Update the order data (in case wait time changed)
        batch.orders.set(order.id, order);
      } else {
        // New order, assign to appropriate batch
        batch = this.getBatchForOrder(order);
        // Add timestamp for new order tracking
        order.addedAt = Date.now();
        batch.orders.set(order.id, order);
        // Mark as new for highlighting
        batch.newOrderIds.add(order.id);
        
        // Check if batch should be locked
        if (batch.orders.size >= this.maxBatchCapacity) {
          batch.locked = true;
        }
      }
      
      // Process items for the batch
      order.items.forEach(item => {
        const key = `${item.size}|${item.category}|${item.baseName || item.name}`;
        
        if (!batch.items.has(key)) {
          if (window.logger) {
            window.logger.debug(`[BatchManager] Creating new batch item for: ${item.name}`);
          }
          const batchItem = {
            ...item,
            orderIds: [],
            totalQuantity: 0,
            batchQuantity: 0
          };
          batch.items.set(key, batchItem);
        }
        
        const batchItem = batch.items.get(key);
        // Only add this order's items if we haven't already processed this order
        if (!batchItem.orderIds.includes(order.id)) {
          batchItem.orderIds.push(order.id);
          const quantityToAdd = item.quantity || 1;
          batchItem.totalQuantity += quantityToAdd;
          batchItem.batchQuantity += quantityToAdd;
          console.log(`[BatchManager] Added ${quantityToAdd} of "${item.name}" from order ${order.id}. Total now: ${batchItem.totalQuantity}`);
        } else {
          console.log(`[BatchManager] Skipping duplicate item "${item.name}" from order ${order.id} - already processed`);
        }
      });
    });
  }
  
  async loadSettings() {
    const settings = await Storage.get('settings');
    if (settings && settings.maxBatchCapacity) {
      this.maxBatchCapacity = settings.maxBatchCapacity;
    } else if (settings && settings.maxWaveCapacity) {
      // Backward compatibility
      this.maxBatchCapacity = settings.maxWaveCapacity;
    }
    // Don't update existing batches - only affects new batches
  }

  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Time-based system doesn't allow manual adding - orders are assigned automatically
  refreshBatchAssignments(orders) {
    this.assignOrderToBatches(orders);
  }
  
  getCurrentBatchItemCount() {
    let totalItems = 0;
    const batch = this.currentBatch;
    if (batch && batch.items) {
      batch.items.forEach(item => {
        totalItems += item.batchQuantity || 0;
      });
    }
    return totalItems;
  }
  
  createNewBatch() {
    const newBatch = {
      id: this.generateBatchId(),
      number: this.nextBatchNumber++,
      name: `Batch ${this.nextBatchNumber - 1}`,
      items: new Map(),
      orders: new Map(),
      createdAt: Date.now(),
      status: 'active',
      capacity: this.maxBatchCapacity,
      locked: false,
      newOrderIds: new Set(),
      urgency: 'normal' // Will be updated based on oldest order
    };
    
    this.batches.push(newBatch);
    this.currentBatchIndex = this.batches.length - 1;
    
    console.log(`Created new batch #${newBatch.number}`);
    this.onNewBatchCreated?.(newBatch);
    
    return newBatch;
  }
  
  getCurrentBatch() {
    // Return the last batch that's not full or locked
    for (let i = this.batches.length - 1; i >= 0; i--) {
      const batch = this.batches[i];
      if (!batch.locked && batch.orders.size < this.maxBatchCapacity) {
        return batch;
      }
    }
    // All batches are full, create a new one
    return this.createNewBatch();
  }
  
  getBatchUrgency(batch) {
    // Calculate urgency based on oldest order in the batch
    let maxElapsedTime = 0;
    
    batch.orders.forEach(order => {
      if (!order.completed) {
        // Calculate elapsed time
        let elapsedTime = order.elapsedTime || 0;
        
        // If we have orderedAt, calculate current elapsed time
        if (order.orderedAt) {
          const orderedDate = new Date(order.orderedAt);
          const now = new Date();
          const elapsedMs = now - orderedDate;
          elapsedTime = Math.floor(elapsedMs / 60000); // Convert to minutes
        }
        
        maxElapsedTime = Math.max(maxElapsedTime, elapsedTime);
      }
    });
    
    // Determine urgency based on elapsed time
    if (maxElapsedTime >= 15) {
      return 'urgent'; // 15+ minutes old
    } else if (maxElapsedTime >= 8) {
      return 'warning'; // 8-15 minutes old
    } else {
      return 'normal'; // 0-8 minutes old
    }
  }

  removeItemFromBatch(itemKey, quantity = 1) {
    if (!this.currentBatch.items.has(itemKey)) return;
    
    const batchItem = this.currentBatch.items.get(itemKey);
    batchItem.batchQuantity -= quantity;
    
    if (batchItem.batchQuantity <= 0) {
      this.currentBatch.items.delete(itemKey);
    }
  }

  getCurrentBatchItems() {
    return Array.from(this.currentBatch.items.values());
  }
  
  getBatchItems(batchIndex) {
    if (batchIndex >= 0 && batchIndex < this.batches.length) {
      return Array.from(this.batches[batchIndex].items.values());
    }
    return [];
  }

  getBatchByCategory(batchIndex, categoryManager) {
    const batch = this.batches[batchIndex];
    if (!batch) return {};
    
    const categorized = {};
    
    batch.items.forEach((item, key) => {
      const category = item.category || 'uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push({
        ...item,
        key
      });
    });
    
    return categorized;
  }

  getCurrentBatchByCategory(categoryManager) {
    return this.getBatchByCategory(this.currentBatchIndex, categoryManager);
  }
  
  getBatchBySize(batchIndex) {
    const batch = this.batches[batchIndex];
    if (!batch) return {};
    
    const sizeGroups = {};
    
    batch.items.forEach((item, key) => {
      // Use the item's category (which should be the topCategory from categoryManager)
      let groupKey = item.category || 'other';
      let displayName = 'Other';
      
      // Get display name from categoryInfo if available
      if (item.categoryInfo && item.categoryInfo.topCategoryName) {
        displayName = item.categoryInfo.topCategoryName;
        groupKey = item.categoryInfo.topCategory || item.category || 'other';
      }
      
      // Sanitize key for object property
      const sanitizedKey = groupKey.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (!sizeGroups[sanitizedKey]) {
        sizeGroups[sanitizedKey] = { name: displayName, items: [] };
      }
      
      // Add item to the appropriate group
      const sizeGroupItem = {
        ...item,
        key
      };
      
      if (window.logger) {
        window.logger.debug(`[BatchManager] Adding item to group ${displayName}: ${sizeGroupItem.name}`);
      }
      
      sizeGroups[sanitizedKey].items.push(sizeGroupItem);
    });
    
    // Sort size groups in the order defined by categoryManager
    const orderedGroups = {};
    const categoryOrder = [
      'ricebowls',
      'rice-bowls',
      'urbanBowls',
      'urban-bowls',
      'bao',
      'meals',
      'appetizers',
      'dumplings',
      'desserts',
      'drinks',
      'sides',
      'chicken',
      'pork',
      'vegetarian',
      'other'
    ];
    
    // Add groups in predefined order
    categoryOrder.forEach(key => {
      if (sizeGroups[key]) {
        orderedGroups[key] = sizeGroups[key];
      }
    });
    
    // Add any remaining groups not in the predefined order
    Object.keys(sizeGroups).forEach(key => {
      if (!orderedGroups[key]) {
        orderedGroups[key] = sizeGroups[key];
      }
    });
    
    return orderedGroups;
  }
  
  getBatchItemCount(batch) {
    let count = 0;
    batch.items.forEach(item => {
      count += item.batchQuantity || item.totalQuantity || 0;
    });
    return count;
  }
  getAllBatches() {
    return this.batches.filter(batch => batch.status === 'active');
  }
  
  switchToBatch(batchIndex) {
    if (batchIndex >= 0 && batchIndex < this.batches.length) {
      this.currentBatchIndex = batchIndex;
      return true;
    }
    return false;
  }

  // Auto-batch functionality removed - batches are created as needed

  // Mark an order as completed
  markOrderCompleted(orderId) {
    console.log(`[BatchManager] Marking order ${orderId} as completed`);
    
    // Find the order across all batches
    for (const batch of this.batches) {
      if (batch.orders.has(orderId)) {
        const order = batch.orders.get(orderId);
        if (!order.completed) {
          order.completed = true;
          order.completedAt = Date.now();
          console.log(`[BatchManager] Order ${orderId} marked as completed in batch ${batch.number}`);
        }
        break;
      }
    }
  }

  // Remove completed orders that have been displayed for too long
  cleanupCompletedOrders() {
    const now = Date.now();
    const timeout = BatchManager.COMPLETED_ORDER_TIMEOUT;
    
    this.batches.forEach(batch => {
      batch.orders.forEach((order, orderId) => {
        if (order.completed && order.completedAt && (now - order.completedAt > timeout)) {
          // Remove the order from the batch
          batch.orders.delete(orderId);
          // Remove from new orders set if present
          batch.newOrderIds.delete(orderId);
        }
      });
    });
  }
  
  // Clear "new" status from orders after 30 seconds
  clearNewOrderStatus() {
    const now = Date.now();
    const NEW_ORDER_TIMEOUT = 30000; // 30 seconds
    
    this.batches.forEach(batch => {
      batch.newOrderIds.forEach(orderId => {
        const order = batch.orders.get(orderId);
        if (order && order.addedAt && (now - order.addedAt > NEW_ORDER_TIMEOUT)) {
          batch.newOrderIds.delete(orderId);
        }
      });
    });
  }

  getBatchStats() {
    return {
      currentBatchSize: this.currentBatch ? this.currentBatch.items.size : 0,
      currentBatchAge: this.currentBatch ? Date.now() - this.currentBatch.createdAt : 0,
      activeBatches: this.batches.filter(b => !b.locked).length,
      lockedBatches: this.batches.filter(b => b.locked).length,
      totalBatches: this.batches.length,
      totalItems: this.batches.reduce((total, batch) => {
        if (!batch || !batch.items) return total;
        let batchTotal = 0;
        batch.items.forEach(item => {
          batchTotal += item.totalQuantity || item.quantity || 0;
        });
        return total + batchTotal;
      }, 0)
    };
  }
  
  getBatchOrders(batchId) {
    const batch = this.batches.find(b => b.id === batchId);
    if (!batch || !batch.orders) {
      return [];
    }
    
    // Handle orders as Map or plain object
    if (batch.orders instanceof Map) {
      return Array.from(batch.orders.keys());
    } else {
      return Object.keys(batch.orders);
    }
  }
}

// Make available globally
window.BatchManager = BatchManager;