// Helper script to extract orders from Otter dashboard
// Paste this into Chrome DevTools console on https://app.tryotter.com/orders

console.log('=== Otter Order Extractor ===');

// Function to extract all visible orders
async function extractAllOrders() {
  const orders = [];
  const orderRows = document.querySelectorAll('[data-testid="order-row"]');
  
  console.log(`Found ${orderRows.length} orders on the page`);
  
  for (let i = 0; i < orderRows.length; i++) {
    const row = orderRows[i];
    console.log(`\nProcessing order ${i + 1}/${orderRows.length}...`);
    
    try {
      // Extract preview data
      const orderNumber = row.querySelector('[data-testid="order-info-subtext"]')?.textContent || 'Unknown';
      const customerName = row.querySelector('.sc-dCesDq.kTVViB > div')?.textContent || 'Unknown';
      const itemCount = row.querySelector('.sc-hGsGDS.iSFqHC')?.textContent || '0';
      const courierTime = row.querySelector('.sc-glPjVa')?.textContent || 'N/A';
      
      console.log(`Order: ${orderNumber} - Customer: ${customerName} - Items: ${itemCount} - Time: ${courierTime}`);
      
      // Click to open details
      row.click();
      
      // Wait for modal to open
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extract detailed items
      const items = [];
      const detailRows = document.querySelectorAll('[data-testid="order-details-receipt-item-row"]');
      
      detailRows.forEach(itemRow => {
        const quantity = itemRow.querySelector('.sc-einZSS')?.textContent || '1';
        const name = itemRow.querySelector('.sc-jsFtja.hSUmFW')?.textContent || 'Unknown Item';
        const price = itemRow.querySelector('.sc-jsFtja.epewNT')?.textContent || '$0';
        
        // Look for size modifier
        let size = 'Regular';
        const itemContainer = itemRow.parentElement;
        const sizeSection = itemContainer?.querySelector('.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA');
        if (sizeSection && sizeSection.textContent.includes('Size Choice')) {
          const sizeValue = sizeSection.parentElement.querySelector('.sc-jsFtja.epewNT');
          if (sizeValue) {
            size = sizeValue.textContent.trim();
          }
        }
        
        items.push({
          quantity: parseInt(quantity) || 1,
          name: name,
          size: size,
          price: price
        });
      });
      
      orders.push({
        orderNumber: orderNumber,
        customerName: customerName,
        courierTime: courierTime,
        items: items
      });
      
      // Close modal
      const closeButton = document.querySelector('button[aria-label="Close"]');
      if (closeButton) {
        closeButton.click();
      } else {
        // Try escape key
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
      }
      
      // Wait before next order
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`Error processing order ${i + 1}:`, error);
    }
  }
  
  return orders;
}

// Function to display results
function displayOrders(orders) {
  console.log('\n=== EXTRACTED ORDERS ===\n');
  
  orders.forEach((order, index) => {
    console.log(`Order ${index + 1}:`);
    console.log(`  Number: ${order.orderNumber}`);
    console.log(`  Customer: ${order.customerName}`);
    console.log(`  Courier: ${order.courierTime}`);
    console.log(`  Items:`);
    order.items.forEach(item => {
      console.log(`    - ${item.quantity}x ${item.name} (${item.size}) - ${item.price}`);
    });
    console.log('');
  });
  
  // Group by item and size
  const itemGroups = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = `${item.name}|${item.size}`;
      if (!itemGroups[key]) {
        itemGroups[key] = {
          name: item.name,
          size: item.size,
          totalQuantity: 0,
          orders: []
        };
      }
      itemGroups[key].totalQuantity += item.quantity;
      itemGroups[key].orders.push(order.customerName);
    });
  });
  
  console.log('=== BATCHED ITEMS ===\n');
  Object.values(itemGroups).forEach(group => {
    console.log(`${group.totalQuantity}x ${group.name} (${group.size})`);
    console.log(`  For: ${group.orders.join(', ')}`);
  });
}

// Run the extraction
console.log('Starting extraction...');
extractAllOrders().then(orders => {
  displayOrders(orders);
  console.log('\nExtraction complete!');
  
  // Store in window for further analysis
  window.extractedOrders = orders;
  console.log('Orders stored in window.extractedOrders');
}).catch(error => {
  console.error('Extraction failed:', error);
});