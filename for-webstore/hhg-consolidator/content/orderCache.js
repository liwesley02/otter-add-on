console.log('[OrderCache.js] Script loaded at:', new Date().toISOString());

class OrderCache {
  constructor() {
    this.apiResponses = new Map(); // URL -> response data
    this.orderDetails = new Map(); // orderId -> order details
    this.itemSizes = new Map(); // itemId -> size info
    this.discoveryMode = true; // Log everything for analysis
    this.knownEndpoints = new Set();
    
    console.log('[OrderCache] Initialized');
  }

  storeApiResponse(url, data, timestamp) {
    console.log('[OrderCache] Storing API response from:', url);
    
    // Store raw response
    this.apiResponses.set(url, {
      data: data,
      timestamp: timestamp,
      url: url
    });
    
    // Track endpoint
    try {
      const urlObj = new URL(url);
      this.knownEndpoints.add(urlObj.pathname);
    } catch (e) {
      // Invalid URL
    }
    
    // Try to extract order information
    this.extractOrderData(data, url);
    
    if (this.discoveryMode) {
      console.log('[OrderCache] Response stored. Total responses:', this.apiResponses.size);
    }
  }

  extractOrderData(data, sourceUrl) {
    // Handle arrays of orders
    if (Array.isArray(data)) {
      console.log(`[OrderCache] Processing array of ${data.length} items from ${sourceUrl}`);
      data.forEach(item => this.tryExtractOrder(item));
      return;
    }
    
    // Handle single order
    if (typeof data === 'object' && data !== null) {
      // Check for Otter-specific structure (customerOrder)
      if (data.customerOrder) {
        console.log('[OrderCache] Found Otter customerOrder structure!');
        this.extractOtterOrder(data);
        return;
      }
      
      // Check if it's a wrapper object
      if (data.orders && Array.isArray(data.orders)) {
        console.log(`[OrderCache] Found orders array with ${data.orders.length} orders`);
        data.orders.forEach(order => this.tryExtractOrder(order));
      } else if (data.data && typeof data.data === 'object') {
        this.extractOrderData(data.data, sourceUrl);
      } else {
        this.tryExtractOrder(data);
      }
    }
  }

  tryExtractOrder(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    // Look for order-like fields
    const orderId = this.findOrderId(obj);
    if (!orderId) return;
    
    const orderInfo = {
      id: orderId,
      customerName: this.findCustomerName(obj),
      orderNumber: this.findOrderNumber(obj),
      items: this.findItems(obj),
      total: this.findTotal(obj),
      timestamp: Date.now(),
      raw: obj // Keep raw data for analysis
    };
    
    if (orderInfo.items.length > 0 || orderInfo.customerName || orderInfo.orderNumber) {
      this.orderDetails.set(orderId, orderInfo);
      
      if (this.discoveryMode) {
        console.log('[OrderCache] Extracted order:', {
          id: orderId,
          customer: orderInfo.customerName,
          itemCount: orderInfo.items.length,
          hasSize: orderInfo.items.some(item => item.size && item.size !== 'no-size')
        });
      }
      
      // Store item sizes
      orderInfo.items.forEach(item => {
        if (item.id && item.size && item.size !== 'no-size') {
          this.itemSizes.set(item.id, item.size);
        }
      });
    }
  }

  extractOtterOrder(data) {
    // Extract from Otter-specific customerOrder structure
    const co = data.customerOrder;
    if (!co) return;
    
    console.log('[OrderCache] Extracting Otter order structure');
    
    // Extract basic order info
    const orderId = co.id || co.uuid || co.orderId || data.id;
    const orderNumber = co.displayId || co.orderNumber || co.number;
    const customerName = co.customerName || co.customer?.name || co.recipientName;
    
    // Extract items from customerItemsContainer
    const items = [];
    if (co.customerItemsContainer?.items) {
      const itemsData = co.customerItemsContainer.items;
      const modifiersData = co.customerItemsContainer.modifiers || {};
      
      // Process each item
      for (const item of itemsData) {
        const itemInfo = {
          id: item.id,
          name: item.name || item.itemName,
          quantity: item.quantity || 1,
          price: item.price || item.totalPrice,
          size: 'no-size', // Default, will be updated from modifiers
          modifiers: []
        };
        
        // Look for size in modifiers
        if (item.modifierCustomerItemIds) {
          for (const modId of item.modifierCustomerItemIds) {
            const modifier = modifiersData[modId];
            if (modifier) {
              const modName = modifier.name || '';
              // Check if this is a size modifier
              if (modName.match(/^(Small|Medium|Large)$/i)) {
                itemInfo.size = modName.toLowerCase();
              } else {
                itemInfo.modifiers.push({
                  name: modName,
                  price: modifier.price
                });
              }
            }
          }
        }
        
        items.push(itemInfo);
      }
    }
    
    // Store the order
    if (orderId && items.length > 0) {
      const orderInfo = {
        id: orderId,
        customerName: customerName,
        orderNumber: orderNumber,
        items: items,
        total: co.total || co.totalPrice,
        timestamp: Date.now(),
        raw: data,
        source: 'otter-api'
      };
      
      this.orderDetails.set(orderId, orderInfo);
      console.log('[OrderCache] Stored Otter order:', {
        id: orderId,
        number: orderNumber,
        customer: customerName,
        itemCount: items.length,
        itemsWithSizes: items.filter(i => i.size !== 'no-size').length
      });
    }
  }

  findOrderId(obj) {
    // Common order ID field names
    const idFields = ['id', 'orderId', 'order_id', 'uuid', '_id', 'orderUuid', 'order_uuid'];
    
    for (const field of idFields) {
      if (obj[field]) {
        return String(obj[field]);
      }
    }
    return null;
  }

  findCustomerName(obj) {
    // Common customer name fields
    const nameFields = ['customerName', 'customer_name', 'name', 'customer', 'recipientName', 'recipient_name'];
    
    for (const field of nameFields) {
      if (obj[field]) {
        if (typeof obj[field] === 'string') {
          return obj[field];
        } else if (obj[field].name) {
          return obj[field].name;
        }
      }
    }
    
    // Check nested customer object
    if (obj.customer && typeof obj.customer === 'object') {
      return this.findCustomerName(obj.customer);
    }
    
    return null;
  }

  findOrderNumber(obj) {
    const numberFields = ['orderNumber', 'order_number', 'number', 'displayId', 'display_id', 'orderDisplayId'];
    
    for (const field of numberFields) {
      if (obj[field]) {
        return String(obj[field]);
      }
    }
    return null;
  }

  findItems(obj) {
    const items = [];
    
    // Common item field names
    const itemFields = ['items', 'orderItems', 'order_items', 'lineItems', 'line_items', 'products'];
    
    for (const field of itemFields) {
      if (obj[field] && Array.isArray(obj[field])) {
        obj[field].forEach(item => {
          const extractedItem = this.extractItemInfo(item);
          if (extractedItem) {
            items.push(extractedItem);
          }
        });
        break;
      }
    }
    
    return items;
  }

  extractItemInfo(item) {
    if (!item || typeof item !== 'object') return null;
    
    const info = {
      id: item.id || item.itemId || item.item_id || item.uuid,
      name: item.name || item.itemName || item.item_name || item.title || item.productName || item.product_name,
      quantity: item.quantity || item.qty || item.count || 1,
      price: item.price || item.amount || item.cost,
      size: this.findItemSize(item),
      modifiers: this.findModifiers(item)
    };
    
    // Only return if we have at least a name
    return info.name ? info : null;
  }

  findItemSize(item) {
    // Direct size fields
    const sizeFields = ['size', 'variant', 'variation', 'option', 'selectedSize', 'selected_size'];
    
    for (const field of sizeFields) {
      if (item[field]) {
        if (typeof item[field] === 'string') {
          return item[field];
        } else if (item[field].name || item[field].value) {
          return item[field].name || item[field].value;
        }
      }
    }
    
    // Check modifiers for size
    if (item.modifiers && Array.isArray(item.modifiers)) {
      const sizeModifier = item.modifiers.find(mod => 
        mod.name && mod.name.toLowerCase().includes('size')
      );
      if (sizeModifier && sizeModifier.value) {
        return sizeModifier.value;
      }
    }
    
    // Check options
    if (item.options && Array.isArray(item.options)) {
      const sizeOption = item.options.find(opt => 
        opt.name && opt.name.toLowerCase().includes('size')
      );
      if (sizeOption && sizeOption.value) {
        return sizeOption.value;
      }
    }
    
    return null;
  }

  findModifiers(item) {
    const modifiers = [];
    
    // Common modifier field names
    const modifierFields = ['modifiers', 'options', 'additions', 'customizations'];
    
    for (const field of modifierFields) {
      if (item[field] && Array.isArray(item[field])) {
        item[field].forEach(mod => {
          if (mod.name || mod.label) {
            modifiers.push({
              name: mod.name || mod.label,
              value: mod.value || mod.option || mod.selection
            });
          }
        });
      }
    }
    
    return modifiers;
  }

  findTotal(obj) {
    const totalFields = ['total', 'totalAmount', 'total_amount', 'grandTotal', 'grand_total', 'price'];
    
    for (const field of totalFields) {
      if (obj[field]) {
        return obj[field];
      }
    }
    return null;
  }

  getOrderDetails(orderId) {
    return this.orderDetails.get(orderId);
  }

  getItemSize(itemId) {
    return this.itemSizes.get(itemId);
  }

  getSizeForItem(itemName, orderContext = null) {
    // Try to find size based on item name and order context
    if (!itemName) return null;
    
    // First, try exact item ID match
    if (orderContext && orderContext.items) {
      const item = orderContext.items.find(i => 
        i.name && i.name.toLowerCase() === itemName.toLowerCase()
      );
      if (item && item.size) {
        return item.size;
      }
    }
    
    // Search through all cached orders for this item
    for (const [orderId, order] of this.orderDetails) {
      const item = order.items.find(i => 
        i.name && i.name.toLowerCase() === itemName.toLowerCase()
      );
      if (item && item.size && item.size !== 'no-size') {
        return item.size;
      }
    }
    
    return null;
  }
  
  findMatchingOrder(domOrder) {
    // Try to find a cached order that matches the DOM order
    if (!domOrder) return null;
    
    // Try to match by order number
    if (domOrder.number) {
      for (const [orderId, cachedOrder] of this.orderDetails) {
        if (cachedOrder.orderNumber === domOrder.number ||
            cachedOrder.orderNumber === domOrder.number.replace('#', '') ||
            '#' + cachedOrder.orderNumber === domOrder.number) {
          console.log(`[OrderCache] Found match by order number: ${domOrder.number}`);
          return cachedOrder;
        }
      }
    }
    
    // Try to match by customer name and item count
    if (domOrder.customerName && domOrder.items) {
      for (const [orderId, cachedOrder] of this.orderDetails) {
        if (cachedOrder.customerName && 
            cachedOrder.customerName.toLowerCase() === domOrder.customerName.toLowerCase() &&
            cachedOrder.items.length === domOrder.items.length) {
          console.log(`[OrderCache] Found match by customer name and item count: ${domOrder.customerName}`);
          return cachedOrder;
        }
      }
    }
    
    // Try fuzzy match by customer name similarity
    if (domOrder.customerName) {
      for (const [orderId, cachedOrder] of this.orderDetails) {
        if (cachedOrder.customerName && 
            this.isSimilarName(cachedOrder.customerName, domOrder.customerName)) {
          console.log(`[OrderCache] Found fuzzy match by customer name: ${domOrder.customerName} ~ ${cachedOrder.customerName}`);
          return cachedOrder;
        }
      }
    }
    
    return null;
  }
  
  isSimilarName(name1, name2) {
    // Simple similarity check
    const clean1 = name1.toLowerCase().trim();
    const clean2 = name2.toLowerCase().trim();
    
    // Exact match
    if (clean1 === clean2) return true;
    
    // One contains the other
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    
    // First name match
    const first1 = clean1.split(' ')[0];
    const first2 = clean2.split(' ')[0];
    if (first1 === first2 && first1.length > 2) return true;
    
    return false;
  }
  
  getCache() {
    return Object.fromEntries(this.orderDetails);
  }
  
  getAllOrders() {
    // Return all cached orders as an array
    return Array.from(this.orderDetails.values());
  }
  
  hasOrders() {
    return this.orderDetails.size > 0;
  }
  
  getOrderCount() {
    return this.orderDetails.size;
  }

  getDiscoveryReport() {
    const report = {
      knownEndpoints: Array.from(this.knownEndpoints),
      totalResponses: this.apiResponses.size,
      ordersWithDetails: this.orderDetails.size,
      itemsWithSizes: this.itemSizes.size,
      orderSummaries: []
    };
    
    // Add sample order summaries
    let count = 0;
    for (const [orderId, order] of this.orderDetails) {
      if (count++ >= 5) break; // Only show first 5
      
      report.orderSummaries.push({
        id: orderId,
        customer: order.customerName,
        itemCount: order.items.length,
        itemsWithSize: order.items.filter(i => i.size && i.size !== 'no-size').length
      });
    }
    
    // Add sample order structure if available
    if (this.orderDetails.size > 0) {
      const [firstOrderId, firstOrder] = this.orderDetails.entries().next().value;
      report.sampleOrder = {
        id: firstOrderId,
        structure: this.getObjectStructure(firstOrder.raw)
      };
    }
    
    return report;
  }

  getObjectStructure(obj, depth = 0, maxDepth = 3) {
    if (depth > maxDepth || !obj) return '...';
    
    if (Array.isArray(obj)) {
      return obj.length > 0 ? [`[${obj.length}] ` + this.getObjectStructure(obj[0], depth + 1, maxDepth)] : '[]';
    }
    
    if (typeof obj !== 'object') {
      return typeof obj;
    }
    
    const structure = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        structure[key] = this.getObjectStructure(obj[key], depth + 1, maxDepth);
      }
    }
    
    return structure;
  }

  clear() {
    this.apiResponses.clear();
    this.orderDetails.clear();
    this.itemSizes.clear();
    this.knownEndpoints.clear();
    console.log('[OrderCache] Cleared all cached data');
  }
}

// Create global instance immediately
try {
  console.log('[OrderCache] Creating global instance...');
  window.otterOrderCache = new OrderCache();
  console.log('[OrderCache] Global instance created successfully');
} catch (error) {
  console.error('[OrderCache] Failed to create instance:', error);
  // Create a stub so other code doesn't crash
  window.otterOrderCache = {
    storeApiResponse: () => console.warn('OrderCache not available'),
    getOrderDetails: () => null,
    findMatchingOrder: () => null,
    getDiscoveryReport: () => ({ error: 'OrderCache failed to initialize' }),
    clear: () => console.warn('OrderCache not available'),
    error: error.message
  };
}