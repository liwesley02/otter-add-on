// Debug helper functions for Otter Order Consolidator
// These functions can be called from the Chrome console

window.otterDebug = {
  // Check extension status
  status() {
    console.log('=== OTTER EXTENSION STATUS ===');
    console.log('Extension Loaded:', !!window.overlayUI);
    console.log('Tab ID:', window.overlayUI?.tabId);
    console.log('Is Leader:', window.overlayUI?.isScrapingMode);
    console.log('Order Batcher:', !!window.orderBatcher);
    console.log('Wave Manager:', !!window.waveManager);
    console.log('Current Wave:', window.waveManager?.currentWave);
    console.log('Total Waves:', window.waveManager?.waves?.length);
    console.log('Processed Orders:', window.overlayUI?.processedOrderIds?.size);
    return 'Status check complete';
  },

  // Force leader mode
  forceLeader() {
    console.log('🔧 Forcing leader mode...');
    const event = new KeyboardEvent('keydown', {
      key: 'L',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
    return 'Leader mode forced - check for green notification';
  },

  // Clear all data and reset
  reset() {
    console.log('🔄 Resetting extension...');
    if (window.overlayUI) {
      // Clear order batcher
      window.orderBatcher?.clearBatches();
      
      // Reset wave manager
      if (window.waveManager) {
        window.waveManager.waves = [];
        window.waveManager.initializeWaves();
      }
      
      // Clear processed orders
      window.overlayUI.processedOrderIds = new Set();
      
      // Re-render
      window.overlayUI.render();
      
      console.log('✅ Extension reset complete');
      return 'Reset complete - ready for fresh extraction';
    } else {
      return '❌ Extension not loaded';
    }
  },

  // Extract orders manually
  async extractOrders() {
    console.log('📋 Starting manual order extraction...');
    if (!window.overlayUI || !window.overlayUI.isScrapingMode) {
      console.warn('⚠️ Not in leader mode. Use otterDebug.forceLeader() first');
      return 'Must be in leader mode to extract';
    }
    
    // Call the extraction function
    await window.overlayUI.extractAndRefreshDetailed();
    return 'Extraction started - check sidebar for results';
  },

  // Show current orders
  showOrders() {
    console.log('=== CURRENT ORDERS ===');
    const orders = window.orderBatcher?.getAllOrders() || [];
    if (orders.length === 0) {
      console.log('No orders extracted yet');
      return 'No orders';
    }
    
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log(`  Wait Time: ${order.waitTime}m`);
      console.log(`  Items: ${order.items.length}`);
      order.items.forEach(item => {
        console.log(`    - ${item.quantity}x ${item.name} (${item.size})`);
      });
    });
    
    return `${orders.length} orders displayed`;
  },

  // Show batched items
  showBatches() {
    console.log('=== BATCHED ITEMS ===');
    const batches = window.orderBatcher?.getBatchedItems() || [];
    if (batches.length === 0) {
      console.log('No batched items yet');
      return 'No batches';
    }
    
    const bySize = window.orderBatcher?.getBatchesBySize() || {};
    Object.entries(bySize).forEach(([size, sizeGroup]) => {
      console.log(`\n${sizeGroup.name}:`);
      Object.entries(sizeGroup.categories).forEach(([category, items]) => {
        items.forEach(item => {
          console.log(`  ${item.totalQuantity}x ${item.name}`);
        });
      });
    });
    
    return 'Batches displayed';
  },

  // Show waves
  showWaves() {
    console.log('=== CURRENT WAVES ===');
    const waves = window.waveManager?.waves || [];
    if (waves.length === 0) {
      console.log('No waves created yet');
      return 'No waves';
    }
    
    waves.forEach((wave, index) => {
      const urgency = window.waveManager?.getWaveUrgency(wave) || 'normal';
      console.log(`\nWave ${wave.number} (${urgency}):`);
      console.log(`  Orders: ${wave.orders?.size || 0}`);
      console.log(`  Items: ${wave.items?.size || 0}`);
      console.log(`  Created: ${new Date(wave.createdAt).toLocaleTimeString()}`);
    });
    
    return `${waves.length} waves displayed`;
  },

  // Toggle sidebar visibility
  toggleSidebar() {
    const sidebar = document.getElementById('otter-consolidator-overlay');
    if (sidebar) {
      const isVisible = sidebar.style.display !== 'none';
      sidebar.style.display = isVisible ? 'none' : 'flex';
      return isVisible ? 'Sidebar hidden' : 'Sidebar shown';
    }
    return 'Sidebar not found';
  },

  // Diagnose sidebar issues
  checkSidebar() {
    console.log('=== SIDEBAR DIAGNOSTICS ===');
    
    // Check if overlay exists
    const overlay = document.getElementById('otter-consolidator-overlay');
    if (!overlay) {
      console.error('❌ Sidebar element not found');
      
      // Check if overlayUI exists
      if (!window.overlayUI) {
        console.error('❌ OverlayUI not initialized');
        return 'Extension not loaded properly';
      }
      
      // Try to create it
      console.log('🔧 Attempting to create sidebar...');
      try {
        window.overlayUI.createOverlay();
        console.log('✅ Sidebar created');
      } catch (e) {
        console.error('Failed to create sidebar:', e);
      }
      return 'Attempted to create sidebar';
    }
    
    // Get computed styles
    const styles = window.getComputedStyle(overlay);
    console.log('Display:', styles.display);
    console.log('Visibility:', styles.visibility);
    console.log('Position:', styles.position);
    console.log('Dimensions:', overlay.offsetWidth, 'x', overlay.offsetHeight);
    console.log('Z-index:', styles.zIndex);
    console.log('Right:', styles.right);
    console.log('Opacity:', styles.opacity);
    console.log('Transform:', styles.transform);
    
    // Check if it's visible
    const isVisible = styles.display !== 'none' && 
                     styles.visibility !== 'hidden' && 
                     styles.opacity !== '0';
    
    // Check position
    const rect = overlay.getBoundingClientRect();
    console.log('Position on screen:', rect);
    
    if (rect.right < 0) {
      console.warn('⚠️ Sidebar is off-screen to the right');
    }
    if (rect.left > window.innerWidth) {
      console.warn('⚠️ Sidebar is off-screen to the left');
    }
    
    // Check parent elements
    let parent = overlay.parentElement;
    let level = 1;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        console.warn(`⚠️ Parent element at level ${level} is hidden:`, parent);
      }
      parent = parent.parentElement;
      level++;
    }
    
    // Check toggle button
    const toggleBtn = document.getElementById('otter-consolidator-toggle');
    console.log('Toggle button exists:', !!toggleBtn);
    
    // Check mode toggle
    const modeBtn = document.getElementById('otter-mode-toggle');
    console.log('Mode button exists:', !!modeBtn);
    
    return isVisible ? '✅ Sidebar should be visible' : '❌ Sidebar is hidden';
  },

  // Force show sidebar
  forceShowSidebar() {
    const sidebar = document.getElementById('otter-consolidator-overlay');
    if (!sidebar) {
      console.log('Creating sidebar...');
      if (window.overlayUI) {
        try {
          window.overlayUI.createOverlay();
        } catch (e) {
          console.error('Failed to create sidebar:', e);
          return 'Failed to create sidebar';
        }
      } else {
        return 'OverlayUI not initialized';
      }
    }
    
    const overlay = document.getElementById('otter-consolidator-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      overlay.style.right = '0';
      overlay.style.transform = 'none';
      overlay.style.zIndex = '999999';
      console.log('✅ Forced sidebar to show');
      return 'Sidebar forced visible';
    }
    return 'Could not find sidebar';
  },

  // Help command
  help() {
    console.log('=== OTTER DEBUG COMMANDS ===');
    console.log('otterDebug.status()      - Check extension status');
    console.log('otterDebug.forceLeader() - Force this tab to be leader (or press Ctrl+Shift+L)');
    console.log('otterDebug.reset()       - Clear all data and reset');
    console.log('otterDebug.extractOrders() - Manually extract orders');
    console.log('otterDebug.showOrders()  - Display extracted orders');
    console.log('otterDebug.showBatches() - Display batched items');
    console.log('otterDebug.showWaves()   - Display current waves');
    console.log('otterDebug.toggleSidebar() - Show/hide sidebar');
    console.log('otterDebug.checkSidebar() - Diagnose sidebar visibility issues');
    console.log('otterDebug.forceShowSidebar() - Force sidebar to be visible');
    console.log('\nKEYBOARD SHORTCUTS:');
    console.log('Ctrl+Shift+L - Force leader mode');
    console.log('Ctrl+Shift+O - Toggle sidebar');
    console.log('Ctrl+Shift+N - Export network findings');
    return 'Help displayed';
  }
};

// Make debug functions globally available
window.otterDebug.help();
console.log('✅ Otter debug helpers loaded. Type otterDebug.help() for commands.');