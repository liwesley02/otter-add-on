// Test script for prep time tracking functionality
// Run this in the browser console while on app.tryotter.com with the extension loaded

// Test 1: Check if prep time tracker is initialized
console.log('=== Prep Time Tracker Test ===');
console.log('1. Checking if PrepTimeTracker is loaded...');
if (window.otterPrepTimeTracker) {
  console.log('✅ PrepTimeTracker is initialized');
  
  // Test 2: Check current statistics
  console.log('\n2. Current statistics:');
  const stats = window.otterPrepTimeTracker.getStatistics();
  console.log('- Last hour average:', stats.lastHour);
  console.log('- Today average:', stats.today);
  console.log('- Total orders tracked:', stats.totalOrdersTracked);
  console.log('- Peak hours:', stats.peakHours);
  
  // Test 3: Simulate order completion
  console.log('\n3. Simulating order completion...');
  const testOrderId = 'TEST_' + Date.now();
  const orderedAt = new Date(Date.now() - 20 * 60000); // 20 minutes ago
  const completedAt = new Date();
  
  window.otterPrepTimeTracker.trackOrderCompletion(testOrderId, orderedAt, completedAt);
  console.log('✅ Test order tracked with 20 minute prep time');
  
  // Test 4: Verify the order was tracked
  const newStats = window.otterPrepTimeTracker.getStatistics();
  console.log('\n4. Updated statistics:');
  console.log('- Last hour average:', newStats.lastHour);
  console.log('- Today average:', newStats.today);
  console.log('- Total orders tracked:', newStats.totalOrdersTracked);
  
  // Test 5: Check UI updates
  console.log('\n5. Checking UI elements...');
  const hourElement = document.querySelector('.prep-time-hour');
  const todayElement = document.querySelector('.prep-time-today');
  
  if (hourElement && todayElement) {
    console.log('✅ Prep time UI elements found');
    console.log('- Hour display:', hourElement.textContent);
    console.log('- Today display:', todayElement.textContent);
  } else {
    console.log('❌ Prep time UI elements not found');
  }
  
  // Test 6: Check batch urgency with prep time
  console.log('\n6. Checking batch urgency calculations...');
  if (window.otterOverlayUI && window.otterOverlayUI.batchManager) {
    const batches = window.otterOverlayUI.batchManager.batches;
    batches.forEach((batch, index) => {
      const urgency = window.otterOverlayUI.batchManager.getBatchUrgency(batch);
      console.log(`- Batch ${index + 1} urgency: ${urgency}`);
    });
  }
  
  // Test 7: Check order completion tracking
  console.log('\n7. Testing automatic order completion tracking...');
  console.log('When orders disappear from the list, they should be automatically tracked.');
  console.log('Check the console for messages like:');
  console.log('[BatchManager] Order XXX auto-completed, prep time tracked');
  
  // Test 8: Export prep time data
  console.log('\n8. Exporting prep time data...');
  const exportData = window.otterPrepTimeTracker.exportData();
  console.log('Exported data:', exportData);
  
  console.log('\n=== Test Complete ===');
  console.log('Monitor the prep time displays in the header as orders complete.');
  console.log('Late orders should show with orange badges and ⚠️ indicators.');
  
} else {
  console.log('❌ PrepTimeTracker is NOT initialized');
  console.log('Make sure the extension is loaded and you are on app.tryotter.com');
}

// Helper function to manually mark an order as completed (for testing)
window.testMarkOrderCompleted = function(orderId) {
  if (window.otterOverlayUI && window.otterOverlayUI.batchManager) {
    window.otterOverlayUI.batchManager.markOrderCompleted(orderId);
    console.log(`Order ${orderId} marked as completed`);
  } else {
    console.log('BatchManager not available');
  }
};

console.log('\nTip: Use window.testMarkOrderCompleted("ORDER_ID") to manually mark an order as completed');