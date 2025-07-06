console.log('[NetworkMonitor.js] Script loaded at:', new Date().toISOString());

class NetworkMonitor {
  constructor() {
    this.apiEndpoints = new Map();
    this.orderDataResponses = [];
    this.allRequests = []; // Store all requests for debugging
    this.isMonitoring = false;
    this.debugMode = false;
    this.verboseMode = false; // New verbose mode
    this.requestCount = 0;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    console.log('[NetworkMonitor] 🚀 Starting network monitoring...');
    this.isMonitoring = true;
    this.interceptFetch();
    this.interceptXHR();
    console.log('[NetworkMonitor] ✅ Network monitoring active');
    
    // Log initial state
    console.log('[NetworkMonitor] Monitoring state:', {
      isMonitoring: this.isMonitoring,
      fetchIntercepted: typeof window.fetch === 'function' && window.fetch.toString().includes('originalFetch'),
      xhrIntercepted: XMLHttpRequest.prototype.open.toString().includes('_url'),
      timestamp: new Date().toISOString()
    });
    
    // Log every 5 seconds to show we're still monitoring
    setInterval(() => {
      if (this.isMonitoring) {
        console.log(`[NetworkMonitor] 📊 Status: ${this.requestCount} requests captured, ${this.apiEndpoints.size} endpoints found, ${this.orderDataResponses.length} order responses`);
      }
    }, 5000);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('[NetworkMonitor] Stopped monitoring');
  }

  interceptFetch() {
    // Check if already intercepted
    if (window._originalFetch) {
      console.log('[NetworkMonitor] Fetch already intercepted');
      return;
    }
    
    const originalFetch = window.fetch;
    window._originalFetch = originalFetch; // Store reference
    const monitor = this;
    
    console.log('[NetworkMonitor] Intercepting fetch...');
    console.log('[NetworkMonitor] Original fetch:', typeof originalFetch);

    window.fetch = async function(...args) {
      const [url, options = {}] = args;
      
      // ALWAYS log the URL to verify interception is working
      console.log('[NetworkMonitor] 🌐 FETCH:', url);
      
      try {
        const response = await originalFetch.apply(this, args);
        
        if (monitor.isMonitoring) {
          monitor.requestCount++;
          
          // Store request info
          monitor.allRequests.push({ 
            method: options.method || 'GET', 
            url: url, 
            timestamp: Date.now() 
          });
          
          // Process Otter API requests
          if (monitor.isOtterAPI(url)) {
            console.log(`[NetworkMonitor] 📥 Response received from: ${url}`);
            console.log(`[NetworkMonitor] Response status: ${response.status}`);
            console.log(`[NetworkMonitor] Response type: ${response.type}`);
            
            // Clone BEFORE any consumption
            const clonedResponse = response.clone();
            
            // Try to parse as JSON
            clonedResponse.json().then(data => {
              console.log(`[NetworkMonitor] ✅ Successfully parsed JSON from: ${url}`);
              console.log(`[NetworkMonitor] Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
              
              // Log first bit of data for debugging
              if (data) {
                const preview = JSON.stringify(data).substring(0, 200);
                console.log(`[NetworkMonitor] Data preview: ${preview}...`);
              }
              
              // Always analyze api.tryotter.com responses
              monitor.analyzeResponse(url, data, options.method || 'GET');
            }).catch(err => {
              console.log(`[NetworkMonitor] ❌ Failed to parse JSON from: ${url}`);
              console.log(`[NetworkMonitor] Error: ${err.message}`);
              
              // Still store the endpoint even if JSON parsing fails
              monitor.apiEndpoints.set(url, {
                url: url,
                method: options.method || 'GET',
                error: 'JSON parse failed',
                timestamp: Date.now()
              });
            });
          }
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  interceptXHR() {
    // Check if already intercepted
    if (window._originalXHROpen) {
      console.log('[NetworkMonitor] XHR already intercepted');
      return;
    }
    
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    window._originalXHROpen = originalOpen; // Store reference
    window._originalXHRSend = originalSend;
    const monitor = this;
    
    console.log('[NetworkMonitor] Intercepting XMLHttpRequest...');

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._url = url;
      this._method = method;
      
      // Always log in debug mode
      if (monitor.debugMode || monitor.verboseMode) {
        console.log('[NetworkMonitor] XHR.open intercepted:', method, url);
      }
      
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      
      // ALWAYS log XHR requests to verify interception
      console.log('[NetworkMonitor] 🌍 XHR:', xhr._method, xhr._url);
      
      if (monitor.isMonitoring) {
        monitor.requestCount++;
        
        // Store request info
        monitor.allRequests.push({ 
          method: `xhr-${xhr._method}`, 
          url: xhr._url, 
          timestamp: Date.now() 
        });
        
        if (monitor.isOtterAPI(xhr._url)) {
          const originalOnReadyStateChange = xhr.onreadystatechange;
          
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              console.log(`[NetworkMonitor] 📥 XHR Response from: ${xhr._url}`);
              console.log(`[NetworkMonitor] Status: ${xhr.status}, Method: ${xhr._method}`);
              
              if (xhr.status === 200 || xhr.status === 201) {
                try {
                  const responseText = xhr.responseText;
                  console.log(`[NetworkMonitor] Response length: ${responseText.length} chars`);
                  
                  const data = JSON.parse(responseText);
                  console.log(`[NetworkMonitor] ✅ Successfully parsed XHR JSON`);
                  
                  // Log preview
                  const preview = JSON.stringify(data).substring(0, 200);
                  console.log(`[NetworkMonitor] Data preview: ${preview}...`);
                  
                  monitor.analyzeResponse(xhr._url, data, `xhr-${xhr._method}`);
                } catch (e) {
                  console.log(`[NetworkMonitor] ❌ Failed to parse XHR JSON: ${e.message}`);
                  
                  // Store endpoint anyway
                  monitor.apiEndpoints.set(xhr._url, {
                    url: xhr._url,
                    method: `xhr-${xhr._method}`,
                    error: 'JSON parse failed',
                    status: xhr.status,
                    timestamp: Date.now()
                  });
                }
              } else {
                console.log(`[NetworkMonitor] Non-200 status: ${xhr.status}`);
              }
            }
            
            if (originalOnReadyStateChange) {
              originalOnReadyStateChange.apply(xhr, arguments);
            }
          };
        }
      }
      
      return originalSend.apply(this, [body]);
    };
  }

  isOtterAPI(url) {
    if (!url) return false;
    const urlStr = url.toString().toLowerCase();
    
    // Capture ALL tryotter.com subdomains (app, api, rosetta, etc.)
    const isOtter = urlStr.includes('.tryotter.com') || urlStr.includes('://tryotter.com');
    
    if (isOtter) {
      console.log('[NetworkMonitor] 🎯 Capturing tryotter.com request:', url.toString());
      
      // Log URL components for analysis
      try {
        const urlObj = new URL(url);
        console.log('[NetworkMonitor] URL breakdown:', {
          host: urlObj.host,
          pathname: urlObj.pathname,
          search: urlObj.search
        });
        
        // Special logging for API endpoints
        if (urlObj.host === 'api.tryotter.com') {
          console.log('[NetworkMonitor] 🚀 API ENDPOINT DETECTED!');
        }
      } catch (e) {
        // Invalid URL
      }
    }
    
    return isOtter;
  }

  analyzeResponse(url, data, method) {
    const endpoint = this.extractEndpoint(url);
    const urlStr = url.toString();
    
    console.log(`[NetworkMonitor] 📦 Analyzing response from: ${endpoint}`);
    
    // ALWAYS store tryotter.com responses for analysis
    if (urlStr.toLowerCase().includes('tryotter.com')) {
      // Store endpoint info (use full URL as key to differentiate POST/GET)
      const endpointKey = `${method}:${endpoint}`;
      
      this.apiEndpoints.set(endpointKey, {
        url: url,
        endpoint: endpoint,
        method: method,
        sampleData: data,
        timestamp: Date.now(),
        hasOrderData: this.looksLikeOrderData(data)
      });
      
      console.log(`[NetworkMonitor] ✅ Stored endpoint: ${endpointKey}`);
      console.log(`[NetworkMonitor] Total endpoints discovered: ${this.apiEndpoints.size}`);
      
      // Special handling for api.tryotter.com - always analyze deeply
      if (urlStr.includes('api.tryotter.com')) {
        console.log(`[NetworkMonitor] 🔍 Analyzing api.tryotter.com response...`);
        
        // Log data structure for analysis
        if (data && typeof data === 'object') {
          const dataInfo = {
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : undefined,
            keys: Array.isArray(data) ? 'array' : Object.keys(data).slice(0, 20),
            hasOrderIndicators: this.looksLikeOrderData(data)
          };
          console.log('[NetworkMonitor] Response structure:', dataInfo);
          
          // For batch_json endpoint, log the structure
          if (endpoint.includes('batch_json')) {
            console.log('[NetworkMonitor] 🎯 BATCH_JSON endpoint data:', data);
            
            // Check common batch structures
            if (data.batch) console.log('Found data.batch:', data.batch);
            if (data.events) console.log('Found data.events:', data.events);
            if (data.data) console.log('Found data.data:', data.data);
            if (data.payload) console.log('Found data.payload:', data.payload);
          }
        }
      }
    }
    
    // For api.tryotter.com, ALWAYS store and notify
    if (urlStr.includes('api.tryotter.com')) {
      console.log('[NetworkMonitor] 🎯 Storing api.tryotter.com response');
      this.orderDataResponses.push({
        url: url,
        data: data,
        timestamp: Date.now(),
        isApiResponse: true
      });
      
      // ALWAYS notify for api.tryotter.com responses
      this.notifyOrderDataFound(url, data);
    } else if (this.looksLikeOrderData(data)) {
      // For other domains, only store if it looks like order data
      this.orderDataResponses.push({
        url: url,
        data: data,
        timestamp: Date.now()
      });
      
      // Notify extension that we found order data
      this.notifyOrderDataFound(url, data);
    }
  }

  looksLikeOrderData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check for order-like properties - expanded list
    const orderIndicators = [
      'order', 'orders', 'items', 'customer', 'customerName',
      'orderNumber', 'orderId', 'orderItems', 'menuItems',
      'total', 'subtotal', 'status', 'createdAt', 'orderType',
      'lineItems', 'line_items', 'modifiers', 'modifier',
      'size', 'price', 'quantity', 'displayId', 'display_id',
      'product', 'sku', 'variant', 'option',
      // Add more Otter-specific terms
      'receipt', 'restaurant', 'delivery', 'pickup',
      'item_name', 'item_price', 'item_quantity',
      // Add Otter-specific fields we've seen
      'customerOrder', 'customerItemsContainer', 'stationOrders',
      'menuReconciledItemsContainer', 'sectionName', 'entityPath',
      'stationItemDetail', 'modifierCustomerItemIds'
    ];
    
    const dataStr = JSON.stringify(data).toLowerCase();
    
    // Special check for batch_json which might have nested data
    if (data.batch || data.events || data.data) {
      console.log('[NetworkMonitor] Found batch/events/data wrapper, checking nested content...');
      const nestedData = data.batch || data.events || data.data;
      if (this.looksLikeOrderData(nestedData)) return true;
    }
    
    // Check for Otter-specific structures
    if (data.customerOrder || data.customerItemsContainer) {
      console.log('[NetworkMonitor] Found Otter-specific order structure!');
      return true;
    }
    
    // Also check for arrays that might contain orders
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = JSON.stringify(data[0]).toLowerCase();
      const hasOrderIndicators = orderIndicators.some(indicator => 
        firstItem.includes(indicator.toLowerCase())
      );
      if (hasOrderIndicators) return true;
    }
    
    return orderIndicators.some(indicator => dataStr.includes(indicator.toLowerCase()));
  }

  extractEndpoint(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch (e) {
      return url;
    }
  }

  notifyOrderDataFound(url, data) {
    // Send message to background script or content script
    window.dispatchEvent(new CustomEvent('otter-api-order-data', {
      detail: {
        url: url,
        data: data,
        timestamp: Date.now()
      }
    }));
  }

  getDiscoveredEndpoints() {
    return Array.from(this.apiEndpoints.entries()).map(([endpoint, info]) => ({
      endpoint,
      ...info
    }));
  }

  getLatestOrderData() {
    return this.orderDataResponses[this.orderDataResponses.length - 1] || null;
  }

  enableDebugMode() {
    this.debugMode = true;
    console.log('[NetworkMonitor] Debug mode enabled');
  }

  enableVerboseMode() {
    this.verboseMode = true;
    console.log('[NetworkMonitor] Verbose mode enabled - logging all requests');
  }

  disableVerboseMode() {
    this.verboseMode = false;
    console.log('[NetworkMonitor] Verbose mode disabled');
  }

  toggleVerboseMode() {
    this.verboseMode = !this.verboseMode;
    console.log(`[NetworkMonitor] Verbose mode ${this.verboseMode ? 'enabled' : 'disabled'}`);
    return this.verboseMode;
  }

  getAllRequests() {
    return this.allRequests;
  }

  exportFindings() {
    const findings = {
      discoveredEndpoints: this.getDiscoveredEndpoints(),
      sampleResponses: this.orderDataResponses.slice(-5), // Last 5 responses
      allRequestsCount: this.allRequests.length,
      recentRequests: this.allRequests.slice(-20), // Last 20 requests
      timestamp: new Date().toISOString()
    };
    
    console.log('[NetworkMonitor] 📋 API FINDINGS REPORT');
    console.log('='.repeat(50));
    console.log(`Total Requests Captured: ${this.allRequests.length}`);
    console.log(`Discovered Endpoints: ${this.apiEndpoints.size}`);
    console.log(`Order Data Responses: ${this.orderDataResponses.length}`);
    console.log('='.repeat(50));
    
    // List all discovered endpoints
    if (this.apiEndpoints.size > 0) {
      console.log('\n🎯 DISCOVERED ENDPOINTS:');
      this.apiEndpoints.forEach((info, endpoint) => {
        console.log(`  ${endpoint}`);
        console.log(`    Method: ${info.method}`);
        console.log(`    Has Order Data: ${info.hasOrderData || false}`);
        if (info.sampleData) {
          console.log(`    Data Type: ${Array.isArray(info.sampleData) ? 'Array' : 'Object'}`);
        }
      });
    } else {
      console.log('\n⚠️ No endpoints discovered yet!');
      console.log('Try interacting with the page (click orders, refresh, etc.)');
    }
    
    // Group requests by domain for analysis
    const requestsByDomain = {};
    this.allRequests.forEach(req => {
      try {
        const url = new URL(req.url);
        const domain = url.hostname;
        if (!requestsByDomain[domain]) {
          requestsByDomain[domain] = new Set();
        }
        requestsByDomain[domain].add(url.pathname);
      } catch (e) {
        // Invalid URL
      }
    });
    
    console.log('\n🌐 REQUESTS BY DOMAIN:');
    Object.entries(requestsByDomain).forEach(([domain, paths]) => {
      console.log(`  ${domain}: ${paths.size} unique paths`);
      if (domain.includes('tryotter.com')) {
        console.log('    Paths:', Array.from(paths).slice(0, 10).join(', '));
      }
    });
    
    console.log('\n💡 TIP: If you see tryotter.com paths above, we\'re capturing them!');
    console.log('Full findings object:', findings);
    
    return findings;
  }
}

// Create global instance immediately
try {
  console.log('[NetworkMonitor] Creating global instance...');
  window.otterNetworkMonitor = new NetworkMonitor();
  console.log('[NetworkMonitor] Global instance created successfully');
  
  // Start monitoring immediately
  window.otterNetworkMonitor.startMonitoring();
  window.otterNetworkMonitor.enableDebugMode();
  console.log('[NetworkMonitor] Monitoring started automatically');
} catch (error) {
  console.error('[NetworkMonitor] Failed to create instance:', error);
  // Create a stub so other code doesn't crash
  window.otterNetworkMonitor = {
    startMonitoring: () => console.warn('NetworkMonitor not available'),
    stopMonitoring: () => console.warn('NetworkMonitor not available'),
    toggleVerboseMode: () => false,
    exportFindings: () => ({ error: 'NetworkMonitor failed to initialize' }),
    isMonitoring: false,
    error: error.message
  };
}