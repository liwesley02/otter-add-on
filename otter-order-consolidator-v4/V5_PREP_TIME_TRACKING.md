# Otter Order Consolidator V5 - Prep Time Tracking

## Overview
Version 5.0.0 adds intelligent prep time tracking and analytics to the Otter Order Consolidator. This feature automatically tracks how long orders take to prepare and provides real-time insights to improve kitchen efficiency.

## Key Features

### 1. **Automatic Prep Time Tracking**
- Tracks time from order placement to completion
- Stores historical data for 7 days
- Automatic cleanup of old data
- Persists data in Chrome storage

### 2. **Real-Time Statistics Display**
- **Header Stats**: Shows last hour and today's average prep times
- **Batch Estimates**: Displays estimated completion time for each batch
- **Visual Indicators**: Highlights orders running late

### 3. **Smart Order Completion Detection**
- Automatically detects when orders disappear from the list
- Manual completion tracking via markOrderCompleted()
- Calculates prep time from orderedAt timestamp

### 4. **Visual Performance Indicators**
- **Orange badges**: Orders exceeding average prep time
- **Warning icon (⚠️)**: Shows how many minutes over average
- **Batch urgency**: Considers prep time performance
- **Ready indicator**: Shows when orders should be complete

## How It Works

### Data Flow
1. **Order Extraction**: Captures orderedAt timestamp from elapsed time
2. **Completion Detection**: Tracks when orders disappear or are marked complete
3. **Time Calculation**: Computes prep time in minutes
4. **Statistics Update**: Updates averages and displays
5. **Visual Feedback**: Updates UI indicators based on performance

### PrepTimeTracker Component
```javascript
// Core methods
trackOrderCompletion(orderId, orderedAt, completedAt)
getLastHourAverage() // Returns { averageMinutes, orderCount }
getTodayAverage() // Returns { averageMinutes, orderCount }
getTodayHourlyBreakdown() // Returns hourly statistics
getStatistics() // Returns comprehensive stats including peak hours
```

### Integration Points
1. **BatchManager**: Calls prep time tracker on order completion
2. **OverlayUI**: Displays statistics and visual indicators
3. **OrderExtractor**: Ensures orderedAt timestamp is captured

## UI Components

### Header Statistics
- **Avg Prep**: Shows two values
  - Last hour average (green badge)
  - Today's average (green badge)
  - Hover for details (order count)

### Batch Display
- **Est: XXm**: Estimated minutes remaining
- **Ready!**: Shows when prep time exceeded
- **Color coding**:
  - Gray: Normal progress
  - Yellow: Almost ready (<5 min)
  - Green: Should be ready

### Customer Badges
- **Normal**: Standard display
- **Orange pulse**: Running late based on avg prep time
- **⚠️ +Xm**: Shows minutes over average
- **Red**: Severely overdue (15+ minutes)

## Usage Instructions

### For Restaurant Staff
1. **Monitor Header Stats**: Check current performance
2. **Watch Batch Estimates**: See when orders should be ready
3. **Prioritize Late Orders**: Orange badges need attention
4. **Track Improvements**: Compare hourly/daily averages

### For Managers
1. **Identify Peak Hours**: System tracks busiest times
2. **Monitor Performance**: See prep time trends
3. **Set Expectations**: Use averages for customer estimates
4. **Optimize Staffing**: Use data to schedule appropriately

## Testing

### Manual Testing
1. Load extension on app.tryotter.com
2. Watch orders progress through system
3. Check prep time updates every 30 seconds
4. Verify completion tracking when orders disappear

### Console Testing
```javascript
// Run test script
// Copy contents of test-prep-time.js to console

// Manual order completion
window.testMarkOrderCompleted("ORDER_ID")

// Check statistics
window.otterPrepTimeTracker.getStatistics()

// Export data
window.otterPrepTimeTracker.exportData()
```

## Configuration

### Default Settings
- **Update Interval**: 30 seconds
- **Data Retention**: 7 days
- **Urgency Thresholds**:
  - Normal: On track with average
  - Warning: 8+ minutes elapsed
  - Urgent: 15+ minutes or exceeding avg prep time

### Chrome Storage Keys
- `prepTimeData`: Stores completion records
- Updated automatically on each completion

## Benefits

1. **Improved Efficiency**: Know exactly when orders should be ready
2. **Better Communication**: Accurate estimates for customers
3. **Performance Tracking**: Historical data for analysis
4. **Proactive Management**: Identify delays before complaints
5. **Data-Driven Decisions**: Optimize kitchen operations

## Technical Details

### Data Structure
```javascript
{
  orderId: string,
  orderedAt: ISO timestamp,
  completedAt: ISO timestamp,
  prepTimeMinutes: number,
  dayOfWeek: number (0-6),
  hourOfDay: number (0-23)
}
```

### Performance Considerations
- Minimal memory footprint
- Efficient data cleanup
- No impact on order processing
- Asynchronous storage operations

## Future Enhancements

1. **Predictive Analytics**: ML-based prep time predictions
2. **Item-Level Tracking**: Track prep times by menu item
3. **Staff Performance**: Individual cook metrics
4. **API Integration**: Send data to restaurant analytics
5. **Custom Alerts**: Configurable thresholds and notifications

## Troubleshooting

### Prep times not showing
- Check if orders have orderedAt timestamps
- Verify prepTimeTracker is initialized
- Look for console errors

### Inaccurate estimates
- Allow system to collect more data
- Check if orders are being properly completed
- Verify elapsed time extraction

### Visual indicators not updating
- Check CSS styles are loaded
- Verify updatePrepTimeStats is called
- Look for JavaScript errors

## Version History

### V5.0.0 (Current)
- Added prep time tracking foundation
- Integrated with order completion flow
- Added visual performance indicators
- Created statistics display
- Implemented batch completion estimates

This feature provides valuable insights into kitchen performance and helps restaurants deliver orders on time, every time.