console.log('[OrderExtractor.js] Script loaded at:', new Date().toISOString());

class OrderExtractor {
  constructor(categoryManager) {
    this.categoryManager = categoryManager;
    this.orderSelectors = {
      // Main order list selectors - will be updated dynamically
      orderRow: '[data-testid="order-row"]',
      orderNumber: '[data-testid="order-info-subtext"]',
      customerName: '.sc-dCesDq.kTVViB > div, .sc-gpaZuh.cMzcnw, h1.sc-khYOSX',
      itemQuantityCircle: '.sc-hGsGDS.iSFqHC',
      itemCategoryText: '.sc-aeBcf.fVhLeR > p, p.sc-gpaZuh',
      itemListText: '.sc-aeBcf.fVhLeR > div',
      courierStatus: '[data-testid="order-type-time"]',
      // Detail view selectors (when clicking order)
      detailModal: '[data-testid="order-details-receipt-items"]',
      detailItemRow: '[data-testid="order-details-receipt-item-row"]',
      detailItemName: '.sc-jsFtja.hSUmFW, p.sc-jsFtja.hSUmFW',
      detailItemQuantity: '.sc-einZSS.hnbVZg',
      detailItemPrice: '.sc-jsFtja.epewNT, p.sc-jsFtja.epewNT',
      modifierSection: '.sc-ixKSzz.sc-cCAuRX.irfKLT.ECGcy',
      modifierLabel: '.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA',
      modifierValue: '.sc-jsFtja.epewNT, p.sc-jsFtja.epewNT',
      closeButton: 'button[aria-label="Close"], svg[aria-label="Close"], button svg path[d*="M"]'
    };
    this.processedOrders = new Set();
  }
  
  // Update the order row selector dynamically
  updateOrderRowSelector(newSelector) {
    console.log(`Updating order row selector from ${this.orderSelectors.orderRow} to ${newSelector}`);
    this.orderSelectors.orderRow = newSelector;
  }

  async extractOrders() {
    const orders = [];
    const orderRows = document.querySelectorAll(this.orderSelectors.orderRow);
    
    console.log(`Found ${orderRows.length} order rows`);
    
    for (let i = 0; i < orderRows.length; i++) {
      const orderRow = orderRows[i];
      
      // Call progress callback if available
      if (this.onProgress) {
        this.onProgress(i + 1, orderRows.length);
      }
      
      try {
        // Use preview-only extraction
        const order = this.extractOrderFromPreview(orderRow);
        if (order && order.items.length > 0) {
          orders.push(order);
        }
      } catch (error) {
        console.error('Error extracting order:', error);
      }
    }
    
    return orders;
  }
  
  async ensureOnOrdersPage() {
    const currentUrl = window.location.href;
    const isMainOrdersPage = currentUrl === 'https://app.tryotter.com/orders' || 
                            currentUrl === 'https://app.tryotter.com/orders/';
    
    if (!isMainOrdersPage) {
      console.log('Not on main orders page, navigating back...');
      // Try to click the orders link
      const ordersLink = document.querySelector('a[href="/orders"]');
      if (ordersLink) {
        ordersLink.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Fallback: navigate directly
        window.location.href = 'https://app.tryotter.com/orders';
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  extractOrderFromPreview(orderRow) {
    try {
      // Validate order row
      if (!orderRow || !orderRow.querySelector) {
        console.warn('Invalid order row element');
        return null;
      }
      
      // Extract basic order info from row
      const orderNumber = this.extractText(orderRow, this.orderSelectors.orderNumber) || 'Unknown';
      const customerName = this.extractText(orderRow, this.orderSelectors.customerName) || 'Unknown';
      
      // Extract elapsed time
      const elapsedTime = this.extractElapsedTime(orderRow);
      
      // Generate order ID
      const orderId = `${orderNumber}_${customerName}`;
      
      // Calculate orderedAt from elapsed time
      const now = new Date();
      const orderedAt = new Date(now - (elapsedTime * 60000)).toISOString();
      
      // Extract items from the preview only
      const previewItems = this.extractPreviewItems(orderRow);
      
      if (!previewItems || previewItems.length === 0) {
        console.warn(`No items found for order ${orderId}`);
        return null;
      }
      
      // Update sizes for Urban Bowls and Rice Bowls in preview items
      previewItems.forEach(item => {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes('urban bowl')) {
          item.size = 'urban';
          item.isUrbanBowl = true;
        } else if (nameLower.includes('rice bowl')) {
          item.isRiceBowl = true;
          // Try to extract size from name if not already set
          if (item.size === 'no-size') {
            if (nameLower.includes('small')) item.size = 'small';
            else if (nameLower.includes('medium')) item.size = 'medium';
            else if (nameLower.includes('large')) item.size = 'large';
          }
        }
        
        // Detect rice substitutions from cached data if available
        if (item.size && item.size.includes('-')) {
          // Size includes substitution like "large - fried rice substitute"
          const parts = item.size.split('-').map(s => s.trim());
          if (parts.length > 1) {
            const substitution = parts.slice(1).join(' - ');
            if (substitution.toLowerCase().includes('fried rice') || 
                substitution.toLowerCase().includes('noodle')) {
              item.riceSubstitution = substitution;
            }
          }
        }
      });
      
      const order = {
        id: orderId,
        number: orderNumber,
        customerName: customerName,
        orderedAt: orderedAt,
        elapsedTime: elapsedTime,
        timestamp: Date.now(),
        waitTime: 0, // No longer using wait time
        items: previewItems
      };
      
      // Check if we have cached API data for this order
      if (window.otterOrderCache) {
        const cachedOrder = window.otterOrderCache.findMatchingOrder(order);
        if (cachedOrder) {
          console.log(`[OrderExtractor] Found cached API data for order ${orderNumber}:`, cachedOrder);
          
          // Merge cached item details with preview items
          if (cachedOrder.items && cachedOrder.items.length > 0) {
            // Replace preview items with more detailed cached items
            order.items = cachedOrder.items.map(cachedItem => {
              const size = cachedItem.size || 'no-size';
              const categoryInfo = this.categoryManager.categorizeItem(cachedItem.name, size);
              return {
                name: cachedItem.name,
                baseName: cachedItem.name,
                size: size,
                quantity: cachedItem.quantity || 1,
                price: cachedItem.price || 0,
                category: categoryInfo.category,
                categoryInfo: categoryInfo, // Store full category info
                modifiers: cachedItem.modifiers || [],
                fromCache: true // Flag to indicate data source
              };
            });
            
            console.log(`[OrderExtractor] Using ${order.items.length} items from cache with sizes`);
          }
        }
      }
      
      console.log(`Order ${orderNumber} - ${customerName}: wait time = ${order.waitTime}m, items: ${order.items.length}`);
      
      return order;
    } catch (error) {
      console.error('Error extracting order from preview:', error);
      return null;
    }
  }
  
  // DISABLED: Modal-based extraction causes page refresh loops
  // Keep the detailed extraction for manual refresh only
  async extractOrderWithDetails(orderRow) {
    // IMPORTANT: Disabled to prevent page refresh loops
    // The modal closing mechanism was causing constant page navigation
    // Using preview-only extraction for stability
    console.log('Detailed extraction disabled - using preview only');
    return this.extractOrderFromPreview(orderRow);
    
    /* Original code disabled:
    try {
      // First get preview data
      const previewOrder = this.extractOrderFromPreview(orderRow);
      if (!previewOrder) return null;
      
      // Check if we already processed this order
      if (this.processedOrders.has(previewOrder.id)) {
        return null;
      }
      
      // For manual detailed extraction, click to get sizes
      try {
        // Click on the order row to open details
        if (orderRow.click) {
          orderRow.click();
        } else {
          // Fallback click method
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          orderRow.dispatchEvent(clickEvent);
        }
        
        // Wait for details modal to appear
        await this.waitForElement(this.orderSelectors.detailModal, 3000);
        
        // Extract detailed items with sizes
        const items = await this.extractDetailedItems();
        
        // Close the modal
        await this.closeOrderDetails();
        
        // Mark as processed
        this.processedOrders.add(previewOrder.id);
        
        // Return order with detailed items if we got them
        if (items && items.length > 0) {
          return {
            ...previewOrder,
            items: items
          };
        }
      } catch (error) {
        console.log(`Using preview items for order ${previewOrder.id}:`, error.message);
      }
      
      // Fallback to preview items
      this.processedOrders.add(previewOrder.id);
      return previewOrder;
    } catch (error) {
      console.error('Error extracting order with details:', error);
      return null;
    }
    */
  }
  
  extractPreviewItems(orderRow) {
    const items = [];
    
    try {
      // Get the quantity from the circle
      const quantityEl = orderRow.querySelector(this.orderSelectors.itemQuantityCircle);
      const totalQuantity = quantityEl ? parseInt(quantityEl.textContent) || 1 : 1;
      
      // Get the item list text
      const itemListEl = orderRow.querySelector(this.orderSelectors.itemListText);
      const itemListText = itemListEl ? itemListEl.textContent.trim() : '';
      
      // Split items by bullet point (•)
      const itemNames = itemListText.split('•').map(name => name.trim()).filter(name => name);
      
      // Create item objects - detect size from name when possible
      // Since we can't determine individual quantities from preview, we'll assign 1 to each
      // The batch system will accumulate these properly
      itemNames.forEach(name => {
        // Detect size from item name
        let size = 'no-size';
        const lowerName = name.toLowerCase();
        
        // Check for Urban Bowl
        if (lowerName.includes('urban bowl')) {
          size = 'urban';
          console.log(`[OrderExtractor] Detected Urban Bowl in preview: ${name} - set size to 'urban'`);
        }
        // Could add more size detection from names here if needed
        // e.g., if name includes size keywords
        
        // Pass size to categorizeItem for proper categorization
        const categoryInfo = this.categoryManager.categorizeItem(name, size);
        
        items.push({
          name: name,
          baseName: name,
          size: size,
          quantity: 1, // Each item instance has quantity 1
          price: 0,
          category: categoryInfo.topCategory,
          subcategory: categoryInfo.subCategory,
          categoryInfo: categoryInfo // Store full category info for display
        });
      });
    } catch (error) {
      console.error('Error extracting preview items:', error);
    }
    
    return items;
  }
  
  async extractDetailedItems() {
    const items = [];
    const detailRows = document.querySelectorAll(this.orderSelectors.detailItemRow);
    
    for (const row of detailRows) {
      const extractedItems = this.extractDetailedItemData(row);
      if (Array.isArray(extractedItems)) {
        // Multiple items returned (main item + side additions)
        extractedItems.forEach(item => {
          if (item && item.name) {
            items.push(item);
          }
        });
      } else if (extractedItems && extractedItems.name) {
        // Single item returned (backward compatibility)
        items.push(extractedItems);
      }
    }
    
    return items;
  }
  
  extractDetailedItemData(itemRow) {
    try {
      const name = this.extractText(itemRow, this.orderSelectors.detailItemName);
      if (!name) {
        console.warn('No item name found in row');
        return null;
      }
      
      const quantityText = this.extractText(itemRow, this.orderSelectors.detailItemQuantity);
      const quantity = parseInt(quantityText) || 1;
      const priceText = this.extractText(itemRow, this.orderSelectors.detailItemPrice);
      const price = this.parsePrice(priceText);
      
      // Look for all modifiers (size, add-ons, etc.)
      const modifiers = [];
      const sideAdditions = []; // Collect side additions separately
      let size = null;
      let isUrbanBowl = name.toLowerCase().includes('urban bowl');
      if (isUrbanBowl) {
        console.log(`[OrderExtractor] Detected Urban Bowl: ${name}`);
      }
      let riceSubstitution = null;
    
    // Get the parent container for this item
    const parentContainer = itemRow.parentElement;
    
    // First check if the modifier containers are direct children of the parent
    if (!size && parentContainer) {
      const modifierContainers = parentContainer.querySelectorAll('.sc-ixKSzz.cMJRAn');
      modifierContainers.forEach(container => {
        // Find the label within this container
        const labelEl = container.querySelector('.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ');
        if (labelEl) {
          const labelText = labelEl.textContent.trim();
          
          // Check if this is a size choice
          if (labelText === 'Size Choice' || labelText.includes('Size Choice')) {
            console.log('Found Size Choice label in container');
            
            // Find the size value - it's in the nested structure
            // Structure: .sc-ixKSzz.irfKLT > .sc-bvrlno.iRptWl > .sc-ixKSzz.dpIGfp > .sc-jsFtja.epewNT
            const valueContainer = container.querySelector('.sc-ixKSzz.irfKLT');
            if (valueContainer) {
              // Look for the size text in the specific nested structure
              const sizeEl = valueContainer.querySelector('.sc-ixKSzz.dpIGfp .sc-jsFtja.epewNT') || 
                           valueContainer.querySelector('.sc-jsFtja.epewNT');
              
              if (sizeEl && sizeEl.textContent) {
                // The size text has a leading space in the HTML
                const sizeText = sizeEl.textContent.trim();
                console.log('Found size text:', sizeText);
                
                if (sizeText && !size) {
                  size = sizeText;
                  
                  // Also try to get the price
                  const priceEl = valueContainer.querySelector('.sc-ixKSzz.fXtJCI .sc-jsFtja.epewNT');
                  if (priceEl) {
                    console.log('Size price:', priceEl.textContent.trim());
                  }
                }
              } else {
                console.log('No size element found in value container');
              }
            } else {
              console.log('No value container (.sc-ixKSzz.irfKLT) found');
            }
          }
        }
      });
    }
    
    // Look for modifier sections after this item row
    let nextSibling = itemRow.nextElementSibling;
    while (nextSibling && !nextSibling.matches(this.orderSelectors.detailItemRow)) {
      // Check if this element contains size information
      // Look for the specific container structure: sc-ixKSzz cMJRAn
      const modifierContainers = nextSibling.querySelectorAll('.sc-ixKSzz.cMJRAn');
      
      modifierContainers.forEach(container => {
        // Find the label within this container
        const labelEl = container.querySelector('.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ');
        if (labelEl) {
          const labelText = labelEl.textContent.trim();
          
          // Check if this is a size choice
          if (labelText.includes('Size Choice')) {
            // Find the size value - it's in a nested structure
            const valueContainer = container.querySelector('.sc-ixKSzz.irfKLT');
            if (valueContainer) {
              const sizeEl = valueContainer.querySelector('.sc-jsFtja.epewNT, p.sc-jsFtja.epewNT');
              if (sizeEl && sizeEl.textContent) {
                // Trim the leading space that's in the HTML
                const sizeText = sizeEl.textContent.trim();
                if (sizeText) {
                  size = sizeText;
                  // Keep the full size text including substitutions
                  // Examples: "Small", "Large", "Small - Garlic Butter Fried Rice Substitute"
                  // Don't extract the base size - keep the full description
                }
              }
            }
          }
        }
      });
      
      // If no size found yet, try the legacy approach for backward compatibility
      if (!size) {
        const allTexts = nextSibling.querySelectorAll('*');
        allTexts.forEach(el => {
          if (el.textContent && el.textContent.trim().includes('Size Choice') && !size) {
            // Look for size value in various possible locations
            let parent = el.parentElement;
            while (parent && !size) {
              const possibleValueEls = parent.querySelectorAll('.sc-jsFtja.epewNT');
              possibleValueEls.forEach(valEl => {
                const text = valEl.textContent.trim();
                if (text && !text.includes('Size Choice') && !size) {
                  size = text;
                }
              });
              parent = parent.parentElement;
              if (parent === nextSibling.parentElement) break; // Don't go too far up
            }
          }
        });
      }
      
      // Also check for other modifiers using the existing logic
      if (nextSibling.matches && nextSibling.matches(this.orderSelectors.modifierSection)) {
        // Look for modifier label and values
        const labelEl = nextSibling.querySelector(this.orderSelectors.modifierLabel);
        if (labelEl) {
          const labelText = labelEl.textContent.trim();
          
          // Extract all values for this modifier
          const valueElements = nextSibling.querySelectorAll(this.orderSelectors.modifierValue);
          const values = Array.from(valueElements)
            .map(el => el.textContent.trim())
            .filter(v => v && !v.includes(labelText)); // Filter out the label text itself
          
          if (labelText.includes('Size Choice')) {
            // Handle regular size and special size cases (e.g., "Size Choice - Salmon")
            if (values.length > 0) {
              size = values[0];
              // Check if it's a complex size with substitution
              if (size.includes('Garlic Butter Fried Rice')) {
                riceSubstitution = 'Garlic Butter Fried Rice';
                // Extract the actual size from complex string
                const sizeMatch = size.match(/^(Small|Medium|Large|Regular)/);
                if (sizeMatch) {
                  size = sizeMatch[1];
                }
              }
            }
          } else if (labelText === 'Substitute Rice') {
            // Rice substitution gets appended to size
            if (values.length > 0) {
              riceSubstitution = values[0];
              // Append rice substitution to the current size
              if (size && size !== 'no-size') {
                size = `${size} - ${riceSubstitution}`;
              } else {
                // If no size yet, just use the rice substitution
                size = riceSubstitution;
              }
            }
          } else if (labelText.includes('Choice of') && labelText.includes('Dumplings') && isUrbanBowl) {
            // This is part of Urban Bowl, not a separate item
            if (values.length > 0) {
              modifiers.push(`${labelText}: ${values[0]}`);
            }
          } else if (labelText.includes('Top') && labelText.includes('Sauces')) {
            // Sauce modifiers for Steak/Salmon
            if (values.length > 0) {
              modifiers.push(`Sauce: ${values[0]}`);
            }
          } else if (labelText === 'Side Addition' || 
                     labelText === 'Add a Dessert' || 
                     labelText.includes('Add ') ||
                     labelText.includes('Addition')) {
            console.log(`Found additional item section in modifiers: ${labelText}`);
            // Extract additional items as separate items
            const valueElements = nextSibling.querySelectorAll(this.orderSelectors.modifierValue);
            if (valueElements.length >= 2) {
              const itemName = valueElements[0].textContent.trim();
              const itemPrice = this.parsePrice(valueElements[1].textContent);
              
              console.log(`${labelText} item found: ${itemName} - $${itemPrice}`);
              
              const isDesert = labelText.toLowerCase().includes('dessert');
              
              const sideCategory = this.categoryManager.categorizeItem(itemName, 'no-size');
              sideAdditions.push({
                name: itemName,
                baseName: itemName,
                size: 'no-size',
                quantity: 1,
                price: itemPrice,
                category: sideCategory.category,
                categoryInfo: sideCategory,
                isSideAddition: !isDesert,
                isDessert: isDesert,
                additionType: labelText
              });
            }
          } else {
            // Other modifiers
            if (values.length > 0 && values[0] !== 'None') {
              modifiers.push(`${labelText}: ${values.join(', ')}`);
            }
          }
        }
      }
      
      // Also check for standalone modifier values (e.g., substitutions)
      const standaloneValues = nextSibling.querySelectorAll('.sc-jsFtja.epewNT');
      const substitutionText = nextSibling.querySelector('.sc-jsFtja.izpgPC');
      if (substitutionText && standaloneValues.length > 0) {
        const subText = substitutionText.textContent.trim();
        if (subText.includes('instead of')) {
          const value = standaloneValues[0].textContent.trim();
          modifiers.push(`Substitution: ${value} ${subText}`);
        }
      }
      
      nextSibling = nextSibling.nextElementSibling;
    }
    
    // Don't include size in modifiers if it's already tracked separately
    const filteredModifiers = modifiers.filter(m => !m.startsWith('Size:'));
    
    // Create full name with relevant modifiers (but not size)
    let fullName = name;
    if (filteredModifiers.length > 0) {
      fullName = `${name} (${filteredModifiers.join(', ')})`;
    }
    
      // Check for additional items (Side Addition, Add a Dessert, etc.) using the same structure as Size Choice
      // Re-query modifier containers if they exist
      if (parentContainer) {
        const additionalModifierContainers = parentContainer.querySelectorAll('.sc-ixKSzz.cMJRAn');
        additionalModifierContainers.forEach(container => {
        const labelEl = container.querySelector('.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ');
        if (labelEl) {
          const labelText = labelEl.textContent.trim();
          
          // Check for various types of additions
          if (labelText === 'Side Addition' || 
              labelText === 'Add a Dessert' || 
              labelText.includes('Add ') ||
              labelText.includes('Addition')) {
            
            console.log(`Found additional item section: ${labelText}`);
            
            const valueContainer = container.querySelector('.sc-ixKSzz.irfKLT');
            if (valueContainer) {
              // Look for the item name
              const nameEl = valueContainer.querySelector('.sc-ixKSzz.dpIGfp .sc-jsFtja.epewNT') || 
                           valueContainer.querySelector('.sc-jsFtja.epewNT');
              // Look for the price
              const priceEl = valueContainer.querySelector('.sc-ixKSzz.fXtJCI .sc-jsFtja.epewNT');
              
              if (nameEl && nameEl.textContent) {
                const itemName = nameEl.textContent.trim();
                const itemPrice = priceEl ? this.parsePrice(priceEl.textContent) : 0;
                
                console.log(`${labelText} item found: ${itemName} - $${itemPrice}`);
                
                // Determine if it's a dessert based on the label
                const isDesert = labelText.toLowerCase().includes('dessert');
                
                const sideAdditionCategory = this.categoryManager.categorizeItem(itemName, 'no-size');
                sideAdditions.push({
                  name: itemName,
                  baseName: itemName,
                  size: 'no-size',
                  quantity: 1,
                  price: itemPrice,
                  category: sideAdditionCategory.category,
                  categoryInfo: sideAdditionCategory,
                  isSideAddition: !isDesert,
                  isDessert: isDesert,
                  additionType: labelText
                });
              }
            }
          }
        }
      });
    }
      
      // Determine final size
      let finalSize = 'no-size';
      if (size) {
        // Keep the full size description including substitutions
        finalSize = size;
      } else if (isUrbanBowl) {
        // Only use 'urban' if no other size was found
        finalSize = 'urban';
        console.log(`[OrderExtractor] Set Urban Bowl size to 'urban' for: ${name}`);
      }
      
      // Create the main item
      const mainCategoryInfo = this.categoryManager.categorizeItem(name, finalSize);
      const mainItem = {
        name: fullName,
        baseName: name,
        size: finalSize,
        modifiers: filteredModifiers,
        quantity: quantity,
        price: price,
        category: mainCategoryInfo.category,
        categoryInfo: mainCategoryInfo,
        isUrbanBowl: isUrbanBowl,
        riceSubstitution: riceSubstitution
      };
      
      // Return array if there are side additions, otherwise return single item
      if (sideAdditions.length > 0) {
        return [mainItem, ...sideAdditions];
      } else {
        return mainItem;
      }
    } catch (error) {
      console.error('Error extracting item data:', error);
      return null;
    }
  }
  
  parsePrice(priceText) {
    if (!priceText) return 0;
    const match = priceText.match(/\$?([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  extractElapsedTime(orderRow) {
    try {
      // Look for the time element within order-type-time
      const timeContainer = orderRow.querySelector('[data-testid="order-type-time"]');
      if (!timeContainer) {
        console.debug('No time container found for order');
        return 0;
      }
      
      // Find the span with bullet and time - try multiple selectors
      let timeText = '';
      
      // Try the specific class first (with both classes)
      let timeSpan = timeContainer.querySelector('.sc-glPjVa.jpEQhm');
      if (!timeSpan) {
        // Try just the first class
        timeSpan = timeContainer.querySelector('.sc-glPjVa');
      }
      
      if (timeSpan) {
        timeText = timeSpan.textContent.trim();
      } else {
        // Try finding any span with bullet character
        const spans = timeContainer.querySelectorAll('span');
        for (const span of spans) {
          if (span.textContent.includes('•') && span.textContent.match(/\d+[mh]/)) {
            timeText = span.textContent.trim();
            break;
          }
        }
      }
      
      if (!timeText) {
        // Last resort - get all text from container
        timeText = timeContainer.textContent.trim();
      }
      
      console.log('Extracting elapsed time from text:', timeText);
      
      // Check for status text that doesn't contain actual time
      const statusOnlyText = ['pending', 'arrived', 'arriving soon', 'out for delivery', 'picked up', 'completed', 'ready'];
      const cleanTimeText = timeText.replace('•', '').trim().toLowerCase();
      
      // If it's just a status, return 0
      if (statusOnlyText.some(status => cleanTimeText === status)) {
        console.log('Status text detected, no elapsed time available:', cleanTimeText);
        return 0;
      }
      
      // Extract number from formats like "• 19m", "• 1h 5m", "19m", etc.
      const hourMinMatch = cleanTimeText.match(/(\d+)\s*h\s*(\d+)\s*m/);
      const hourMatch = cleanTimeText.match(/(\d+)\s*h/);
      const minMatch = cleanTimeText.match(/(\d+)\s*m/);
      
      let minutes = 0;
      
      if (hourMinMatch) {
        // Format: "1h 5m"
        minutes = parseInt(hourMinMatch[1]) * 60 + parseInt(hourMinMatch[2]);
      } else if (hourMatch) {
        // Format: "1h"
        minutes = parseInt(hourMatch[1]) * 60;
      } else if (minMatch) {
        // Format: "19m"
        minutes = parseInt(minMatch[1]);
      } else {
        console.debug('No time match found in:', timeText);
        return 0;
      }
      
      console.log('Extracted elapsed time:', minutes, 'minutes');
      return minutes;
    } catch (error) {
      console.error('Error extracting elapsed time:', error);
      return 0;
    }
  }
  
  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  }
  
  async closeOrderDetails() {
    // DISABLED: Modal closing was causing page navigation loops
    console.log('Modal closing disabled to prevent page refresh loops');
    return;
    
    /* Original code disabled:
    try {
      // Quick check if modal is already closed
      const modalCheck = document.querySelector(this.orderSelectors.detailModal);
      if (!modalCheck || !modalCheck.offsetParent) {
        return; // Modal already closed
      }
      
      // Wait a bit for modal content to fully load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Strategy 1: Try escape key first (least disruptive)
      const escEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        keyCode: 27, 
        which: 27,
        bubbles: true,
        cancelable: true 
      });
      document.dispatchEvent(escEvent);
      document.body.dispatchEvent(escEvent);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if closed
      const modalAfterEsc = document.querySelector(this.orderSelectors.detailModal);
      if (!modalAfterEsc || !modalAfterEsc.offsetParent) {
        return; // Success
      }
      
      // Strategy 2: Try multiple close button selectors
      const closeSelectors = [
        'button[aria-label="Close"]',
        'button[aria-label="close"]',
        'button svg[aria-label="Close"]',
        'button:has(svg path[d*="M"])',
        '[data-testid="close-button"]',
        '.close-button',
        'button[class*="close"]'
      ];
      
      for (const selector of closeSelectors) {
        const closeButton = document.querySelector(selector);
        if (closeButton) {
          closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check if closed
          const modalCheck = document.querySelector(this.orderSelectors.detailModal);
          if (!modalCheck || !modalCheck.offsetParent) {
            return; // Success
          }
        }
      }
      
      // Strategy 3: Click backdrop/overlay
      const backdrop = document.querySelector('[class*="backdrop"], [class*="overlay"], [class*="modal-bg"]');
      if (backdrop) {
        backdrop.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const modalCheck3 = document.querySelector(this.orderSelectors.detailModal);
        if (!modalCheck3 || !modalCheck3.offsetParent) {
          return; // Success
        }
      }
      
      // REMOVED: Navigation logic that was causing page refresh loops
      // Never navigate away from the page
      
    } catch (error) {
      console.error('Error closing order details:', error);
      // REMOVED: Navigation fallback
    }
    */
  }

  findOrderElements() {
    const selectors = this.orderSelectors.orderContainer.split(', ');
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found orders using selector: ${selector}`);
        return elements;
      }
    }
    
    const possibleContainers = document.querySelectorAll('[class*="order"], [id*="order"]');
    if (possibleContainers.length > 0) {
      console.log('Found orders using fallback selector');
      return possibleContainers;
    }
    
    return [];
  }

  extractOrderData(orderElement, index) {
    const order = {
      id: `order_${Date.now()}_${index}`,
      number: this.extractText(orderElement, this.orderSelectors.orderNumber) || `#${index + 1}`,
      timestamp: this.extractTimestamp(orderElement),
      items: []
    };
    
    const itemElements = this.findItemElements(orderElement);
    
    itemElements.forEach((itemEl) => {
      const item = this.extractItemData(itemEl);
      if (item && item.name) {
        order.items.push(item);
      }
    });
    
    return order;
  }

  findItemElements(orderElement) {
    const selectors = this.orderSelectors.itemContainer.split(', ');
    
    for (const selector of selectors) {
      const elements = orderElement.querySelectorAll(selector);
      if (elements.length > 0) {
        return elements;
      }
    }
    
    const textNodes = this.getTextNodes(orderElement);
    const itemTexts = textNodes.filter(text => 
      text.length > 3 && 
      !text.match(/^[\d\s\-\:]+$/) &&
      !text.toLowerCase().includes('order')
    );
    
    return itemTexts.map(text => ({ textContent: text, isTextNode: true }));
  }

  extractItemData(itemElement) {
    let name, quantity, price, modifiers;
    
    if (itemElement.isTextNode) {
      const parsed = this.parseItemText(itemElement.textContent);
      name = parsed.name;
      quantity = parsed.quantity;
      price = parsed.price;
      modifiers = parsed.modifiers;
    } else {
      name = this.extractText(itemElement, this.orderSelectors.itemName);
      quantity = this.extractQuantity(itemElement);
      price = this.extractPrice(itemElement);
      modifiers = this.extractModifiers(itemElement);
    }
    
    if (!name) {
      name = itemElement.textContent?.trim();
    }
    
    const fullName = modifiers && modifiers.length > 0 
      ? `${name} (${modifiers.join(', ')})` 
      : name;
    
    return {
      name: fullName,
      quantity: quantity || 1,
      price: price || 0,
      category: this.categoryManager.categorizeItem(name),
      modifiers
    };
  }

  parseItemText(text) {
    const quantityMatch = text.match(/^(\d+)\s*x?\s*/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    let remaining = quantityMatch ? text.slice(quantityMatch[0].length) : text;
    
    const priceMatch = remaining.match(/\$?([\d.]+)$/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
    
    if (priceMatch) {
      remaining = remaining.slice(0, -priceMatch[0].length).trim();
    }
    
    const modifierMatch = remaining.match(/\(([^)]+)\)/);
    const modifiers = modifierMatch 
      ? modifierMatch[1].split(',').map(m => m.trim())
      : [];
    
    const name = remaining.replace(/\([^)]+\)/, '').trim();
    
    return { name, quantity, price, modifiers };
  }

  extractText(element, selectors) {
    const selectorList = selectors.split(', ');
    
    for (const selector of selectorList) {
      const el = element.querySelector(selector);
      if (el && el.textContent) {
        return el.textContent.trim();
      }
    }
    
    return null;
  }

  extractQuantity(element) {
    const qtyText = this.extractText(element, this.orderSelectors.itemQuantity);
    if (qtyText) {
      const match = qtyText.match(/\d+/);
      return match ? parseInt(match[0]) : 1;
    }
    
    const fullText = element.textContent || '';
    const qtyMatch = fullText.match(/^(\d+)\s*x/i);
    return qtyMatch ? parseInt(qtyMatch[1]) : 1;
  }

  extractPrice(element) {
    const priceText = this.extractText(element, this.orderSelectors.itemPrice);
    if (priceText) {
      const match = priceText.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    
    const fullText = element.textContent || '';
    const priceMatch = fullText.match(/\$?([\d.]+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  extractModifiers(element) {
    const modText = this.extractText(element, this.orderSelectors.itemModifiers);
    if (modText) {
      return modText.split(',').map(m => m.trim()).filter(m => m);
    }
    
    return [];
  }

  extractTimestamp(element) {
    const timeText = this.extractText(element, this.orderSelectors.orderTime);
    if (timeText) {
      const date = new Date(timeText);
      return isNaN(date.getTime()) ? Date.now() : date.getTime();
    }
    
    return Date.now();
  }

  getTextNodes(element) {
    const texts = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent.trim();
          return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      texts.push(node.textContent.trim());
    }
    
    return texts;
  }
}

// Make available globally
window.OrderExtractor = OrderExtractor;