# React Data Extraction Guide for Otter Orders

## Table of Contents
1. [Overview](#overview)
2. [The Challenge](#the-challenge)
3. [Architecture](#architecture)
4. [Key Concepts](#key-concepts)
5. [Implementation Details](#implementation-details)
6. [Special Cases & Edge Cases](#special-cases--edge-cases)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Future Improvements](#future-improvements)

## Overview

This guide documents the complete approach to extracting order data from Otter's React-based web application. After extensive experimentation and learning, we've developed a robust system that handles the complexities of modern React applications.

## The Challenge

Otter's ordering system presents several unique challenges:

1. **React Virtual DOM**: Order data lives in React's internal structures, not in the DOM
2. **Dynamic Loading**: Orders load asynchronously and update frequently
3. **Complex Data Structure**: Orders contain nested items, modifiers, and special relationships
4. **Security Boundaries**: Chrome extensions run in isolated contexts from the page
5. **Performance**: Need to extract data without impacting user experience

## Architecture

### Three-Layer Approach

```
┌─────────────────────────────────────────────────────────┐
│                    Content Script                        │
│  (reactDataExtractor.js - Extension Context)            │
│  • Manages extraction flow                              │
│  • Handles retries and timeouts                        │
│  • Formats data for extension use                      │
└────────────────────┬────────────────────────────────────┘
                     │ Custom DOM Events
┌────────────────────▼────────────────────────────────────┐
│                 Page Context Script                      │
│  (pageContextExtractor.js - Webpage Context)           │
│  • Direct access to React internals                    │
│  • Traverses React fiber tree                          │
│  • Extracts raw order data                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  React Fiber Tree                        │
│  • Contains all component props and state               │
│  • Accessible via __reactFiber$ properties             │
└─────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Request Phase**:
   ```javascript
   // Content script initiates extraction
   window.dispatchEvent(new CustomEvent('otter-extract-request', {
     detail: { requestId: uniqueId }
   }));
   ```

2. **Extraction Phase**:
   ```javascript
   // Page context accesses React fibers
   const fiber = element.__reactFiber$xxx;
   const orderData = fiber.memoizedProps.order.customerOrder;
   ```

3. **Response Phase**:
   ```javascript
   // Page context sends data back
   window.dispatchEvent(new CustomEvent('otter-extract-response', {
     detail: { requestId, orders, success: true }
   }));
   ```

## Key Concepts

### React Fiber Tree

React uses a fiber tree to represent the component hierarchy. Each fiber node contains:
- `memoizedProps`: The current props passed to the component
- `return`: Parent fiber node
- `child`: First child fiber node
- `sibling`: Next sibling fiber node

### Finding Order Data

Order data is typically located at **depth 2** in the fiber tree:
```
DOM Element (depth 0)
└── Fiber Node (depth 1)
    └── Fiber Node (depth 2) ← Order data here!
        └── memoizedProps.order.customerOrder
```

### Data Structure

```javascript
customerOrder: {
  id: "order-id",
  customerName: "John Doe",
  stationOrders: [
    {
      sectionName: "Rice Bowls",  // ← Determines modifier handling!
      items: [
        {
          id: "item-id",
          name: "Teriyaki Chicken Rice Bowl",
          modifiers: [
            {
              id: "mod-id",
              name: "large",
              groupName: "Size"
            }
          ]
        }
      ]
    }
  ]
}
```

## Implementation Details

### 1. Injection Strategy

```javascript
// Inject page context script once
function injectPageContextScript() {
  if (document.getElementById('otter-page-context-script')) return;
  
  const script = document.createElement('script');
  script.id = 'otter-page-context-script';
  script.textContent = pageContextCode;
  document.documentElement.appendChild(script);
}
```

### 2. React Readiness Check

```javascript
function waitForReact() {
  const orderElements = document.querySelectorAll('[class*="order-card"]');
  for (const element of orderElements) {
    const reactKeys = Object.keys(element).filter(key => 
      key.startsWith('__react')
    );
    if (reactKeys.length > 0) return true;
  }
  return false;
}
```

### 3. Retry Logic with Exponential Backoff

```javascript
const delays = [0, 500, 1000, 2000];
for (let attempt = 0; attempt < delays.length; attempt++) {
  await new Promise(resolve => setTimeout(resolve, delays[attempt]));
  
  const result = await tryExtraction();
  if (result.success) return result;
}
```

### 4. Modifier Classification

The key insight: **`sectionName` determines modifier behavior**!

```javascript
function classifyModifiers(item, sectionName) {
  const integrated = [];
  const separate = [];
  
  for (const modifier of item.modifiers) {
    if (sectionName === 'Meals') {
      // ALL modifiers are separate for meals
      separate.push(modifier);
    } else if (isIntegratedModifier(modifier, sectionName)) {
      integrated.push(modifier);
    } else {
      separate.push(modifier);
    }
  }
  
  return { integrated, separate };
}
```

### 5. Size Extraction Logic

```javascript
function extractSize(item, modifiers, sectionName) {
  // Priority order for size determination
  
  // 1. Urban Bowls are always "urban"
  if (sectionName === 'Urban Bowls') return 'urban';
  
  // 2. Check explicit size modifiers
  const sizeModifier = modifiers.find(m => 
    m.groupName === 'Size' || isKnownSize(m.name)
  );
  if (sizeModifier) return sizeModifier.name;
  
  // 3. Extract from item name
  const sizeMatch = item.name.match(/\b(small|medium|large)\b/i);
  if (sizeMatch) return sizeMatch[1].toLowerCase();
  
  // 4. Default
  return null;
}
```

## Special Cases & Edge Cases

### 1. Urban Bowls
- Always have size "urban"
- Rice substitutions are integrated
- Dumpling choices are integrated
- Different from standard Rice Bowls

### 2. Meal Items
Examples: "Bao Out", "Bowl of Rice Meal"
- **ALL** modifiers become separate items
- No modifiers are integrated
- Each modifier represents a full item

### 3. Rice Substitutions
- Append to size: "large - garlic butter fried rice"
- Only for Rice Bowls, not Urban Bowls
- Affects the size display

### 4. Integrated vs Separate Modifiers

**Integrated** (part of main item):
- Size selections
- Rice substitutions
- Base modifications (no cilantro, etc.)

**Separate** (individual items):
- Drinks
- Desserts
- Side dishes
- Additional proteins

### 5. Missing Data Scenarios
- Orders still loading → Retry with backoff
- React not initialized → Fall back to DOM extraction
- Partial data → Combine with API cache

## Best Practices

### 1. Always Check React Readiness
```javascript
if (!waitForReact()) {
  console.log('React not ready, retrying...');
  return;
}
```

### 2. Use Preview-Only Extraction
Avoid triggering modals:
```javascript
const orders = await extractOrdersFromReact({ previewOnly: true });
```

### 3. Implement Proper Error Handling
```javascript
try {
  const result = await extractWithTimeout(5000);
  if (!result.success) {
    return fallbackToDOMExtraction();
  }
} catch (error) {
  console.error('Extraction failed:', error);
  return { success: false, orders: [] };
}
```

### 4. Cache Processed Orders
```javascript
const processedCache = new Set();
if (processedCache.has(order.id)) {
  continue; // Skip already processed
}
```

### 5. Log for Debugging
```javascript
console.log(`[Otter] Found ${orders.length} orders via React`);
console.log('[Otter] Order structure:', JSON.stringify(order, null, 2));
```

## Troubleshooting

### Common Issues

1. **"Cannot read property 'memoizedProps' of undefined"**
   - React structure changed or not loaded
   - Solution: Add null checks and retry logic

2. **Empty orders array**
   - Orders haven't loaded yet
   - Solution: Implement retry with exponential backoff

3. **Modifiers classified incorrectly**
   - Check `sectionName` in the data
   - Verify modifier classification logic

4. **Performance issues**
   - Too frequent extraction attempts
   - Solution: Debounce extraction calls

### Debug Checklist

- [ ] Is React initialized? Check for `__reactFiber$` properties
- [ ] Are orders loaded? Check DOM for order elements
- [ ] Is page context script injected? Check for script element
- [ ] Are events firing? Add console logs to event handlers
- [ ] Is data structure as expected? Log the raw fiber data

## Future Improvements

### 1. Performance Optimization
- Implement smarter change detection
- Cache fiber references
- Use React DevTools protocol if available

### 2. Robustness
- Add more fallback strategies
- Handle React version changes
- Implement data validation

### 3. Features
- Real-time order updates
- Batch progress tracking
- Historical order analysis

### 4. Maintenance
- Automated testing for React changes
- Version detection and adaptation
- Self-healing extraction logic

## Conclusion

Extracting data from modern React applications requires understanding both React's internals and the specific application's architecture. This guide captures the hard-won knowledge from building a robust extraction system for Otter orders.

Key takeaways:
1. **Context isolation** is the biggest challenge
2. **React fibers** contain all the data we need
3. **sectionName** is crucial for modifier classification
4. **Retry logic** is essential for reliability
5. **Multiple strategies** ensure robustness

With this approach, we can reliably extract complex order data from Otter's React application while maintaining performance and user experience.