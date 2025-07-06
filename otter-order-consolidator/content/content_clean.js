(async function() {
  console.log('🔴 OTTER EXTENSION LOADED AT:', new Date().toISOString());
  
  // Visual confirmation - red flash
  const originalBg = document.body.style.backgroundColor;
  document.body.style.backgroundColor = 'red';
  setTimeout(() => {
    document.body.style.backgroundColor = originalBg;
  }, 500);
  
  // Add floating badge
  const loadBadge = document.createElement('div');
  loadBadge.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #ff0000;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 9999999;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;
  loadBadge.textContent = 'OTTER EXT LOADED';
  document.body.appendChild(loadBadge);
  
  // Remove badge after 3 seconds
  setTimeout(() => loadBadge.remove(), 3000);
  
  // Log basic page info
  console.log('Page URL:', window.location.href);
  console.log('Page Title:', document.title);
  console.log('Body classes:', document.body.className);
  
  // Toggle debug panel with Ctrl+Shift+D - REMOVED
  // Export network findings with Ctrl+Shift+N
  document.addEventListener('keydown', (e) => {
    // Export network findings with Ctrl+Shift+N
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      if (window.otterNetworkMonitor) {
        const findings = window.otterNetworkMonitor.exportFindings();
        console.log('=== NETWORK API FINDINGS ===');
        console.log(findings);
        
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px 20px;
          border-radius: 5px;
          z-index: 9999999;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = `Network findings exported to console (${findings.discoveredEndpoints.length} endpoints found)`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
    }
  });
  
  // Initialize components with error checking
  let itemMatcher, orderBatcher, categoryManager, waveManager, orderExtractor, overlayUI;
  
  try {
    console.log('Creating ItemMatcher...');
    itemMatcher = new ItemMatcher();
    
    console.log('Creating OrderBatcher...');
    orderBatcher = new OrderBatcher(itemMatcher);
    
    console.log('Creating CategoryManager...');
    categoryManager = new CategoryManager();
    
    console.log('Creating WaveManager...');
    waveManager = new WaveManager();
    
    // Set up wave event callbacks
    waveManager.onNewWaveCreated = (wave) => {
      overlayUI?.showNotification(`Wave ${wave.number - 1} is full! Created Wave ${wave.number}`, 'info');
    };
    
    waveManager.onWaveCapacityReached = () => {
      overlayUI?.showNotification('Current wave is at capacity!', 'warning');
    };
    
    console.log('Loading categories...');
    await categoryManager.loadCustomCategories();
    
    console.log('Creating OrderExtractor...');
    orderExtractor = new OrderExtractor(categoryManager);
    
    console.log('Creating OverlayUI...');
    overlayUI = new OverlayUI(orderBatcher, categoryManager, waveManager, orderExtractor);
  } catch (error) {
    console.error('Error creating components:', error);
    throw new Error(`Failed to create components: ${error.message}`);
  }
  
  let isInitialized = false;
  let orderObserver = null;
  
  async function init() {
    if (isInitialized) return;
    
    try {
      // Only run on the main orders page, not on individual order detail pages
      const currentUrl = window.location.href;
      const isMainOrdersPage = currentUrl === 'https://app.tryotter.com/orders' || 
                              currentUrl === 'https://app.tryotter.com/orders/';
      
      // Check if we're on an order detail page (has UUID in URL)
      const isOrderDetailPage = /\/orders\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(currentUrl);
      
      if (!isMainOrdersPage || isOrderDetailPage) {
        console.log('Not on main orders page, skipping initialization. Current URL:', currentUrl);
        return;
      }
      
      console.log('Initializing Otter Order Consolidator...');
      
      // Start network monitoring
      if (window.otterNetworkMonitor) {
        window.otterNetworkMonitor.startMonitoring();
        window.otterNetworkMonitor.enableDebugMode();
        console.log('Network monitoring started');
      }
      
      // Show initialization progress
      const initProgress = document.createElement('div');
      initProgress.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 9999999;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      initProgress.textContent = 'Otter Extension: Initializing...';
      document.body.appendChild(initProgress);
      
      await waitForPageLoad();
      console.log('Page loaded, initializing UI...');
      initProgress.textContent = 'Otter Extension: Creating UI...';
      
      // Initialize UI first with error handling
      try {
        overlayUI.init();
        console.log('UI initialized');
        initProgress.textContent = 'Otter Extension: UI Ready';
      } catch (error) {
        console.error('Error initializing UI:', error);
        initProgress.textContent = 'Otter Extension: Error - ' + error.message;
        initProgress.style.background = '#dc3545';
      }
      
      // Register with background script
      console.log('Registering tab with background script...');
      
      const registration = await chrome.runtime.sendMessage({ action: 'registerTab' });
      console.log('Tab registration result:', registration);
      
      // Set mode based on leadership
      overlayUI.isScrapingMode = registration.isLeader;
      overlayUI.tabId = registration.tabId;
      overlayUI.updateModeIndicator();
      
      // If we have existing data and we're not the leader, load it
      if (!registration.isLeader && registration.existingData && registration.existingData.orders) {
        console.log('Loading existing order data...');
        overlayUI.updateFromSharedData(registration.existingData);
      }
      
      // Set up message listeners for leadership changes and data updates
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Received message:', message.action);
        
        switch (message.action) {
          case 'leadershipChanged':
            // We've been promoted to leader
            console.log('LEADER - Taking over extraction');
            overlayUI.isScrapingMode = true;
            overlayUI.updateModeIndicator();
            
            // Start extraction
            if (isInitialized) {
              extractAndBatchOrders(true);
              setupOrderMonitoring();
              overlayUI.startLiveMonitoring();
            }
            break;
            
          case 'ordersUpdated':
            // New order data from leader
            if (!overlayUI.isScrapingMode) {
              overlayUI.updateFromSharedData(message.data);
              console.log('Orders Updated:', new Date().toLocaleTimeString());
            }
            break;
            
          case 'tabRegistered':
            // Another tab joined
            console.log('Total Tabs:', message.totalTabs);
            break;
            
          case 'tabClosed':
            // Another tab left
            console.log('Remaining Tabs:', message.remainingTabs.length);
            break;
        }
      });
      
      // Start extraction if we're the leader
      if (overlayUI.isScrapingMode) {
        console.log('Leader mode - starting order extraction...');
        
        try {
          await extractAndBatchOrders(true);
          setupOrderMonitoring();
          // Start live monitoring after initial extraction
          overlayUI.startLiveMonitoring();
        } catch (error) {
          console.error('Error during extraction:', error);
        }
      } else {
        console.log('Follower mode - waiting for order updates...');
      }
      
      isInitialized = true;
      console.log('Otter Order Consolidator initialized successfully');
      
      // Remove progress indicator
      setTimeout(() => initProgress.remove(), 2000);
      
    } catch (error) {
      console.error('Critical error during initialization:', error);
      throw error;
    }
  }
  
  async function waitForPageLoad() {
    // Wait for critical selectors to appear
    const criticalSelectors = [
      '[data-testid="order-row"]',
      '.sc-dCesDq',
      '.sc-gpaZuh'
    ];
    
    for (let i = 0; i < 30; i++) { // 3 seconds max
      const found = criticalSelectors.some(selector => 
        document.querySelector(selector) !== null
      );
      
      if (found) {
        console.log('Critical elements found, page ready');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn('Page load timeout - proceeding anyway');
  }
  
  function detectOrderRowSelector() {
    // Try different selectors that might contain order rows
    const possibleSelectors = [
      '[data-testid="order-row"]',
      '[data-test="order-row"]',
      '.order-row',
      '[class*="order"][class*="row"]',
      'div[class*="orderRow"]',
      'div[class*="order-row"]',
      // More generic selectors
      'div[class*="sc-"][class*="order"]'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      
      // Check if these look like order rows
      if (elements.length > 0) {
        const firstElement = elements[0];
        const text = firstElement.textContent || '';
        
        // Order rows typically contain order numbers and customer names
        if (text.match(/#\d+/) || text.includes('Order') || text.includes('Customer')) {
          console.log(`Found order rows using selector: ${selector} (${elements.length} found)`);
          return { selector, elements: Array.from(elements) };
        }
      }
    }
    
    console.warn('No order rows found with known selectors');
    return { selector: null, elements: [] };
  }
  
  async function extractAndBatchOrders(useDetailed = false) {
    console.log('Starting order extraction...');
    
    if (!overlayUI.isScrapingMode) {
      console.log('Not in scraping mode, skipping extraction');
      return;
    }
    
    const progress = overlayUI.showProgress('Detecting orders...');
    
    try {
      // First, detect the order row selector
      const result = detectOrderRowSelector();
      
      if (!result.selector || result.elements.length === 0) {
        progress.update('No orders found on page');
        setTimeout(() => progress.remove(), 2000);
        
        overlayUI.showNotification('No orders detected. The page might still be loading.', 'warning');
        
        // Show retry button
        const retryNotification = overlayUI.showNotification(
          'Click here to retry order detection', 
          'info',
          0 // Don't auto-hide
        );
        retryNotification.style.cursor = 'pointer';
        retryNotification.addEventListener('click', async () => {
          retryNotification.remove();
          await extractAndBatchOrders(useDetailed);
        });
        
        return;
      }
      
      orderBatcher.clearBatches();
      
      // Use the found selector and elements
      console.log(`Using selector: ${result.selector}`);
      const orderRows = result.elements;
      const orders = [];
      
      // Update the order extractor to use the found selector
      if (result.selector !== '[data-testid="order-row"]') {
        orderExtractor.updateOrderRowSelector(result.selector);
      }
      
      if (useDetailed) {
        // Detailed extraction for initial load - gets sizes
        for (let i = 0; i < orderRows.length; i++) {
          progress.update(`Extracting order ${i + 1} of ${orderRows.length}...`);
          
          try {
            const order = await orderExtractor.extractOrderWithDetails(orderRows[i]);
            if (order && order.items.length > 0) {
              orders.push(order);
              orderBatcher.addOrder(order);
            }
          } catch (error) {
            console.error(`Error extracting order ${i}:`, error);
            // Fall back to preview for this order
            const previewOrder = extractOrderFromPreview(orderRows[i]);
            if (previewOrder && previewOrder.items.length > 0) {
              orders.push(previewOrder);
              orderBatcher.addOrder(previewOrder);
            }
          }
          
          // Small delay between orders
          if (i < orderRows.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        // Quick extraction for updates - preview only
        for (let i = 0; i < orderRows.length; i++) {
          progress.update(`Processing order ${i + 1} of ${orderRows.length}...`);
          
          const order = orderExtractor.extractOrderFromPreview(orderRows[i]);
          if (order && order.items.length > 0) {
            orders.push(order);
            orderBatcher.addOrder(order);
          }
        }
      }
      
      console.log(`Extracted ${orders.length} orders`);
      
      // Update wave assignments
      waveManager.refreshWaveAssignments(orders);
      
      // Update UI
      overlayUI.render();
      
      progress.remove();
      
      // Show success notification
      overlayUI.showNotification(`Processed ${orders.length} orders`, 'success');
      
      // Broadcast data to other tabs
      await overlayUI.broadcastOrderData();
      
    } catch (error) {
      console.error('Error in order extraction:', error);
      progress.remove();
      overlayUI.showNotification('Error extracting orders', 'error');
    }
  }
  
  function setupOrderMonitoring() {
    if (orderObserver) {
      orderObserver.disconnect();
    }
    
    const targetNode = document.querySelector('main') || document.body;
    
    orderObserver = new MutationObserver(async (mutations) => {
      // Only process if we're in scraping mode
      if (!overlayUI.isScrapingMode) return;
      
      // Check if new order rows were added
      const hasNewOrders = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === 1) { // Element node
            return node.matches && (
              node.matches('[data-testid="order-row"]') ||
              node.querySelector('[data-testid="order-row"]')
            );
          }
          return false;
        });
      });
      
      if (hasNewOrders) {
        console.log('New orders detected');
        // Small delay to let DOM settle
        setTimeout(() => {
          extractAndBatchOrders(false); // Use preview mode for live updates
        }, 500);
      }
    });
    
    const config = {
      childList: true,
      subtree: true
    };
    
    orderObserver.observe(targetNode, config);
    console.log('Order monitoring started');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure all scripts are loaded
    setTimeout(init, 100);
  }
  
  // Also listen for navigation changes (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('URL changed to:', url);
      
      // Reset and reinitialize if navigating to orders page
      if (url.includes('/orders') && !url.match(/\/orders\/[a-f0-9-]+$/)) {
        isInitialized = false;
        setTimeout(init, 500);
      }
    }
  }).observe(document, { subtree: true, childList: true });
})();