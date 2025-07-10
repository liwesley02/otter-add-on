// Debug script for print labels functionality
// Run this in the browser console while on app.tryotter.com with the extension loaded

console.log('=== Print Labels Debug ===');

// Check if components are loaded
console.log('1. Checking components...');
console.log('- BatchLabelPrinter:', typeof BatchLabelPrinter);
console.log('- LabelDataTransformer:', typeof LabelDataTransformer);
console.log('- OverlayUI available:', !!window.otterOverlayUI);

if (window.otterOverlayUI) {
  console.log('- batchLabelPrinter initialized:', !!window.otterOverlayUI.batchLabelPrinter);
  console.log('- batchManager available:', !!window.otterOverlayUI.batchManager);
}

// Check if print buttons exist
console.log('\n2. Checking print buttons...');
const printButtons = document.querySelectorAll('.print-labels-btn');
console.log('- Print buttons found:', printButtons.length);

printButtons.forEach((btn, index) => {
  console.log(`  Button ${index + 1}:`, {
    batchId: btn.dataset.batchId,
    hasClickHandler: btn.onclick !== null || btn.hasAttribute('onclick'),
    element: btn
  });
});

// Check batches
console.log('\n3. Checking batches...');
if (window.otterOverlayUI && window.otterOverlayUI.batchManager) {
  const batches = window.otterOverlayUI.batchManager.batches;
  console.log('- Total batches:', batches.length);
  batches.forEach((batch, index) => {
    console.log(`  Batch ${index + 1}:`, {
      id: batch.id,
      name: batch.name,
      orders: batch.orders.size || Object.keys(batch.orders).length,
      items: batch.items.size || Object.keys(batch.items).length
    });
  });
}

// Test direct print function
console.log('\n4. Testing direct print...');
if (window.otterOverlayUI && window.otterOverlayUI.batchManager && window.otterOverlayUI.batchManager.batches.length > 0) {
  const firstBatch = window.otterOverlayUI.batchManager.batches[0];
  console.log('Attempting to print first batch:', firstBatch.id);
  
  // Create test function
  window.testPrintLabels = async function() {
    try {
      await window.otterOverlayUI.handlePrintLabels(firstBatch.id);
      console.log('Print labels function completed');
    } catch (error) {
      console.error('Error in print labels:', error);
    }
  };
  
  console.log('Run window.testPrintLabels() to test printing');
}

// Check Chrome runtime
console.log('\n5. Checking Chrome runtime...');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('- Chrome runtime available:', true);
  console.log('- Extension ID:', chrome.runtime.id);
  console.log('- getURL available:', typeof chrome.runtime.getURL === 'function');
  
  if (chrome.runtime.getURL) {
    console.log('- Label printer URL:', chrome.runtime.getURL('label_printer.html'));
  }
} else {
  console.log('- Chrome runtime NOT available');
}

// Check for errors
console.log('\n6. Checking for errors...');
console.log('Open the browser console and look for any red error messages when clicking the print button.');
console.log('Common issues:');
console.log('- "Cannot read property of undefined" - Component not loaded');
console.log('- "chrome.runtime is not defined" - Extension context issue');
console.log('- "Failed to fetch" - Label printer page not accessible');

console.log('\n=== Debug Complete ===');