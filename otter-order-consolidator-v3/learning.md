# Learning & Insights - Otter Order Consolidator

## Key Learnings from Development

### 1. React Fiber Extraction
**Problem**: Initial DOM-based extraction was unreliable due to dynamic class names and React's virtual DOM.

**Solution**: Direct React Fiber inspection via injected page context script.

**Key Insights**:
- React stores component data in fiber nodes accessible via `__reactFiber$` properties
- The order data lives in `memoizedProps.order` (not `customerOrder` as initially thought)
- Communication between page context and content script requires CustomEvent messaging
- React readiness must be checked before attempting extraction

### 2. Chrome Extension Architecture (Manifest V3)
**Challenge**: Manifest V3 has stricter security policies than V2.

**Learnings**:
- Cannot use `eval()` or inline scripts
- Service workers replace background pages
- Content scripts cannot directly access page's JavaScript context
- Must inject scripts to access React internals

### 3. Size-First Categorization Design
**Initial Approach**: Category-first (Entrees > Size > Protein)

**Refined Approach**: Size-first (Size > Protein > Sauce)

**Why It Works Better**:
- Matches kitchen workflow (prep by size batches)
- Simplifies visual scanning for staff
- Reduces cognitive load during rush periods
- Treats size variations (e.g., "Large - Fried Rice Substitute") as distinct categories

### 4. Modifier Handling Complexity
**Discovery**: Not all modifiers are created equal.

**Categories Identified**:
1. **Integrated Modifiers** (part of the main item):
   - Size selections
   - Urban Bowl dumplings/rice
   - Sauces ON items (steak/salmon)

2. **Separate Items** (upsells):
   - "Add a Dessert" selections
   - "Add a Drink" selections
   - "Side Addition" selections

**Implementation**: Check `sectionName` in stationOrders to determine modifier type.

### 5. Urban Bowl Special Handling
**Unique Characteristics**:
- Fixed size category ("urban")
- Rice substitution options (White Rice, Fried Rice, Noodles)
- Integrated dumpling choice
- Different from standard Rice Bowls

**Solution**: Treat Urban Bowls as a top-level category with rice type as subcategory.

### 6. Real-Time Order Updates
**Challenge**: Orders appear dynamically without page refresh.

**Solution**:
- MutationObserver on order container
- Debounced updates (500ms)
- Incremental processing (only new orders)
- Maintain processed order ID set

### 7. Error Handling Patterns
**Common Issues**:
- React not ready when extension loads
- Modal close failures
- Network timeouts
- Stale element references

**Best Practices**:
- Retry logic with exponential backoff
- Graceful degradation
- User-visible error notifications
- Automatic recovery attempts

## Technical Gotchas & Solutions

### 1. React Fiber Access Timing
```javascript
// BAD: Immediate access fails
const fiber = element.__reactFiber$xyz;

// GOOD: Check React readiness
function waitForReact() {
  return new Promise(resolve => {
    const check = setInterval(() => {
      if (document.querySelector('[data-testid="order-row"]')?.__reactFiber$) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}
```

### 2. Cross-Context Communication
```javascript
// Page context (can access React)
window.dispatchEvent(new CustomEvent('otter-orders-extracted', {
  detail: { orders: extractedData }
}));

// Content script (receives data)
window.addEventListener('otter-orders-extracted', (event) => {
  processOrders(event.detail.orders);
});
```

### 3. Modifier Section Detection
```javascript
// Critical: Check sectionName to determine modifier behavior
const isUpsell = ['Add a Dessert', 'Add a Drink', 'Side Addition']
  .includes(modifier.sectionName);
```

### 4. Size Extraction Priority
```javascript
// Priority order for size detection:
// 1. Explicit size modifier
// 2. Size in item name
// 3. Urban Bowl → "urban"
// 4. Default → "no-size"
```

## Performance Optimizations

### 1. Batch Processing
- Process orders sequentially, not in parallel
- Prevents UI lockup and modal conflicts
- 500ms delay between order clicks

### 2. Incremental Updates
- Track processed order IDs
- Only extract new orders
- Update existing batches rather than rebuild

### 3. Memory Management
- Clear old order data periodically
- Limit stored order history
- Use WeakMap for DOM element references

### 4. UI Responsiveness
- Debounce mutation callbacks
- Use requestAnimationFrame for UI updates
- Virtual scrolling for large order lists

## Debugging Techniques

### 1. React Fiber Inspection
```javascript
// In Chrome DevTools Console
$0.__reactFiber$ // Select element first
// Navigate through return/child/sibling
// Look for memoizedProps
```

### 2. Event Monitoring
```javascript
// Monitor custom events
window.addEventListener('otter-orders-extracted', console.log);
window.addEventListener('otter-react-extract-orders', console.log);
```

### 3. Extension Debugging
- Use chrome://extensions → Inspect views
- Check both popup and content script consoles
- Monitor network tab for API calls

### 4. State Inspection
```javascript
// Useful debugging globals
window.otterOrderBatcher
window.otterCategoryManager
window.otterReactDataExtractor
```

## Best Practices Established

### 1. Defensive Programming
- Always check for null/undefined
- Verify DOM elements exist before interaction
- Handle all promise rejections

### 2. User Communication
- Clear error messages
- Progress indicators for long operations
- Success confirmations

### 3. Code Organization
- Separate concerns (extraction, categorization, UI)
- Single responsibility per class
- Clear naming conventions

### 4. Testing Strategy
- Manual testing with real Otter data
- Edge case documentation
- Visual regression testing for UI

## Recent Discoveries & Fixes

### 1. No Medium Size
**Discovery**: Restaurant only offers Small and Large sizes, no Medium.
**Fix**: Removed all medium size handling from code.

### 2. Rice Substitutions as Size Modifiers
**Issue**: Items with rice substitutions were falling under "Other" category.
**Solution**: Rice substitutions are appended to size (e.g., "large - garlic butter fried rice substitute").
**Implementation**: Added normalization logic to handle variations in naming.

### 3. Real-Time Order Monitoring
**Feature**: Added MutationObserver to detect when orders change on Otter page.
**Benefits**:
- Automatically detects new orders added to cooking
- Detects when orders move to completed
- Shows notifications for changes
- Triggers auto-refresh

### 4. Debug Mode & Logging
**Added**: Comprehensive debug logging for categorization issues.
**Usage**: Enable debug mode checkbox to see detailed logs in console.
**Helps Identify**:
- Why items are categorized as "Other"
- Size extraction issues
- Rice bowl detection problems

### 5. Performance Optimizations
**Implemented**:
- Category caching (LRU cache)
- Debug mode toggle to reduce console spam
- Debounced DOM change detection
- Cleanup of completed orders

### 6. Batch Controls UI
**Improvement**: Moved batch controls to bottom of overlay per user request.
**Benefits**: Better visibility of order items, controls don't obstruct view.

## Future Considerations

### 1. API Integration
If Otter provides official API:
- Replace React extraction
- Implement webhook listeners
- Real-time synchronization

### 2. Scalability
- Consider IndexedDB for large datasets
- Implement data pagination
- Optimize for hundreds of daily orders

### 3. Maintenance
- Monitor for Otter UI changes
- Automated testing suite
- Version compatibility checks

### 4. User Feedback Integration
- Analytics on usage patterns
- Feature request tracking
- Performance monitoring

### 5. Known Issues to Address
- Categorization of rice bowl items still showing as "Other" (debug logs added to diagnose)
- Need to ensure completed orders are properly filtered out
- Consider adding visual indicators for order age/urgency