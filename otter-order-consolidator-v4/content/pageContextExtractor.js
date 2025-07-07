// This script is injected into the page context to access React internals directly
// It communicates with the content script via custom events

(function() {
  console.log('[PageContextExtractor] Injected into page context');
  
  // Check if React is ready on the page
  function isReactReady() {
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    if (orderRows.length === 0) return false;
    
    // Check if at least one row has React fiber
    for (const row of orderRows) {
      const keys = Object.keys(row);
      const hasReactFiber = keys.some(k => 
        k.startsWith('__reactFiber$') || 
        k.startsWith('__reactInternalInstance$') ||
        k.startsWith('__react')
      );
      if (hasReactFiber) return true;
    }
    
    return false;
  }
  
  // Function to extract orders from React (runs in page context)
  // Based on user's working function that finds data at depth 2
  function extractOrdersFromReact() {
    console.log('[PageContextExtractor] Starting React extraction in page context');
    
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    console.log(`[PageContextExtractor] Found ${orderRows.length} order rows`);
    
    if (orderRows.length === 0) {
      console.log('[PageContextExtractor] No order rows found');
      return [];
    }
    
    const orders = [];
    
    orderRows.forEach((row, index) => {
      console.log(`\n--- Extracting Order ${index} ---`);
      try {
        // Get all properties of the element
        const keys = Object.keys(row);
        console.log(`Row ${index} keys:`, keys);
        
        // Find React fiber keys - match any React internal key pattern
        const reactKeys = keys.filter(k => 
          k.startsWith('__react') ||
          k.startsWith('__reactFiber$') ||
          k.startsWith('__reactInternalInstance$')
        );
        console.log(`Row ${index} React keys found:`, reactKeys);
        
        if (reactKeys.length === 0) {
          console.log(`No React keys found on row ${index}`);
          return;
        }
        
        // Get the first React fiber key (matching user's approach)
        const fiber = row[reactKeys[0]];
        if (!fiber) {
          console.log(`No fiber found for row ${index}`);
          return;
        }
        
        // Navigate up the fiber tree - user's function finds data at depth 2
        let current = fiber;
        let depth = 0;
        let orderData = null;
        
        // Look for order prop at various depths (matching user's working function)
        while (current && depth < 10) {
          console.log(`Depth ${depth}: checking memoizedProps...`, current.memoizedProps ? Object.keys(current.memoizedProps) : 'no memoizedProps');
          
          if (current.memoizedProps && current.memoizedProps.order) {
            orderData = current.memoizedProps.order;
            console.log(`Found order data at depth ${depth}!`);
            break;
          }
          current = current.return;
          depth++;
        }
        
        if (orderData) {
          console.log('Order object:', orderData);
          
          // Check if orderData has customerOrder property (the actual API structure)
          const hasCustomerOrder = orderData.customerOrder && typeof orderData.customerOrder === 'object';
          const co = hasCustomerOrder ? orderData.customerOrder : orderData;
          
          console.log('Has customerOrder property:', hasCustomerOrder);
          
          // Extract order ID - it's at customerOrder.orderId.id
          let orderId = 'unknown';
          if (co.orderId && co.orderId.id) {
            orderId = co.orderId.id;
          } else if (co.id) {
            orderId = typeof co.id === 'object' && co.id.id ? co.id.id : co.id;
          }
          console.log('Order ID:', orderId);
          
          // Extract order number from orderIdentifier.displayId
          let orderNumber = 'unknown';
          if (co.orderIdentifier && co.orderIdentifier.displayId) {
            orderNumber = co.orderIdentifier.displayId;
          } else if (co.externalOrderIdentifier && co.externalOrderIdentifier.displayId) {
            orderNumber = co.externalOrderIdentifier.displayId;
          } else if (co.externalOrderId && co.externalOrderId.displayId) {
            orderNumber = co.externalOrderId.displayId;
          } else if (orderData.orderNumber) {
            orderNumber = orderData.orderNumber;
          } else if (orderData.displayId) {
            orderNumber = orderData.displayId;
          }
          console.log('Order Number:', orderNumber);
          
          // Extract restaurant/store name
          let restaurantName = 'Unknown Restaurant';
          if (co.store && co.store.name) {
            restaurantName = co.store.name;
          } else if (co.storeName) {
            restaurantName = co.storeName;
          } else if (co.brand && co.brand.name) {
            restaurantName = co.brand.name;
          } else if (co.brandName) {
            restaurantName = co.brandName;
          } else if (co.merchant && co.merchant.name) {
            restaurantName = co.merchant.name;
          } else if (co.merchantName) {
            restaurantName = co.merchantName;
          } else if (co.restaurant && co.restaurant.name) {
            restaurantName = co.restaurant.name;
          } else if (co.restaurantName) {
            restaurantName = co.restaurantName;
          }
          console.log('Restaurant:', restaurantName);
          
          // Extract order status/state
          let orderStatus = 'UNKNOWN';
          if (co.state) {
            orderStatus = co.state;
          } else if (co.status) {
            orderStatus = co.status;
          } else if (co.orderState) {
            orderStatus = co.orderState;
          } else if (co.order && co.order.state) {
            orderStatus = co.order.state;
          } else if (orderData.state) {
            orderStatus = orderData.state;
          } else if (orderData.status) {
            orderStatus = orderData.status;
          }
          console.log('Order Status:', orderStatus);
          
          // Extract orderedAt timestamp
          let orderedAt = null;
          if (co.orderedAt) {
            orderedAt = co.orderedAt;
          } else if (co.createdAt) {
            orderedAt = co.createdAt;
          } else if (co.timestamp) {
            orderedAt = co.timestamp;
          } else if (co.orderDate) {
            orderedAt = co.orderDate;
          } else if (orderData.orderedAt) {
            orderedAt = orderData.orderedAt;
          } else if (orderData.createdAt) {
            orderedAt = orderData.createdAt;
          }
          console.log('Ordered At:', orderedAt);
          
          // Extract customer name from customer.displayName
          let customerName = 'Unknown';
          if (co.customer && co.customer.displayName) {
            customerName = co.customer.displayName;
          } else if (co.customer && (co.customer.firstName || co.customer.lastName)) {
            customerName = `${co.customer.firstName || ''} ${co.customer.lastName || ''}`.trim();
          } else if (orderData.customerName) {
            customerName = orderData.customerName;
          } else if (orderData.customer && orderData.customer.name) {
            customerName = orderData.customer.name;
          }
          console.log('Customer:', customerName);
          
          // Extract order notes/instructions that might contain recipient names
          let orderNotes = '';
          let recipientName = '';
          
          // Check various possible locations for notes
          const noteSources = [
            co.deliveryInstructions,
            co.specialInstructions,
            co.notes,
            co.customerNotes,
            co.orderNotes,
            co.deliveryNotes,
            co.customer?.notes,
            co.additionalInfo,
            co.instructions,
            co.recipientNotes
          ];
          
          for (const source of noteSources) {
            if (source && typeof source === 'string' && source.trim()) {
              orderNotes = source.trim();
              console.log('Found order notes:', orderNotes);
              break;
            }
          }
          
          // Try to extract recipient name from notes if they follow common patterns
          if (orderNotes) {
            // Common patterns: "For: Name", "Deliver to: Name", "Name:", "To: Name"
            const namePatterns = [
              /(?:for|deliver to|to|name):\s*([^,\n]+)/i,
              /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m, // Name on its own line
              /(?:pick\s*up|pickup).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
            ];
            
            for (const pattern of namePatterns) {
              const match = orderNotes.match(pattern);
              if (match && match[1]) {
                recipientName = match[1].trim();
                console.log('Extracted recipient name from notes:', recipientName);
                break;
              }
            }
          }
          
          // Extract wait time if available
          let waitTime = 0;
          if (co.confirmationInfo && co.confirmationInfo.estimatedPrepTimeMinutes) {
            waitTime = co.confirmationInfo.estimatedPrepTimeMinutes;
          } else if (co.stationOrders && co.stationOrders[0] && co.stationOrders[0].stationPrepInfo) {
            // Extract from estimatedPrepTime (format: "516.281372784s")
            const prepTimeStr = co.stationOrders[0].stationPrepInfo.estimatedPrepTime;
            if (prepTimeStr && prepTimeStr.endsWith('s')) {
              const seconds = parseFloat(prepTimeStr.slice(0, -1));
              waitTime = Math.round(seconds / 60); // Convert to minutes
            }
          }
          
          // Extract items from customerItemsContainer if available
          const items = [];
          if (co.customerItemsContainer) {
            console.log('Found customerItemsContainer!');
            const itemsArray = co.customerItemsContainer.items || [];
            const modifiersMap = co.customerItemsContainer.modifiers || {};
            
            console.log(`Processing ${itemsArray.length} items with modifiers map`);
            console.log(`Modifiers map has ${Object.keys(modifiersMap).length} entries`);
            
            // Debug: Log first few modifiers to see their structure
            const modifierKeys = Object.keys(modifiersMap);
            if (modifierKeys.length > 0) {
              console.log(`[MODIFIER MAP SAMPLE] First modifier:`, {
                id: modifierKeys[0],
                data: modifiersMap[modifierKeys[0]]
              });
            }
            
            // Also get modifiers from stationOrders for section names
            let stationModifiers = {};
            if (co.stationOrders && co.stationOrders[0] && 
                co.stationOrders[0].menuReconciledItemsContainer &&
                co.stationOrders[0].menuReconciledItemsContainer.modifiers) {
              stationModifiers = co.stationOrders[0].menuReconciledItemsContainer.modifiers;
            }
            
            itemsArray.forEach((item, idx) => {
              if (item.orderItemDetail) {
                const itemDetail = item.orderItemDetail;
                const itemName = itemDetail.name || 'Unknown Item';
                const quantity = itemDetail.quantity || 1;
                let itemNote = '';
                
                // Extract item-level note if available
                if (itemDetail.note) {
                  itemNote = itemDetail.note;
                  console.log(`Found note for ${itemName}: ${itemNote}`);
                }
                
                // Also check stationItemDetail for notes
                let stationItemNote = '';
                if (co.stationOrders && co.stationOrders[0] && co.stationOrders[0].items) {
                  // Find the corresponding station item
                  const stationItem = co.stationOrders[0].items.find(si => 
                    si.stationItemDetail && si.stationItemDetail.name === itemName
                  );
                  if (stationItem && stationItem.stationItemDetail && stationItem.stationItemDetail.note) {
                    stationItemNote = stationItem.stationItemDetail.note;
                    console.log(`Found station note for ${itemName}: ${stationItemNote}`);
                  }
                }
                
                // Use the most detailed note available
                const finalItemNote = itemNote || stationItemNote;
                
                // Log the full item structure for debugging
                if (itemName.toLowerCase().includes('rice bowl')) {
                  console.log(`[FULL ITEM STRUCTURE] ${itemName}:`, {
                    item: item,
                    orderItemDetail: itemDetail,
                    modifierIds: item.modifierCustomerItemIds,
                    allKeys: Object.keys(item),
                    itemNote: finalItemNote
                  });
                }
                
                let size = 'no-size';
                let sizeModifiers = []; // Collect ALL size-related modifiers
                const additionalItems = []; // Track items that should be extracted separately
                
                // Check if Urban Bowl first
                if (itemName.toLowerCase().includes('urban bowl')) {
                  size = 'urban';
                  console.log(`Detected Urban Bowl: ${itemName} - set size to 'urban'`);
                }
                
                // Look for size in modifiers
                console.log(`Item has modifierCustomerItemIds: ${!!item.modifierCustomerItemIds}, count: ${item.modifierCustomerItemIds ? item.modifierCustomerItemIds.length : 0}`);
                if (item.modifierCustomerItemIds && size !== 'urban') {
                  console.log(`Checking ${item.modifierCustomerItemIds.length} modifiers for ${itemName}`);
                  
                  item.modifierCustomerItemIds.forEach(modId => {
                    const modifier = modifiersMap[modId];
                    const stationMod = stationModifiers[modId];
                    
                    console.log(`Checking modifier ID ${modId}, found in map: ${!!modifier}`);
                    
                    // Check if this is an additional item based on section
                    if (stationMod && stationMod.sectionName) {
                      const sectionName = stationMod.sectionName.toLowerCase();
                      const modName = stationMod.stationItemDetail ? 
                        stationMod.stationItemDetail.name : 
                        (modifier && modifier.orderItemDetail ? modifier.orderItemDetail.name : '');
                      
                      console.log(`  Station modifier section: ${stationMod.sectionName}, item: ${modName}`);
                      
                      // Check if this should be a separate item
                      if (sectionName.includes('add') || 
                          sectionName.includes('side') || 
                          sectionName.includes('drink') || 
                          sectionName.includes('dessert') ||
                          sectionName.includes('bao-nut') ||
                          modName.toLowerCase().includes('bao-nut') ||
                          modName.toLowerCase().includes('tea') ||
                          modName.toLowerCase().includes('cinnamon sugar')) {
                        // This is an additional item, not a size modifier
                        if (modName) {
                          additionalItems.push(modName);
                          console.log(`  Marked as additional item: "${modName}"`);
                        }
                      } else {
                        // This is a size modifier
                        if (modName && !sizeModifiers.includes(modName)) {
                          sizeModifiers.push(modName);
                          console.log(`  Added as size modifier: "${modName}"`);
                        }
                      }
                    } else if (modifier && modifier.orderItemDetail) {
                      const modName = modifier.orderItemDetail.name || '';
                      const modNameLower = modName.toLowerCase();
                      console.log(`  Modifier name: "${modName}"`);
                      
                      // Only add as size modifier if it's actually about size/rice
                      if (modNameLower.includes('small') || 
                          modNameLower.includes('large') || 
                          modNameLower.includes('rice') || 
                          modNameLower.includes('noodle')) {
                        sizeModifiers.push(modName);
                        console.log(`Added to size modifiers: ${modName}`);
                      } else {
                        // Otherwise it might be an additional item
                        additionalItems.push(modName);
                        console.log(`Added as additional item: ${modName}`);
                      }
                    }
                  });
                  
                  // Process collected modifiers to determine size
                  console.log(`Collected size modifiers for ${itemName}:`, sizeModifiers);
                  
                  if (sizeModifiers.length > 0) {
                    // Look for base size first
                    const baseSize = sizeModifiers.find(m => 
                      m.toLowerCase() === 'small' || 
                      m.toLowerCase() === 'large'
                    );
                    
                    // Look for any rice/noodle substitution
                    const substitution = sizeModifiers.find(m => {
                      const lower = m.toLowerCase();
                      return lower.includes('rice') || 
                             lower.includes('noodle') || 
                             lower.includes('stir fry');
                    });
                    
                    if (baseSize && substitution) {
                      // Combine them exactly as they are
                      size = `${baseSize.toLowerCase()} - ${substitution.toLowerCase()}`;
                      console.log(`Combined size: ${size}`);
                    } else if (baseSize) {
                      // Just the base size
                      size = baseSize.toLowerCase();
                      console.log(`Using base size: ${size}`);
                    } else if (sizeModifiers.length === 1) {
                      // If we only have one modifier, use it as-is
                      size = sizeModifiers[0].toLowerCase();
                      console.log(`Using single modifier as size: ${size}`);
                    } else {
                      // Multiple modifiers but no clear base size - join them
                      size = sizeModifiers.join(' - ').toLowerCase();
                      console.log(`Joining all modifiers: ${size}`);
                    }
                  }
                }
                
                // If still no size and it's a rice bowl, try to infer from context
                if (size === 'no-size' && itemName.toLowerCase().includes('rice bowl')) {
                  console.log(`[RICE BOWL SIZE INFERENCE] No size found for ${itemName}, checking order context...`);
                  
                  // Check if the order has a pattern where all rice bowls share the same size
                  // This is a last resort fallback
                  const otherItems = itemsArray.filter(i => i !== item && 
                    i.orderItemDetail && 
                    i.orderItemDetail.name && 
                    i.orderItemDetail.name.toLowerCase().includes('rice bowl'));
                  
                  if (otherItems.length > 0) {
                    console.log(`[RICE BOWL SIZE INFERENCE] Found ${otherItems.length} other rice bowls in order`);
                  }
                }
                
                // Enhanced debug logging for rice bowls
                if (itemName.toLowerCase().includes('rice bowl')) {
                  console.log(`[RICE BOWL DEBUG] Item: ${itemName}`);
                  console.log(`[RICE BOWL DEBUG] Raw size: ${size}`);
                  console.log(`[RICE BOWL DEBUG] Size type: ${typeof size}`);
                  console.log(`[RICE BOWL DEBUG] Item modifiers:`, item.modifierCustomerItemIds);
                  console.log(`[RICE BOWL DEBUG] Modifiers count:`, item.modifierCustomerItemIds ? item.modifierCustomerItemIds.length : 0);
                  
                  // Log all modifiers for this rice bowl
                  if (item.modifierCustomerItemIds) {
                    console.log(`[RICE BOWL DEBUG] All modifiers for ${itemName}:`);
                    item.modifierCustomerItemIds.forEach(modId => {
                      const mod = modifiersMap[modId];
                      const stationMod = stationModifiers[modId];
                      console.log(`[RICE BOWL DEBUG] Modifier ${modId}:`, {
                        customerModifier: mod,
                        stationModifier: stationMod,
                        name: mod && mod.orderItemDetail ? mod.orderItemDetail.name : 'N/A',
                        stationName: stationMod && stationMod.stationItemDetail ? stationMod.stationItemDetail.name : 'N/A',
                        sectionName: stationMod ? stationMod.sectionName : 'N/A'
                      });
                    });
                  }
                }
                
                // Final size determination log
                if (itemName.toLowerCase().includes('rice bowl')) {
                  console.log(`[RICE BOWL FINAL] ${itemName}: Final size = "${size}"`);
                }
                
                // Extract full modifier information for better categorization
                const allModifiers = [];
                const modifierDetails = {};
                
                if (item.modifierCustomerItemIds) {
                  item.modifierCustomerItemIds.forEach(modId => {
                    const modifier = modifiersMap[modId];
                    const stationMod = stationModifiers[modId];
                    
                    if (modifier && modifier.orderItemDetail) {
                      const modifierInfo = {
                        id: modId,
                        name: modifier.orderItemDetail.name,
                        price: modifier.orderItemDetail.price || 0,
                        sectionName: stationMod ? stationMod.sectionName : null
                      };
                      allModifiers.push(modifierInfo);
                      
                      // Extract specific modifier types
                      const modNameLower = modifierInfo.name.toLowerCase();
                      if (modNameLower.includes('fried rice') || modNameLower.includes('noodle')) {
                        modifierDetails.riceSubstitution = modifierInfo.name;
                      }
                      if (stationMod && stationMod.sectionName && stationMod.sectionName.includes('Sauce')) {
                        modifierDetails.sauce = modifierInfo.name;
                      }
                    }
                  });
                }
                
                // Extract protein type from item name
                let proteinType = '';
                const nameLower = itemName.toLowerCase();
                if (nameLower.includes('pork belly')) {
                  proteinType = 'Pork Belly';
                } else if (nameLower.includes('grilled') && nameLower.includes('chicken')) {
                  // Handle both "grilled chicken" and "grilled orange chicken" patterns
                  proteinType = 'Grilled Chicken';
                } else if (nameLower.includes('crispy') && nameLower.includes('chicken')) {
                  // Handle both "crispy chicken" and "crispy orange chicken" patterns
                  proteinType = 'Crispy Chicken';
                } else if (nameLower.includes('steak')) {
                  proteinType = 'Steak';
                } else if (nameLower.includes('salmon')) {
                  proteinType = 'Salmon';
                } else if (nameLower.includes('shrimp')) {
                  proteinType = 'Shrimp';
                } else if (nameLower.includes('fish')) {
                  proteinType = 'Crispy Fish';
                } else if (nameLower.includes('tofu')) {
                  proteinType = 'Tofu';
                } else if (nameLower.includes('cauliflower')) {
                  proteinType = 'Cauliflower Nugget';
                }
                
                // Extract sauce from item name if not in modifiers
                if (!modifierDetails.sauce) {
                  const sauces = ['sesame aioli', 'garlic aioli', 'chipotle aioli', 'jalapeño herb aioli', 
                                  'sweet sriracha aioli', 'orange', 'teriyaki', 'spicy yuzu', 'garlic sesame fusion'];
                  for (const sauce of sauces) {
                    if (nameLower.includes(sauce)) {
                      modifierDetails.sauce = sauce.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      break;
                    }
                  }
                }
                
                items.push({
                  name: itemName,
                  quantity: quantity,
                  size: size,
                  modifiers: allModifiers,
                  modifierDetails: modifierDetails,
                  note: finalItemNote,
                  proteinType: proteinType,
                  isRiceBowl: itemName.toLowerCase().includes('rice bowl'),
                  isUrbanBowl: itemName.toLowerCase().includes('urban bowl')
                });
                
                console.log(`Item ${idx + 1}: ${itemName} (${size}) x${quantity}`);
                
                // Add any additional items that were found
                if (additionalItems && additionalItems.length > 0) {
                  console.log(`Adding ${additionalItems.length} additional items from modifiers`);
                  additionalItems.forEach(additionalItemName => {
                    items.push({
                      name: additionalItemName,
                      quantity: 1,
                      size: 'no-size'
                    });
                    console.log(`Added additional item: ${additionalItemName}`);
                  });
                }
              }
            });
          } else {
            // Try simpler structure from user's example
            const simpleItems = co.items || co.orderItems || co.lineItems || [];
            console.log(`Found ${simpleItems.length} items in simple structure`);
            
            simpleItems.forEach((item, idx) => {
              const itemName = item.name || item.itemName || item.title || 'Unknown Item';
              const quantity = item.quantity || item.qty || 1;
              let size = item.size || item.variant || item.option || 'no-size';
              const itemNote = item.note || item.notes || item.specialInstructions || '';
              
              // Check if Urban Bowl
              if (itemName.toLowerCase().includes('urban bowl')) {
                size = 'urban';
              }
              
              // Extract protein and sauce info for simple structure too
              let proteinType = '';
              const nameLower = itemName.toLowerCase();
              if (nameLower.includes('grilled chicken')) {
                proteinType = 'Grilled Chicken';
              } else if (nameLower.includes('crispy chicken')) {
                proteinType = 'Crispy Chicken';
              } else if (nameLower.includes('steak')) {
                proteinType = 'Steak';
              } else if (nameLower.includes('salmon')) {
                proteinType = 'Salmon';
              } else if (nameLower.includes('shrimp')) {
                proteinType = 'Shrimp';
              } else if (nameLower.includes('fish')) {
                proteinType = 'Crispy Fish';
              } else if (nameLower.includes('tofu')) {
                proteinType = 'Tofu';
              } else if (nameLower.includes('cauliflower')) {
                proteinType = 'Cauliflower Nugget';
              }
              
              items.push({
                name: itemName,
                quantity: quantity,
                size: size,
                modifiers: [],
                modifierDetails: {},
                note: itemNote,
                proteinType: proteinType,
                isRiceBowl: itemName.toLowerCase().includes('rice bowl'),
                isUrbanBowl: itemName.toLowerCase().includes('urban bowl')
              });
              
              console.log(`Item ${idx + 1}: ${itemName} (${size}) x${quantity}`);
            });
          }
          
          const order = {
            id: orderId,
            customerName: customerName,
            orderNumber: orderNumber,
            waitTime: waitTime,
            items: items,
            orderNotes: orderNotes,
            recipientName: recipientName || customerName, // Use recipient name if found, otherwise customer name
            restaurantName: restaurantName,
            orderStatus: orderStatus,
            orderedAt: orderedAt,
            source: hasCustomerOrder ? 'react-customerOrder' : 'react-simple'
          };
          
          console.log('Created order object:', order);
          console.log(`Extracted ${items.length} items with sizes`);
          
          // Store for later use
          orders.push(order);
          console.log(`Successfully extracted order ${index}: ${orderNumber} (${order.items.length} items)`);
          
        } else {
          console.log(`No order data found for row ${index} after checking depths 0-10`);
        }
      } catch (error) {
        console.error(`[PageContextExtractor] Error extracting row ${index}:`, error);
      }
    });
    
    console.log(`[PageContextExtractor] Extraction complete:`, {
      totalOrders: orders.length,
      ordersWithItems: orders.filter(o => o.items.length > 0).length,
      totalItems: orders.reduce((sum, o) => sum + o.items.length, 0)
    });
    
    if (orders.length === 0) {
      console.log('[PageContextExtractor] No valid orders found. Check console for debugging info.');
    }
    
    return orders;
  }
  
  // Listen for React ready check requests
  window.addEventListener('otter-react-ready-check', function(e) {
    console.log('[PageContextExtractor] React ready check requested');
    const ready = isReactReady();
    window.dispatchEvent(new CustomEvent('otter-react-ready-response', {
      detail: { ready: ready }
    }));
  });

  // Listen for extraction requests from content script
  window.addEventListener('otter-extract-request', function(e) {
    console.log('[PageContextExtractor] Received extraction request');
    
    try {
      // Check if React is ready first
      if (!isReactReady()) {
        console.log('[PageContextExtractor] React not ready yet');
        window.dispatchEvent(new CustomEvent('otter-extract-response', {
          detail: {
            success: false,
            error: 'React not ready',
            orders: [],
            timestamp: Date.now()
          }
        }));
        return;
      }
      
      const orders = extractOrdersFromReact();
      
      // Debug: Check orders structure before sending
      console.log('[PageContextExtractor] Orders before sending:', orders);
      if (orders.length > 0) {
        console.log('[PageContextExtractor] First order detail:', {
          id: orders[0].id,
          idType: typeof orders[0].id,
          customerName: orders[0].customerName,
          fullOrder: JSON.stringify(orders[0])
        });
      }
      
      // Send results back to content script
      window.dispatchEvent(new CustomEvent('otter-extract-response', {
        detail: {
          success: true,
          orders: orders,
          timestamp: Date.now()
        }
      }));
    } catch (error) {
      console.error('[PageContextExtractor] Extraction error:', error);
      
      window.dispatchEvent(new CustomEvent('otter-extract-response', {
        detail: {
          success: false,
          error: error.message,
          timestamp: Date.now()
        }
      }));
    }
  });
  
  // Debug function to inspect React presence
  function debugReactPresence() {
    console.log('[PageContextExtractor] === REACT PRESENCE DEBUG ===');
    
    const rows = document.querySelectorAll('[data-testid="order-row"]');
    console.log(`Found ${rows.length} order rows`);
    
    if (rows.length > 0) {
      const firstRow = rows[0];
      const keys = Object.keys(firstRow);
      console.log('First row keys:', keys);
      console.log('First row element:', firstRow);
      
      // Check for React DevTools
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✓ React DevTools detected');
      }
      
      // Check for React on window
      if (window.React) {
        console.log('✓ React found on window:', window.React.version);
      }
      
      // Try to find React internals
      keys.forEach(key => {
        if (key.includes('react') || key.startsWith('__')) {
          console.log(`Checking key ${key}:`, typeof firstRow[key], firstRow[key]);
        }
      });
    }
  }
  
  // Also expose functions globally for debugging
  window.__otterExtractOrders = extractOrdersFromReact;
  window.__otterDebugReact = debugReactPresence;
  window.__otterIsReactReady = isReactReady;
  
  // Add a simple test function that matches user's working code exactly
  window.__otterTestExtract = function() {
    console.log('=== TESTING REACT EXTRACTION ===');
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    console.log(`Found ${orderRows.length} order rows`);
    
    if (orderRows.length > 0) {
      const firstRow = orderRows[0];
      const keys = Object.keys(firstRow);
      console.log('First row keys:', keys);
      
      const reactKeys = keys.filter(k => k.startsWith('__react'));
      console.log('React keys:', reactKeys);
      
      if (reactKeys.length > 0) {
        const fiber = firstRow[reactKeys[0]];
        console.log('Fiber:', fiber);
        
        let current = fiber;
        let depth = 0;
        while (current && depth < 10) {
          console.log(`Depth ${depth}:`, current.memoizedProps);
          if (current.memoizedProps && current.memoizedProps.order) {
            console.log('FOUND ORDER AT DEPTH', depth);
            console.log('Order:', current.memoizedProps.order);
            return current.memoizedProps.order;
          }
          current = current.return;
          depth++;
        }
      }
    }
  };
  
  console.log('[PageContextExtractor] Ready. Available functions:');
  console.log('  - window.__otterExtractOrders() - Extract orders');
  console.log('  - window.__otterDebugReact() - Debug React presence');
  console.log('  - window.__otterIsReactReady() - Check if React is ready');
  console.log('  - window.__otterTestExtract() - Test extraction (matches user function)');
})();