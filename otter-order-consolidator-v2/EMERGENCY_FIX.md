# Emergency Fix - Get Orders Working NOW

## The Issue
The extension is having trouble finding orders and closing modals. Here's the immediate fix:

## Quick Fix Script

Open Chrome Console (F12) and paste this:

```javascript
// Emergency order extraction
(function() {
  console.log('=== EMERGENCY ORDER EXTRACTION ===');
  
  // Find orders using the structure from your screenshot
  const orderRows = document.querySelectorAll('.sc-dhHMav.fdVdID');
  console.log(`Found ${orderRows.length} potential order rows`);
  
  if (orderRows.length === 0) {
    // Try alternative
    const alt = document.querySelectorAll('[data-testid="order-row"]');
    console.log(`Alternative found ${alt.length} rows`);
  }
  
  // Extract basic info without clicking
  const orders = [];
  orderRows.forEach((row, index) => {
    try {
      const orderNumber = row.querySelector('[data-testid="order-info-subtext"]')?.textContent || 'Unknown';
      const customerName = row.querySelector('.sc-dCesDq.kTVViB > div')?.textContent || 
                          row.querySelector('.sc-kGCWdC')?.textContent || 'Unknown';
      const itemCount = row.querySelector('.sc-hGsGDS.iSFqHC')?.textContent || '0';
      const itemText = row.querySelector('.sc-aeBcf.fVhLeR > div')?.textContent || '';
      
      console.log(`Order ${index + 1}: ${orderNumber} - ${customerName} - ${itemCount} items`);
      console.log(`  Items: ${itemText}`);
      
      orders.push({
        number: orderNumber,
        customer: customerName,
        itemCount: itemCount,
        items: itemText
      });
    } catch (e) {
      console.log(`Error on row ${index}:`, e.message);
    }
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total orders found: ${orders.length}`);
  
  // Group items
  const itemGroups = {};
  orders.forEach(order => {
    const items = order.items.split('•').map(i => i.trim()).filter(i => i);
    items.forEach(item => {
      itemGroups[item] = (itemGroups[item] || 0) + 1;
    });
  });
  
  console.log('\n=== BATCHED ITEMS ===');
  Object.entries(itemGroups).forEach(([item, count]) => {
    console.log(`${count}x ${item}`);
  });
  
  return orders;
})();
```

## If Extension Context Invalid

The "Extension context invalidated" error means the extension crashed. You need to:

1. Go to chrome://extensions
2. Find "Otter Order Consolidator" 
3. Click the refresh button
4. Return to the Otter page
5. The extension should now load with the fixes

## Alternative: Use the Standalone Script

If the extension keeps failing, use the `extract-orders-helper.js` script I created earlier. It works independently of the extension and will extract all your orders.

## Why This Is Happening

1. The order row HTML structure might have changed
2. The modal closing mechanism is failing
3. The extension is trying to click orders but can't close them

The emergency script above extracts orders WITHOUT clicking, avoiding the modal issue entirely.