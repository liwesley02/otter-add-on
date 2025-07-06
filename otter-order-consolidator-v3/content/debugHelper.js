console.log('[DebugHelper.js] Script loaded at:', new Date().toISOString());

// Debug helper functions for Otter Order Consolidator
// These functions can be called from the Chrome console

window.otterDebug = {
  // Check extension status
  status() {
    console.log('=== OTTER EXTENSION STATUS ===');
    console.log('Extension Loaded:', !!window.otterOverlayUI);
    console.log('Network Monitor:', !!window.otterNetworkMonitor);
    console.log('Order Cache:', !!window.otterOrderCache);
    console.log('Tab ID:', window.otterOverlayUI?.tabId);
    console.log('Is Leader:', window.otterOverlayUI?.isScrapingMode);
    console.log('Order Batcher:', !!window.otterOverlayUI?.orderBatcher);
    console.log('Batch Manager:', !!window.otterOverlayUI?.batchManager);
    console.log('Current Batch:', window.otterOverlayUI?.batchManager?.currentBatchIndex);
    console.log('Total Batches:', window.otterOverlayUI?.batchManager?.batches?.length);
    console.log('Processed Orders:', window.otterOverlayUI?.processedOrderIds?.size);
    return 'Status check complete';
  },

  // Force leader mode
  forceLeader() {
    console.log('🔧 Forcing leader mode...');
    const event = new KeyboardEvent('keydown', {
      key: 'L',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
    return 'Leader mode forced - check for green notification';
  },

  // Clear all data and reset
  reset() {
    console.log('🔄 Resetting extension...');
    if (window.otterOverlayUI) {
      // Clear order batcher
      window.otterOverlayUI.orderBatcher?.clearBatches();
      
      // Reset batch manager
      if (window.otterOverlayUI.batchManager) {
        window.otterOverlayUI.batchManager.batches = [];
        window.otterOverlayUI.batchManager.currentBatchIndex = 0;
        window.otterOverlayUI.batchManager.nextBatchNumber = 1;
      }
      
      // Clear processed orders
      window.otterOverlayUI.processedOrderIds = new Set();
      
      // Clear caches
      window.otterOrderCache?.clear();
      
      // Re-render
      window.otterOverlayUI.render();
      
      console.log('✅ Extension reset complete');
      return 'Reset complete - ready for fresh extraction';
    } else {
      return '❌ Extension not loaded';
    }
  },

  // Extract orders manually
  async extractOrders() {
    console.log('📋 Starting manual order extraction...');
    if (!window.otterOverlayUI || !window.otterOverlayUI.isScrapingMode) {
      console.warn('⚠️ Not in leader mode. Use otterDebug.forceLeader() first');
      return 'Must be in leader mode to extract';
    }
    
    // Call the extraction function
    if (window.extractAndBatchOrders) {
      await window.extractAndBatchOrders(false);
      return 'Extraction started - check sidebar for results';
    } else {
      return 'Extraction function not available';
    }
  },

  // Show current orders
  showOrders() {
    console.log('=== CURRENT ORDERS ===');
    const orders = window.otterOverlayUI?.orderBatcher?.getAllOrders() || [];
    if (orders.length === 0) {
      console.log('No orders extracted yet');
      return 'No orders';
    }
    
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log(`  Wait Time: ${order.waitTime}m`);
      console.log(`  Items: ${order.items.length}`);
      order.items.forEach(item => {
        console.log(`    - ${item.quantity}x ${item.name} (${item.size})`);
      });
    });
    
    return `${orders.length} orders displayed`;
  },

  // Show batched items
  showBatches() {
    console.log('=== BATCHED ITEMS ===');
    const batches = window.otterOverlayUI?.orderBatcher?.getBatchedItems() || [];
    if (batches.length === 0) {
      console.log('No batched items yet');
      return 'No batches';
    }
    
    const bySize = window.otterOverlayUI?.orderBatcher?.getBatchesBySize() || {};
    Object.entries(bySize).forEach(([size, sizeGroup]) => {
      console.log(`\n${sizeGroup.name}:`);
      Object.entries(sizeGroup.categories).forEach(([category, items]) => {
        items.forEach(item => {
          console.log(`  ${item.totalQuantity}x ${item.name}`);
        });
      });
    });
    
    return 'Batches displayed';
  },

  // Show batches
  showBatchDetails() {
    console.log('=== CURRENT BATCHES ===');
    const batches = window.otterOverlayUI?.batchManager?.batches || [];
    if (batches.length === 0) {
      console.log('No batches created yet');
      return 'No batches';
    }
    
    batches.forEach((batch, index) => {
      const urgency = window.otterOverlayUI?.batchManager?.getBatchUrgency(batch) || 'normal';
      console.log(`\nBatch ${batch.number} (${urgency}):`);
      console.log(`  Orders: ${batch.orders?.size || 0}`);
      console.log(`  Items: ${batch.items?.size || 0}`);
      console.log(`  Locked: ${batch.isLocked || false}`);
      console.log(`  Created: ${new Date(batch.createdAt).toLocaleTimeString()}`);
    });
    
    return `${batches.length} batches displayed`;
  },

  // Toggle sidebar visibility
  toggleSidebar() {
    const sidebar = document.getElementById('otter-consolidator-overlay');
    if (sidebar) {
      const isVisible = sidebar.style.display !== 'none';
      sidebar.style.display = isVisible ? 'none' : 'flex';
      return isVisible ? 'Sidebar hidden' : 'Sidebar shown';
    }
    return 'Sidebar not found';
  },

  // Diagnose sidebar issues
  checkSidebar() {
    console.log('=== SIDEBAR DIAGNOSTICS ===');
    
    // Check if overlay exists
    const overlay = document.getElementById('otter-consolidator-overlay');
    if (!overlay) {
      console.error('❌ Sidebar element not found');
      
      // Check if overlayUI exists
      if (!window.otterOverlayUI) {
        console.error('❌ OverlayUI not initialized');
        return 'Extension not loaded properly';
      }
      
      // Try to create it
      console.log('🔧 Attempting to create sidebar...');
      try {
        window.otterOverlayUI.createOverlay();
        console.log('✅ Sidebar created');
      } catch (e) {
        console.error('Failed to create sidebar:', e);
      }
      return 'Attempted to create sidebar';
    }
    
    // Get computed styles
    const styles = window.getComputedStyle(overlay);
    console.log('Display:', styles.display);
    console.log('Visibility:', styles.visibility);
    console.log('Position:', styles.position);
    console.log('Dimensions:', overlay.offsetWidth, 'x', overlay.offsetHeight);
    console.log('Z-index:', styles.zIndex);
    console.log('Right:', styles.right);
    console.log('Opacity:', styles.opacity);
    console.log('Transform:', styles.transform);
    
    // Check if it's visible
    const isVisible = styles.display !== 'none' && 
                     styles.visibility !== 'hidden' && 
                     styles.opacity !== '0';
    
    // Check position
    const rect = overlay.getBoundingClientRect();
    console.log('Position on screen:', rect);
    
    if (rect.right < 0) {
      console.warn('⚠️ Sidebar is off-screen to the right');
    }
    if (rect.left > window.innerWidth) {
      console.warn('⚠️ Sidebar is off-screen to the left');
    }
    
    // Check parent elements
    let parent = overlay.parentElement;
    let level = 1;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        console.warn(`⚠️ Parent element at level ${level} is hidden:`, parent);
      }
      parent = parent.parentElement;
      level++;
    }
    
    // Check toggle button
    const toggleBtn = document.getElementById('otter-consolidator-toggle');
    console.log('Toggle button exists:', !!toggleBtn);
    
    // Check mode toggle
    const modeBtn = document.getElementById('otter-mode-toggle');
    console.log('Mode button exists:', !!modeBtn);
    
    return isVisible ? '✅ Sidebar should be visible' : '❌ Sidebar is hidden';
  },

  // Force show sidebar
  forceShowSidebar() {
    const sidebar = document.getElementById('otter-consolidator-overlay');
    if (!sidebar) {
      console.log('Creating sidebar...');
      if (window.otterOverlayUI) {
        try {
          window.otterOverlayUI.createOverlay();
        } catch (e) {
          console.error('Failed to create sidebar:', e);
          return 'Failed to create sidebar';
        }
      } else {
        return 'OverlayUI not initialized';
      }
    }
    
    const overlay = document.getElementById('otter-consolidator-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      overlay.style.right = '0';
      overlay.style.transform = 'none';
      overlay.style.zIndex = '999999';
      console.log('✅ Forced sidebar to show');
      return 'Sidebar forced visible';
    }
    return 'Could not find sidebar';
  },

  // Search DOM for hidden data
  findHiddenData() {
    console.log('=== SEARCHING FOR HIDDEN ORDER DATA ===');
    
    // 1. Check for script tags with JSON
    const scriptTags = document.querySelectorAll('script[type="application/json"], script[type="text/json"]');
    console.log(`Found ${scriptTags.length} JSON script tags`);
    scriptTags.forEach((script, i) => {
      try {
        const data = JSON.parse(script.textContent);
        console.log(`Script ${i}:`, data);
        
        // Check if it contains order-like data
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes('order') || str.includes('item') || str.includes('size')) {
          console.log('🎯 This script might contain order data!');
        }
      } catch (e) {
        console.log(`Script ${i}: Failed to parse`);
      }
    });
    
    // 2. Check data attributes on order elements
    console.log('\n=== Checking data attributes ===');
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    orderRows.forEach((row, i) => {
      const attrs = row.attributes;
      console.log(`Order ${i} attributes:`);
      for (let attr of attrs) {
        if (attr.name.startsWith('data-') && attr.value) {
          console.log(`  ${attr.name}: ${attr.value.substring(0, 100)}...`);
        }
      }
      
      // Check all child elements for data attributes
      const elements = row.querySelectorAll('*');
      elements.forEach(el => {
        for (let attr of el.attributes) {
          if (attr.name.startsWith('data-') && attr.value && attr.value.length > 20) {
            console.log(`  Found data attr: ${attr.name} = ${attr.value.substring(0, 50)}...`);
          }
        }
      });
    });
    
    // 3. Check window object for exposed data
    console.log('\n=== Checking window object ===');
    const suspectKeys = Object.keys(window).filter(key => {
      const lower = key.toLowerCase();
      return lower.includes('order') || lower.includes('otter') || 
             lower.includes('menu') || lower.includes('item') ||
             lower.includes('__') || lower.includes('initial');
    });
    console.log('Suspicious window keys:', suspectKeys);
    suspectKeys.forEach(key => {
      try {
        const value = window[key];
        if (value && typeof value === 'object') {
          console.log(`window.${key}:`, value);
        }
      } catch (e) {
        // Some properties throw errors when accessed
      }
    });
    
    // 4. Check localStorage and sessionStorage
    console.log('\n=== Checking storage ===');
    console.log('LocalStorage keys:', Object.keys(localStorage));
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key);
      if (value && value.includes('order') || value.includes('item')) {
        console.log(`localStorage['${key}']:`, value.substring(0, 200) + '...');
      }
    });
    
    console.log('\nSessionStorage keys:', Object.keys(sessionStorage));
    Object.keys(sessionStorage).forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value && (value.includes('order') || value.includes('item'))) {
        console.log(`sessionStorage['${key}']:`, value.substring(0, 200) + '...');
      }
    });
    
    // 5. Check React/Vue components
    console.log('\n=== Checking for React/Vue data ===');
    const reactKeys = Object.keys(orderRows[0] || {}).filter(key => key.startsWith('__react'));
    if (reactKeys.length > 0) {
      console.log('Found React internal keys:', reactKeys);
      // Try to access React fiber/props
      try {
        const firstOrder = orderRows[0];
        const reactKey = reactKeys[0];
        const fiber = firstOrder[reactKey];
        if (fiber) {
          console.log('React fiber found:', fiber);
          if (fiber.memoizedProps) {
            console.log('React props:', fiber.memoizedProps);
          }
        }
      } catch (e) {
        console.log('Could not access React internals');
      }
    }
    
    return 'Search complete - check console for findings';
  },
  
  // Inspect a specific order for hidden data
  inspectOrder(orderIndex = 0) {
    console.log('=== INSPECTING ORDER ELEMENT ===');
    
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    if (!orderRows[orderIndex]) {
      console.log(`No order found at index ${orderIndex}`);
      return;
    }
    
    const orderRow = orderRows[orderIndex];
    console.log('Order element:', orderRow);
    
    // 1. Check all attributes
    console.log('\nAll attributes:');
    Array.from(orderRow.attributes).forEach(attr => {
      console.log(`  ${attr.name}: ${attr.value}`);
    });
    
    // 2. Check computed styles for hidden content
    console.log('\nChecking for hidden elements:');
    const allElements = orderRow.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || 
          style.opacity === '0' || el.hidden) {
        console.log('Hidden element found:', el);
        console.log('  Text content:', el.textContent);
        console.log('  Inner HTML:', el.innerHTML.substring(0, 200));
      }
      
      // Check for size-related text
      const text = el.textContent || '';
      if (text.match(/small|medium|large|sm|md|lg|size/i)) {
        console.log('Size-related text found:', text);
        console.log('  Element:', el);
      }
    });
    
    // 3. Check for React props
    console.log('\nChecking React internals:');
    const reactKeys = Object.keys(orderRow).filter(key => key.startsWith('__react'));
    reactKeys.forEach(key => {
      try {
        const fiber = orderRow[key];
        console.log(`React fiber (${key}):`, fiber);
        
        // Navigate the fiber tree
        let current = fiber;
        let depth = 0;
        while (current && depth < 5) {
          if (current.memoizedProps) {
            console.log(`  Props at depth ${depth}:`, current.memoizedProps);
            
            // Check if props contain size data
            const propsStr = JSON.stringify(current.memoizedProps);
            if (propsStr.includes('size') || propsStr.includes('Size')) {
              console.log('  🎯 Found size in props!');
            }
          }
          if (current.memoizedState) {
            console.log(`  State at depth ${depth}:`, current.memoizedState);
          }
          current = current.return; // Go up the tree
          depth++;
        }
      } catch (e) {
        console.log('Error accessing React fiber:', e);
      }
    });
    
    // 4. Check for Vue instance
    if (orderRow.__vue__) {
      console.log('\nVue instance found:', orderRow.__vue__);
      console.log('Vue data:', orderRow.__vue__.$data);
      console.log('Vue props:', orderRow.__vue__.$props);
    }
    
    // 5. Look for JSON in text nodes
    console.log('\nChecking for JSON in text nodes:');
    const walker = document.createTreeWalker(
      orderRow,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text.startsWith('{') || text.startsWith('[')) {
        try {
          const data = JSON.parse(text);
          console.log('Found JSON in text node:', data);
        } catch (e) {
          // Not valid JSON
        }
      }
    }
    
    return 'Inspection complete';
  },
  
  // Extract data from page state
  extractPageState() {
    console.log('=== EXTRACTING PAGE STATE ===');
    
    // Common state container patterns
    const stateContainers = [
      '__INITIAL_STATE__',
      '__PRELOADED_STATE__',
      '__APP_STATE__',
      '__NEXT_DATA__',
      '__NUXT__',
      'initialState',
      'preloadedState'
    ];
    
    stateContainers.forEach(key => {
      if (window[key]) {
        console.log(`Found window.${key}:`);
        console.log(window[key]);
        
        // Search for order data
        const str = JSON.stringify(window[key]);
        if (str.includes('order') || str.includes('item') || str.includes('size')) {
          console.log('🎯 This state contains order-related data!');
          
          // Try to find specific paths
          try {
            const findOrders = (obj, path = '') => {
              if (!obj || typeof obj !== 'object') return;
              
              Object.keys(obj).forEach(k => {
                const newPath = path ? `${path}.${k}` : k;
                if (k.toLowerCase().includes('order') || k.toLowerCase().includes('item')) {
                  console.log(`Found at ${newPath}:`, obj[k]);
                }
                if (typeof obj[k] === 'object') {
                  findOrders(obj[k], newPath);
                }
              });
            };
            
            findOrders(window[key]);
          } catch (e) {
            console.log('Error traversing state:', e);
          }
        }
      }
    });
    
    return 'State extraction complete';
  },
  
  // Help command
  help() {
    console.log('=== OTTER DEBUG COMMANDS ===');
    console.log('otterDebug.status()      - Check extension status');
    console.log('otterDebug.forceLeader() - Force this tab to be leader (or press Ctrl+Shift+L)');
    console.log('otterDebug.reset()       - Clear all data and reset');
    console.log('otterDebug.extractOrders() - Manually extract orders');
    console.log('otterDebug.showOrders()  - Display extracted orders');
    console.log('otterDebug.showBatches() - Display batched items');
    console.log('otterDebug.showBatchDetails() - Display current batches');
    console.log('otterDebug.toggleSidebar() - Show/hide sidebar');
    console.log('otterDebug.checkSidebar() - Diagnose sidebar visibility issues');
    console.log('otterDebug.forceShowSidebar() - Force sidebar to be visible');
    console.log('otterDebug.findHiddenData() - Search DOM for hidden order/size data');
    console.log('otterDebug.extractPageState() - Extract React/Vue state data');
    console.log('otterDebug.inspectOrder(0) - Deep inspect a specific order element');
    console.log('\nKEYBOARD SHORTCUTS:');
    console.log('Ctrl+Shift+O - Toggle sidebar visibility');
    console.log('Ctrl+Shift+L - Force leader mode');
    console.log('Ctrl+Shift+F - Export network findings');
    console.log('Ctrl+Shift+D - Show order cache discovery report');
    console.log('Ctrl+Shift+V - Toggle verbose network logging');
    console.log('Ctrl+Shift+I - Show diagnostics');
    console.log('\nREACT DEBUGGING:');
    console.log('otterDebug.inspectReact() - Inspect React fibers for order data');
    console.log('otterDebug.extractReact() - Force React data extraction');
    return 'Help displayed';
  },
  
  // Inspect React fibers to find order data
  inspectReact() {
    if (window.otterReactDataExtractor) {
      return window.otterReactDataExtractor.inspectReactFibers();
    } else {
      console.error('React data extractor not available');
      return null;
    }
  },
  
  // Force React extraction with debug
  extractReact() {
    if (window.otterReactDataExtractor) {
      window.otterReactDataExtractor.enableDebug();
      const orders = window.otterReactDataExtractor.extractOrders();
      console.log(`Extracted ${orders.length} orders from React:`, orders);
      return orders;
    } else {
      console.error('React data extractor not available');
      return [];
    }
  },
  
  // Check if React is present on the page
  checkReact() {
    console.log('=== REACT PRESENCE CHECK ===');
    
    // Check for React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✓ React DevTools hook found');
    } else {
      console.log('✗ No React DevTools hook');
    }
    
    // Check for React on window
    if (window.React) {
      console.log('✓ React found on window:', window.React.version);
    } else {
      console.log('✗ React not found on window');
    }
    
    // Check first order row for React properties
    const row = document.querySelector('[data-testid="order-row"]');
    if (row) {
      const keys = Object.keys(row);
      const reactKeys = keys.filter(k => k.includes('react') || k.includes('React'));
      console.log('Order row keys:', keys);
      console.log('React-related keys:', reactKeys);
      
      // Check all properties
      keys.forEach(key => {
        if (key.startsWith('__')) {
          console.log(`Property ${key}:`, typeof row[key]);
        }
      });
    } else {
      console.log('No order rows found');
    }
    
    return 'Check complete';
  }
};

// Make debug functions globally available
if (window.otterDebug && window.otterDebug.help) {
  window.otterDebug.help();
}
console.log('✅ Otter debug helpers loaded. Type otterDebug.help() for commands.');