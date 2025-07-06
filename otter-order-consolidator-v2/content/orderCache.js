// Order Cache for storing intercepted API data
class OrderCache {
  constructor() {
    this.apiResponses = new Map(); // URL -> response data
    this.orderDetails = new Map(); // Order ID -> detailed order data
    this.orderSummaries = new Map(); // Order ID -> summary data
    this.discoveryMode = true; // Log everything for analysis
    this.knownEndpoints = new Set();
  }

  // Store raw API response
  storeApiResponse(url, data, timestamp) {
    const endpoint = this.extractEndpoint(url);
    this.knownEndpoints.add(endpoint);
    
    this.apiResponses.set(url, {
      endpoint,
      data,
      timestamp,
      analyzed: false
    });
    
    if (this.discoveryMode) {
      console.log('[OrderCache] Stored API response:', {
        endpoint,
        url,
        dataStructure: this.analyzeStructure(data),
        timestamp
      });
    }
    
    // Try to extract order data from the response
    this.extractOrderData(url, data);
  }

  // Analyze the structure of unknown API response
  analyzeStructure(data) {
    if (!data || typeof data !== 'object') return 'primitive';
    
    const structure = {
      type: Array.isArray(data) ? 'array' : 'object',
      length: Array.isArray(data) ? data.length : undefined,
      keys: Array.isArray(data) ? undefined : Object.keys(data),
      sampleFields: {}
    };
    
    // Sample first item if array
    const sample = Array.isArray(data) ? data[0] : data;
    if (sample && typeof sample === 'object') {
      for (const [key, value] of Object.entries(sample)) {
        structure.sampleFields[key] = {
          type: typeof value,
          isArray: Array.isArray(value),
          sample: typeof value === 'object' ? '...' : value
        };
      }
    }
    
    return structure;
  }

  // Extract order data from various possible API response formats
  extractOrderData(url, data) {
    // Try different extraction strategies
    
    // Strategy 1: Direct order array
    if (Array.isArray(data)) {
      data.forEach(item => this.tryExtractOrder(item));
    }
    
    // Strategy 2: Nested in 'data' field
    if (data && data.data) {
      if (Array.isArray(data.data)) {
        data.data.forEach(item => this.tryExtractOrder(item));
      } else {
        this.tryExtractOrder(data.data);
      }
    }
    
    // Strategy 3: Look for 'orders' field
    if (data && data.orders) {
      if (Array.isArray(data.orders)) {
        data.orders.forEach(item => this.tryExtractOrder(item));
      }
    }
    
    // Strategy 4: Single order detail
    if (url.includes('/order/') || url.includes('/orders/')) {
      this.tryExtractOrder(data);
    }
  }

  // Try to extract order information from an object
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
    
    // Store based on detail level
    if (orderInfo.items && orderInfo.items.length > 0) {
      this.orderDetails.set(orderId, orderInfo);
      if (this.discoveryMode) {
        console.log('[OrderCache] Extracted detailed order:', orderInfo);
      }
    } else {
      this.orderSummaries.set(orderId, orderInfo);
      if (this.discoveryMode) {
        console.log('[OrderCache] Extracted order summary:', orderInfo);
      }
    }
  }

  // Field finder methods - try multiple possible field names
  findOrderId(obj) {
    const possibleFields = ['id', 'orderId', 'order_id', 'ID', '_id', 'uuid'];
    for (const field of possibleFields) {
      if (obj[field]) return obj[field];
    }
    return null;
  }

  findCustomerName(obj) {
    const possibleFields = ['customerName', 'customer_name', 'customer', 'name'];
    for (const field of possibleFields) {
      if (typeof obj[field] === 'string') return obj[field];
      if (obj[field] && obj[field].name) return obj[field].name;
    }
    return null;
  }

  findOrderNumber(obj) {
    const possibleFields = ['orderNumber', 'order_number', 'number', 'displayId', 'display_id'];
    for (const field of possibleFields) {
      if (obj[field]) return obj[field];
    }
    return null;
  }

  findItems(obj) {
    const items = [];
    const possibleFields = ['items', 'lineItems', 'line_items', 'orderItems', 'order_items'];
    
    for (const field of possibleFields) {
      if (Array.isArray(obj[field])) {
        obj[field].forEach(item => {
          const extracted = this.extractItemDetails(item);
          if (extracted) items.push(extracted);
        });
        break;
      }
    }
    
    return items;
  }

  extractItemDetails(item) {
    if (!item || typeof item !== 'object') return null;
    
    const details = {
      name: item.name || item.itemName || item.item_name || 'Unknown Item',
      quantity: item.quantity || item.qty || 1,
      price: item.price || item.unitPrice || item.unit_price || 0,
      size: this.extractSize(item),
      modifiers: this.extractModifiers(item),
      raw: item
    };
    
    return details;
  }

  extractSize(item) {
    // Direct size field
    if (item.size) return item.size;
    
    // Look in modifiers
    if (item.modifiers || item.modifierGroups || item.modifier_groups) {
      const modifiers = item.modifiers || item.modifierGroups || item.modifier_groups;
      
      // If modifiers is array
      if (Array.isArray(modifiers)) {
        for (const mod of modifiers) {
          const size = this.checkModifierForSize(mod);
          if (size) return size;
        }
      }
    }
    
    // Check if size is in the name
    const sizeInName = this.extractSizeFromName(item.name || '');
    if (sizeInName) return sizeInName;
    
    return 'no-size';
  }

  checkModifierForSize(modifier) {
    // Check if this modifier is a size
    if (modifier.type === 'SIZE' || modifier.category === 'SIZE') {
      return modifier.name || modifier.value;
    }
    
    // Check if name indicates size
    if (modifier.name && /^(Small|Medium|Large|Regular)\b/i.test(modifier.name)) {
      return modifier.name;
    }
    
    // Check nested/selected modifiers
    const selected = modifier.selectedModifiers || modifier.selected_modifiers || modifier.selected;
    if (Array.isArray(selected)) {
      for (const sel of selected) {
        if (sel.type === 'SIZE' || /^(Small|Medium|Large|Regular)\b/i.test(sel.name || '')) {
          return sel.name;
        }
      }
    }
    
    return null;
  }

  extractSizeFromName(name) {
    const sizeMatch = name.match(/\b(Small|Medium|Large|Regular)\b/i);
    return sizeMatch ? sizeMatch[1] : null;
  }

  extractModifiers(item) {
    const modifiers = [];
    const modifierFields = ['modifiers', 'modifierGroups', 'modifier_groups', 'selectedModifiers'];
    
    for (const field of modifierFields) {
      if (item[field]) {
        if (Array.isArray(item[field])) {
          item[field].forEach(mod => {
            if (mod.name && mod.type !== 'SIZE') {
              modifiers.push(mod.name);
            }
          });
        }
      }
    }
    
    return modifiers;
  }

  findTotal(obj) {
    const possibleFields = ['total', 'totalPrice', 'total_price', 'amount'];
    for (const field of possibleFields) {
      if (obj[field]) return obj[field];
    }
    
    // Check nested in totals object
    if (obj.totals && obj.totals.total) return obj.totals.total;
    
    return null;
  }

  // Get cached order details by ID
  getOrderDetails(orderId) {
    return this.orderDetails.get(orderId) || this.orderSummaries.get(orderId);
  }

  // Match order from DOM with cached data
  findMatchingOrder(domOrder) {
    // Try to match by order ID first
    if (domOrder.id) {
      const cached = this.getOrderDetails(domOrder.id);
      if (cached) return cached;
    }
    
    // Try to match by order number
    if (domOrder.number) {
      for (const [id, order] of this.orderDetails) {
        if (order.orderNumber === domOrder.number) return order;
      }
    }
    
    // Try to match by customer name (less reliable)
    if (domOrder.customerName) {
      for (const [id, order] of this.orderDetails) {
        if (order.customerName === domOrder.customerName) return order;
      }
    }
    
    return null;
  }

  // Extract endpoint from URL
  extractEndpoint(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  // Get discovery report
  getDiscoveryReport() {
    return {
      knownEndpoints: Array.from(this.knownEndpoints),
      totalResponses: this.apiResponses.size,
      ordersWithDetails: this.orderDetails.size,
      orderSummaries: this.orderSummaries.size,
      sampleOrder: this.orderDetails.size > 0 ? 
        Array.from(this.orderDetails.values())[0] : null
    };
  }

  // Clear cache
  clear() {
    this.apiResponses.clear();
    this.orderDetails.clear();
    this.orderSummaries.clear();
    console.log('[OrderCache] Cache cleared');
  }
}

// Create global instance
window.otterOrderCache = new OrderCache();