/**
 * Label Data Transformer
 * Converts batch data from the order consolidator into label-ready format
 * Handles complex meal decomposition and modifier classification
 */

class LabelDataTransformer {
  constructor() {
    // Meal items that need special decomposition
    this.MEAL_ITEMS = {
      'bowl of rice meal': {
        components: [
          { name: 'Small Rice Bowl' },
          { name: 'Dumplings' },
          { name: 'Dessert' }
        ]
      },
      'bao out': {
        components: [
          { name: 'Bao 1', extractFrom: 'bao choices' },
          { name: 'Bao 2', extractFrom: 'bao choices' },
          { name: 'Dumplings', extractFrom: 'dumpling choices' },
          { name: 'Dessert', extractFrom: 'dessert choices' }
        ]
      }
    };

    // Add-on items that should be separate labels
    this.ADD_ON_ITEMS = [
      // Drinks
      'coke', 'diet coke', 'pepsi', 'sprite', 'dr pepper', 'iced tea', 'lemonade',
      'bottled water', 'coffee', 'orange juice', 'apple juice', 'milk tea', 'thai tea',
      'coca-cola', 'diet pepsi', 'root beer', 'ginger ale', 'water', 'sparkling water',
      'hot tea', 'iced coffee', 'latte', 'cappuccino', 'smoothie', 'fountain drink',
      // Sides
      'french fries', 'side of fries', 'onion rings', 'side salad', 'cup of soup',
      'steamed rice', 'brown rice', 'garlic bread', 'mashed potatoes', 'steamed vegetables',
      'cole slaw', 'mac and cheese', 'cornbread', 'edamame', 'miso soup', 'egg roll', 'spring roll',
      // Desserts
      'cheesecake slice', 'chocolate cake', 'ice cream scoop', 'brownie', 'cookie',
      'apple pie', 'tiramisu', 'pudding', 'fruit cup', 'mochi'
    ];

    // Modifier prefixes that indicate separate items
    this.SEPARATE_ITEM_PREFIXES = [
      'choice of side:', 'choice of drink:', 'side addition:', 'dessert choice:',
      'extra dessert:', 'drink choice:', 'add a drink:', 'side choice:',
      'add dessert:', 'extra side:', 'extra drink:', 'add side:', 'add drink:', 'add on:'
    ];

    // Restaurant logo mapping
    this.RESTAURANT_LOGOS = {
      'Bowls of Rice': 'images/Bowls_Logo.png',
      'Bunch of Dumplings': 'images/Bunch_Logo.png',
      'Take a Bao Eats': 'images/Bao_Logo.png'
    };
  }

  /**
   * Transform a batch into label data for printing
   * @param {Object} batch - Batch object from BatchManager
   * @param {Object} batchManager - Reference to BatchManager for additional data
   * @returns {Object} Label data ready for printing
   */
  transformBatchToLabels(batch, batchManager) {
    // Try to get restaurant name from the batch object first (for single order batches)
    let restaurantName = batch.restaurantName || 'Restaurant';
    
    // If not on batch, try to get from the first order
    if (restaurantName === 'Restaurant' || restaurantName === 'Unknown Restaurant') {
      const firstOrderId = this.getFirstOrderId(batch, batchManager);
      if (firstOrderId && batchManager && batchManager.orderBatcher) {
        const order = batchManager.orderBatcher.getOrderById(firstOrderId);
        if (order && order.restaurantName) {
          restaurantName = order.restaurantName;
        }
      }
    }
    
    // Fallback to detection if no restaurant name found
    if (restaurantName === 'Restaurant' || restaurantName === 'Unknown Restaurant') {
      restaurantName = this.detectRestaurantName(batch);
    }
    
    const labelData = {
      batchId: batch.id,
      batchName: batch.name,
      restaurantName: restaurantName,
      items: [],
      totalLabels: 0,
      customerOrders: []
    };

    // Get all orders in this batch
    let orderIds = [];
    
    // Check if this is a temporary single-order batch
    if (batch.id && batch.id.startsWith('order_')) {
      // Extract order ID from temporary batch ID
      const orderId = batch.id.replace('order_', '');
      orderIds = [orderId];
    } else if (batchManager && batchManager.getBatchOrders) {
      // Regular batch - use batchManager method
      orderIds = batchManager.getBatchOrders(batch.id);
    } else {
      // Fallback - extract order IDs from batch items
      const orderSet = new Set();
      Object.values(batch.items || {}).forEach(categoryItems => {
        Object.values(categoryItems).forEach(item => {
          if (item.orders) {
            item.orders.forEach(order => {
              orderSet.add(order.orderId);
            });
          }
        });
      });
      orderIds = Array.from(orderSet);
    }
    
    // Process each order in the batch
    orderIds.forEach(orderId => {
      const orderItems = this.getOrderItemsFromBatch(batch, orderId);
      const customerName = this.extractCustomerName(orderId);
      
      // Get the actual order object to access recipient name
      const orderData = this.findOrderData(batch, orderId);
      const recipientName = orderData ? this.getRecipientName(orderData) : customerName;
      
      labelData.customerOrders.push({
        orderId,
        customerName: recipientName, // Use recipient name for display
        items: orderItems
      });

      // Transform each item for the order
      orderItems.forEach(item => {
        const transformedItems = this.transformOrderItem(item, recipientName, batch.id);
        labelData.items.push(...transformedItems);
        labelData.totalLabels += transformedItems.reduce((sum, item) => sum + item.quantity, 0);
      });
    });

    return labelData;
  }

  /**
   * Transform a single order item into label format
   * Handles meal decomposition and modifier classification
   */
  transformOrderItem(item, customerName, batchId) {
    const baseItem = {
      name: item.name || item.fullName,
      baseName: item.baseName || item.name,
      size: item.size || '',
      category: item.category,
      categoryInfo: item.categoryInfo,
      modifiers: item.modifiers || [],
      quantity: item.quantity || 1,
      customerName: customerName,
      batchId: batchId,
      note: item.note || ''
    };

    // Check if this is a special meal that needs decomposition
    const mealKey = Object.keys(this.MEAL_ITEMS).find(meal => 
      baseItem.baseName.toLowerCase().includes(meal)
    );

    if (mealKey) {
      return this.decomposeMealItem(baseItem, this.MEAL_ITEMS[mealKey]);
    }

    // Otherwise, process normally
    const labelItems = [];
    const { mainItem, addOnItems } = this.classifyModifiers(baseItem);
    
    // Ensure customer name is prominently included
    mainItem.customerName = customerName;
    labelItems.push(mainItem);
    
    // Also add customer name to add-on items
    addOnItems.forEach(addon => {
      addon.customerName = customerName;
    });
    labelItems.push(...addOnItems);

    return labelItems;
  }

  /**
   * Decompose meal items into their components
   */
  decomposeMealItem(item, mealConfig) {
    const components = [];
    const mealName = item.baseName;

    mealConfig.components.forEach(component => {
      let componentName = component.name;
      
      // Try to extract specific component names from modifiers
      if (component.extractFrom) {
        const extracted = this.extractComponentFromModifiers(
          item.modifiers, 
          component.extractFrom
        );
        if (extracted) {
          componentName = extracted;
        }
      }

      const componentNotes = [`Customer: ${item.customerName}`, `Batch: ${item.batchId}`];
      // Include the item note if present
      if (item.note && item.note.trim()) {
        componentNotes.push(item.note);
      }
      
      components.push({
        name: `${componentName} (from ${mealName})`,
        size: '',
        quantity: item.quantity,
        notes: componentNotes,
        isMealComponent: true,
        parentMeal: mealName,
        customerName: item.customerName,
        batchId: item.batchId
      });
    });

    return components;
  }

  /**
   * Extract component name from modifiers
   */
  extractComponentFromModifiers(modifiers, searchKey) {
    for (const modifier of modifiers) {
      const modLower = modifier.toLowerCase();
      if (modLower.includes(searchKey)) {
        // Extract the actual choice after the colon
        const parts = modifier.split(':');
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
    return null;
  }

  /**
   * Classify modifiers into integrated vs separate items
   */
  classifyModifiers(item) {
    const mainItem = {
      ...item,
      notes: []
    };
    const addOnItems = [];

    item.modifiers.forEach(modifier => {
      // Handle modifier as object or string
      let modifierText = '';
      if (typeof modifier === 'string') {
        modifierText = modifier;
      } else if (modifier && modifier.name) {
        modifierText = modifier.name;
      } else {
        console.warn('Invalid modifier format:', modifier);
        return; // Skip this modifier
      }
      
      const modLower = modifierText.toLowerCase();
      let isSeparateItem = false;
      let extractedName = modifierText;

      // Check if it's a separate item based on prefix
      for (const prefix of this.SEPARATE_ITEM_PREFIXES) {
        if (modLower.startsWith(prefix)) {
          isSeparateItem = true;
          extractedName = modifierText.substring(prefix.length).trim();
          break;
        }
      }

      // Check if it's an add-on item by name
      if (!isSeparateItem && this.ADD_ON_ITEMS.includes(modLower)) {
        isSeparateItem = true;
      }

      if (isSeparateItem) {
        const addonNotes = [`With: ${item.name}`, `Customer: ${item.customerName}`];
        // Include the item note if it might be relevant to the addon
        if (item.note && item.note.trim()) {
          addonNotes.push(item.note);
        }
        
        addOnItems.push({
          name: extractedName,
          quantity: item.quantity,
          size: '',
          notes: addonNotes,
          isAddon: true,
          customerName: item.customerName,
          batchId: item.batchId
        });
      } else {
        // It's an integrated modifier
        mainItem.notes.push(modifierText);
      }
    });

    // Add item-specific note if present
    if (item.note && item.note.trim()) {
      mainItem.notes.push(item.note);
    }
    
    // Add customer and batch info to main item notes
    mainItem.notes.push(`Customer: ${item.customerName}`);
    mainItem.notes.push(`Batch: ${item.batchId}`);

    return { mainItem, addOnItems };
  }

  /**
   * Get items for a specific order from a batch
   */
  getOrderItemsFromBatch(batch, orderId) {
    const items = [];
    
    // Each batch item contains orders array
    Object.values(batch.items || {}).forEach(categoryItems => {
      Object.values(categoryItems).forEach(item => {
        const orderEntry = item.orders.find(o => o.orderId === orderId);
        if (orderEntry) {
          items.push({
            ...item,
            quantity: orderEntry.quantity
          });
        }
      });
    });

    return items;
  }

  /**
   * Extract customer name from order ID
   */
  extractCustomerName(orderId) {
    // Order ID format: "orderNumber_customerName"
    const parts = orderId.split('_');
    return parts.length > 1 ? parts[1] : 'Unknown Customer';
  }
  
  /**
   * Find order data from batch
   */
  findOrderData(batch, orderId) {
    // Search through all items in the batch for order data
    for (const categoryItems of Object.values(batch.items || {})) {
      for (const item of Object.values(categoryItems)) {
        const orderEntry = item.orders.find(o => o.orderId === orderId);
        if (orderEntry) {
          // Return the order entry which should have the order data
          return orderEntry;
        }
      }
    }
    return null;
  }
  
  /**
   * Get recipient name from order (prefers notes-based name over customer name)
   */
  getRecipientName(order) {
    // First check if order has recipientName field
    if (order.recipientName && order.recipientName !== order.customerName) {
      return order.recipientName;
    }
    
    // Then check order notes for recipient name patterns
    if (order.orderNotes) {
      const namePatterns = [
        /(?:for|deliver to|to|name):\s*([^,\n]+)/i,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m,
        /(?:pick\s*up|pickup).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = order.orderNotes.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    // Fall back to customer name
    return order.customerName || this.extractCustomerName(order.id || '');
  }

  /**
   * Get the first order ID from a batch
   */
  getFirstOrderId(batch, batchManager) {
    // Check if this is a temporary single-order batch
    if (batch.id && batch.id.startsWith('order_')) {
      return batch.id.replace('order_', '');
    }
    
    // Try to get from batch items
    if (batch.items) {
      for (const categoryItems of Object.values(batch.items)) {
        for (const item of Object.values(categoryItems)) {
          if (item.orders && item.orders.length > 0) {
            return item.orders[0].orderId;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Detect restaurant name from batch items
   */
  detectRestaurantName(batch) {
    // Check batch items for category information that might indicate restaurant
    const categories = new Set();
    
    Object.values(batch.items || {}).forEach(categoryItems => {
      Object.values(categoryItems).forEach(item => {
        if (item.categoryInfo?.topCategoryName) {
          categories.add(item.categoryInfo.topCategoryName);
        }
      });
    });

    // Map categories to restaurant names
    if (categories.has('Rice Bowls') || categories.has('Urban Bowls')) {
      return 'Bowls of Rice';
    } else if (categories.has('Dumplings')) {
      return 'Bunch of Dumplings';
    } else if (categories.has('Bao')) {
      return 'Take a Bao Eats';
    }

    return 'Restaurant';
  }

  /**
   * Get logo URL for a restaurant
   */
  getLogoUrl(restaurantName) {
    return this.RESTAURANT_LOGOS[restaurantName] || '';
  }

  /**
   * Format label data for the label printer
   */
  formatForLabelPrinter(labelData) {
    return {
      customerName: labelData.customerOrders.map(o => o.customerName).join(', '),
      orderSource: `Batch ${labelData.batchId}`,
      restaurantName: labelData.restaurantName,
      items: labelData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        size: item.size || '',
        notes: item.notes || []
      }))
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LabelDataTransformer;
}