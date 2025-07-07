(async function() {
  console.log('🔴 OTTER EXTENSION LOADED AT:', new Date().toISOString());
  console.log('🔴 Page URL:', window.location.href);
  console.log('🔴 Document ready state:', document.readyState);
  
  // Log available components
  console.log('🔴 Available components:', {
    Storage: typeof Storage,
    ItemMatcher: typeof ItemMatcher,
    OrderBatcher: typeof OrderBatcher,
    CategoryManager: typeof CategoryManager,
    BatchManager: typeof BatchManager,
    OrderExtractor: typeof OrderExtractor,
    OverlayUI: typeof OverlayUI,
    NetworkMonitor: typeof NetworkMonitor,
    OrderCache: typeof OrderCache
  });
  
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
    // Export network findings with Ctrl+Shift+F (F for Findings)
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
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
    
    // Toggle verbose network logging with Ctrl+Shift+V
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      if (window.otterNetworkMonitor) {
        const isVerbose = window.otterNetworkMonitor.toggleVerboseMode();
        
        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${isVerbose ? '#ff6b6b' : '#6c757d'};
          color: white;
          padding: 15px 20px;
          border-radius: 5px;
          z-index: 9999999;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = `Network Verbose Mode: ${isVerbose ? 'ON - Check console for all requests' : 'OFF'}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    }
    
    // Hide/Show UI elements with Ctrl+Shift+H
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      
      // Toggle UI visibility
      const uiElements = [
        document.querySelector('.otter-floating-toggle'),
        document.querySelector('.otter-mode-toggle'),
        document.getElementById('otter-consolidator-overlay')
      ];
      
      const anyVisible = uiElements.some(el => el && !el.classList.contains('otter-ui-hidden'));
      
      uiElements.forEach(el => {
        if (el) {
          if (anyVisible) {
            el.classList.add('otter-ui-hidden');
          } else {
            el.classList.remove('otter-ui-hidden');
          }
        }
      });
      
      // Show notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${anyVisible ? '#dc3545' : '#28a745'};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 9999999;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      notification.textContent = anyVisible ? 'UI Hidden - Press Ctrl+Shift+H to show' : 'UI Shown';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }
    
    // Show diagnostics with Ctrl+Shift+I (not regular I to avoid conflicts)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      console.log('=== OTTER EXTENSION DIAGNOSTICS ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('URL:', window.location.href);
      console.log('\nComponents Status:');
      console.log('- NetworkMonitor:', !!window.otterNetworkMonitor, window.otterNetworkMonitor?.isMonitoring ? '(monitoring)' : '(not monitoring)');
      console.log('- OrderCache:', !!window.otterOrderCache, window.otterOrderCache?.apiResponses?.size ? `(${window.otterOrderCache.apiResponses.size} responses)` : '(empty)');
      console.log('- OverlayUI:', !!window.otterOverlayUI, window.otterOverlayUI?.isScrapingMode ? '(leader)' : '(follower)');
      console.log('- Debug Helper:', !!window.otterDebug);
      console.log('\nDOM Elements:');
      console.log('- Overlay:', !!document.getElementById('otter-consolidator-overlay'));
      console.log('- Toggle Button:', !!document.querySelector('.otter-floating-toggle'));
      console.log('- Mode Button:', !!document.querySelector('.otter-mode-toggle'));
      console.log('- Order Rows:', document.querySelectorAll('[data-testid="order-row"]').length);
      console.log('\nInitialization State:');
      console.log('- isInitialized:', isInitialized);
      console.log('- overlayUI created:', !!overlayUI);
      console.log('\nRun otterDebug.help() for available commands');
      
      // Show visual notification
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
      notification.textContent = 'Diagnostics printed to console (F12)';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
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
  
  // Create components immediately
  async function createComponents() {
    try {
      console.log('Creating ItemMatcher...');
      if (typeof ItemMatcher === 'undefined') {
        throw new Error('ItemMatcher not loaded');
      }
      itemMatcher = new ItemMatcher();
      
      console.log('Creating OrderBatcher...');
      if (typeof OrderBatcher === 'undefined') {
        throw new Error('OrderBatcher not loaded');
      }
      orderBatcher = new OrderBatcher(itemMatcher);
      
      console.log('Creating CategoryManager...');
      if (typeof CategoryManager === 'undefined') {
        throw new Error('CategoryManager not loaded');
      }
      categoryManager = new CategoryManager();
      
      console.log('Creating BatchManager...');
      if (typeof BatchManager === 'undefined') {
        throw new Error('BatchManager not loaded');
      }
      batchManager = new BatchManager();
      
      // Set up batch event callbacks
      batchManager.onNewBatchCreated = (batch) => {
        overlayUI?.showNotification(`Batch ${batch.number - 1} is full! Created Batch ${batch.number}`, 'info');
      };
      
      batchManager.onBatchCapacityReached = () => {
        overlayUI?.showNotification('Current batch is at capacity!', 'warning');
      };
      
      // Categories are loaded directly in categoryManager constructor
      console.log('Categories loaded');
      
      console.log('Creating OrderExtractor...');
      if (typeof OrderExtractor === 'undefined') {
        throw new Error('OrderExtractor not loaded');
      }
      orderExtractor = new OrderExtractor(categoryManager);
      
      console.log('Creating OverlayUI...');
      if (typeof OverlayUI === 'undefined') {
        throw new Error('OverlayUI not loaded');
      }
      overlayUI = new OverlayUI(orderBatcher, categoryManager, batchManager, orderExtractor);
      
      // Make overlayUI globally accessible for debugging
      window.otterOverlayUI = overlayUI;
      
      return true;
    } catch (error) {
      console.error('Error creating components:', error);
      console.error('Available globals:', {
        ItemMatcher: typeof ItemMatcher,
        OrderBatcher: typeof OrderBatcher,
        CategoryManager: typeof CategoryManager,
        BatchManager: typeof BatchManager,
        OrderExtractor: typeof OrderExtractor,
        OverlayUI: typeof OverlayUI
      });
      throw error;
    }
  }
  
  // Create components early
  await createComponents();
  
  let isInitialized = false;
  let orderObserver = null;
  let reactExtractionSuccessful = false;
  
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
    if (isInitialized) {
      console.log('[init] Already initialized, skipping');
      return;
    }
    
    console.log('[init] Starting initialization...');
    console.log('[init] Available components at start:', {
      networkMonitor: !!window.otterNetworkMonitor,
      orderCache: !!window.otterOrderCache,
      overlayUI: !!overlayUI
    });
    
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
      
      // Check network monitoring status
      if (window.otterNetworkMonitor) {
        console.log('[Content] Network monitor status:', {
          available: true,
          isMonitoring: window.otterNetworkMonitor.isMonitoring,
          error: window.otterNetworkMonitor.error || null
        });
        
        // Enable verbose mode for debugging
        if (window.otterNetworkMonitor.toggleVerboseMode) {
          window.otterNetworkMonitor.toggleVerboseMode();
          console.log('[Content] Verbose mode enabled');
        }
        
        // Test the interception is working
        console.log('[Content] Testing network interception...');
        fetch('https://app.tryotter.com/test-interception').catch(() => {});
        
        // Log current page requests after a delay
        setTimeout(() => {
          if (window.otterNetworkMonitor.getAllRequests) {
            const requests = window.otterNetworkMonitor.getAllRequests();
            console.log(`[Content] Total requests captured so far: ${requests.length}`);
            if (requests.length > 0) {
              console.log('[Content] Sample requests:', requests.slice(0, 5));
            }
          }
        }, 3000);
      } else {
        console.error('[Content] Network monitor not available!');
      }
      
      // Check order cache status
      if (window.otterOrderCache) {
        console.log('[Content] Order cache available:', {
          available: true,
          error: window.otterOrderCache.error || null
        });
      } else {
        console.error('[Content] Order cache not available!');
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
      initProgress.id = 'otter-init-progress';
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
        transition: all 0.3s ease;
      `;
      initProgress.textContent = 'Otter Extension: Initializing...';
      document.body.appendChild(initProgress);
      
      await waitForPageLoad();
      console.log('Page loaded, initializing UI...');
      initProgress.textContent = 'Otter Extension: Creating UI...';
      
      // Initialize UI first with error handling
      try {
        if (!overlayUI) {
          throw new Error('OverlayUI not created');
        }
        overlayUI.init();
        console.log('UI initialized');
        initProgress.textContent = 'Otter Extension: UI Ready';
      } catch (error) {
        console.error('Error initializing UI:', error);
        initProgress.textContent = 'Otter Extension: Error - ' + error.message;
        initProgress.style.background = '#dc3545';
        
        // Try to recover by recreating components
        try {
          await createComponents();
          overlayUI.init();
          console.log('UI initialized after recovery');
          initProgress.textContent = 'Otter Extension: Recovered';
          initProgress.style.background = '#28a745';
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
          throw recoveryError;
        }
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
      isInitialized = false;
      
      // Update or create error notification
      let errorNotif = document.getElementById('otter-init-progress');
      if (!errorNotif) {
        errorNotif = document.createElement('div');
        errorNotif.id = 'otter-init-progress';
        document.body.appendChild(errorNotif);
      }
      
      errorNotif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 9999999;
        font-size: 14px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      errorNotif.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">Otter Extension Failed to Load</div>
        <div style="margin-bottom: 10px;">${error.message}</div>
        <div style="font-size: 12px; opacity: 0.8;">Try refreshing the page (F5) or check console (F12) for details.</div>
        <button onclick="location.reload()" style="
          background: white;
          color: #dc3545;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-top: 10px;
        ">Refresh Page</button>
      `;
      
      // Don't re-throw to prevent breaking other scripts
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
  
  async function extractFromReact(progress) {
    console.log('[Content] Extracting orders from React props');
    
    try {
      // Use the React data extractor (async function)
      const reactOrders = await window.otterReactDataExtractor.extractOrders();
      
      if (!reactOrders || reactOrders.length === 0) {
        console.log('[Content] No orders found in React props');
        return null;
      }
      
      console.log(`[Content] Found ${reactOrders.length} orders in React props`);
      progress.update(`Processing ${reactOrders.length} orders...`);
      
      // Clear existing batches
      orderBatcher.clearBatches();
      
      // Process each React order
      reactOrders.forEach((reactOrder, index) => {
        progress.update(`Processing order ${index + 1} of ${reactOrders.length}...`);
        
        // Convert React order to our format
        const order = {
          id: reactOrder.id,
          number: reactOrder.orderNumber,
          customerName: reactOrder.customerName,
          timestamp: reactOrder.timestamp || Date.now(),
          orderedAt: reactOrder.orderedAt, // Include orderedAt timestamp from React
          elapsedTime: reactOrder.elapsedTime || 0, // Include elapsed time from React
          waitTime: reactOrder.waitTime || 0,
          items: reactOrder.items.map(item => {
            let categoryInfo;
            try {
              // Pass the complete item object to categoryManager
              categoryInfo = categoryManager.categorizeItem(item.name, item.size || 'no-size', {
                proteinType: item.proteinType,
                sauce: item.sauce || item.modifierDetails?.sauce,
                modifiers: item.modifiers,
                modifierDetails: item.modifierDetails,
                isRiceBowl: item.isRiceBowl,
                isUrbanBowl: item.isUrbanBowl
              });
            } catch (error) {
              console.error(`Error categorizing item ${item.name}:`, error);
              categoryInfo = {
                topCategory: 'other',
                subCategory: 'other',
                topCategoryName: 'Other',
                subCategoryName: 'Other',
                displayCategory: 'Other',
                proteinType: item.proteinType || '',
                sauceType: item.sauce || ''
              };
            }
            return {
              name: item.name,
              baseName: item.name,
              size: item.size || 'no-size',
              quantity: item.quantity || 1,
              price: item.price || 0,
              category: categoryInfo.topCategory,
              categoryInfo: categoryInfo,
              modifiers: item.modifiers || [],
              modifierList: item.modifierList || [],
              modifierDetails: item.modifierDetails || {},
              proteinType: item.proteinType || categoryInfo.proteinType || '',
              sauce: item.sauce || categoryInfo.sauceType || '',
              isRiceBowl: item.isRiceBowl || false,
              isUrbanBowl: item.isUrbanBowl || false,
              fromReact: true,
              source: 'react'
            };
          })
        };
        
        // Add to batcher
        orderBatcher.addOrder(order);
      });
      
      // Update batch assignments
      batchManager.refreshBatchAssignments(reactOrders);
      
      // Update UI
      overlayUI.render();
      
      progress.remove();
      
      // Show success notification with size info
      const ordersWithSizes = reactOrders.filter(o => 
        o.items.some(i => i.size && i.size !== 'no-size' && i.size !== 'urban')
      ).length;
      
      overlayUI.showNotification(
        `Loaded ${reactOrders.length} orders from React (${ordersWithSizes} with sizes)`, 
        'success'
      );
      
      // Broadcast data to other tabs
      // broadcastOrderData(); // TODO: Define this function if needed
      
      return reactOrders;
      
    } catch (error) {
      console.error('[Content] Error extracting from React:', error);
      return null;
    }
  }

  function extractFromAPICache(progress) {
    console.log('[Content] Extracting orders from API cache');
    
    try {
      const cachedOrders = window.otterOrderCache.getAllOrders();
      console.log(`[Content] Found ${cachedOrders.length} orders in API cache`);
      
      progress.update(`Processing ${cachedOrders.length} API orders...`);
      
      // Clear existing batches
      orderBatcher.clearBatches();
      
      // Process each cached order
      cachedOrders.forEach((cachedOrder, index) => {
        progress.update(`Processing order ${index + 1} of ${cachedOrders.length}...`);
        
        // Convert cached order to our format
        const order = {
          id: cachedOrder.id,
          number: cachedOrder.orderNumber || cachedOrder.id,
          customerName: cachedOrder.customerName || 'Unknown Customer',
          timestamp: cachedOrder.timestamp || Date.now(),
          waitTime: 0, // Will need to get from DOM if available
          items: cachedOrder.items.map(item => {
            const categoryInfo = categoryManager.categorizeItem(item.name, item.size || 'no-size');
            return {
              name: item.name,
              baseName: item.name,
              size: item.size || 'no-size',
              quantity: item.quantity || 1,
              price: item.price || 0,
              category: categoryInfo.topCategory,
              categoryInfo: categoryInfo,
              modifiers: item.modifiers || [],
              fromApi: true
            };
          })
        };
        
        // Add to batcher
        orderBatcher.addOrder(order);
      });
      
      // Update batch assignments
      batchManager.refreshBatchAssignments(cachedOrders);
      
      // Update UI
      overlayUI.render();
      
      progress.remove();
      
      // Show success notification
      overlayUI.showNotification(
        `Loaded ${cachedOrders.length} orders from API (${cachedOrders.filter(o => o.items.some(i => i.size !== 'no-size')).length} with sizes)`, 
        'success'
      );
      
      // Broadcast data to other tabs
      // broadcastOrderData(); // TODO: Define this function if needed
      
    } catch (error) {
      console.error('[Content] Error extracting from API cache:', error);
      progress.remove();
      overlayUI.showNotification('API extraction failed', 'error');
    }
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
    
    const progress = overlayUI.showProgress('Extracting orders from React data...');
    
    try {
      // Try React data extraction first - this is the most reliable method
      if (window.otterReactDataExtractor) {
        console.log('[Content] Using React data extractor');
        // Enable debug mode to see what's happening
        window.otterReactDataExtractor.enableDebug();
        const reactOrders = await extractFromReact(progress);
        if (reactOrders && reactOrders.length > 0) {
          console.log(`[Content] Successfully extracted ${reactOrders.length} orders from React`);
          reactExtractionSuccessful = true;
          return; // Success, no need for fallback
        }
        console.log('[Content] React extraction failed or returned 0 orders');
      }
      
      // Fallback to API cache if React extraction failed
      if (window.otterOrderCache && window.otterOrderCache.hasOrders()) {
        console.log('[Content] React extraction failed, trying API cache');
        progress.update('Checking API cache...');
        return extractFromAPICache(progress);
      }
      
      // No DOM extraction fallback - it overwrites good React data
      console.log('[Content] No React or API data available');
      progress.remove();
      
      overlayUI.showNotification('No orders found. Try refreshing the page.', 'warning');
      
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
        
        // Skip if React extraction was successful
        if (reactExtractionSuccessful) {
          console.log('React extraction was successful, skipping DOM extraction');
          return;
        }
        
        // Check if we already have orders from React extraction
        const currentBatches = window.batchManager?.getBatches() || [];
        const hasExistingOrders = currentBatches.some(batch => batch.orders && batch.orders.length > 0);
        
        if (hasExistingOrders) {
          console.log('Orders already extracted, skipping re-extraction');
          return;
        }
        
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