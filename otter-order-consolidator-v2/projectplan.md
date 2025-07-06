# Otter Order Consolidator - Project Plan

## Project Overview
A Chrome extension that consolidates live orders from app.tryotter.com, batches identical items (including size/modifiers), and organizes them into waves for efficient kitchen operations.

## Architecture

### Core Components
1. **Content Scripts**
   - `content.js` - Main orchestrator
   - `orderExtractor.js` - DOM parsing and order extraction
   - `overlay.js` - Sidebar UI management

2. **Business Logic**
   - `itemMatcher.js` - Item comparison with modifier support
   - `orderBatcher.js` - Groups identical items
   - `categoryManager.js` - Food categorization
   - `waveManager.js` - Wave creation and management

3. **Background Service**
   - `background.js` - Extension lifecycle and storage

4. **UI Components**
   - Sidebar overlay with categories
   - Popup settings interface
   - Real-time notifications

## Implementation Phases

### Phase 1: Core Functionality ✅
- [x] Basic Chrome extension structure
- [x] Order extraction from Otter dashboard
- [x] Item batching with size/modifier support
- [x] Category-based organization
- [x] Wave management system

### Phase 2: Real-time Updates ✅
- [x] Enhanced MutationObserver for new order detection
- [x] Incremental extraction (only new orders)
- [x] Live UI updates without page refresh
- [x] NEW order badges and notifications

### Phase 3: Size-First & Time-Based Waves ✅
- [x] Size as primary grouping (Large, Medium, Small, No Size)
- [x] Protein-based categorization (Steak, Salmon, Crispy Chicken, etc.)
- [x] Urban Bowl handling with rice substitutions
- [x] Time-based wave assignment (order age determines wave)
- [x] Automatic wave distribution based on wait time
- [x] Wave urgency indicators and timers
- [x] Bulk wave processing with item display
- [x] Automatic order aging with 30-second refresh
- [x] Visual notifications when orders become urgent
- [x] Confirmation dialogs showing exact items before sending waves

### Phase 4: Kitchen Integration
- [ ] Kitchen display mode
- [ ] Order completion tracking
- [ ] Prep time estimates
- [ ] Rush hour predictions

## Technical Specifications

### Order Extraction Flow
1. **Initial Load**
   - Find all `[data-testid="order-row"]` elements
   - Click each row to open detail modal
   - Extract items with sizes and modifiers
   - Close modal and process next order

2. **Real-time Monitoring**
   - MutationObserver on order list container
   - Detect new order rows added to DOM
   - Extract only unprocessed orders
   - Update batches incrementally

### Data Structure
```javascript
{
  order: {
    id: "order_number_customer",
    number: "#E62C792E",
    customerName: "John D.",
    platform: "DoorDash",
    waitTime: 19, // minutes since order placed
    timestamp: 1701234567890,
    items: [{
      name: "Grilled Steak Rice Bowl (Sauce: Sweet Sriracha Aioli)",
      baseName: "Grilled Steak Rice Bowl",
      size: "Small",
      modifiers: ["Sauce: Sweet Sriracha Aioli", "Side: Crispy Pork Dumplings ($6.95)"],
      quantity: 1,
      price: 11.95,
      category: "steakDishes",
      isUrbanBowl: false,
      riceSubstitution: null
    }]
  }
}
```

### Wave Structure
```javascript
{
  wave: {
    id: "wave_timestamp_random",
    number: 1,
    name: "Wave 1",
    timeRange: { min: 15, max: Infinity, urgency: "urgent" },
    items: Map<itemKey, {
      name: string,
      baseName: string,
      size: string,
      category: string,
      totalQuantity: number,
      orderIds: Array<orderId>
    }>,
    orders: Map<orderId, orderData>, // Full order objects
    capacity: 10, // configurable
    status: "pending" | "sent" | "completed"
  }
}
```

### Time-Based Wave Configuration
- **Wave 1 (URGENT)**: 15+ minutes old (past 8.5 min prep time target)
- **Wave 2 (WARNING)**: 8-15 minutes old (approaching target)
- **Wave 3 (NORMAL)**: 0-8 minutes old (within prep time)

## User Workflows

### Restaurant Staff Flow
1. Open Otter dashboard
2. Extension loads automatically
3. View consolidated items by category
4. Add items to current wave
5. Send wave when ready or let auto-wave handle it
6. Start preparing batched items

### Configuration Flow
1. Click extension icon
2. Set wave capacity (default: 10 items)
3. Configure auto-wave interval
4. Enable/disable notifications
5. View statistics

## Performance Considerations
- Debounce MutationObserver callbacks (500ms)
- Process orders sequentially to avoid UI overload
- Cache extracted order data
- Incremental updates instead of full refresh
- Limit modal open time to prevent blocking

## Future Enhancements
1. **Multi-location Support**
   - Location-based filtering
   - Cross-location analytics

2. **Advanced Analytics**
   - Popular item tracking
   - Peak hour analysis
   - Prep time optimization

3. **Integration Options**
   - Kitchen display system API
   - POS system integration
   - Inventory management sync

## Development Guidelines
1. Always preserve existing order data when updating
2. Handle modal close failures gracefully
3. Maintain backward compatibility with Otter updates
4. Test with high-volume order scenarios
5. Ensure accessibility compliance

## Testing Checklist
- [ ] New order detection within 2 seconds
- [ ] Correct item batching with modifiers
- [ ] Wave capacity limits enforced
- [ ] UI updates without flicker
- [ ] Modal handling across all order types
- [ ] Performance with 50+ active orders
- [ ] Extension recovery from errors