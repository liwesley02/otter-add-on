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
  // Force leader mode with Ctrl+Shift+L
  document.addEventListener('keydown', async (e) => {
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
    
    // Show order cache discovery report with Ctrl+Shift+D
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      if (window.otterOrderCache) {
        const report = window.otterOrderCache.getDiscoveryReport();
        console.log('=== ORDER CACHE DISCOVERY REPORT ===');
        console.log('Known API Endpoints:', report.knownEndpoints);
        console.log('Total API Responses:', report.totalResponses);
        console.log('Orders with Details:', report.ordersWithDetails);
        console.log('Order Summaries:', report.orderSummaries);
        if (report.sampleOrder) {
          console.log('Sample Order Structure:', report.sampleOrder);
        }
        
        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #17a2b8;
          color: white;
          padding: 15px 20px;
          border-radius: 5px;
          z-index: 9999999;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = `Discovery Report: ${report.knownEndpoints.length} endpoints, ${report.ordersWithDetails} detailed orders`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
    }
    
    // Force leader mode with Ctrl+Shift+L
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      console.log('🔧 Forcing leader mode...');
      
      // Force this tab to become leader
      overlayUI.isScrapingMode = true;
      overlayUI.updateModeIndicator();
      
      // Notify background script
      await chrome.runtime.sendMessage({
        action: 'forceLeader',
        tabId: overlayUI.tabId
      });
      
      // Show notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999999;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      notification.textContent = '🔍 This tab is now the LEADER - extracting orders';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
      
      // Start extraction
      extractAndBatchOrders(false); // Always use preview mode
      setupOrderMonitoring();
      overlayUI.startLiveMonitoring();
    }
  });
  
  // Initialize components with error checking
  let itemMatcher, orderBatcher, categoryManager, batchManager, orderExtractor, overlayUI;
  
  try {
    console.log('Creating ItemMatcher...');
    itemMatcher = new ItemMatcher();
    
    console.log('Creating OrderBatcher...');
    orderBatcher = new OrderBatcher(itemMatcher);
    
    console.log('Creating CategoryManager...');
    categoryManager = new CategoryManager();
    
    console.log('Creating BatchManager...');
    batchManager = new BatchManager();
    
    // Set up batch event callbacks
    batchManager.onNewBatchCreated = (batch) => {
      overlayUI?.showNotification(`Batch ${batch.number - 1} is full! Created Batch ${batch.number}`, 'info');
    };
    
    batchManager.onBatchCapacityReached = () => {
      overlayUI?.showNotification('Current batch is at capacity!', 'warning');
    };
    
    console.log('Loading categories...');
    await categoryManager.loadCustomCategories();
    
    console.log('Creating OrderExtractor...');
    orderExtractor = new OrderExtractor(categoryManager);
    
    console.log('Creating OverlayUI...');
    overlayUI = new OverlayUI(orderBatcher, categoryManager, batchManager, orderExtractor);
  } catch (error) {
    console.error('Error creating components:', error);
    throw new Error(`Failed to create components: ${error.message}`);
  }
  
  let isInitialized = false;
  let orderObserver = null;
  
  function showNavigationHelper() {
    // Create navigation helper UI
    const helper = document.createElement('div');
    helper.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 9999999;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 350px;
    `;
    helper.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">📋 Otter Order Consolidator</div>
      <div style="margin-bottom: 15px;">You're on an order detail page. The extension works on the orders list page.</div>
      <div id="auto-open-countdown" style="margin-bottom: 15px; font-size: 14px; opacity: 0.9;">
        Opening orders list in new tab in <span id="countdown">3</span> seconds...
      </div>
      <button id="cancel-auto-open" style="
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: 5px;
        font-size: 13px;
        cursor: pointer;
        width: 100%;
        margin-bottom: 10px;
      ">Cancel Auto-Open</button>
      <button id="go-to-orders" style="
        background: white;
        color: #007bff;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
      ">Go to Orders List in This Tab</button>
    `;
    document.body.appendChild(helper);
    
    // Auto-open countdown
    let countdown = 3;
    let autoOpenCancelled = false;
    const countdownEl = document.getElementById('countdown');
    const autoOpenCountdownEl = document.getElementById('auto-open-countdown');
    
    const countdownInterval = setInterval(() => {
      if (autoOpenCancelled) {
        clearInterval(countdownInterval);
        return;
      }
      
      countdown--;
      if (countdownEl) {
        countdownEl.textContent = countdown;
      }
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        // Auto-open in new tab
        window.open('https://app.tryotter.com/orders', '_blank');
        
        // Update the helper message
        if (autoOpenCountdownEl) {
          autoOpenCountdownEl.innerHTML = '<div style="color: #90EE90;">✓ Orders list opened in new tab!</div>';
        }
        
        // Remove the cancel button
        const cancelBtn = document.getElementById('cancel-auto-open');
        if (cancelBtn) {
          cancelBtn.remove();
        }
        
        // Remove helper after a short delay
        setTimeout(() => helper.remove(), 5000);
      }
    }, 1000);
    
    // Cancel auto-open handler
    document.getElementById('cancel-auto-open').addEventListener('click', () => {
      autoOpenCancelled = true;
      clearInterval(countdownInterval);
      
      // Remove countdown and cancel button
      if (autoOpenCountdownEl) {
        autoOpenCountdownEl.remove();
      }
      const cancelBtn = document.getElementById('cancel-auto-open');
      if (cancelBtn) {
        cancelBtn.remove();
      }
    });
    
    // Manual navigation handler
    document.getElementById('go-to-orders').addEventListener('click', () => {
      autoOpenCancelled = true;
      clearInterval(countdownInterval);
      window.location.href = 'https://app.tryotter.com/orders';
    });
    
    // Auto-remove after 60 seconds (extended time)
    setTimeout(() => {
      if (helper.parentNode) {
        helper.remove();
      }
    }, 60000);
  }
  
  async function init() {
    if (isInitialized) return;
    
    try {
      // Check what page we're on
      const currentUrl = window.location.href;
      const isMainOrdersPage = currentUrl === 'https://app.tryotter.com/orders' || 
                              currentUrl === 'https://app.tryotter.com/orders/';
      
      // Check if we're on an order detail page (has UUID in URL)
      const isOrderDetailPage = /\/orders\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(currentUrl);
      
      if (isOrderDetailPage) {
        console.log('On order detail page - offering navigation to orders list');
        showNavigationHelper();
        return;
      }
      
      if (!isMainOrdersPage) {
        console.log('Not on orders page, skipping initialization. Current URL:', currentUrl);
        return;
      }
      
      console.log('Initializing Otter Order Consolidator...');
      
      // Start network monitoring
      if (window.otterNetworkMonitor) {
        window.otterNetworkMonitor.startMonitoring();
        window.otterNetworkMonitor.enableDebugMode();
        console.log('Network monitoring started');
      }
      
      // Set up listener for API data from network monitor
      window.addEventListener('otter-api-order-data', (event) => {
        console.log('[Content] Received API order data event:', event.detail);
        
        // Store in order cache
        if (window.otterOrderCache) {
          window.otterOrderCache.storeApiResponse(
            event.detail.url,
            event.detail.data,
            event.detail.timestamp
          );
          
          // Show discovery report
          if (window.otterOrderCache.discoveryMode) {
            const report = window.otterOrderCache.getDiscoveryReport();
            console.log('[Content] Order Cache Discovery Report:', report);
          }
        }
      });
      
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
      
      let registration;
      try {
        registration = await chrome.runtime.sendMessage({ action: 'registerTab' });
        console.log('Tab registration result:', registration);
      } catch (error) {
        console.error('Failed to register with background script:', error);
        // Extension context invalidated - force leader mode
        registration = {
          isLeader: true,
          tabId: Date.now(),
          existingData: null,
          totalTabs: 1
        };
        console.log('Extension context invalid - forcing leader mode');
      }
      
      // Set mode based on leadership
      // OVERRIDE: Force leader if URL param or no other tabs
      if (window.FORCE_LEADER) {
        overlayUI.isScrapingMode = true;
        console.log('Force leader mode via URL parameter');
      } else if (registration.totalTabs <= 1 || !registration.existingData || Object.keys(registration.existingData).length === 0) {
        overlayUI.isScrapingMode = true;
        console.log('No other active tabs or data - forcing leader mode');
      } else {
        overlayUI.isScrapingMode = registration.isLeader;
      }
      overlayUI.tabId = registration.tabId;
      overlayUI.updateModeIndicator();
      
      // IMPORTANT: Prevent automatic mode switching
      overlayUI._lockMode = overlayUI.isScrapingMode;
      
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
            // Only accept leadership changes if not locked
            if (!overlayUI._lockMode) {
              // We've been promoted to leader
              console.log('LEADER - Taking over extraction');
              overlayUI.isScrapingMode = true;
              overlayUI.updateModeIndicator();
              
              // Start extraction
              if (isInitialized) {
                extractAndBatchOrders(false); // Always use preview mode
                setupOrderMonitoring();
                overlayUI.startLiveMonitoring();
              }
            } else {
              console.log('Leadership change ignored - mode is locked');
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
          await extractAndBatchOrders(false); // Always use preview mode
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
      'div[class*="sc-"][class*="order"]',
      // Based on the HTML you showed earlier
      '.sc-dhHMav.fdVdID',
      'div.sc-dhHMav',
      // Try any div that contains order number pattern
      'div:has([data-testid="order-info-subtext"])'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      
      // Check if these look like order rows
      if (elements.length > 0) {
        const firstElement = elements[0];
        const text = firstElement.textContent || '';
        
        // Order rows typically contain order numbers and customer names
        // More flexible matching for order numbers (can start with # or be alphanumeric)
        if (text.match(/#[A-Z0-9]+/i) || text.includes('Order') || text.includes('Customer') || 
            firstElement.querySelector('[data-testid="order-info-subtext"]')) {
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
      
      // ALWAYS use preview-only extraction to prevent page refresh loops
      // Detailed extraction is disabled due to modal closing issues
      console.log('Using preview-only extraction (detailed mode disabled)');
      
      for (let i = 0; i < orderRows.length; i++) {
        progress.update(`Processing order ${i + 1} of ${orderRows.length}...`);
        
        const order = orderExtractor.extractOrderFromPreview(orderRows[i]);
        if (order && order.items.length > 0) {
          orders.push(order);
          orderBatcher.addOrder(order);
        }
      }
      
      console.log(`Extracted ${orders.length} orders`);
      
      // Update batch assignments
      batchManager.refreshBatchAssignments(orders);
      
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
  
  // Check for force leader mode in URL
  const urlParams = new URLSearchParams(window.location.search);
  window.FORCE_LEADER = urlParams.get('leader') === 'true';
  
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