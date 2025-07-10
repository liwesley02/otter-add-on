# End-to-End Integration Test Guide

## Prerequisites

1. **Install Python dependencies** (run in Windows/WSL with Python environment):
   ```bash
   cd "C:\Users\liwes\OneDrive\Desktop\Python Projects\Otter Order Consolidator\otter-kds-v6"
   pip install -r requirements.txt
   ```

2. **Start the FastAPI server**:
   ```bash
   python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Testing Steps

### 1. Create a Test User

First, use the CLI to create a restaurant and user:

```bash
python -m src.cli auth signup
```

Enter:
- Email: test@restaurant.com
- Password: testpassword123
- Restaurant name: Test Restaurant
- Your name: Test User

### 2. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the folder: `C:\Users\liwes\OneDrive\Desktop\Python Projects\Otter Order Consolidator\otter-order-consolidator-v4`
5. The extension should appear with ID shown

### 3. Test Authentication

1. Go to https://app.tryotter.com/orders
2. You should see:
   - The Otter Order Consolidator overlay on the right
   - A "Login to KDS" button in the header
3. Click "Login to KDS"
4. Enter the credentials:
   - Email: test@restaurant.com
   - Password: testpassword123
5. Click Login

Expected result:
- Login modal closes
- Header shows green "Connected" status
- Console shows: "[OtterAPIClient] WebSocket connected"

### 4. Test Order Extraction and Submission

1. Make sure you're on the orders page with some orders visible
2. The extension should automatically extract orders
3. Check the browser console (F12) for:
   ```
   [Content] Sending orders to API...
   [Content] Orders sent to API
   ```

### 5. Verify in Supabase

1. Go to your Supabase dashboard
2. Navigate to Table Editor → orders
3. You should see the submitted orders with:
   - Correct restaurant_id
   - Order details
   - Status as 'pending'

### 6. Test WebSocket Updates

1. In another browser tab, open the same restaurant account
2. When orders are updated in one tab, the other should receive updates
3. Check console for WebSocket messages

### 7. Test Logout

1. Click the green "Connected" status
2. Click "Logout"
3. Verify:
   - Status changes back to "Login to KDS" button
   - Orders are no longer sent to API

## Troubleshooting

### API Server Issues

Check server logs:
```bash
# If running in terminal, check output directly
# Or check the log file if using nohup:
tail -f api.log
```

Common issues:
- Port 8000 already in use: `lsof -i :8000` and kill the process
- Missing .env file: Make sure .env has correct Supabase credentials
- CORS errors: Check that Chrome extension origin is allowed

### Chrome Extension Issues

1. Check extension errors:
   - Go to chrome://extensions/
   - Click "Details" on the extension
   - Click "Errors" if present

2. Check console errors:
   - Open DevTools (F12) on the Otter page
   - Look for errors in Console tab

3. Verify scripts loaded:
   - In console, type: `window.otterAPIClient`
   - Should return the API client object

### Authentication Issues

1. Verify user exists in Supabase:
   - Check auth.users table
   - Check public.users table

2. Test login directly:
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@restaurant.com", "password": "testpassword123"}'
   ```

## Expected Data Flow

1. User logs in → JWT token stored in Chrome storage
2. Orders extracted from page → Sent to API with auth token
3. API validates token → Stores orders with restaurant_id
4. WebSocket sends updates → Other tabs receive real-time updates
5. Orders displayed in KDS dashboard (future feature)