/**
 * Simple Mock API Server for testing Chrome Extension integration
 * No external dependencies required - uses only Node.js built-ins
 */

const http = require('http');
const crypto = require('crypto');

// Mock data
const mockUsers = {
  'test@restaurant.com': {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@restaurant.com',
    password: 'testpassword123',
    restaurant_id: '456e7890-e89b-12d3-a456-426614174000',
    restaurant_name: 'Test Restaurant',
    role: 'owner'
  }
};

const mockOrders = [];
let orderIdCounter = 1;

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  try {
    // Health check
    if (path === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy', 
        service: 'mock-otter-kds-api',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Login endpoint
    if (path === '/api/auth/login' && req.method === 'POST') {
      const data = await parseBody(req);
      const user = mockUsers[data.email];
      
      if (user && user.password === data.password) {
        // Generate mock JWT token
        const tokenData = {
          user_id: user.id,
          email: user.email,
          restaurant_id: user.restaurant_id,
          exp: Date.now() + 3600000 // 1 hour
        };
        const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
        
        console.log('Login successful for:', user.email);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          access_token: token,
          token_type: 'bearer',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          user_id: user.id,
          restaurant_id: user.restaurant_id,
          restaurant_name: user.restaurant_name,
          user_role: user.role
        }));
      } else {
        console.log('Login failed for:', data.email);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Invalid credentials' }));
      }
      return;
    }
    
    // Logout endpoint
    if (path === '/api/auth/logout' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Logged out successfully' }));
      return;
    }
    
    // Current user endpoint
    if (path === '/api/auth/me' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Missing authorization' }));
        return;
      }
      
      const token = authHeader.substring(7);
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Find user by ID
      const user = Object.values(mockUsers).find(u => u.id === tokenData.user_id);
      if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: user.id,
          email: user.email,
          name: 'Test User',
          role: user.role,
          restaurant_id: user.restaurant_id,
          restaurant_name: user.restaurant_name
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'User not found' }));
      }
      return;
    }
    
    // Create order endpoint
    if (path === '/api/orders/' && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Missing authorization' }));
        return;
      }
      
      const orderData = await parseBody(req);
      const token = authHeader.substring(7);
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Create order
      const order = {
        id: crypto.randomUUID(),
        restaurant_id: tokenData.restaurant_id,
        ...orderData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockOrders.push(order);
      console.log('Order created:', order.order_number);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(order));
      return;
    }
    
    // Update order status
    if (path.match(/^\/api\/orders\/[^\/]+\/status$/) && req.method === 'PATCH') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Missing authorization' }));
        return;
      }
      
      const orderId = path.split('/')[3];
      const data = await parseBody(req);
      const order = mockOrders.find(o => o.id === orderId);
      
      if (order) {
        order.status = data.status;
        order.updated_at = new Date().toISOString();
        if (data.notes) order.notes = data.notes;
        
        console.log('Order status updated:', orderId, data.status);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(order));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Order not found' }));
      }
      return;
    }
    
    // Get active orders
    if (path === '/api/orders/active' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Missing authorization' }));
        return;
      }
      
      const token = authHeader.substring(7);
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      const restaurantOrders = mockOrders.filter(o => 
        o.restaurant_id === tokenData.restaurant_id && 
        o.status !== 'completed' && 
        o.status !== 'cancelled'
      );
      
      console.log(`Returning ${restaurantOrders.length} active orders`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(restaurantOrders));
      return;
    }
    
    // Create batch endpoint
    if (path === '/api/orders/batch' && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Missing authorization' }));
        return;
      }
      
      const data = await parseBody(req);
      const batch = {
        batch_id: crypto.randomUUID(),
        order_ids: data.order_ids,
        batch_name: data.batch_name,
        notes: data.notes,
        created_at: new Date().toISOString()
      };
      
      console.log('Batch created:', batch.batch_name);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: batch }));
      return;
    }
    
    // Mock WebSocket endpoint (returns upgrade required)
    if (path === '/ws/orders') {
      res.writeHead(426, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        detail: 'WebSocket upgrade required. This mock server supports HTTP only.',
        note: 'Orders are still saved successfully via HTTP API'
      }));
      return;
    }
    
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ detail: 'Not found' }));
    
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ detail: 'Internal server error: ' + error.message }));
  }
});

// Start server
const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║          Mock Otter KDS API Server Running            ║
╚═══════════════════════════════════════════════════════╝

Server URL: http://localhost:${PORT}

Test Credentials:
  Email:    test@restaurant.com
  Password: testpassword123

Available Endpoints:
  GET    /health                  - Health check
  POST   /api/auth/login          - Login
  POST   /api/auth/logout         - Logout  
  GET    /api/auth/me             - Get current user
  POST   /api/orders/             - Create order
  GET    /api/orders/active       - Get active orders
  PATCH  /api/orders/:id/status   - Update order status
  POST   /api/orders/batch        - Create batch

Testing:
  1. Open Chrome and load the extension
  2. Go to https://app.tryotter.com/orders
  3. Click "Login to KDS" and use test credentials
  4. Orders should be sent to this mock server

Or test with: 
  open test-api-integration.html
`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down mock server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});