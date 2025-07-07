console.log('[ReactDataExtractor.js] Script loaded at:', new Date().toISOString());

// React Data Extractor for Otter Order Consolidator
// Extracts order data directly from React component props

class ReactDataExtractor {
  constructor() {
    this.enabled = true;
    this.debug = false;
    this.pageContextInjected = false;
    this.extractionTimeout = null;
  }

  enable() {
    this.enabled = true;
    console.log('[ReactDataExtractor] Enabled');
  }

  disable() {
    this.enabled = false;
    console.log('[ReactDataExtractor] Disabled');
  }

  enableDebug() {
    this.debug = true;
    console.log('[ReactDataExtractor] Debug mode enabled');
  }
  
  findReactFiber(element) {
    if (!element) return null;
    
    // Get all keys from the element
    const allKeys = Object.keys(element);
    
    // Look specifically for keys starting with __react (matching user's working pattern)
    const reactKeys = allKeys.filter(key => key.startsWith('__react'));
    
    if (this.debug && allKeys.length > 0) {
      console.log('[ReactDataExtractor] Element keys:', allKeys);
      console.log('[ReactDataExtractor] React keys found:', reactKeys);
    }
    
    // Return the first React fiber found
    if (reactKeys.length > 0) {
      const fiber = element[reactKeys[0]];
      if (this.debug) {
        console.log('[ReactDataExtractor] Found React fiber at key:', reactKeys[0]);
      }
      return fiber;
    }
    
    if (this.debug) {
      console.log('[ReactDataExtractor] No React fiber found on element');
    }
    
    return null;
  }

  // Inject page context script if not already done
  injectPageContextScript() {
    if (this.pageContextInjected) return;
    
    console.log('[ReactDataExtractor] Injecting page context script...');
    
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/pageContextExtractor.js');
    script.onload = () => {
      console.log('[ReactDataExtractor] Page context script loaded');
      this.pageContextInjected = true;
    };
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Extract orders using page context (main method)
  async extractOrdersViaPageContext(retryCount = 0) {
    return new Promise((resolve, reject) => {
      console.log(`[ReactDataExtractor] Requesting extraction via page context (attempt ${retryCount + 1})...`);
      
      // Set up response listener
      const responseHandler = (event) => {
        console.log('[ReactDataExtractor] Received response from page context:', event.detail);
        
        // Debug: Check what we received
        if (event.detail.success && event.detail.orders && event.detail.orders.length > 0) {
          console.log('[ReactDataExtractor] First order received:', {
            order: event.detail.orders[0],
            id: event.detail.orders[0].id,
            idType: typeof event.detail.orders[0].id,
            customerName: event.detail.orders[0].customerName
          });
        }
        
        window.removeEventListener('otter-extract-response', responseHandler);
        
        if (event.detail.success) {
          resolve(event.detail.orders || []);
        } else {
          reject(new Error(event.detail.error || 'Unknown error'));
        }
      };
      
      window.addEventListener('otter-extract-response', responseHandler);
      
      // Send extraction request
      window.dispatchEvent(new CustomEvent('otter-extract-request', {
        detail: { timestamp: Date.now() }
      }));
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('otter-extract-response', responseHandler);
        reject(new Error('Extraction timeout'));
      }, 5000);
    });
  }
  
  // Retry extraction with delays
  async extractOrdersWithRetry(maxRetries = 3) {
    const delays = [0, 500, 1000, 2000]; // Increasing delays between retries
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        if (i > 0) {
          console.log(`[ReactDataExtractor] Waiting ${delays[i]}ms before retry ${i}...`);
          await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
        
        const orders = await this.extractOrdersViaPageContext(i);
        
        if (orders.length > 0) {
          console.log(`[ReactDataExtractor] Success on attempt ${i + 1}: found ${orders.length} orders`);
          return orders;
        } else {
          console.log(`[ReactDataExtractor] Attempt ${i + 1}: No orders found, will retry...`);
        }
      } catch (error) {
        console.error(`[ReactDataExtractor] Attempt ${i + 1} failed:`, error.message);
        
        if (i === maxRetries) {
          throw error;
        }
      }
    }
    
    return [];
  }

  async extractOrders() {
    if (!this.enabled) {
      console.log('[ReactDataExtractor] Extractor is disabled');
      return [];
    }

    console.log('[ReactDataExtractor] Starting order extraction...');
    
    // First ensure page context script is injected
    this.injectPageContextScript();
    
    // Wait a bit for script to load
    if (!this.pageContextInjected) {
      console.log('[ReactDataExtractor] Waiting for page context script to load...');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      // Try page context extraction with retries
      const orders = await this.extractOrdersWithRetry();
      
      if (orders.length === 0) {
        console.log('[ReactDataExtractor] No orders found after retries');
        return [];
      }
      
      console.log(`[ReactDataExtractor] Successfully extracted ${orders.length} orders via page context`);
      
      // Convert to our format
      return orders.map(order => {
        // Calculate elapsed time if orderedAt exists
        let elapsedTime = order.elapsedTime || 0;
        if (order.orderedAt && !order.elapsedTime) {
          const orderedDate = new Date(order.orderedAt);
          const now = new Date();
          const elapsedMs = now - orderedDate;
          elapsedTime = Math.floor(elapsedMs / 60000); // Convert to minutes
        }
        
        return {
          ...order,
          source: 'react',
          timestamp: Date.now(),
          elapsedTime: elapsedTime,
          items: order.items.map(item => ({
            ...item,
            baseName: item.name,
            modifiers: item.modifiers || [] // Preserve modifiers from React data
          }))
        };
      });
      
    } catch (error) {
      console.error('[ReactDataExtractor] Page context extraction failed after retries:', error);
      
      // Fallback to content script method (won't work but try anyway)
      console.log('[ReactDataExtractor] Falling back to content script method...');
      return this.extractOrdersContentScript();
    }
  }
  
  // Old method kept as fallback
  extractOrdersContentScript() {
    const orders = [];
    
    try {
      const orderRows = document.querySelectorAll('[data-testid="order-row"]');
      console.log(`[ReactDataExtractor] Found ${orderRows.length} order rows`);
      
      orderRows.forEach((row, index) => {
        const order = this.extractOrderFromRow(row, index);
        if (order) {
          orders.push(order);
        }
      });
      
      console.log(`[ReactDataExtractor] Extracted ${orders.length} orders`);
      
      // If no orders found, try alternative method
      if (orders.length === 0 && this.debug) {
        console.log('[ReactDataExtractor] No orders found with primary method, trying alternative...');
        return this.extractOrdersAlternative();
      }
      
      return orders;
      
    } catch (error) {
      console.error('[ReactDataExtractor] Error during extraction:', error);
      return orders;
    }
  }

  extractOrderFromRow(row, index) {
    try {
      // Find React fiber with comprehensive search
      let fiber = this.findReactFiber(row);
      
      if (!fiber) {
        if (this.debug) {
          console.log(`[ReactDataExtractor] No React fiber found for row ${index}`);
          console.log(`[ReactDataExtractor] Element properties:`, Object.keys(row));
          console.log(`[ReactDataExtractor] Element:`, row);
        }
        return null;
      }
      
      if (this.debug) {
        console.log(`[ReactDataExtractor] Found React fiber for row ${index}`);
      }
      let current = fiber;
      let depth = 0;
      
      // Navigate up the fiber tree to find the order data (matching user's working pattern)
      while (current && depth < 20) {
        if (current.memoizedProps) {
          // Check for customerOrder first (user's working pattern shows this is the key)
          if (current.memoizedProps.customerOrder) {
            console.log(`[ReactDataExtractor] Found customerOrder at depth ${depth}`);
            if (this.debug) {
              console.log('[ReactDataExtractor] CustomerOrder structure:', current.memoizedProps.customerOrder);
            }
            return this.parseOrderData({ customerOrder: current.memoizedProps.customerOrder });
          }
          
          // Log what's available in memoizedProps for debugging
          if (this.debug && depth < 10) {
            const propKeys = Object.keys(current.memoizedProps);
            if (propKeys.length > 0 && propKeys.length < 20) {
              console.log(`[ReactDataExtractor] Depth ${depth} - memoizedProps keys:`, propKeys);
            }
          }
          
          // Check for order in various locations as fallback
          if (current.memoizedProps.order) {
            const orderData = current.memoizedProps.order;
            console.log(`[ReactDataExtractor] Found order data at depth ${depth}:`, orderData);
            return this.parseOrderData(orderData);
          }
          
          // Check for data prop that might contain order
          if (current.memoizedProps.data && current.memoizedProps.data.order) {
            const orderData = current.memoizedProps.data.order;
            console.log(`[ReactDataExtractor] Found order in data prop at depth ${depth}:`, orderData);
            return this.parseOrderData(orderData);
          }
        }
        
        // Move up the fiber tree
        current = current.return;
        depth++;
      }
      
      if (this.debug) {
        console.log(`[ReactDataExtractor] No order data found in React props for row ${index}`);
      }
      return null;
      
    } catch (error) {
      console.error(`[ReactDataExtractor] Error extracting from row ${index}:`, error);
      return null;
    }
  }

  parseOrderData(orderData) {
    try {
      // Handle different order data structures
      let order;
      
      // Check if it's the newer structure with customerOrder
      if (orderData.customerOrder) {
        order = this.parseCustomerOrderStructure(orderData.customerOrder);
      } else {
        // Original structure
        order = {
          id: this.extractOrderId(orderData),
          customerName: this.extractCustomerName(orderData),
          orderNumber: this.extractOrderNumber(orderData),
          waitTime: this.extractWaitTime(orderData),
          items: this.extractItems(orderData),
          source: 'react',
          timestamp: Date.now()
        };
      }
      
      if (this.debug) {
        console.log('[ReactDataExtractor] Parsed order:', order);
      }
      
      return order;
      
    } catch (error) {
      console.error('[ReactDataExtractor] Error parsing order data:', error);
      return null;
    }
  }
  
  parseCustomerOrderStructure(customerOrder) {
    // Extract from the newer API structure
    const orderId = customerOrder.orderIdentifier?.displayId || 
                    customerOrder.orderId?.id || 
                    'unknown';
    
    const customerName = customerOrder.customer?.displayName || 
                        customerOrder.customer?.firstName || 
                        'Unknown';
    
    const orderNumber = customerOrder.orderIdentifier?.displayId || 
                       customerOrder.externalOrderIdentifier?.displayId || 
                       'N/A';
    
    // Extract items from customerItemsContainer
    const items = [];
    const processedModifierIds = new Set(); // Track which modifiers we've processed
    
    if (customerOrder.customerItemsContainer) {
      const container = customerOrder.customerItemsContainer;
      
      // Process main items
      if (container.items) {
        container.items.forEach(item => {
          const parsedItem = this.parseCustomerItem(item, container.modifiers, customerOrder.stationOrders);
          if (parsedItem) {
            items.push(parsedItem);
            // Mark these modifiers as processed
            if (parsedItem.modifierItemIds) {
              parsedItem.modifierItemIds.forEach(id => processedModifierIds.add(id));
            }
          }
        });
      }
      
      // Process modifiers that weren't attached to any item
      // These are truly standalone items (including upsells)
      if (container.modifiers) {
        Object.entries(container.modifiers).forEach(([modId, modifier]) => {
          if (!processedModifierIds.has(modId)) {
            const modName = modifier.orderItemDetail?.name || '';
            
            // If this is NOT a size modifier and wasn't processed with an item
            if (!this.isSizeName(modName)) {
              // Try to extract size from the modifier name itself
              let itemSize = 'no-size';
              const modNameLower = modName.toLowerCase();
              
              // Check if size is in the name (e.g., "Small Cucumber Lemon Soda")
              if (modNameLower.includes('small')) {
                itemSize = 'small';
              } else if (modNameLower.includes('medium')) {
                itemSize = 'medium';
              } else if (modNameLower.includes('large')) {
                itemSize = 'large';
              }
              
              // Check if this is from an upsell section using stationOrders
              let isUpsellItem = false;
              if (customerOrder.stationOrders && customerOrder.stationOrders[0]) {
                const stationMods = customerOrder.stationOrders[0].menuReconciledItemsContainer?.modifiers;
                if (stationMods && stationMods[modId]) {
                  const sectionName = stationMods[modId].sectionName || '';
                  const upsellSections = ['Add a Dessert', 'Add a Drink', 'Side Addition'];
                  const separateItemSections = ['Choice of 3 piece Dumplings']; // Dumplings should be separate
                  isUpsellItem = upsellSections.includes(sectionName) || separateItemSections.includes(sectionName);
                  
                  if (isUpsellItem) {
                    console.log(`[ReactDataExtractor] Found upsell item: ${modName} from section: ${sectionName}`);
                  }
                }
              }
              
              items.push({
                name: modName,
                quantity: modifier.orderItemDetail?.quantity || 1,
                size: itemSize,
                category: 'Other',
                price: this.extractPriceFromMonetary(modifier.orderItemDetail?.salePrice),
                isStandaloneModifier: true,
                isUpsellItem: isUpsellItem
              });
              console.log(`[ReactDataExtractor] Added standalone modifier as item: ${modName} (size: ${itemSize})`);
            }
          }
        });
      }
    }
    
    // Also check stationOrders for additional item details
    if (customerOrder.stationOrders && customerOrder.stationOrders[0]) {
      const stationOrder = customerOrder.stationOrders[0];
      const reconciledItems = stationOrder.menuReconciledItemsContainer;
      
      if (reconciledItems && reconciledItems.modifiers) {
        // Map to track which items have which size modifiers
        const itemSizeMap = new Map();
        
        // First pass: identify size modifiers
        Object.entries(reconciledItems.modifiers).forEach(([modId, modifier]) => {
          const sectionName = modifier.sectionName || '';
          const itemName = modifier.stationItemDetail?.name || '';
          
          // Check if this is a size section or the modifier name is a size
          if (sectionName.toLowerCase().includes('size') || this.isSizeName(itemName)) {
            console.log(`[ReactDataExtractor] Found size in station order: ${itemName} (section: ${sectionName})`);
            
            // Find which items use this modifier
            if (reconciledItems.items) {
              reconciledItems.items.forEach(item => {
                if (item.modifierStationItemIds && item.modifierStationItemIds.includes(modId)) {
                  const mainItemName = item.stationItemDetail?.name;
                  if (mainItemName) {
                    itemSizeMap.set(mainItemName, itemName.toLowerCase());
                  }
                }
              });
            }
          }
        });
        
        // Second pass: update item sizes
        items.forEach(item => {
          if (itemSizeMap.has(item.name)) {
            const size = itemSizeMap.get(item.name);
            if (this.isSizeName(size)) {
              item.size = size;
              console.log(`[ReactDataExtractor] Updated ${item.name} size to: ${size}`);
            }
          }
        });
      }
    }
    
    // Calculate wait time
    const estimatedPrepTime = customerOrder.confirmationInfo?.estimatedPrepTimeMinutes || 0;
    
    return {
      id: orderId,
      customerName: customerName,
      orderNumber: orderNumber,
      waitTime: estimatedPrepTime,
      items: items,
      source: 'react-customer-order',
      timestamp: Date.now()
    };
  }
  
  parseCustomerItem(item, allModifiers, stationOrders) {
    const itemDetail = item.orderItemDetail;
    if (!itemDetail) return null;
    
    const parsedItem = {
      name: itemDetail.name || 'Unknown Item',
      quantity: itemDetail.quantity || 1,
      size: 'no-size',
      category: null, // Will be set based on categorization
      price: this.extractPriceFromMonetary(itemDetail.salePrice),
      modifierItemIds: [], // Track which modifiers are processed with this item
      modifiers: {}, // Store modifier details for categorization
      modifierList: [], // Store full modifier information
      proteinType: '', // Will be extracted from name or modifiers
      sauce: '', // Will be extracted from name or modifiers
      isRiceBowl: false,
      isUrbanBowl: false
    };
    
    // Check if this is a meal item (Bao Out, Bowl of Rice Meal)
    const isMealItem = parsedItem.name.toLowerCase().includes('bao out') || 
                      parsedItem.name.toLowerCase().includes('bowl of rice meal') ||
                      parsedItem.name.toLowerCase().includes('meal');
    
    if (isMealItem) {
      console.log(`[ReactDataExtractor] Detected meal item: ${parsedItem.name} - ALL modifiers will be separate items`);
    }
    
    // Check if this is an Urban Bowl FIRST (before any modifier checks)
    const isUrbanBowl = parsedItem.name.toLowerCase().includes('urban bowl');
    if (isUrbanBowl) {
      parsedItem.size = 'urban';
      parsedItem.modifiers.riceSubstitution = 'White Rice'; // Default
      parsedItem.modifiers.dumplingChoice = null;
      console.log(`[ReactDataExtractor] Detected Urban Bowl: ${parsedItem.name} - set size to 'urban'`);
    }
    
    // Check if this item has modifiers
    if (item.modifierCustomerItemIds && allModifiers) {
      console.log(`[ReactDataExtractor] Item ${parsedItem.name} has ${item.modifierCustomerItemIds.length} modifiers`);
      item.modifierCustomerItemIds.forEach(modId => {
        const modifier = allModifiers[modId];
        if (modifier && modifier.orderItemDetail) {
          const modName = modifier.orderItemDetail.name || '';
          const modNameLower = modName.toLowerCase();
          console.log(`[ReactDataExtractor] Processing modifier: ${modName} for item ${parsedItem.name}`);
          
          // Only check for size modifiers if this is NOT an Urban Bowl
          if (!isUrbanBowl && this.isSizeName(modName)) {
            // This is a size modifier - apply it to the main item
            parsedItem.size = modNameLower.trim();
            console.log(`[ReactDataExtractor] Applied size modifier: ${modName} to item ${parsedItem.name}`);
            
            // Add to the item price if the size modifier has a price
            const modPrice = this.extractPriceFromMonetary(modifier.orderItemDetail.salePrice);
            if (modPrice > 0) {
              parsedItem.price += modPrice;
            }
            
            // Mark this modifier as processed
            parsedItem.modifierItemIds.push(modId);
          } 
          // Check if this modifier is integrated into the main item
          else {
            // For meal items, NO modifiers are integrated - all are separate
            const isIntegrated = isMealItem ? false : this.shouldIntegrateModifier(parsedItem.name, modName, modifier, stationOrders);
            
            if (isIntegrated) {
              // This modifier is part of the main item, not separate
              console.log(`[ReactDataExtractor] ${modName} is integrated into ${parsedItem.name}`);
              parsedItem.modifierItemIds.push(modId);
              
              // Special handling for Urban Bowl modifiers
              if (isUrbanBowl) {
                // Check for rice substitution
                if (modNameLower.includes('fried rice') || modNameLower.includes('noodle')) {
                  parsedItem.modifiers.riceSubstitution = modName;
                  console.log(`[ReactDataExtractor] Urban Bowl rice substitution: ${modName}`);
                }
                // Check for dumpling choice
                else if (modNameLower.includes('dumpling')) {
                  parsedItem.modifiers.dumplingChoice = modName;
                  console.log(`[ReactDataExtractor] Urban Bowl dumpling choice: ${modName}`);
                }
              }
              // Special handling for rice substitutions on Rice Bowls - append to size
              else if (this.isRiceSubstitution(modName, modifier, stationOrders)) {
                // Append the rice substitution to the size
                const currentSize = parsedItem.size !== 'no-size' ? parsedItem.size : '';
                // Use the full modifier name exactly as it appears
                parsedItem.size = currentSize ? `${currentSize} - ${modName.toLowerCase()}` : modName.toLowerCase();
                console.log(`[ReactDataExtractor] Updated size with rice substitution: ${parsedItem.size}`);
              }
            } else {
              // This is an upsell modifier - DON'T mark it as processed
              // It will be added as a separate item in parseOrderData
              console.log(`[ReactDataExtractor] ${modName} is an upsell item - will be added separately`);
            }
          }
        }
      });
    }
    
    // Check if this is a Rice Bowl and extract additional info
    if (parsedItem.name.toLowerCase().includes('rice bowl')) {
      parsedItem.isRiceBowl = true;
      
      // If size wasn't found in modifiers, try to extract from name
      if (parsedItem.size === 'no-size') {
        const nameLower = parsedItem.name.toLowerCase();
        if (nameLower.includes('small')) parsedItem.size = 'small';
        else if (nameLower.includes('medium')) parsedItem.size = 'medium';
        else if (nameLower.includes('large')) parsedItem.size = 'large';
      }
    }
    
    // Extract protein type from item name
    const nameLower = parsedItem.name.toLowerCase();
    if (nameLower.includes('pork belly')) {
      parsedItem.proteinType = 'Pork Belly';
    } else if (nameLower.includes('grilled') && nameLower.includes('chicken')) {
      // Handle both "grilled chicken" and "grilled orange chicken" patterns
      parsedItem.proteinType = 'Grilled Chicken';
    } else if (nameLower.includes('crispy') && nameLower.includes('chicken')) {
      // Handle both "crispy chicken" and "crispy orange chicken" patterns
      parsedItem.proteinType = 'Crispy Chicken';
    } else if (nameLower.includes('steak')) {
      parsedItem.proteinType = 'Steak';
    } else if (nameLower.includes('salmon')) {
      parsedItem.proteinType = 'Salmon';
    } else if (nameLower.includes('shrimp')) {
      parsedItem.proteinType = 'Shrimp';
    } else if (nameLower.includes('fish')) {
      parsedItem.proteinType = 'Crispy Fish';
    } else if (nameLower.includes('tofu')) {
      parsedItem.proteinType = 'Tofu';
    } else if (nameLower.includes('cauliflower')) {
      parsedItem.proteinType = 'Cauliflower Nugget';
    }
    
    // Extract sauce from item name if not already in modifiers
    if (!parsedItem.sauce) {
      const sauces = ['sesame aioli', 'garlic aioli', 'chipotle aioli', 'jalapeño herb aioli', 
                      'sweet sriracha aioli', 'orange', 'teriyaki', 'spicy yuzu', 'garlic sesame fusion'];
      for (const sauce of sauces) {
        if (nameLower.includes(sauce)) {
          parsedItem.sauce = sauce.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          break;
        }
      }
    }
    
    // Store all modifiers in modifierList for complete information
    if (item.modifierCustomerItemIds && allModifiers) {
      item.modifierCustomerItemIds.forEach(modId => {
        const modifier = allModifiers[modId];
        if (modifier && modifier.orderItemDetail) {
          parsedItem.modifierList.push({
            id: modId,
            name: modifier.orderItemDetail.name || '',
            price: this.extractPriceFromMonetary(modifier.orderItemDetail.salePrice),
            integrated: parsedItem.modifierItemIds.includes(modId)
          });
        }
      });
    }
    
    return parsedItem;
  }
  
  shouldIntegrateModifier(itemName, modifierName, modifier, stationOrders) {
    // Determine if a modifier should be integrated into the main item
    // or treated as a separate item
    
    // First check station orders for section name
    let sectionName = '';
    if (stationOrders && stationOrders[0]) {
      const stationMods = stationOrders[0].menuReconciledItemsContainer?.modifiers;
      if (stationMods) {
        for (const [id, stationMod] of Object.entries(stationMods)) {
          if (stationMod.stationItemDetail?.name === modifierName) {
            sectionName = stationMod.sectionName || '';
            break;
          }
        }
      }
    }
    
    // Special case: Dumplings in Urban Bowls should be separate items
    if (sectionName === 'Choice of 3 piece Dumplings' && itemName.toLowerCase().includes('urban bowl')) {
      console.log(`[ReactDataExtractor] Dumplings in Urban Bowl will be separate items: ${modifierName}`);
      return false;
    }
    
    return this.isIntegratedModifier(itemName, modifierName, sectionName);
  }
  
  isUrbanBowlComponent(modifierName, modifier, stationOrders) {
    // Check if this modifier is part of an Urban Bowl (like choice of dumplings)
    const modNameLower = modifierName.toLowerCase();
    
    // Check if it's dumplings that are part of "Choice of 3 piece Dumplings"
    if (modNameLower.includes('dumpling')) {
      // Check the station orders for section name
      if (stationOrders && stationOrders[0]) {
        const stationMods = stationOrders[0].menuReconciledItemsContainer?.modifiers;
        if (stationMods) {
          // Find this modifier in station orders
          for (const [id, stationMod] of Object.entries(stationMods)) {
            if (stationMod.stationItemDetail?.name === modifierName) {
              const sectionName = stationMod.sectionName || '';
              // If it's part of "Choice of X piece Dumplings", it's part of the bowl
              if (sectionName.toLowerCase().includes('choice') && sectionName.toLowerCase().includes('dumpling')) {
                return true;
              }
            }
          }
        }
      }
    }
    
    // Rice substitutions are also part of Urban Bowls
    if (modNameLower.includes('rice') && (modNameLower.includes('garlic butter') || modNameLower.includes('substitute'))) {
      return true;
    }
    
    // Sauces for Urban Bowls are part of the bowl
    if (modNameLower.includes('sauce') || modNameLower.includes('aioli')) {
      return true;
    }
    
    return false;
  }
  
  isIntegratedModifier(itemName, modifierName, sectionName) {
    // Determines if a modifier is integrated into the main item
    const itemLower = itemName.toLowerCase();
    const modLower = modifierName.toLowerCase();
    const section = sectionName || '';
    
    // These sections are ALWAYS integrated with the main item
    const integratedSections = [
      'Size Choice',
      'Size Choice - Salmon',
      'Boba Option',
      // 'Choice of 3 piece Dumplings', // Now treated as separate items
      'Choice of Dressing',
      'Choice of Protein',
      'House Sauces',
      'Substitute Rice',
      'Top Steak with Our Signature Sauces',  // Sauce ON the steak
      'Top Salmon with Our Signature Sauces'  // Sauce ON the salmon
    ];
    
    if (integratedSections.includes(section)) {
      return true; // These modify/complete the main item
    }
    
    // Check section names that indicate SEPARATE items
    const separateItemSections = [
      'Add a Dessert',
      'Add a Drink', 
      'Side Addition'
    ];
    
    if (separateItemSections.includes(section)) {
      return false; // These are always separate items
    }
    
    // Special case: Required modifiers that create combo items
    if (section === '(Dessert)' || section === '(Dumplings)' || section === '(Small Rice Bowl)') {
      // These create new combo items, so they're integrated
      return true;
    }
    
    // Default: modifiers are separate items
    return false;
  }
  
  isDrinkItem(itemName) {
    return itemName.includes('tea') || 
           itemName.includes('drink') || 
           itemName.includes('latte') || 
           itemName.includes('coffee') || 
           itemName.includes('smoothie') ||
           itemName.includes('juice') ||
           itemName.includes('soda');
  }
  
  isRiceSubstitution(modifierName, modifier, stationOrders) {
    // Check if this is a rice substitution modifier
    if (stationOrders && stationOrders[0]) {
      const stationMods = stationOrders[0].menuReconciledItemsContainer?.modifiers;
      if (stationMods) {
        for (const [id, stationMod] of Object.entries(stationMods)) {
          if (stationMod.stationItemDetail?.name === modifierName) {
            const sectionName = stationMod.sectionName || '';
            if (sectionName === 'Substitute Rice') {
              return true;
            }
          }
        }
      }
    }
    
    // Also check by name patterns
    const modLower = modifierName.toLowerCase();
    return (modLower.includes('rice') && modLower.includes('substitute')) ||
           modLower.includes('garlic butter fried rice') ||
           modLower.includes('stir fry rice noodles');
  }
  
  // Helper function to determine section type based on Otter's naming patterns
  getSectionType(sectionName) {
    if (!sectionName) return 'unknown';
    
    // Map of exact section names to their types
    const sectionMap = {
      // Separate items
      'Add a Dessert': 'separate',
      'Add a Drink': 'separate',
      'Side Addition': 'separate',
      'Top Steak with Our Signature Sauces': 'separate',
      'Top Salmon with Our Signature Sauces': 'separate',
      'House Sauces': 'separate',
      
      // Integrated modifiers
      'Size Choice': 'integrated',
      'Size Choice - Salmon': 'integrated',
      'Boba Option': 'integrated-conditional', // Only integrated for drinks
      'Choice of 3 piece Dumplings': 'integrated-urban-bowl',
      'Substitute Rice': 'integrated-urban-bowl',
      
      // Combo creators (create new items)
      '(Dessert)': 'combo',
      '(Dumplings)': 'combo',
      '(Small Rice Bowl)': 'combo',
      
      // Optional modifiers
      'Add-ons': 'optional',
      'Add-Ons Vegetarian': 'optional'
    };
    
    return sectionMap[sectionName] || 'unknown';
  }
  
  isSizeName(name) {
    if (!name) return false;
    const nameLower = name.toLowerCase().trim();
    
    // Exact matches for size names
    const sizeNames = ['small', 'medium', 'large', 'regular', 'xl', 'extra large', 'extra-large'];
    if (sizeNames.includes(nameLower)) return true;
    
    // Check for size abbreviations
    if (nameLower === 'sm' || nameLower === 'md' || nameLower === 'lg' || nameLower === 'xs') return true;
    
    // Check if it's just "Large" or "Small" etc. (exact match)
    const exactSizeNames = ['Large', 'Small', 'Medium', 'Regular', 'XL', 'Extra Large'];
    if (exactSizeNames.includes(name.trim())) return true;
    
    // Check for patterns like "Size: Large" or "Large Size"
    if (nameLower.includes('size') && (nameLower.includes('small') || nameLower.includes('medium') || nameLower.includes('large'))) {
      return true;
    }
    
    return false;
  }
  
  extractPriceFromMonetary(priceObj) {
    if (!priceObj) return 0;
    
    const units = priceObj.units || 0;
    const nanos = priceObj.nanos || 0;
    
    return units + (nanos / 1000000000);
  }

  extractOrderId(orderData) {
    return orderData.id || 
           orderData.orderId || 
           orderData.uuid || 
           orderData._id || 
           `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  extractCustomerName(orderData) {
    return orderData.customerName || 
           orderData.customer?.name || 
           orderData.customer?.firstName || 
           orderData.name || 
           'Unknown Customer';
  }

  extractOrderNumber(orderData) {
    return orderData.orderNumber || 
           orderData.displayId || 
           orderData.code || 
           orderData.number || 
           'N/A';
  }

  extractWaitTime(orderData) {
    // Try various fields that might contain wait time
    const waitTime = orderData.estimatedReadyTime || 
                     orderData.prepTime || 
                     orderData.waitTime ||
                     orderData.estimatedTime;
    
    if (waitTime) {
      // If it's a timestamp, calculate minutes from now
      if (waitTime > 1000000000) {
        const now = Date.now();
        const diffMs = waitTime - now;
        return Math.max(0, Math.floor(diffMs / 60000));
      }
      return parseInt(waitTime) || 0;
    }
    
    return 0;
  }

  extractItems(orderData) {
    const items = [];
    
    // Find items in various possible locations
    const itemsArray = orderData.items || 
                       orderData.orderItems || 
                       orderData.lineItems || 
                       orderData.products || 
                       [];
    
    itemsArray.forEach(itemData => {
      const item = this.parseItemData(itemData);
      if (item) {
        items.push(item);
        
        // Check for modifiers that might be separate items (like dumplings in Urban Bowls)
        const additionalItems = this.extractAdditionalItems(itemData);
        items.push(...additionalItems);
      }
    });
    
    return items;
  }

  parseItemData(itemData) {
    try {
      const item = {
        name: this.extractItemName(itemData),
        quantity: this.extractItemQuantity(itemData),
        size: this.extractItemSize(itemData),
        category: 'Other', // Will be categorized later
        price: this.extractItemPrice(itemData)
      };
      
      // Skip items without valid names
      if (!item.name || item.name === 'Unknown Item') {
        return null;
      }
      
      // Log size extraction for debugging
      if (this.debug && item.size === 'no-size') {
        console.log('[ReactDataExtractor] No size found for item:', itemData);
      }
      
      return item;
      
    } catch (error) {
      console.error('[ReactDataExtractor] Error parsing item:', error);
      return null;
    }
  }

  extractItemName(itemData) {
    return itemData.name || 
           itemData.itemName || 
           itemData.title || 
           itemData.productName || 
           itemData.description || 
           'Unknown Item';
  }

  extractItemQuantity(itemData) {
    const qty = itemData.quantity || 
                itemData.qty || 
                itemData.count || 
                itemData.amount || 
                1;
    return parseInt(qty) || 1;
  }

  extractItemPrice(itemData) {
    const price = itemData.price || 
                  itemData.amount || 
                  itemData.total || 
                  itemData.subtotal || 
                  0;
    
    if (typeof price === 'string') {
      return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    }
    
    return parseFloat(price) || 0;
  }

  extractItemSize(itemData) {
    // Check for Urban Bowl FIRST (before checking any size fields)
    const name = this.extractItemName(itemData);
    if (name && name.toLowerCase().includes('urban bowl')) {
      console.log(`[ReactDataExtractor] Detected Urban Bowl in extractItemSize: ${name} - returning 'urban' size`);
      return 'urban'; // Special size category for Urban Bowls
    }
    
    // Direct size fields
    if (itemData.size) return itemData.size;
    if (itemData.variant) return itemData.variant;
    if (itemData.variation) return itemData.variation;
    if (itemData.option) return itemData.option;
    if (itemData.selectedSize) return itemData.selectedSize;
    if (itemData.selected_size) return itemData.selected_size;
    
    // Check in selectedOptions array
    if (itemData.selectedOptions && Array.isArray(itemData.selectedOptions)) {
      const sizeOption = itemData.selectedOptions.find(opt => {
        const name = (opt.name || opt.label || '').toLowerCase();
        return name.includes('size') || name.includes('variant');
      });
      
      if (sizeOption) {
        return sizeOption.value || sizeOption.selection || sizeOption.choice || 'no-size';
      }
    }
    
    // Check in modifiers array
    if (itemData.modifiers && Array.isArray(itemData.modifiers)) {
      const sizeModifier = itemData.modifiers.find(mod => {
        const name = (mod.name || mod.label || '').toLowerCase();
        return name.includes('size') || 
               name.includes('small') || 
               name.includes('medium') || 
               name.includes('large');
      });
      
      if (sizeModifier) {
        return sizeModifier.value || 
               sizeModifier.selection || 
               sizeModifier.choice || 
               sizeModifier.name || 
               'no-size';
      }
      
      // For Urban Bowls, rice substitution might indicate size
      const riceMod = itemData.modifiers.find(mod => {
        const name = (mod.name || mod.label || '').toLowerCase();
        return name.includes('rice') && name.includes('substitute');
      });
      
      if (riceMod && itemData.name && itemData.name.includes('Urban Bowl')) {
        return riceMod.value || riceMod.selection || riceMod.name || 'no-size';
      }
    }
    
    // Check in options object
    if (itemData.options && typeof itemData.options === 'object') {
      if (itemData.options.size) return itemData.options.size;
      if (itemData.options.variant) return itemData.options.variant;
      
      // Check nested options
      const optionKeys = Object.keys(itemData.options);
      for (const key of optionKeys) {
        if (key.toLowerCase().includes('size') || key.toLowerCase().includes('variant')) {
          return itemData.options[key];
        }
      }
    }
    
    // Check in attributes
    if (itemData.attributes && Array.isArray(itemData.attributes)) {
      const sizeAttr = itemData.attributes.find(attr => {
        const name = (attr.name || attr.key || '').toLowerCase();
        return name.includes('size') || name.includes('variant');
      });
      
      if (sizeAttr) {
        return sizeAttr.value || sizeAttr.text || 'no-size';
      }
    }
    
    // Try to extract from item name
    const itemName = this.extractItemName(itemData);
    const sizeMatch = itemName.match(/\b(small|medium|large|sm|md|lg|xl|regular)\b/i);
    if (sizeMatch) {
      return sizeMatch[1].toLowerCase();
    }
    
    // Check SKU patterns (specific to Otter)
    if (itemData.sku || itemData.skuId) {
      const sku = itemData.sku || itemData.skuId;
      // Common SKU patterns for sizes
      if (sku.includes('_SM') || sku.includes('-SM')) return 'small';
      if (sku.includes('_MD') || sku.includes('-MD')) return 'medium';
      if (sku.includes('_LG') || sku.includes('-LG')) return 'large';
      if (sku.includes('_XL') || sku.includes('-XL')) return 'xl';
    }
    
    // Default to no-size
    return 'no-size';
  }

  extractAdditionalItems(itemData) {
    const additionalItems = [];
    
    // Check modifiers for items that should be separate (like dumplings)
    if (itemData.modifiers && Array.isArray(itemData.modifiers)) {
      itemData.modifiers.forEach(modifier => {
        // Check if this modifier is actually a separate item
        const modName = (modifier.name || modifier.label || '').toLowerCase();
        
        // Dumplings in Urban Bowls are separate items
        if (modName.includes('dumpling') && modifier.value) {
          additionalItems.push({
            name: modifier.value || modifier.selection || modifier.name,
            quantity: modifier.quantity || 1,
            size: 'no-size',
            category: 'Other',
            price: modifier.price || 0
          });
        }
      });
    }
    
    return additionalItems;
  }

  // Integration method to be called by OrderExtractor
  async extractOrdersForIntegration() {
    console.log('[ReactDataExtractor] Extracting orders for integration...');
    const orders = this.extractOrders();
    
    // Format orders to match expected structure
    return orders.map(order => ({
      ...order,
      source: 'react-props',
      extractedAt: Date.now()
    }));
  }
  
  // Debug method to inspect React fibers
  inspectReactFibers() {
    console.log('=== REACT FIBER INSPECTION ===');
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    console.log(`Found ${orderRows.length} order rows`);
    
    if (orderRows.length === 0) return;
    
    // Inspect first order row
    const row = orderRows[0];
    const reactKeys = Object.keys(row).filter(k => k.startsWith('__react'));
    
    if (reactKeys.length === 0) {
      console.log('No React fiber found on order row');
      return;
    }
    
    console.log('React keys found:', reactKeys);
    const fiber = row[reactKeys[0]];
    let current = fiber;
    let depth = 0;
    
    console.log('\nTraversing fiber tree:');
    while (current && depth < 10) {
      console.log(`\nDepth ${depth}:`);
      console.log('- Type:', current.type?.name || current.type || 'unknown');
      console.log('- StateNode:', current.stateNode?.constructor?.name || 'none');
      
      if (current.memoizedProps) {
        const props = current.memoizedProps;
        console.log('- Props keys:', Object.keys(props));
        
        // Check for order-related props
        if (props.order) {
          console.log('  ✓ Found order prop!');
          console.log('  Order structure:', props.order);
        }
        if (props.data) {
          console.log('  ✓ Found data prop!');
          console.log('  Data keys:', Object.keys(props.data));
        }
        if (props.customerOrder) {
          console.log('  ✓ Found customerOrder prop!');
          console.log('  CustomerOrder:', props.customerOrder);
        }
        
        // Log any prop that might contain order data
        Object.keys(props).forEach(key => {
          if (key.toLowerCase().includes('order') || 
              key.toLowerCase().includes('customer') ||
              key.toLowerCase().includes('item')) {
            console.log(`  → ${key}:`, props[key]);
          }
        });
      }
      
      current = current.return;
      depth++;
    }
    
    console.log('\n=== END INSPECTION ===');
    return fiber;
  }
  
  // Alternative extraction method that matches the working function
  extractOrdersAlternative() {
    console.log('[ReactDataExtractor] Using alternative extraction method');
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    console.log(`[ReactDataExtractor] Found ${orderRows.length} order rows`);
    
    const orders = [];
    
    orderRows.forEach((row, index) => {
      // Try all possible React keys
      const allKeys = Object.keys(row);
      const reactKeys = allKeys.filter(k => 
        k.startsWith('__react') || 
        k.includes('Fiber') || 
        k.includes('Instance')
      );
      
      if (reactKeys.length === 0) {
        console.log(`[ReactDataExtractor] Row ${index}: No React keys found. All keys:`, allKeys);
        return;
      }
      
      console.log(`[ReactDataExtractor] Row ${index}: Found React keys:`, reactKeys);
      
      try {
        const fiber = row[reactKeys[0]];
        let current = fiber;
        let depth = 0;
        let orderData = null;
        
        // Navigate up the fiber tree
        while (current && depth < 20) {
          // Log what we find at each level
          if (depth < 5) {
            console.log(`[ReactDataExtractor] Depth ${depth}:`, {
              type: current.type?.name || current.type,
              hasProps: !!current.memoizedProps,
              propKeys: current.memoizedProps ? Object.keys(current.memoizedProps) : []
            });
          }
          
          if (current.memoizedProps) {
            // Check for order in any prop
            const props = current.memoizedProps;
            
            // Direct order prop
            if (props.order) {
              orderData = props.order;
              console.log(`[ReactDataExtractor] Found order at depth ${depth}`);
              break;
            }
            
            // Check all props for order-like data
            Object.keys(props).forEach(key => {
              const value = props[key];
              if (value && typeof value === 'object') {
                if (value.customerOrder || value.orderId || value.orderNumber) {
                  orderData = value;
                  console.log(`[ReactDataExtractor] Found order data in prop '${key}' at depth ${depth}`);
                }
              }
            });
            
            if (orderData) break;
          }
          
          current = current.return;
          depth++;
        }
        
        if (orderData) {
          const parsed = this.parseOrderData(orderData);
          if (parsed) {
            orders.push(parsed);
          }
        }
      } catch (e) {
        console.log(`[ReactDataExtractor] Error processing row ${index}:`, e.message);
      }
    });
    
    console.log(`[ReactDataExtractor] Alternative method extracted ${orders.length} orders`);
    return orders;
  }
}

// Create global instance
window.otterReactDataExtractor = new ReactDataExtractor();
console.log('[ReactDataExtractor] Global instance created: window.otterReactDataExtractor');

// Enable debug mode if needed
if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
  window.otterReactDataExtractor.enableDebug();
}