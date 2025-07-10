/**
 * API Client for communicating with Otter KDS Python backend
 */

class OtterAPIClient {
  constructor() {
    // API configuration - will be updated for production
    this.baseUrl = 'http://localhost:8000';
    this.wsUrl = 'ws://localhost:8000';
    
    // Auth state
    this.token = null;
    this.tokenExpiry = null;
    this.restaurantId = null;
    this.restaurantName = null;
    
    // WebSocket connection
    this.ws = null;
    this.wsReconnectInterval = 5000;
    this.wsReconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    // Initialize from storage
    this.loadAuthFromStorage();
  }
  
  /**
   * Load authentication data from Chrome storage
   */
  async loadAuthFromStorage() {
    console.log('[APIClient] Loading auth from storage...');
    try {
      const data = await chrome.storage.local.get(['apiToken', 'tokenExpiry', 'restaurantId', 'restaurantName']);
      
      console.log('[APIClient] Storage data:', {
        hasToken: !!data.apiToken,
        hasExpiry: !!data.tokenExpiry,
        restaurantName: data.restaurantName
      });
      
      this.token = data.apiToken || null;
      this.tokenExpiry = data.tokenExpiry ? new Date(data.tokenExpiry) : null;
      this.restaurantId = data.restaurantId || null;
      this.restaurantName = data.restaurantName || null;
      
      // Check if token is expired
      if (this.tokenExpiry && new Date() > this.tokenExpiry) {
        console.log('[APIClient] Token expired, clearing auth');
        await this.clearAuth();
      } else if (this.token) {
        console.log('[APIClient] Valid token loaded from storage');
      }
    } catch (error) {
      console.error('[APIClient] Error loading auth from storage:', error);
    }
  }
  
  /**
   * Save authentication data to Chrome storage
   */
  async saveAuthToStorage() {
    try {
      await chrome.storage.local.set({
        apiToken: this.token,
        tokenExpiry: this.tokenExpiry?.toISOString(),
        restaurantId: this.restaurantId,
        restaurantName: this.restaurantName
      });
    } catch (error) {
      console.error('Error saving auth to storage:', error);
    }
  }
  
  /**
   * Clear authentication data
   */
  async clearAuth() {
    this.token = null;
    this.tokenExpiry = null;
    this.restaurantId = null;
    this.restaurantName = null;
    await chrome.storage.local.remove(['apiToken', 'tokenExpiry', 'restaurantId', 'restaurantName']);
    
    // Close WebSocket if connected
    if (this.ws) {
      this.ws.close();
    }
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.token && this.tokenExpiry && new Date() < this.tokenExpiry;
  }
  
  /**
   * Login to the API
   */
  async login(email, password, restaurantId = null) {
    console.log('[APIClient] Login attempt for:', email);
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          restaurant_id: restaurantId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[APIClient] Login failed:', error);
        throw new Error(error.detail || 'Login failed');
      }
      
      const data = await response.json();
      console.log('[APIClient] Login successful:', {
        restaurantName: data.restaurant_name,
        hasToken: !!data.access_token
      });
      
      // Store auth data
      this.token = data.access_token;
      this.tokenExpiry = new Date(data.expires_at);
      this.restaurantId = data.restaurant_id;
      this.restaurantName = data.restaurant_name;
      
      await this.saveAuthToStorage();
      console.log('[APIClient] Auth saved to storage');
      
      // Connect WebSocket
      this.connectWebSocket();
      
      return {
        success: true,
        restaurantName: data.restaurant_name,
        userRole: data.user_role
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Logout
   */
  async logout() {
    console.log('[APIClient] Logging out...');
    try {
      if (this.token) {
        // Call logout endpoint (optional, since JWT is stateless)
        await fetch(`${this.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.error('[APIClient] Logout error:', error);
    } finally {
      await this.clearAuth();
      console.log('[APIClient] Auth cleared');
    }
  }
  
  /**
   * Get current user info
   */
  async getCurrentUser() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await this.authenticatedFetch('/api/auth/me');
      return await response.json();
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }
  
  /**
   * Submit an order to the API
   */
  async submitOrder(orderData) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Transform order data to API format
      const apiOrder = {
        order_number: orderData.orderNumber,
        customer_name: orderData.customerName || null,
        customer_phone: orderData.customerPhone || null,
        order_type: orderData.orderType || 'dine-in',
        platform: 'otter',
        items: orderData.items.map(item => ({
          item_name: item.name || item.itemName,
          category: item.category || null,
          subcategory: item.subcategory || null,
          protein_type: item.proteinType || null,
          sauce: item.sauce || null,
          size: item.size || null,
          quantity: parseInt(item.quantity) || 1,
          modifiers: item.modifiers || {},
          special_instructions: item.specialInstructions || null,
          price: parseFloat(item.price) || null
        })),
        notes: orderData.notes || null,
        total_amount: parseFloat(orderData.totalAmount) || null,
        metadata: {
          source: 'chrome-extension',
          version: chrome.runtime.getManifest().version,
          extractedAt: new Date().toISOString(),
          originalData: orderData
        }
      };
      
      const response = await this.authenticatedFetch('/api/orders/', {
        method: 'POST',
        body: JSON.stringify(apiOrder)
      });
      
      const result = await response.json();
      console.log('Order submitted successfully:', result);
      
      // Store order ID mapping for tracking
      await this.storeOrderMapping(orderData.orderNumber, result.id);
      
      return {
        success: true,
        orderId: result.id,
        data: result
      };
      
    } catch (error) {
      console.error('Error submitting order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Submit multiple orders as a batch
   */
  async submitBatch(orders) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    const results = [];
    const errors = [];
    
    // Submit orders individually (could be optimized with batch endpoint)
    for (const order of orders) {
      try {
        const result = await this.submitOrder(order);
        if (result.success) {
          results.push(result);
        } else {
          errors.push({order: order.orderNumber, error: result.error});
        }
      } catch (error) {
        errors.push({order: order.orderNumber, error: error.message});
      }
    }
    
    // Create batch if we have successful orders
    if (results.length > 0) {
      try {
        const orderIds = results.map(r => r.orderId);
        const batchResponse = await this.createBatch(orderIds);
        
        return {
          success: true,
          submitted: results.length,
          errors: errors,
          batchId: batchResponse.data?.batch_id
        };
      } catch (error) {
        console.error('Error creating batch:', error);
        return {
          success: true,
          submitted: results.length,
          errors: errors,
          batchError: error.message
        };
      }
    }
    
    return {
      success: false,
      submitted: 0,
      errors: errors
    };
  }
  
  /**
   * Create a batch from order IDs
   */
  async createBatch(orderIds, batchName = null) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    const response = await this.authenticatedFetch('/api/orders/batch', {
      method: 'POST',
      body: JSON.stringify({
        order_ids: orderIds,
        batch_name: batchName || `Batch-${new Date().toISOString()}`,
        notes: `Created from Chrome extension`
      })
    });
    
    return await response.json();
  }
  
  /**
   * Get active orders
   */
  async getActiveOrders() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    const response = await this.authenticatedFetch('/api/orders/active');
    return await response.json();
  }
  
  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, notes = null) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    const response = await this.authenticatedFetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        notes
      })
    });
    
    return await response.json();
  }
  
  /**
   * Helper method for authenticated fetch requests
   */
  async authenticatedFetch(endpoint, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      await this.clearAuth();
      throw new Error('Authentication expired. Please login again.');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Request failed: ${response.statusText}`);
    }
    
    return response;
  }
  
  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket() {
    if (!this.isAuthenticated()) {
      console.log('Cannot connect WebSocket: not authenticated');
      return;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    const wsUrl = `${this.wsUrl}/ws/orders?token=${encodeURIComponent(this.token)}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.wsReconnectAttempts = 0;
        
        // Notify UI of connection
        this.notifyConnectionStatus(true);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.notifyConnectionStatus(false);
        
        // Attempt reconnection
        if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
          this.wsReconnectAttempts++;
          setTimeout(() => {
            console.log(`Attempting WebSocket reconnection (${this.wsReconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connectWebSocket();
          }, this.wsReconnectInterval);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(message) {
    console.log('WebSocket message:', message);
    
    switch (message.type) {
      case 'connection':
        console.log('WebSocket connection confirmed:', message.data);
        break;
        
      case 'order_update':
        // Notify UI of order update
        this.notifyOrderUpdate(message.data);
        break;
        
      case 'batch_created':
        // Notify UI of new batch
        this.notifyBatchCreated(message.data);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }
  
  /**
   * Send ping to keep connection alive
   */
  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    if (this.ws) {
      this.wsReconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }
  }
  
  /**
   * Store order ID mapping for tracking
   */
  async storeOrderMapping(orderNumber, apiOrderId) {
    try {
      const mappings = await chrome.storage.local.get('orderMappings') || {};
      mappings[orderNumber] = {
        apiOrderId,
        timestamp: new Date().toISOString()
      };
      await chrome.storage.local.set({ orderMappings });
    } catch (error) {
      console.error('Error storing order mapping:', error);
    }
  }
  
  /**
   * Notify UI of connection status change
   */
  notifyConnectionStatus(connected) {
    window.postMessage({
      type: 'OTTER_API_CONNECTION_STATUS',
      connected,
      restaurantName: this.restaurantName
    }, '*');
  }
  
  /**
   * Notify UI of order update
   */
  notifyOrderUpdate(order) {
    window.postMessage({
      type: 'OTTER_ORDER_UPDATE',
      order
    }, '*');
  }
  
  /**
   * Notify UI of batch creation
   */
  notifyBatchCreated(batch) {
    window.postMessage({
      type: 'OTTER_BATCH_CREATED',
      batch
    }, '*');
  }
}

// Create singleton instance
window.otterAPIClient = new OtterAPIClient();

console.log('[OtterAPIClient] Initialized');