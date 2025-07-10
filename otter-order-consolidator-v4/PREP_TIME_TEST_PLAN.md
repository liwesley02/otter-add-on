# Prep Time Tracking Test Plan

## Overview
This document outlines the test plan for the prep time tracking feature in v4/v5 of the Otter Order Consolidator.

## Test Setup
1. Load the extension on https://app.tryotter.com
2. Open browser developer console (F12)
3. Navigate to the Orders page

## Test Cases

### 1. Initial Load
- [ ] Verify PrepTimeTracker is initialized: `window.otterPrepTimeTracker` should exist
- [ ] Check header displays "Avg Prep: --m --m" when no data available
- [ ] Verify prep time stats section is visible in the header

### 2. Manual Order Completion Testing
Run in console:
```javascript
// Load test script
// Copy contents of test-prep-time.js and paste in console

// Simulate a test order completion
const testOrderId = 'TEST_' + Date.now();
const orderedAt = new Date(Date.now() - 20 * 60000); // 20 minutes ago
const completedAt = new Date();
window.otterPrepTimeTracker.trackOrderCompletion(testOrderId, orderedAt, completedAt);
```

Expected Results:
- [ ] Console shows: "Tracked order TEST_XXX: 20 minutes prep time"
- [ ] Header updates to show "20m" in green badge
- [ ] Hover over badge shows "(1 order)"

### 3. Automatic Order Completion
When orders disappear from the dashboard:
- [ ] Console shows: "[BatchManager] Order XXX auto-completed, prep time tracked"
- [ ] Prep time statistics update automatically
- [ ] Header badges reflect new averages

### 4. Visual Indicators
For orders exceeding average prep time:
- [ ] Customer badges show orange background with pulse animation
- [ ] ⚠️ indicator appears with "+Xm" showing minutes over average
- [ ] Batch shows "Est: Xm" for estimated completion time

### 5. Batch Completion Estimates
- [ ] New batches show "Est: --" when no prep data available
- [ ] With prep data, shows "Est: Xm" based on average prep time
- [ ] When ready, shows "Ready!" in green
- [ ] When almost ready (<5 min), shows yellow background

### 6. Statistics Accuracy
Check statistics in console:
```javascript
window.otterPrepTimeTracker.getStatistics()
```

Verify:
- [ ] lastHour contains correct average and order count
- [ ] today contains correct average and order count
- [ ] hourlyBreakdown shows data by hour
- [ ] peakHours identifies busiest times

### 7. Data Persistence
- [ ] Refresh the page
- [ ] Verify prep time data persists
- [ ] Check console: "[PrepTimeTracker] Loaded X orders from storage"

### 8. Update Intervals
- [ ] Prep time stats update every 30 seconds
- [ ] Can be verified by watching network requests or console logs

### 9. Error Handling
- [ ] If prep time calculation fails, UI doesn't break
- [ ] Console shows error messages but extension continues working

### 10. Edge Cases
- [ ] Orders with no orderedAt timestamp are handled gracefully
- [ ] Orders completed in less than 1 minute show as "1m"
- [ ] Very old orders (>7 days) are automatically cleaned up

## Troubleshooting

### Prep times not showing
1. Check console for errors
2. Verify `window.otterPrepTimeTracker` exists
3. Run test script to manually track an order
4. Check Chrome storage: `chrome.storage.local.get('prepTimeData')`

### Incorrect calculations
1. Export data: `window.otterPrepTimeTracker.exportData()`
2. Verify orderedAt timestamps are correct
3. Check timezone handling

### Visual indicators not working
1. Verify CSS is loaded (check for .prep-time-late class)
2. Check if orders have elapsed time data
3. Verify prep time averages are > 0

## Success Criteria
- Prep time tracking works automatically
- Visual indicators help identify late orders
- Statistics are accurate and update regularly
- Data persists across page refreshes
- No performance impact on order processing