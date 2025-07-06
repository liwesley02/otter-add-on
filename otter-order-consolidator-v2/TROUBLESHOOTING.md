# Otter Order Consolidator - Troubleshooting Guide

## Common Errors and Solutions

### 1. "this.waveManager.stopAutoWave is not a function"

**Cause**: This error appears to be from a cached version of the extension. The stopAutoWave method has been removed from the code.

**Solution**:
1. Go to `chrome://extensions`
2. Find "Otter Order Consolidator"
3. Click the refresh icon on the extension card
4. Hard refresh the Otter page (Ctrl+Shift+R)
5. If error persists, disable and re-enable the extension

### 2. "Modal close failed after all attempts"

**Cause**: The order details modal is not closing properly when extracting order information.

**Status**: Fixed - The modal close logic has been simplified to:
1. Try Escape key first
2. Try clicking close button
3. Force navigation back to orders page

### 3. "modifierContainers is not defined"

**Status**: Fixed - Variable scope issue resolved.

### 4. "wave.orders.forEach is not a function"

**Status**: Fixed - wave.orders is a Map, not an array. The forEach syntax has been corrected.

### 5. "Error in render: container is not defined"

**Status**: Fixed - Variable scoping issue in error handler resolved.

## Testing the Extension

1. Open the test page: `file:///path/to/otter-order-consolidator/test-load.html`
2. Check for:
   - Red flash when page loads
   - "OTTER EXT LOADED" badge
   - Debug panel (toggle with Ctrl+Shift+D)
   - Console messages

## Debug Mode

Press `Ctrl+Shift+D` to toggle the debug panel which shows:
- Extension status
- Current URL
- Initialization progress
- Any errors encountered

## Manual Extraction

Press `Ctrl+Shift+E` to trigger manual order extraction and debugging.

## If Extension Won't Load

1. Check Chrome DevTools Console for errors
2. Ensure you're on https://app.tryotter.com/orders
3. Try disabling other extensions that might conflict
4. Clear browser cache and cookies for tryotter.com
5. Reinstall the extension

## Reporting Issues

When reporting issues, please include:
1. The error message from the console
2. The URL you're on
3. What you were trying to do
4. Screenshot of the debug panel (Ctrl+Shift+D)