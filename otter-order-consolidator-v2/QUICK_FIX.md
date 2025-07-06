# Quick Fix Instructions

## To Extract Orders Immediately

1. **Open Chrome DevTools** (F12) on the Otter orders page
2. **Copy the entire contents** of `extract-orders-helper.js`
3. **Paste it into the Console** tab and press Enter
4. The script will:
   - Find all orders on the page
   - Click each one to get details (including sizes)
   - Extract all items with their modifiers
   - Display batched results in the console

## Understanding the Extension Issue

The extension is working but may need to:
1. Be refreshed after loading the page
2. Have the sidebar toggled visible (Ctrl+Shift+O)
3. Click the refresh button (🔄) in the sidebar

## Manual Testing Steps

1. **Check if extension loaded**:
   ```javascript
   // In console, type:
   console.log(document.querySelector('#otter-consolidator-toggle'));
   ```
   If this returns `null`, the extension didn't load properly.

2. **Force extension initialization**:
   ```javascript
   // If extension elements exist but aren't working:
   if (window.overlayUI) {
     window.overlayUI.extractAndRefreshDetailed();
   }
   ```

3. **Check for errors**:
   - Look in the console for any red error messages
   - Check if you see "OTTER EXTENSION LOADED" message

## If Extension Still Doesn't Work

The order extraction helper script will give you the same functionality:
- It extracts all orders
- Groups items by name and size
- Shows total quantities needed

This can be used as a temporary solution while debugging the extension.