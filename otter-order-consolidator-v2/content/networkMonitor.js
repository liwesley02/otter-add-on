class NetworkMonitor {
  constructor() {
    this.apiEndpoints = new Map();
    this.orderDataResponses = [];
    this.isMonitoring = false;
    this.debugMode = false;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.interceptFetch();
    this.interceptXHR();
    console.log('[NetworkMonitor] Started monitoring network requests');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('[NetworkMonitor] Stopped monitoring');
  }

  interceptFetch() {
    const originalFetch = window.fetch;
    const monitor = this;

    window.fetch = async function(...args) {
      const [url, options = {}] = args;
      
      try {
        const response = await originalFetch.apply(this, args);
        
        if (monitor.isMonitoring && monitor.isOtterAPI(url)) {
          const clonedResponse = response.clone();
          
          clonedResponse.json().then(data => {
            monitor.analyzeResponse(url, data, 'fetch');
          }).catch(() => {
            // Not JSON response
          });
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const monitor = this;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._url = url;
      this._method = method;
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      
      if (monitor.isMonitoring && monitor.isOtterAPI(xhr._url)) {
        const originalOnReadyStateChange = xhr.onreadystatechange;
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              monitor.analyzeResponse(xhr._url, data, 'xhr');
            } catch (e) {
              // Not JSON response
            }
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(xhr, arguments);
          }
        };
      }
      
      return originalSend.apply(this, [body]);
    };
  }

  isOtterAPI(url) {
    if (!url) return false;
    const urlStr = url.toString();
    return urlStr.includes('tryotter.com') && 
           (urlStr.includes('/api/') || urlStr.includes('/v1/') || urlStr.includes('/v2/'));
  }

  analyzeResponse(url, data, method) {
    // Check if this looks like order data
    if (this.looksLikeOrderData(data)) {
      const endpoint = this.extractEndpoint(url);
      
      if (!this.apiEndpoints.has(endpoint)) {
        this.apiEndpoints.set(endpoint, {
          url: url,
          method: method,
          sampleData: data,
          timestamp: Date.now()
        });
        
        console.log(`[NetworkMonitor] Found potential order API endpoint: ${endpoint}`);
        
        if (this.debugMode) {
          console.log('Sample data:', data);
        }
      }
      
      // Store the response for later use
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
      'product', 'sku', 'variant', 'option'
    ];
    
    const dataStr = JSON.stringify(data).toLowerCase();
    
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

  exportFindings() {
    const findings = {
      discoveredEndpoints: this.getDiscoveredEndpoints(),
      sampleResponses: this.orderDataResponses.slice(-5), // Last 5 responses
      timestamp: new Date().toISOString()
    };
    
    console.log('[NetworkMonitor] API Findings:', findings);
    return findings;
  }
}

// Create global instance
window.otterNetworkMonitor = new NetworkMonitor();