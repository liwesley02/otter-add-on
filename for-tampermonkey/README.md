# Otter Order Consolidator - Tampermonkey Version

This directory contains Tampermonkey-compatible versions of the Otter Order Consolidator for use on Firefox (desktop and mobile).

## Files

- `otter-consolidator-mobile.user.js` - Manually created mobile-optimized version with all features
- `build-userscript.js` - Node.js script to automatically bundle the Chrome extension into a userscript
- `otter-consolidator-bundle.user.js` - Auto-generated bundle (created by build script)

## Features

### Mobile-Optimized Version (`otter-consolidator-mobile.user.js`)
- ✅ Fixed React fiber extraction (correct traversal pattern)
- ✅ Chrome API polyfills (storage, runtime, tabs)
- ✅ CORS handling via GM_xmlhttpRequest
- ✅ Inline batch processing (no background script)
- ✅ Mobile-friendly UI with touch events
- ✅ Responsive design for tablets
- ✅ Embedded label printer HTML
- ✅ API integration with prep time tracking

### Key Differences from Extension

1. **No Background Script**: All logic runs inline in the content script
2. **Single Tab Operation**: Always operates as "leader" (no multi-tab coordination)
3. **CORS Bypass**: Uses GM_xmlhttpRequest for API calls
4. **Storage**: Uses GM_getValue/GM_setValue instead of chrome.storage
5. **Label Printing**: Uses data URLs or blob URLs instead of chrome.runtime.getURL

## Installation

### Desktop Firefox
1. Install Tampermonkey extension from Firefox Add-ons
2. Click on Tampermonkey icon → Create a new script
3. Copy and paste the contents of `otter-consolidator-mobile.user.js`
4. Save (Ctrl+S)
5. Navigate to https://app.tryotter.com and press Ctrl+Shift+O to open overlay

### Mobile Firefox (Android Tablets)
1. Install Firefox for Android
2. Install Tampermonkey from Firefox Add-ons (available on Android)
3. Open Tampermonkey dashboard
4. Tap + to create new script
5. Copy and paste the userscript content
6. Save the script
7. Navigate to Otter dashboard
8. The overlay should work with touch gestures

## Building from Source

To generate a userscript from the Chrome extension:

```bash
cd for-tampermonkey
npm install  # First time only
node build-userscript.js
```

This creates:
- `otter-consolidator-bundle.user.js` - Full version
- `otter-consolidator-bundle.min.user.js` - Minified version

## Testing

### Desktop Testing
1. Open Firefox Developer Tools (F12)
2. Check console for "[Otter TM]" messages
3. Test overlay with Ctrl+Shift+O
4. Verify order extraction works
5. Test batch processing and label printing

### Mobile Testing
1. Use Firefox Remote Debugging or about:debugging
2. Check for touch event handling
3. Verify responsive layout
4. Test label printing (may have limitations)
5. Ensure CORS bypass works for API calls

## Troubleshooting

### React Extraction Issues
- Check if `__reactFiber$` properties exist on DOM elements
- Verify the fiber traversal depth (usually 2 levels up)
- Look for `memoizedProps.order` in the fiber tree

### CORS Issues
- Ensure @connect directives include all API domains
- Check GM_xmlhttpRequest permissions
- Verify API endpoints are accessible

### Mobile-Specific Issues
- Touch events not working: Check event listener attachments
- UI too small: Verify mobile CSS media queries
- Print not working: Mobile browsers have limited print support

## Debug Mode

The script exposes debug utilities via the console:

```javascript
// Access debug interface
otterDebug.overlay    // Overlay UI instance
otterDebug.storage    // Storage utilities
otterDebug.apiClient  // API client
otterDebug.config     // Configuration
otterDebug.version    // Script version
```

## Known Limitations

1. **No Multi-Tab Sync**: Unlike the extension, each tab operates independently
2. **Print Limitations**: Mobile browsers may not support direct printing
3. **Performance**: Large orders may be slower on mobile devices
4. **Background Updates**: No background script means no automatic updates

## Contributing

When making changes:
1. Test on desktop Firefox first
2. Verify mobile compatibility
3. Update version number in userscript header
4. Document any new GM_* API usage
5. Ensure all Chrome APIs have polyfills