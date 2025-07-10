# Chrome Extension API Integration Test Guide

## Current Status

✅ **Mock API Server Running** at http://localhost:8000
✅ **Chrome Extension Updated** with API integration
✅ **Authentication UI** implemented
✅ **Order Submission** to API implemented

## Quick Test Steps

### 1. Test the Mock API (Already Running!)

The mock API server is already running. You can verify by opening:
- http://localhost:8000/health

### 2. Load/Reload the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. If extension is already loaded:
   - Click the refresh icon on the extension card
4. If not loaded:
   - Click "Load unpacked"
   - Select folder: `C:\Users\liwes\OneDrive\Desktop\Python Projects\Otter Order Consolidator\otter-order-consolidator-v4`

### 3. Test the Integration

#### Option A: Use the Test Page (Recommended for initial testing)

1. Open the test page in Chrome:
   ```
   file:///C:/Users/liwes/OneDrive/Desktop/Python%20Projects/Otter%20Order%20Consolidator/otter-order-consolidator-v4/test-api-integration.html
   ```

2. Follow the test steps on the page:
   - Click "Test API Connection" (should show ✓ API is running)
   - Enter email: `test@restaurant.com` and password: `testpassword123`
   - Click "Test Login" (should show success)
   - Click "Submit Test Order" (should create order)

#### Option B: Test on Otter Website

1. Go to https://app.tryotter.com/orders
2. Wait for the extension to load (you'll see the overlay on the right)
3. Look for the "Login to KDS" button in the extension header
4. Click it and login with:
   - Email: `test@restaurant.com`
   - Password: `testpassword123`
5. After login, you should see a green "Connected" status
6. When orders are extracted, check the browser console (F12) for:
   ```
   [Content] Sending orders to API...
   [Content] Orders sent to API
   ```

### 4. Verify Order Submission

Check the mock server terminal output. You should see:
```
2025-07-09T01:55:00.000Z - POST /api/auth/login
Login successful for: test@restaurant.com
2025-07-09T01:55:10.000Z - POST /api/orders/
Order created: [order number]
```

### 5. Test API Features

From the browser console (F12) on the Otter page:

```javascript
// Check if API client is loaded
window.otterAPIClient

// Check authentication status
window.otterAPIClient.isAuthenticated()

// Check current restaurant
window.otterAPIClient.restaurantName

// Manually submit a test order
await window.otterAPIClient.submitOrder({
  orderNumber: 'TEST-123',
  customerName: 'Console Test',
  items: [{
    name: 'Test Item',
    quantity: 1,
    price: 9.99
  }]
})
```

## Troubleshooting

### Extension Not Loading
- Check chrome://extensions/ for errors
- Make sure all files are saved
- Try removing and re-adding the extension

### Login Not Working
- Check browser console for errors
- Verify mock server is running: `curl http://localhost:8000/health`
- Check network tab in DevTools for failed requests

### Orders Not Sending
- Make sure you're logged in (green "Connected" status)
- Check console for authentication errors
- Verify orders are being extracted (check overlay shows orders)

### Mock Server Issues
If the mock server stops:
```bash
# Find the process
ps aux | grep simple-mock-api

# Kill it if needed
kill [PID]

# Restart
cd /mnt/c/Users/liwes/OneDrive/Desktop/Python\ Projects/Otter\ Order\ Consolidator/otter-order-consolidator-v4
node simple-mock-api.js
```

## What's Happening Behind the Scenes

1. **Authentication Flow**:
   - User clicks "Login to KDS"
   - Credentials sent to mock API
   - API returns JWT token
   - Token stored in Chrome storage
   - WebSocket connection attempted (mock returns 426 Upgrade Required)

2. **Order Submission Flow**:
   - Orders extracted from Otter page
   - For each order, API client sends POST to /api/orders/
   - Mock server logs the order
   - Order saved with restaurant_id from JWT token

3. **Security**:
   - All API calls require JWT token in Authorization header
   - Orders are isolated by restaurant_id
   - Token expires after 1 hour

## Next Steps with Real API

When using the real Python FastAPI server:

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the real server:
   ```bash
   python -m uvicorn src.api.main:app --reload
   ```

3. Create a real user:
   ```bash
   python -m src.cli auth signup
   ```

4. The flow is identical, but orders will be saved to Supabase

## Success Indicators

✅ Mock API health check returns JSON
✅ Login shows green "Connected" status in extension
✅ Console shows "[Content] Orders sent to API"
✅ Mock server logs show order creation
✅ No CORS errors in browser console