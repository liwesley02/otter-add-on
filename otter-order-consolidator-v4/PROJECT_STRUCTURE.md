# Otter Order Consolidator v3 - Project Structure

## Production Files

### Core Extension Files
- `manifest.json` - Extension manifest (Manifest V3)
- `background.js` - Service worker for extension

### Components (Business Logic)
- `components/batchManager.js` - Manages order batches
- `components/categoryManager.js` - Handles item categorization
- `components/itemMatcher.js` - Matches and groups similar items
- `components/orderBatcher.js` - Batches orders together

### Content Scripts (Page Interaction)
- `content/content.js` - Main content script entry point
- `content/overlay.js` - UI overlay rendering
- `content/orderExtractor.js` - Extracts orders from page
- `content/reactDataExtractor.js` - Extracts data from React components
- `content/pageContextExtractor.js` - Runs in page context for React access
- `content/networkMonitor.js` - Monitors network requests
- `content/orderCache.js` - Caches order data
- `content/debugHelper.js` - Debug utilities

### Utilities
- `utils/storage.js` - Chrome storage API wrapper
- `utils/logger.js` - Logging utility
- `utils/htmlEscape.js` - HTML escaping for security
- `utils/categoryCache.js` - Category caching

### Styles
- `styles/overlay.css` - All UI styles

### Documentation
- `README.md` - Project overview and setup
- `SECURITY.md` - Security analysis and best practices
- `ORDER_HIERARCHY.md` - Order categorization logic
- `MENU_FINDINGS.md` - Menu structure documentation
- `CLAUDE.md` - AI assistant guidelines

### Assets
- `icons/` folder - Extension icons (placeholder SVG included)

## File Organization

```
otter-order-consolidator-v3/
├── manifest.json
├── background.js
├── components/
│   ├── batchManager.js
│   ├── categoryManager.js
│   ├── itemMatcher.js
│   └── orderBatcher.js
├── content/
│   ├── content.js
│   ├── overlay.js
│   ├── orderExtractor.js
│   ├── reactDataExtractor.js
│   ├── pageContextExtractor.js
│   ├── networkMonitor.js
│   ├── orderCache.js
│   └── debugHelper.js
├── utils/
│   ├── storage.js
│   ├── logger.js
│   ├── htmlEscape.js
│   └── categoryCache.js
├── styles/
│   └── overlay.css
├── icons/
│   ├── icon.svg
│   └── README.md
└── docs/
    └── [documentation files]
```

## Notes
- All test files have been removed for production
- Icons folder contains placeholder SVG - convert to PNG before publishing
- Popup functionality has been removed (not needed for this extension)