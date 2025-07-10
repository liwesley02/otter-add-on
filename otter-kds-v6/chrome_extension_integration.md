# Chrome Extension Integration Guide

This guide shows how to update the v4 Chrome extension to send orders to the new Python API.

## 1. Update Configuration

Add to your Chrome extension's config:

```javascript
// config.js
const API_CONFIG = {
  baseUrl: 'http://localhost:8000',  // Change to production URL later
  endpoints: {
    login: '/api/auth/login',
    orders: '/api/orders/',
    activeOrders: '/api/orders/active',
    batch: '/api/orders/batch',
    websocket: 'ws://localhost:8000/ws/orders'
  }
};
```

## 2. Authentication

Update your login flow to get JWT token:

```javascript
// auth.js
async function login(email, password, restaurantId = null) {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`, {
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
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Store token in Chrome storage
    await chrome.storage.local.set({
      authToken: data.access_token,
      tokenExpiry: data.expires_at,
      restaurantId: data.restaurant_id,
      restaurantName: data.restaurant_name,
      userRole: data.user_role
    });

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

## 3. Send Orders to API

Update your order submission:

```javascript
// orderSubmitter.js
async function sendOrderToAPI(orderData) {
  try {
    // Get auth token
    const { authToken } = await chrome.storage.local.get(['authToken']);
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    // Transform order data to API format
    const apiOrder = {
      order_number: orderData.orderNumber,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      order_type: orderData.orderType || 'dine-in',
      platform: 'otter',
      items: orderData.items.map(item => ({
        item_name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        protein_type: item.proteinType,
        sauce: item.sauce,
        size: item.size,
        quantity: item.quantity || 1,
        modifiers: item.modifiers || {},
        special_instructions: item.specialInstructions,
        price: item.price
      })),
      notes: orderData.notes,
      total_amount: orderData.totalAmount,
      metadata: {
        source: 'chrome-extension',
        version: '4.0.0',
        extractedAt: new Date().toISOString()
      }
    };

    // Send to API
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.orders}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiOrder)
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, need to re-login
        await chrome.storage.local.remove(['authToken']);
        throw new Error('Authentication expired');
      }
      throw new Error(`Failed to send order: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Order sent successfully:', result);
    return result;

  } catch (error) {
    console.error('Error sending order to API:', error);
    throw error;
  }
}
```

## 4. Real-time Updates with WebSocket

Add WebSocket connection for real-time updates:

```javascript
// websocketManager.js
class OrderWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.shouldReconnect = true;
  }

  async connect() {
    try {
      const { authToken } = await chrome.storage.local.get(['authToken']);
      if (!authToken) {
        console.error('No auth token for WebSocket');
        return;
      }

      const wsUrl = `${API_CONFIG.endpoints.websocket}?token=${encodeURIComponent(authToken)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.onConnected();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  handleMessage(message) {
    console.log('WebSocket message:', message);
    
    switch (message.type) {
      case 'order_update':
        this.onOrderUpdate(message.data);
        break;
      case 'batch_created':
        this.onBatchCreated(message.data);
        break;
      case 'connection':
        console.log('Connected to restaurant:', message.data.restaurant_id);
        break;
      case 'pong':
        // Heartbeat response
        break;
    }
  }

  onConnected() {
    // Override this method
  }

  onOrderUpdate(order) {
    // Override this method to handle order updates
    console.log('Order updated:', order);
  }

  onBatchCreated(batch) {
    // Override this method to handle batch creation
    console.log('Batch created:', batch);
  }

  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const orderSocket = new OrderWebSocket();
orderSocket.onOrderUpdate = (order) => {
  // Update UI with new order status
  updateOrderDisplay(order);
};
orderSocket.connect();
```

## 5. Update Batch Operations

Update batch creation to use the API:

```javascript
// batchManager.js
async function createBatch(orderIds, batchName) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);
    
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.batch}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_ids: orderIds,
        batch_name: batchName,
        notes: `Created from Chrome extension at ${new Date().toISOString()}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create batch');
    }

    const result = await response.json();
    console.log('Batch created:', result);
    return result;

  } catch (error) {
    console.error('Error creating batch:', error);
    throw error;
  }
}
```

## 6. Update Manifest (if needed)

Ensure your manifest.json allows connection to the API:

```json
{
  "permissions": [
    "http://localhost:8000/*",
    "ws://localhost:8000/*"
  ],
  "host_permissions": [
    "http://localhost:8000/*"
  ]
}
```

## 7. Error Handling

Add proper error handling and retry logic:

```javascript
// apiClient.js
class APIClient {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async request(url, options, retries = 0) {
    try {
      const { authToken } = await chrome.storage.local.get(['authToken']);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 401 && retries < this.maxRetries) {
        // Try to refresh token
        await this.refreshToken();
        return this.request(url, options, retries + 1);
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.request(url, options, retries + 1);
      }
      throw error;
    }
  }

  async refreshToken() {
    // Implement token refresh logic
    const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      await chrome.storage.local.set({
        authToken: data.access_token,
        tokenExpiry: data.expires_at
      });
    }
  }
}
```

## Testing the Integration

1. Start the API server:
   ```bash
   python run_api.py
   ```

2. Open the API documentation:
   - http://localhost:8000/docs

3. Test WebSocket connection:
   - http://localhost:8000/ws/demo

4. Load your Chrome extension and test:
   - Login functionality
   - Order submission
   - Real-time updates
   - Batch creation

## Production Considerations

1. **HTTPS**: Use HTTPS in production
2. **CORS**: Update allowed origins for production domains
3. **Rate Limiting**: Implement rate limiting on the API
4. **Error Tracking**: Add error tracking (e.g., Sentry)
5. **Monitoring**: Add API monitoring and alerts