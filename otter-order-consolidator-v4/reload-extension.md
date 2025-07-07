# How to Reload the Extension

After making the fixes to expose the component classes to the window object, you need to reload the extension:

1. **In Chrome, go to:** `chrome://extensions/`

2. **Find "Otter Order Consolidator v3"** in your extensions list

3. **Click the refresh icon** (circular arrow) on the extension card
   - Alternatively, toggle the extension off and on using the switch

4. **Go back to the Otter page** at `https://app.tryotter.com/orders`

5. **Refresh the page** (Ctrl+R or Cmd+R)

The extension should now load properly without the "CategoryManager not loaded" error.

## What was fixed:

Added `window.ClassName = ClassName;` to the end of these files:
- `components/categoryManager.js`
- `components/itemMatcher.js`
- `components/orderBatcher.js`
- `components/batchManager.js`
- `content/orderExtractor.js`
- `content/overlay.js`

This ensures the classes are available in the global window scope when content.js tries to instantiate them.