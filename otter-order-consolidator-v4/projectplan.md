# Project Plan - Otter Order Consolidator v3

## Project Overview
A Chrome extension for consolidating and managing orders from the Otter (app.tryotter.com) restaurant management platform. The extension extracts order data using React Fiber inspection, categorizes items hierarchically, and provides a kitchen-friendly interface for order management.

## Architecture

### Chrome Extension Structure (Manifest V3)
```
├── manifest.json          # Extension configuration
├── background/
│   └── service-worker.js  # Background script
├── content/
│   ├── content.js         # Main content script
│   ├── pageContextExtractor.js  # Injected into page context
│   ├── reactDataExtractor.js    # React data extraction
│   ├── overlay.js         # UI overlay management
│   └── styles.css         # Extension styles
├── components/
│   ├── categoryManager.js # Item categorization logic
│   ├── orderBatcher.js    # Order batching logic
│   └── batchManager.js    # Batch/wave management
└── popup/
    ├── popup.html         # Extension popup
    └── popup.js           # Popup logic
```

### Key Components

#### 1. React Data Extraction
- **pageContextExtractor.js**: Runs in page context to access React Fiber
- **reactDataExtractor.js**: Manages extraction and processes order data
- Uses CustomEvent for communication between contexts
- Extracts from `memoizedProps.order` property

#### 2. Categorization System (Size-First Hierarchy)
**Top Level Categories (all at same hierarchy):**
- Large, Medium, Small (with rice substitution variants)
- Urban Bowls
- Appetizers, Dumplings, Desserts, Drinks, Sides
- Other

**Hierarchical Structure:**
- Size Categories → Protein Type → Sauce Variant
- Urban Bowls → Rice Type → Protein → Sauce

#### 3. Modifier Handling
**Integrated Modifiers (part of main item):**
- Size selections
- Urban Bowl components (dumplings, rice substitutions)
- Sauces that go ON items (steak/salmon)

**Separate Items (upsells):**
- "Add a Dessert" items
- "Add a Drink" items
- "Side Addition" items

## Implementation Status

### ✅ Phase 1: Core Functionality
- [x] Chrome extension structure (Manifest V3)
- [x] Order extraction from Otter dashboard
- [x] React Fiber data extraction
- [x] Item batching with size/modifier support
- [x] Category-based organization
- [x] Wave management system

### ✅ Phase 2: Real-time Updates
- [x] MutationObserver for new order detection
- [x] Incremental extraction (only new orders)
- [x] Live UI updates without page refresh
- [x] NEW order badges and notifications
- [x] React-based extraction (replaced DOM scraping)

### ✅ Phase 3: Size-First & Advanced Features
- [x] Size as primary grouping (Large, Medium, Small, No Size)
- [x] Protein-based subcategorization
- [x] Urban Bowl handling with rice substitutions
- [x] Time-based wave assignment
- [x] Automatic wave distribution based on wait time
- [x] Wave urgency indicators
- [x] Upsell item separation (desserts, drinks, sides)

### 🚧 Phase 4: Kitchen Integration
- [ ] Kitchen display mode
- [ ] Order completion tracking
- [ ] Prep time estimates
- [ ] Rush hour predictions

## Technical Specifications

### Order Extraction Flow
1. **React Fiber Extraction**
   - Inject pageContextExtractor.js into page context
   - Traverse React Fiber tree to find order data
   - Extract from `memoizedProps.order` property
   - Send data via CustomEvent to content script

2. **Data Processing**
   - Parse customerOrder structure
   - Extract items with modifiers
   - Identify upsell items vs integrated modifiers
   - Categorize based on size-first hierarchy

### Data Structures

#### Order Data
```javascript
{
  id: "order_123",
  customerName: "John D.",
  orderNumber: "#E62C792E",
  waitTime: 15,
  items: [{
    name: "Crispy Chipotle Aioli Chicken Rice Bowl",
    size: "large",
    quantity: 1,
    price: 14.95,
    modifiers: {},
    categoryInfo: {
      topCategory: "large",
      subCategory: "crispy-chicken",
      sauce: "Chipotle Aioli",
      displayCategory: "Large > Crispy Chicken > Chipotle Aioli"
    }
  }]
}
```

#### Urban Bowl Structure
```javascript
{
  name: "Crispy Garlic Sesame Fusion Chicken Urban Bowl",
  size: "urban",
  modifiers: {
    riceSubstitution: "Garlic Butter Fried Rice",
    dumplingChoice: "Pork Dumplings"
  },
  categoryInfo: {
    topCategory: "urban-bowls",
    subCategory: "fried-rice",
    displayCategory: "Urban Bowls > Garlic Butter Fried Rice > Crispy Chicken > Garlic Sesame Fusion"
  }
}
```

## Key Technical Decisions

### Why React Fiber Inspection?
- Otter uses React with dynamic class names
- DOM scraping proved unreliable
- React Fiber provides stable data structure
- Direct access to order data via memoizedProps

### Why Size-First Categorization?
- Kitchen operations prioritize by preparation size
- Matches restaurant workflow patterns
- Simplifies batch preparation
- Clear visual hierarchy for staff

### Why Separate Upsell Items?
- Kitchen needs to see all ordered items
- Upsells require different preparation
- Prevents missing items in orders
- Clear distinction between integrated vs separate items

## Deployment & Testing

### Development Setup
```bash
# Load unpacked extension
1. Navigate to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension directory
```

### Testing Checklist
- [x] React data extraction works
- [x] Size categorization accurate
- [x] Urban Bowl modifiers handled
- [x] Upsell items appear separately
- [x] Real-time order updates
- [x] UI responsive and clear
- [ ] Performance with 50+ orders
- [ ] Error recovery mechanisms

### Production Deployment
1. Minify JavaScript files
2. Optimize assets
3. Create .crx package
4. Submit to Chrome Web Store
5. Monitor user feedback

## Future Enhancements

### Short Term
- API integration (when available)
- WebSocket monitoring
- Custom category configuration
- Export functionality

### Long Term
- Multi-location support
- Analytics dashboard
- Kitchen performance metrics
- Integration with POS systems

## Git Repository
https://github.com/liwesley02/otterconsolidator.git

## Project Timeline
- **Initial Development**: Started with DOM-based extraction
- **React Migration**: Moved to React Fiber inspection for reliability
- **Size-First Refactor**: Reorganized categorization for kitchen workflow
- **Upsell Handling**: Added proper separation of upsell items
- **Current Status**: Ready for production testing