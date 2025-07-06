# Otter Order Consolidator - Debugging Guide

## Extension Status
The code analysis shows no critical syntax errors. The extension should be loading correctly.

## How to Test and Debug

### 1. Check Extension Installation
1. Open Chrome and go to `chrome://extensions`
2. Ensure "Developer mode" is enabled (top right)
3. Look for "Otter Order Consolidator" in the list
4. Check that it's enabled and version shows as 1.0.1

### 2. Test the Extension
1. Navigate to https://app.tryotter.com/orders
2. You should see:
   - A red flash when the page loads
   - "OTTER EXT LOADED" badge briefly appears
   - A floating clipboard icon (📋) on the right side
   - A mode indicator button (🔍 or 👁️)

### 3. Check Chrome Console (F12)
Look for these messages:
- `🔴 OTTER EXTENSION LOADED AT: [timestamp]`
- `Tab registration result: {isLeader: true/false}`
- No error messages in red

### 4. Common Issues and Solutions

#### Extension Not Loading
- **Solution**: Reload the extension
  1. Go to chrome://extensions
  2. Click the refresh icon on the extension
  3. Refresh the Otter page

#### "Cannot read properties of undefined" Errors
- **Cause**: The page structure might have changed
- **Solution**: 
  1. Make sure you're on https://app.tryotter.com/orders (not a specific order page)
  2. Wait for the page to fully load before the extension initializes

#### No Orders Showing
- **Solution**: Click the manual refresh button (🔄) in the extension sidebar
- The extension needs to extract orders first before displaying them

### 5. Using the Extension

#### Leader/Follower Mode
- **First tab opened**: Automatically becomes the LEADER (🔍) - extracts orders
- **Additional tabs**: Become FOLLOWERS (👁️) - view orders from the leader
- Click the mode indicator to see which mode you're in

#### Keyboard Shortcuts
- `Ctrl+Shift+O`: Toggle sidebar visibility
- `Ctrl+Shift+N`: Export network findings (for debugging)
- `Ctrl+Shift+E`: Manual order extraction (leader only)

### 6. If Still Having Issues

1. **Clear Extension Cache**:
   - Remove and re-add the extension
   - Or increment version in manifest.json to 1.0.2

2. **Check Permissions**:
   - Ensure the extension has permissions for https://app.tryotter.com/*

3. **Console Debugging**:
   ```javascript
   // In Chrome console, check if components are loaded:
   console.log(typeof ItemMatcher);
   console.log(typeof OrderBatcher);
   console.log(typeof OverlayUI);
   ```

### 7. Expected Behavior
When working correctly:
1. Orders appear in the sidebar organized by waves
2. Items are batched by size (Large, Medium, Small, No Size)
3. Orders are assigned to waves based on wait time:
   - URGENT (red): 15+ minutes
   - WARNING (orange): 8-15 minutes  
   - NORMAL (green): 0-8 minutes
4. The sidebar updates automatically as new orders come in

## Test Without Real Orders
You can test using the included test files:
1. Open `test-load.html` in Chrome
2. Check if the extension loads (red flash, console messages)
3. Use `test.html` to verify all JS files load without errors