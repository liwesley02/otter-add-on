/**
 * Mock API Server for testing Chrome Extension integration
 * This simulates the Python FastAPI server for testing purposes
 */

const http = require('http');
const WebSocket = require('ws');
const url = require('url');

// Mock data
const mockUsers = {
  'test@restaurant.com': {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@restaurant.com',
    password: 'testpassword123', // In real app, this would be hashed
    restaurant_id: '456e7890-e89b-12d3-a456-426614174000',
    restaurant_name: 'Test Restaurant',
    role: 'owner'
  }
};

const mockOrders = [];
let orderIdCounter = 1;

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
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
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const user = mockUsers[data.email];
        
        if (user && user.password === data.password) {
          // Generate mock JWT token
          const token = Buffer.from(JSON.stringify({
            user_id: user.id,
            email: user.email,
            restaurant_id: user.restaurant_id,
            exp: Date.now() + 3600000 // 1 hour
          })).toString('base64');
          
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
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ detail: 'Invalid credentials' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Invalid request' }));
      }
    });
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
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const orderData = JSON.parse(body);
        const token = authHeader.substring(7);
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        
        // Create order
        const order = {
          id: orderIdCounter++,
          restaurant_id: tokenData.restaurant_id,
          ...orderData,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockOrders.push(order);
        
        // Broadcast to WebSocket clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && client.restaurantId === tokenData.restaurant_id) {
            client.send(JSON.stringify({
              type: 'order_update',
              data: order
            }));
          }
        });
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(order));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Invalid request: ' + error.message }));
      }
    });
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
    
    try {
      const token = authHeader.substring(7);
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      const restaurantOrders = mockOrders.filter(o => 
        o.restaurant_id === tokenData.restaurant_id && 
        o.status !== 'completed'
      );
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(restaurantOrders));
    } catch (error) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Invalid token' }));
    }
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ detail: 'Not found' }));
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const token = parsedUrl.query.token;
  
  if (!token) {
    ws.close(1008, 'Missing token');
    return;
  }
  
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    ws.restaurantId = tokenData.restaurant_id;
    
    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection',
      data: {
        message: 'Connected to order updates',
        restaurant_id: tokenData.restaurant_id
      }
    }));
    
    console.log(`WebSocket client connected for restaurant ${tokenData.restaurant_id}`);
    
    // Handle ping/pong
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log(`WebSocket client disconnected for restaurant ${ws.restaurantId}`);
    });
    
  } catch (error) {
    ws.close(1008, 'Invalid token');
  }
});

// Start server
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log('\nTest credentials:');
  console.log('Email: test@restaurant.com');
  console.log('Password: testpassword123');
  console.log('\nEndpoints:');
  console.log('- GET  /health');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/orders/');
  console.log('- GET  /api/orders/active');
  console.log('- WS   /ws/orders?token=<token>');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down mock server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});