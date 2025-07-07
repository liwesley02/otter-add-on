console.log('[OverlayUI.js] Script loaded at:', new Date().toISOString());

class OverlayUI {
  constructor(orderBatcher, categoryManager, batchManager, orderExtractor) {
    this.orderBatcher = orderBatcher;
    this.categoryManager = categoryManager;
    this.batchManager = batchManager;
    this.orderExtractor = orderExtractor;
    this.isCollapsed = false;
    this.selectedSize = 'all';
    this.overlayElement = null;
    this.orderChangeObserver = null;
    this.lastOrderCount = 0;
    this.lastOrderIds = new Set();
    this.isMonitoringChanges = false;
    this.batchLabelPrinter = new BatchLabelPrinter();
  }

  init() {
    try {
      this.processedOrderIds = new Set();
      this.isExtracting = false;
      this.extractionQueue = [];
      this.isScrapingMode = false;
      this.tabId = Date.now(); // Unique ID for this tab
      
      this.createToggleButton();
      this.createModeToggle();
      this.createOverlay();
      this.attachEventListeners();
      this.loadSavedState();
      this.render();
      
      // Note: checkScrapingMode will be called from content.js
      // Data sync will be set up after mode is determined
      
      // Mode will be selected by user via modal
      console.log('OverlayUI initialized successfully');
      
      // Start monitoring for order changes
      this.startOrderChangeMonitoring();
    } catch (error) {
      console.error('Critical error in OverlayUI init:', error);
      // Try to show error to user
      this.showInitError(error);
      throw error; // Re-throw to let content.js handle it
    }
  }
  
  injectLayoutStyles() {
    // Check if styles already injected
    if (document.getElementById('otter-layout-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'otter-layout-styles';
    styleEl.textContent = `
      /* Force the main Otter content to shrink when overlay is visible */
      body:has(#otter-consolidator-overlay:not([style*="display: none"])) > div:first-of-type:not(#otter-consolidator-overlay):not(.otter-floating-toggle):not(.otter-mode-toggle) {
        margin-right: 600px !important;
        width: calc(100% - 600px) !important;
        transition: all 0.3s ease;
      }
      
      /* Alternative selector for different page structures */
      body:has(#otter-consolidator-overlay:not([style*="display: none"])) #root {
        margin-right: 600px !important;
        width: calc(100% - 600px) !important;
        transition: all 0.3s ease;
      }
      
      /* Ensure floating buttons stay on top */
      .otter-floating-toggle,
      .otter-mode-toggle {
        z-index: 1000000 !important;
      }
      
      /* Prevent horizontal scrollbar */
      body:has(#otter-consolidator-overlay) {
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(styleEl);
    console.log('Layout styles injected');
  }
  
  showInitError(error) {
    // Create a simple error display even if UI failed to initialize
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      z-index: 9999999;
      font-size: 14px;
      font-weight: bold;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    errorDiv.innerHTML = `
      <div>Otter Extension Error</div>
      <div style="font-size: 12px; margin-top: 5px; font-weight: normal;">
        ${error.message || 'Unknown error occurred'}
      </div>
      <div style="font-size: 11px; margin-top: 10px; opacity: 0.8;">
        Try refreshing the page or check console for details
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
  
  async showModeSelectionModal() {
    // Modal no longer needed - leadership is automatic
    console.log('Mode selection modal skipped - using automatic leader election');
    return true;
  }
  
  initializeProcessedOrders() {
    // Mark all current orders as processed to avoid re-extracting on first load
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    orderRows.forEach(row => {
      const orderNumber = this.extractOrderInfo(row, '[data-testid="order-info-subtext"]');
      const customerName = this.extractOrderInfo(row, '.sc-dCesDq.kTVViB > div, .sc-gpaZuh.cMzcnw, h1.sc-khYOSX');
      if (orderNumber && customerName) {
        this.processedOrderIds.add(`${orderNumber}_${customerName}`);
      }
    });
  }
  
  createToggleButton() {
    // Create a floating toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'otter-consolidator-toggle';
    toggleBtn.className = 'otter-floating-toggle';
    toggleBtn.innerHTML = '📋';
    toggleBtn.title = 'Toggle Order Consolidator (Ctrl+Shift+O)';
    
    document.body.appendChild(toggleBtn);
    
    toggleBtn.addEventListener('click', () => {
      this.toggleVisibility();
    });
  }
  
  createModeToggle() {
    // Create mode toggle button
    const modeBtn = document.createElement('button');
    modeBtn.id = 'otter-mode-toggle';
    modeBtn.className = 'otter-mode-toggle';
    modeBtn.innerHTML = '👁️ Loading...';
    modeBtn.title = 'Extension Mode';
    
    document.body.appendChild(modeBtn);
    
    // Clicking shows current mode - leadership is automatic
    modeBtn.addEventListener('click', async () => {
      // Get current tab info from background
      const tabInfo = await chrome.runtime.sendMessage({ action: 'getTabInfo' });
      
      this.showNotification(
        this.isScrapingMode ? 
        `This tab is the LEADER (Tab ${this.tabId}) - extracting orders for ${tabInfo.totalTabs} tab(s)` : 
        `This tab is a FOLLOWER - viewing orders from tab ${tabInfo.leaderId}`,
        'info'
      );
    });
  }
  
  async loadSavedState() {
    // Load saved visibility state
    const result = await chrome.storage.local.get('consolidatorVisible');
    const isVisible = result.consolidatorVisible !== false; // Default to visible
    
    if (!isVisible) {
      this.overlayElement.style.display = 'none';
    }
  }
  
  toggleVisibility() {
    const isVisible = this.overlayElement.style.display !== 'none';
    this.overlayElement.style.display = isVisible ? 'none' : 'flex';
    
    // Save state
    chrome.storage.local.set({ consolidatorVisible: !isVisible });
    
    // Adjust page layout
    if (isVisible) {
      // Hidden
      const mainContent = document.querySelector('[data-adjusted="true"]');
      if (mainContent) {
        mainContent.style.marginRight = '0';
      }
    } else {
      // Shown
      this.adjustPageLayout();
    }
  }

  createOverlay() {
    // Inject CSS to handle page layout
    this.injectLayoutStyles();
    
    // Shrink the main content to make room for sidebar
    this.adjustPageLayout();
    
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'otter-consolidator-overlay';
    this.overlayElement.className = 'otter-overlay';
    this.overlayElement.innerHTML = `
      <div class="otter-header">
        <button class="otter-toggle" title="Toggle sidebar">≡</button>
        <h3 class="otter-title">Order Consolidator</h3>
        <div class="otter-stats">
          <span class="order-count">0 orders</span>
          <span class="batch-timer">Batch: 0:00</span>
        </div>
      </div>
      
      <div class="mode-indicator" id="mode-indicator">
        <span class="mode-text">VIEW ONLY</span>
      </div>
      
      <div class="otter-content">
        <div class="otter-batch-view" id="batch-view">
          <!-- Batches will be rendered here -->
        </div>
      </div>
      
      <div class="otter-footer" id="batch-controls">
        <!-- Batch controls will be moved here -->
      </div>
    `;
    
    document.body.appendChild(this.overlayElement);
    
    // Verify the overlay was created and is visible
    const verifyOverlay = document.getElementById('otter-consolidator-overlay');
    if (!verifyOverlay) {
      console.error('Failed to create overlay element');
      throw new Error('Overlay element was not created');
    }
    
    // Force visibility
    this.overlayElement.style.display = 'flex';
    console.log('Overlay created and visible');
  }

  attachEventListeners() {
    this.overlayElement.querySelector('.otter-toggle').addEventListener('click', () => {
      this.toggleCollapse();
    });
    
    
    // Add keyboard shortcut listener
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+O to toggle visibility
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        this.toggleVisibility();
      }
    });
    
    this.startBatchTimer();
  }

  render() {
    try {
      this.renderBatchView();
      this.updateStats();
    } catch (error) {
      console.error('Error in render:', error);
      // Don't let render errors crash the extension
    }
  }
  
  renderBatchControls() {
    const footerContainer = this.overlayElement?.querySelector('#batch-controls');
    if (!footerContainer) return;
    
    let html = `
      <div class="batch-controls">
        <div class="batch-capacity-control">
          <label for="batch-capacity">Orders/batch:</label>
          <input type="number" id="batch-capacity" class="batch-capacity-input" 
                 value="${this.batchManager.maxBatchCapacity}" min="1" max="20">
        </div>
        <div class="button-group">
          <button class="refresh-btn" id="manual-refresh" title="Re-scan current page for orders">
            🔄 Refresh
          </button>
          <button class="refresh-btn" id="api-refresh" style="background: #007bff;" title="Reload page to get fresh data">
            🌐 API
          </button>
          <button class="refresh-btn" id="clear-completed" style="background: #dc3545;" title="Clear all cached data and orders">
            🗑️ Clear All
          </button>
        </div>
        <div class="debug-toggle" style="margin-left: auto;">
          <label style="display: flex; align-items: center; gap: 3px; font-size: 10px;">
            <input type="checkbox" id="debug-mode-toggle" ${window.logger && window.logger.debugMode ? 'checked' : ''}>
            Debug
          </label>
        </div>
      </div>
      <div class="update-status" id="update-status" style="display: none;">
        <span class="update-indicator"></span>
        <span class="update-text">Detecting changes...</span>
      </div>
    `;
    
    footerContainer.innerHTML = html;
    
    // Move event listeners here since we're rendering controls separately
    const capacityInput = footerContainer.querySelector('#batch-capacity');
    if (capacityInput) {
      capacityInput.addEventListener('change', async (e) => {
        const newCapacity = parseInt(e.target.value);
        if (newCapacity > 0 && newCapacity <= 20) {
          await this.batchManager.updateMaxCapacity(newCapacity);
          this.showNotification(`Batch size set to ${newCapacity} orders`, 'success');
          
          // Show save indicator
          const saveIndicator = document.createElement('span');
          saveIndicator.className = 'save-indicator';
          saveIndicator.textContent = '✓ Saved';
          saveIndicator.style.cssText = 'color: #28a745; margin-left: 10px; animation: fadeIn 0.3s;';
          capacityInput.parentElement.appendChild(saveIndicator);
          
          // Remove indicator after 2 seconds
          setTimeout(() => saveIndicator.remove(), 2000);
        } else {
          // Reset to valid value
          capacityInput.value = this.batchManager.maxBatchCapacity;
          this.showNotification('Batch size must be between 1 and 20', 'error');
        }
      });
    }
    
    // Add manual refresh button listener
    const refreshBtn = footerContainer.querySelector('#manual-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (!this.isScrapingMode) {
          this.showNotification('Enable scraping mode to refresh orders', 'warning');
          return;
        }
        
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
        
        // Check for completed orders first
        this.checkForCompletedOrders();
        
        // Always use detailed extraction to get actual sizes
        this.extractAndRefreshDetailed().then(() => {
          refreshBtn.classList.remove('refreshing');
          refreshBtn.disabled = false;
        });
      });
    }
    
    // Add API refresh button listener
    const apiRefreshBtn = footerContainer.querySelector('#api-refresh');
    if (apiRefreshBtn) {
      apiRefreshBtn.addEventListener('click', () => {
        apiRefreshBtn.classList.add('refreshing');
        apiRefreshBtn.disabled = true;
        
        // Clear order cache to force fresh API data
        if (window.otterOrderCache) {
          window.otterOrderCache.clear();
          console.log('[Overlay] Cleared order cache');
        }
        
        // Show notification
        this.showNotification('Refreshing page to capture API data...', 'info');
        
        // Reload the page to trigger fresh API calls
        setTimeout(() => {
          window.location.reload();
        }, 500);
      });
    }
    
    // Add debug mode toggle listener
    const debugToggle = footerContainer.querySelector('#debug-mode-toggle');
    if (debugToggle) {
      debugToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        if (window.logger) {
          window.logger.setDebugMode(enabled);
          this.showNotification(`Debug mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
        }
      });
    }
    
    // Add clear completed button listener
    const clearCompletedBtn = footerContainer.querySelector('#clear-completed');
    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', () => {
        this.clearCompletedOrders();
      });
    }
  }
  
  renderBatchView() {
    const container = this.overlayElement?.querySelector('#batch-view');
    if (!container) {
      console.warn('Batch view container not found');
      return;
    }
    
    try {
      let html = '';
    
    // Add compact status bar
    const modeText = this.isScrapingMode ? 'SCRAPING' : 'VIEW-ONLY';
    const modeClass = this.isScrapingMode ? 'scraping' : 'view-only';
    
    html += `
      <div class="refresh-status">
        <div class="status-left">
          <span class="mode-badge ${modeClass}">${modeText}</span>
          <span class="live-indicator ${this.isScrapingMode ? 'active' : ''}"></span>
          <span class="status-text">${this.isScrapingMode ? 'Live' : 'Syncing'}</span>
        </div>
        <div class="status-right">
          <span class="last-refresh">Updated: Just now</span>
        </div>
      </div>
    `;
    
    // Batch controls will be rendered at the bottom
    
    // Render each batch (skip completed batches)
    this.batchManager.batches.forEach((batch, index) => {
      if (batch.status === 'completed') return; // Skip completed batches
      const itemCount = batch.items.size;
      // Handle batch.orders as either Map or plain object (after Chrome messaging)
      const ordersMap = batch.orders instanceof Map ? batch.orders : new Map(Object.entries(batch.orders || {}));
      const orderCount = ordersMap.size;
      const urgencyClass = this.batchManager.getBatchUrgency(batch);
      const sizeGroups = this.batchManager.getBatchBySize(index);
      
      // Create order color mapping for this batch (needs to be accessible for items)
      const orderColorMap = new Map();
      const orderEntries = Array.from(ordersMap.entries());
      orderEntries.forEach(([orderId, order], index) => {
        orderColorMap.set(orderId, index % 10); // Cycle through 10 colors
      });
      
      // Calculate oldest order wait time for display (excluding completed)
      let oldestWaitTime = 0;
      let activeOrderCount = 0;
      const now = new Date();
      console.log(`Batch ${batch.number} orders:`, ordersMap.size);
      ordersMap.forEach((order, orderId) => {
        if (!order.completed) {
          activeOrderCount++;
          // Calculate elapsed time from orderedAt
          let elapsedTime = 0;
          if (order.orderedAt) {
            const orderedDate = new Date(order.orderedAt);
            elapsedTime = Math.floor((now - orderedDate) / 60000); // Convert to minutes
          } else if (order.elapsedTime) {
            elapsedTime = order.elapsedTime;
          }
          console.log(`  Order ${orderId}: elapsed time = ${elapsedTime}m, completed = ${order.completed}`);
          if (elapsedTime > oldestWaitTime) {
            oldestWaitTime = elapsedTime;
          }
        }
      });
      console.log(`Batch ${batch.number} oldest wait time: ${oldestWaitTime}m`);
      
      html += `
        <div class="batch-section ${urgencyClass} ${batch.locked ? 'batch-locked' : ''}">
          <div class="batch-header">
            <h3>${batch.name} (${activeOrderCount}/${batch.capacity} orders) ${batch.locked ? '🔒' : ''}</h3>
            <div class="batch-stats">
              <span>Oldest: ${oldestWaitTime}m</span>
              <span>${itemCount} items</span>
              <button class="print-labels-btn" data-batch-id="${batch.id}" title="Print labels for this batch">
                🏷️ Print Labels
              </button>
            </div>
          </div>
          
          <div class="batch-content">
      `;
      
      // Add customer names section if there are orders
      if (orderCount > 0) {
        html += `
          <div class="batch-customers">
            <div class="batch-customers-header">Orders in this batch:</div>
            <div class="batch-customer-list">
        `;
        
        // Get customers sorted by elapsed time (oldest first - FIFO)
        const customers = orderEntries.map(([orderId, order]) => ({
          ...order,
          orderId: orderId,
          colorIndex: orderColorMap.get(orderId)
        })).sort((a, b) => {
          // Calculate elapsed times
          let aElapsed = a.elapsedTime || 0;
          let bElapsed = b.elapsedTime || 0;
          
          if (a.orderedAt) {
            const aDate = new Date(a.orderedAt);
            aElapsed = Math.floor((new Date() - aDate) / 60000);
          }
          if (b.orderedAt) {
            const bDate = new Date(b.orderedAt);
            bElapsed = Math.floor((new Date() - bDate) / 60000);
          }
          
          // Sort by elapsed time descending (higher elapsed = older = should be first)
          return bElapsed - aElapsed;
        });
        
        customers.forEach(order => {
          const orderClass = order.completed ? 'order-completed' : (order.isNew ? 'order-new' : '');
          
          // Calculate current elapsed time
          let elapsedTime = order.elapsedTime || 0;
          if (order.orderedAt) {
            const orderedDate = new Date(order.orderedAt);
            const now = new Date();
            elapsedTime = Math.floor((now - orderedDate) / 60000);
          }
          
          const elapsedClass = elapsedTime >= 15 ? 'elapsed-overdue' : '';
          
          html += `
            <div class="batch-customer-badge ${orderClass} ${elapsedClass}" data-order-color="${order.colorIndex}">
              <span class="customer-name">${window.escapeHtml(order.customerName)}</span>
              <span class="customer-order">${window.escapeHtml(order.number || order.orderNumber)}</span>
              <span class="customer-wait-time">${window.escapeHtml(this.formatElapsedTime(elapsedTime))}</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      // Start two-column wrapper for items
      html += `<div class="wave-items-wrapper">`;
      
      // Render items grouped by size
      Object.entries(sizeGroups).forEach(([sizeKey, sizeGroup]) => {
        if (sizeGroup.items.length > 0) {
          html += `
            <div class="wave-size-group">
              <h4 class="wave-size-header">${window.escapeHtml(sizeGroup.name)}</h4>
              <div class="wave-items-list">
          `;
          
          // Group items by protein subcategory within size
          const byProtein = {};
          sizeGroup.items.forEach(item => {
            // Use subcategory name for grouping, fallback to main category
            let proteinGroup = 'Other';
            console.log(`[Overlay] Processing item: ${item.name}, categoryInfo:`, JSON.stringify(item.categoryInfo));
            console.log(`[Overlay] Item full details:`, {
              name: item.name,
              category: item.category,
              categoryInfo: item.categoryInfo,
              hasSubcategory: item.categoryInfo && item.categoryInfo.subcategory,
              subcategoryName: item.categoryInfo && item.categoryInfo.subcategoryName
            });
            
            // Use categoryInfo if available - this should be the source of truth
            if (item.categoryInfo) {
              // For rice bowls, use the subcategory (protein) name
              if (item.categoryInfo.topCategory === 'riceBowls' && item.categoryInfo.subCategoryName) {
                proteinGroup = `${item.categoryInfo.subCategoryName} Rice Bowls`;
              } else if (item.categoryInfo.topCategoryName) {
                // For other categories, use the top category name
                proteinGroup = item.categoryInfo.topCategoryName;
              } else {
                proteinGroup = 'Other';
              }
            } else {
              // Fallback for missing categoryInfo
              console.warn('[Overlay] Item missing categoryInfo:', item);
              // Try to determine category from item name
              const itemNameLower = (item.name || '').toLowerCase();
              if (itemNameLower.includes('rice bowl')) {
                proteinGroup = 'Rice Bowls';
              } else if (itemNameLower.includes('urban bowl')) {
                proteinGroup = 'Urban Bowls';
              } else if (itemNameLower.includes('dumpling')) {
                proteinGroup = 'Dumplings';
              } else {
                proteinGroup = 'Other';
              }
            }
            
            if (!byProtein[proteinGroup]) {
              byProtein[proteinGroup] = [];
            }
            byProtein[proteinGroup].push(item);
          });
          
          // Render each protein group
          Object.entries(byProtein).forEach(([proteinGroup, items]) => {
            // Skip empty groups
            if (items.length === 0) {
              return;
            }
            
            html += `
              <div class="wave-category-group">
                <h5 class="wave-category-header">${window.escapeHtml(proteinGroup)}</h5>
                <ul class="wave-item-list">
            `;
            
            items.forEach(item => {
              // Check elapsed time for orders associated with this item
              let isOverdue = false;
              let maxElapsedTime = 0;
              let allOrdersCompleted = true;
              let activeOrderCount = 0;
              
              if (item.orderIds && batch.orders) {
                item.orderIds.forEach(orderId => {
                  const order = batch.orders.get ? batch.orders.get(orderId) : batch.orders[orderId];
                  if (order) {
                    if (!order.completed) {
                      allOrdersCompleted = false;
                      activeOrderCount++;
                      
                      // Calculate elapsed time
                      let elapsedTime = order.elapsedTime || 0;
                      
                      // If we have orderedAt, calculate current elapsed time
                      if (order.orderedAt) {
                        const orderedDate = new Date(order.orderedAt);
                        const now = new Date();
                        const elapsedMs = now - orderedDate;
                        elapsedTime = Math.floor(elapsedMs / 60000); // Convert to minutes
                      }
                      
                      maxElapsedTime = Math.max(maxElapsedTime, elapsedTime);
                      
                      // Mark as overdue if order is older than 15 minutes
                      if (elapsedTime >= 15) {
                        isOverdue = true;
                      }
                    }
                  }
                });
              }
              
              let itemClass = allOrdersCompleted ? 'wave-item completed' : (isOverdue ? 'wave-item overdue' : 'wave-item');
              
              // Always create color dots for all items
              let colorDotsHtml = '';
              if (item.orderIds && item.orderIds.length > 0 && orderColorMap) {
                colorDotsHtml = '<div class="order-color-dots">';
                item.orderIds.forEach(orderId => {
                  const colorIndex = orderColorMap.get(orderId);
                  if (colorIndex !== undefined) {
                    colorDotsHtml += `<div class="order-color-dot" data-color="${colorIndex}"></div>`;
                  }
                });
                colorDotsHtml += '</div>';
              }
              
              // Get customer names for tooltip
              let customerNames = '';
              if (item.orderIds && item.orderIds.length > 1) {
                const names = item.orderIds.map(orderId => {
                  const order = batch.orders.get ? batch.orders.get(orderId) : batch.orders[orderId];
                  return order ? window.escapeHtml(order.customerName) : 'Unknown';
                });
                customerNames = ` title="${names.join(', ')}"`;
              }
              
              html += `
                <li class="${itemClass}"${customerNames}>
                  ${colorDotsHtml}
                  <span class="wave-item-quantity">${window.escapeHtml(item.batchQuantity || item.totalQuantity || 0)}x</span>
                  <span class="wave-item-name">${window.escapeHtml(item.baseName || item.name)}</span>
                  ${item.size && item.size !== 'no-size' ? (() => {
                    // Extract the actual size from compound values like "small - Garlic Butter Fried Rice Substitute"
                    const fullSizeText = item.size;
                    let sizeClass = fullSizeText.toLowerCase();
                    
                    // Check if it's a compound size with rice substitution
                    if (fullSizeText.includes(' - ')) {
                      // Extract the parts
                      const parts = fullSizeText.split(' - ');
                      const sizePart = parts[0].trim();
                      const substitution = parts[1].trim();
                      sizeClass = sizePart.toLowerCase();
                      
                      // Simplify rice type display
                      let riceTypeDisplay = substitution;
                      const subLower = substitution.toLowerCase();
                      
                      if (subLower.includes('garlic butter') && subLower.includes('fried rice')) {
                        riceTypeDisplay = 'Garlic Butter';
                      } else if (subLower.includes('fried rice')) {
                        riceTypeDisplay = 'Fried Rice';
                      } else if (subLower.includes('noodle')) {
                        riceTypeDisplay = 'Noodles';
                      } else if (subLower.includes('substitute')) {
                        // Remove the word "substitute" for cleaner display
                        riceTypeDisplay = substitution.replace(/substitute/i, '').trim();
                      }
                      
                      // Create single stacked badge
                      return `<span class="item-size size-badge stacked" data-size="${window.escapeHtml(sizeClass)}">
                        <span class="size-line">${window.escapeHtml(sizePart)}</span>
                        <span class="rice-line">${window.escapeHtml(riceTypeDisplay)}</span>
                      </span>`;
                    } else {
                      // Simple size without substitution
                      return `<span class="item-size size-badge" data-size="${window.escapeHtml(sizeClass)}">${window.escapeHtml(fullSizeText)}</span>`;
                    }
                  })() : ''}
                  ${maxElapsedTime > 0 ? `<span class="item-wait-time ${isOverdue ? 'overdue' : ''}">${window.escapeHtml(this.formatElapsedTime(maxElapsedTime))}</span>` : ''}
                </li>
              `;
            });
            
            html += `
                </ul>
              </div>
            `;
          });
          
          html += `
              </div>
            </div>
          `;
        }
      });
      
      // Close two-column wrapper
      html += `</div>`;
      
      // Batch actions
      // Batch actions removed - batches lock automatically when full
      
      html += `
          </div>
        </div>
      `;
    });
    
    // Add individual orders section
    html += this.renderIndividualOrders();
    
    container.innerHTML = html;
    
    // Render batch controls at the bottom
    this.renderBatchControls();
    
    // Attach event listeners
    // Add complete wave button listeners
    container.querySelectorAll('.complete-wave-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const batchIndex = parseInt(e.target.dataset.batchIndex);
        this.completeBatch(batchIndex);
      });
    });
    
    // Add print labels button listeners
    container.querySelectorAll('.print-labels-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const batchId = e.target.dataset.batchId;
        await this.handlePrintLabels(batchId);
      });
    });
    
    // Add individual order print button listeners
    container.querySelectorAll('.print-order-labels-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const orderId = e.target.dataset.orderId;
        await this.handlePrintOrderLabels(orderId);
      });
    });
    
    // Event listeners moved to renderBatchControls()
    } catch (error) {
      console.error('Error in renderBatchView:', error);
      // Show error in the container if possible
      if (container) {
        container.innerHTML = '<div style="padding: 20px; color: #dc3545;">Error rendering view. Please refresh.</div>';
      }
    }
  }
  
  renderIndividualOrders() {
    const orders = this.orderBatcher.getAllOrders();
    if (!orders || orders.length === 0) {
      return '';
    }
    
    let html = `
      <div class="individual-orders-section">
        <h3>Individual Orders</h3>
        <div class="orders-list">
    `;
    
    // Sort orders by order number
    const sortedOrders = [...orders].sort((a, b) => {
      const numA = parseInt(a.orderNumber) || 0;
      const numB = parseInt(b.orderNumber) || 0;
      return numA - numB;
    });
    
    sortedOrders.forEach(order => {
      const customerName = order.recipientName || order.customerName;
      // Calculate elapsed time from orderedAt
      let elapsedTime = 0;
      if (order.orderedAt) {
        const orderedDate = new Date(order.orderedAt);
        const now = new Date();
        elapsedTime = Math.floor((now - orderedDate) / 60000); // Convert to minutes
      } else if (order.elapsedTime) {
        elapsedTime = order.elapsedTime;
      }
      const isOverdue = elapsedTime >= 15;
      
      // Count items for this order
      let itemCount = 0;
      const batchedItems = this.orderBatcher.getBatchedItems();
      batchedItems.forEach(item => {
        const orderItem = item.orders.find(o => o.orderId === order.id);
        if (orderItem) {
          itemCount += orderItem.quantity;
        }
      });
      
      html += `
        <div class="order-card ${isOverdue ? 'overdue' : ''}">
          <div class="order-header">
            <span class="order-number">#${order.orderNumber}</span>
            <span class="order-customer">${customerName}</span>
            <span class="order-time ${isOverdue ? 'overdue' : ''}">${this.formatElapsedTime(elapsedTime)}</span>
          </div>
          <div class="order-details">
            <span class="order-items">${itemCount} items</span>
            ${order.orderNotes ? `<span class="order-notes" title="${order.orderNotes}">📝 Note</span>` : ''}
            <button class="print-order-labels-btn" data-order-id="${order.id}" title="Print labels for this order">
              🏷️ Print
            </button>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }
  
  renderBatchTabs() {
    const waveTabsContainer = this.overlayElement.querySelector('#wave-tabs');
    const waves = this.batchManager.getAllWaves();
    
    let html = '';
    waves.forEach((wave, index) => {
      const itemCount = this.batchManager.getWaveItemCount(wave);
      const isActive = index === this.batchManager.currentBatchIndex;
      const isFull = itemCount >= wave.capacity;
      
      html += `
        <button class="wave-tab ${isActive ? 'active' : ''} ${isFull ? 'full' : ''}" 
                data-batch-index="${index}">
          Batch ${wave.number}
          <span class="wave-count">${itemCount}/${wave.capacity}</span>
        </button>
      `;
    });
    
    waveTabsContainer.innerHTML = html;
    
    // Add click handlers
    waveTabsContainer.querySelectorAll('.wave-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const batchIndex = parseInt(e.currentTarget.dataset.batchIndex);
        this.batchManager.switchToBatch(batchIndex);
        this.render();
      });
    });
  }

  renderBatchedItems() {
    const container = this.overlayElement.querySelector('#batched-items');
    const categorized = this.orderBatcher.getBatchesByCategory();
    
    console.log('[Overlay] === RENDER START ===');
    console.log('[Overlay] Categorized structure:', JSON.stringify(categorized, null, 2));
    
    // Log rice bowl details specifically
    if (categorized.riceBowls) {
      console.log('[Overlay] Rice Bowls found:', {
        name: categorized.riceBowls.name,
        subcategories: Object.keys(categorized.riceBowls.subcategories || {}),
        subcategoryCounts: Object.entries(categorized.riceBowls.subcategories || {}).map(([k, v]) => ({
          subcategory: k,
          itemCount: v.items?.length || 0
        }))
      });
    }
    
    let html = '';
    
    // Define display order for categories - rice bowls and urban bowls first
    const categoryOrder = ['riceBowls', 'urbanBowls', 'appetizers', 'dumplings', 'drinks', 'noodles', 'friedRice', 'sides', 'desserts', 'uncategorized'];
    
    // Render categories in order
    categoryOrder.forEach(categoryKey => {
      if (!categorized[categoryKey]) return;
      
      const categoryData = categorized[categoryKey];
      
      // Check if it's a hierarchical category (has subcategories)
      if (categoryData.subcategories) {
        console.log('[Overlay] Rendering hierarchical category:', categoryKey, 'with subcategories:', Object.keys(categoryData.subcategories));
        html += this.renderHierarchicalCategory(categoryKey, categoryData);
      } else if (Array.isArray(categoryData) && categoryData.length > 0) {
        // Regular category
        console.log('[Overlay] Rendering regular category:', categoryKey, 'with', categoryData.length, 'items');
        html += this.renderRegularCategory(categoryKey, categoryData);
      }
    });
    
    container.innerHTML = html || '<p class="no-items">No orders yet</p>';
    
    // Add event listeners
    container.querySelectorAll('.add-to-wave').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemKey = e.target.dataset.itemKey;
        const itemData = JSON.parse(e.target.dataset.itemData);
        this.addToWave(itemKey, itemData);
      });
    });
  }

  renderHierarchicalCategory(categoryKey, categoryData) {
    console.log('[Overlay] renderHierarchicalCategory called for:', categoryKey, categoryData);
    
    let html = `<div class="category-section hierarchical ${categoryKey}">
      <h4 class="category-header main-category">${categoryData.name}</h4>`;
    
    // Regular hierarchical rendering for all categories (including rice bowls)
    // The categoryManager has already organized rice bowls by protein as subcategories
    Object.entries(categoryData.subcategories).forEach(([subKey, subData]) => {
      console.log(`[Overlay] Subcategory ${subKey} has ${subData.items.length} items`);
      if (subData.items.length > 0) {
        html += `
          <div class="subcategory-section ${subKey}">
            <h5 class="subcategory-header">${subData.name}</h5>
            <div class="item-list">
        `;
        
        html += this.renderItemsList(subData.items);
        html += '</div></div>';
      }
    });
    
    // Render items without subcategory if any
    if (categoryData.items && categoryData.items.length > 0) {
      html += `
        <div class="subcategory-section no-subcategory">
          <h5 class="subcategory-header">Other ${categoryData.name}</h5>
          <div class="item-list">
      `;
      html += this.renderItemsList(categoryData.items);
      html += '</div></div>';
    }
    
    html += '</div>';
    return html;
  }
  
  renderRegularCategory(categoryKey, items) {
    const categoryName = this.categoryManager.getCategoryDisplay(categoryKey);
    let html = `
      <div class="category-section ${categoryKey}">
        <h4 class="category-header">${categoryName}</h4>
        <div class="item-list">
    `;
    
    html += this.renderItemsList(items);
    html += '</div></div>';
    
    return html;
  }
  
  renderItemsList(items) {
    let html = '';
    
    items.forEach(item => {
      const itemKey = this.orderBatcher.itemMatcher.generateItemKey(item.name, item.size, item.category, item.riceSubstitution);
      const itemDataStr = JSON.stringify({
        name: item.name,
        size: item.size,
        category: item.category,
        price: item.price,
        note: item.note || ''
      });
      
      // Check if any orders for this item are new
      const hasNewOrders = item.orders.some(order => {
        const orderData = this.orderBatcher.getOrderById(order.orderId);
        return orderData && orderData.isNew;
      });
      
      // Parse protein type and rice type for badges from categoryInfo
      let proteinBadge = '';
      let riceType = '';
      let riceTypeClass = '';
      
      // Use categoryInfo if available - it's the source of truth
      if (item.categoryInfo) {
        // Get protein from categoryInfo
        if (item.categoryInfo.proteinType) {
          proteinBadge = item.categoryInfo.proteinType;
        }
        
        // Extract rice type from the full size info
        if (item.categoryInfo.fullSize && item.categoryInfo.fullSize !== 'no-size') {
          const fullSize = item.categoryInfo.fullSize.toLowerCase();
          if (fullSize.includes('garlic butter')) {
            riceType = 'Garlic Butter';
            riceTypeClass = 'garlic-butter';
          } else if (fullSize.includes('fried rice')) {
            riceType = 'Fried Rice';
            riceTypeClass = 'fried-rice';
          } else if (fullSize.includes('noodle')) {
            riceType = 'Noodles';
            riceTypeClass = 'noodles';
          } else if (item.isRiceBowl || (item.name && item.name.toLowerCase().includes('rice bowl'))) {
            // Regular rice bowl without substitution = White Rice
            riceType = 'White Rice';
            riceTypeClass = 'white-rice';
          }
        } else if (item.isRiceBowl || (item.name && item.name.toLowerCase().includes('rice bowl'))) {
          // Default to white rice for rice bowls
          riceType = 'White Rice';
          riceTypeClass = 'white-rice';
        }
        
        // Check for Urban Bowl rice substitutions from modifiers
        if (item.isUrbanBowl || (item.name && item.name.toLowerCase().includes('urban bowl'))) {
          // Check modifiers for rice substitutions
          if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(mod => {
              const modName = mod.name.toLowerCase();
              if (modName.includes('garlic butter') && modName.includes('fried rice')) {
                riceType = 'Garlic Butter Fried Rice';
                riceTypeClass = 'garlic-butter';
              } else if (modName.includes('fried rice')) {
                riceType = 'Fried Rice';
                riceTypeClass = 'fried-rice';
              } else if (modName.includes('stir fry') && modName.includes('noodle')) {
                riceType = 'Stir Fry Noodles';
                riceTypeClass = 'noodles';
              }
            });
          }
        }
      }
      
      html += `
        <div class="batch-item ${hasNewOrders ? 'new-item' : ''}">
          <div class="item-info">
            ${hasNewOrders ? '<span class="new-badge">NEW</span>' : ''}
            <span class="item-name">${item.name}</span>
            ${proteinBadge ? `<span class="protein-badge">${proteinBadge}</span>` : ''}
            ${riceType ? `<span class="rice-type-badge ${riceTypeClass}">${riceType}</span>` : ''}
            <span class="item-quantity">×${item.totalQuantity}</span>
          </div>
          ${item.modifiers && item.modifiers.length > 0 ? `
            <div class="item-modifiers">
              ${item.modifiers.map(mod => `
                <div class="modifier-item">
                  <span class="modifier-name">• ${mod.name}</span>
                  ${mod.price > 0 ? `<span class="modifier-price">+$${mod.price.toFixed(2)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${item.note ? `
            <div class="item-note">
              <span class="note-label">Note:</span>
              <span class="note-text">${item.note}</span>
            </div>
          ` : ''}
          <div class="item-actions">
            <span class="item-price">$${(item.price * item.totalQuantity).toFixed(2)}</span>
            <button class="add-to-wave" 
                    data-item-key="${itemKey}" 
                    data-item-data='${itemDataStr}'>
              + Batch
            </button>
          </div>
        </div>
      `;
    });
    
    return html;
  }

  renderBatchItems() {
    const container = this.overlayElement.querySelector('#wave-items');
    const waveItems = this.batchManager.getCurrentBatchByCategory(this.categoryManager);
    const currentBatch = this.batchManager.currentBatch;
    
    // Update wave title and capacity
    const waveTitle = this.overlayElement.querySelector('#wave-title');
    const waveCapacity = this.overlayElement.querySelector('#wave-capacity');
    const totalItems = this.batchManager.getCurrentBatchItemCount();
    
    waveTitle.textContent = `Batch ${currentBatch.number}`;
    waveCapacity.textContent = `${totalItems}/${currentBatch.capacity} items`;
    waveCapacity.className = totalItems >= currentBatch.capacity ? 'wave-capacity full' : 'wave-capacity';
    
    let html = '';
    
    Object.entries(waveItems).forEach(([category, items]) => {
      if (items.length > 0) {
        const categoryName = this.categoryManager.getCategoryDisplay(category);
        html += `<div class="wave-category">
          <h6>${categoryName}</h6>`;
        
        items.forEach(item => {
          html += `
            <div class="wave-item">
              <span class="wave-item-name">${item.name}</span>
              <span class="wave-item-qty">×${item.waveQuantity}</span>
              <button class="remove-from-wave" data-item-key="${item.key}">−</button>
            </div>
          `;
        });
        
        html += '</div>';
      }
    });
    
    container.innerHTML = html || '<p class="empty-wave">Wave is empty</p>';
    
    container.querySelectorAll('.remove-from-wave').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.removeFromWave(e.target.dataset.itemKey);
      });
    });
    
    const sendBtn = this.overlayElement.querySelector('#send-wave');
    sendBtn.disabled = totalItems === 0;
    sendBtn.textContent = totalItems > 0 
      ? `Send Batch ${currentBatch.number} (${totalItems} items)` 
      : 'Send Batch to Kitchen';
  }

  // Items are added to batches through order assignment, not manually
  // addToWave and removeFromWave are deprecated in the batch system

  // Removed send wave functionality - waves are now just for visual organization
  
  async extractAndRefresh() {
    // Only do preview-based refresh - no clicking
    console.log('Starting refresh...');
    const progress = this.showProgress('Refreshing orders...');
    
    try {
      // Clear existing orders
      this.orderBatcher.clearBatches();
      
      // Extract all orders using preview data only
      const orderRows = document.querySelectorAll('[data-testid="order-row"]');
      const orders = [];
      
      console.log(`Found ${orderRows.length} order rows to process`);
      
      orderRows.forEach((row, index) => {
        try {
          const order = this.extractOrderFromPreview(row);
          if (order && order.items.length > 0) {
            orders.push(order);
            this.orderBatcher.addOrder(order);
            console.log(`Order ${index + 1}: ${order.customerName} - ${order.items.length} items, elapsed: ${order.elapsedTime}m`);
          }
        } catch (error) {
          console.error(`Error processing order row ${index}:`, error);
        }
      });
      
      console.log(`Successfully extracted ${orders.length} orders`);
      
      // Update batch assignments
      this.batchManager.refreshBatchAssignments(orders);
      
      // Update last refresh time
      this.lastRefreshTime = Date.now();
      
      this.render();
      progress.remove();
      
      this.showNotification(`Refreshed ${orders.length} orders (sizes require React data)`, 'success');
    } catch (error) {
      console.error('Error refreshing orders:', error);
      progress.remove();
      this.showNotification('Error refreshing orders', 'error');
    }
  }
  
  extractOrderFromPreview(orderRow) {
    try {
      const orderNumber = this.extractOrderInfo(orderRow, '[data-testid="order-info-subtext"]');
      const customerName = this.extractOrderInfo(orderRow, '.sc-dCesDq.kTVViB > div, .sc-gpaZuh.cMzcnw, h1.sc-khYOSX');
      
      if (!orderNumber || !customerName) return null;
      
      const orderId = `${orderNumber}_${customerName}`;
      const elapsedTime = this.extractElapsedTime(orderRow);
      const items = this.extractPreviewItems(orderRow);
      
      // Calculate orderedAt from elapsed time
      const now = new Date();
      const orderedAt = new Date(now - (elapsedTime * 60000)).toISOString();
      
      return {
        id: orderId,
        number: orderNumber,
        customerName: customerName,
        timestamp: Date.now(),
        orderedAt: orderedAt,
        elapsedTime: elapsedTime,
        waitTime: 0, // No longer using wait time
        items: items
      };
    } catch (error) {
      console.error('Error extracting order from preview:', error);
      return null;
    }
  }

  clearWave() {
    this.batchManager.currentBatch.items.clear();
    this.render();
  }
  
  clearCompletedOrders() {
    console.log('[Overlay] Clearing completed orders...');
    
    // Get all visible order IDs from the DOM
    const visibleOrderIds = new Set();
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    
    orderRows.forEach(row => {
      // Try to extract order ID
      const orderNumElement = row.querySelector('[data-testid="order-info-subtext"]');
      if (orderNumElement) {
        const orderText = orderNumElement.textContent;
        const match = orderText.match(/#([A-Z0-9]+)/);
        if (match) {
          visibleOrderIds.add(match[1]);
        }
      }
    });
    
    console.log(`[Overlay] Found ${visibleOrderIds.size} visible orders on page`);
    
    // Remove orders that are not visible
    let removedCount = 0;
    this.batchManager.batches.forEach(batch => {
      const ordersToRemove = [];
      
      batch.orders.forEach((order, orderId) => {
        const orderNumber = orderId.split('_')[0];
        if (!visibleOrderIds.has(orderNumber)) {
          ordersToRemove.push(orderId);
        }
      });
      
      // Remove the orders
      ordersToRemove.forEach(orderId => {
        batch.orders.delete(orderId);
        removedCount++;
        console.log(`[Overlay] Removed order ${orderId} from batch ${batch.number}`);
      });
    });
    
    if (removedCount > 0) {
      // Refresh the display
      const allOrders = this.orderBatcher.getAllOrders().filter(order => {
        const orderNumber = order.id.split('_')[0];
        return visibleOrderIds.has(orderNumber);
      });
      
      this.orderBatcher.clearBatches();
      allOrders.forEach(order => this.orderBatcher.addOrder(order));
      this.batchManager.refreshBatchAssignments(allOrders);
      
      this.showNotification(`Cleared ${removedCount} completed order${removedCount > 1 ? 's' : ''}`, 'success');
      this.render();
    } else {
      this.showNotification('No completed orders to clear', 'info');
    }
  }

  toggleAutoWave(enabled) {
    // Auto-wave functionality has been removed since we're not sending to kitchen
    // This method is kept for backward compatibility but does nothing
    console.log('Auto-wave toggle called but functionality removed');
  }

  selectSize(size) {
    this.selectedSize = size;
    this.overlayElement.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
    this.renderBatchedItems();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.overlayElement.classList.toggle('collapsed', this.isCollapsed);
    
    // Adjust page layout when toggling
    try {
      const mainContent = document.querySelector('[data-adjusted="true"]');
      if (mainContent) {
        mainContent.style.marginRight = this.isCollapsed ? '50px' : '400px';
      }
    } catch (error) {
      console.error('Error toggling layout:', error);
    }
  }

  updateStats() {
    const stats = this.batchManager.getBatchStats();
    const batches = this.orderBatcher.getBatchedItems();
    const totalOrders = batches.reduce((sum, batch) => sum + batch.orders.length, 0);
    
    this.overlayElement.querySelector('.order-count').textContent = `${totalOrders} orders`;
  }

  startBatchTimer() {
    setInterval(() => {
      try {
        // Add null check for currentBatch
        if (!this.batchManager || !this.batchManager.currentBatch) {
          console.warn('Batch manager or current batch not initialized');
          return;
        }
        
        const currentBatch = this.batchManager.currentBatch;
        if (!currentBatch.createdAt) {
          console.warn('Current batch has no createdAt timestamp');
          return;
        }
        
        const ageMs = Date.now() - currentBatch.createdAt;
        const minutes = Math.floor(ageMs / 60000);
        const seconds = Math.floor((ageMs % 60000) / 1000);
        
        const timerElement = this.overlayElement?.querySelector('.batch-timer');
        if (timerElement) {
          timerElement.textContent = `Batch: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      } catch (error) {
        console.error('Error in batch timer:', error);
      }
    }, 1000);
  }

  formatElapsedTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
    }
  }
  
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `otter-notification ${type}`;
    notification.textContent = message;
    
    this.overlayElement.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    if (duration > 0) {
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
    
    return notification;
  }
  
  showProgress(message) {
    const progress = document.createElement('div');
    progress.className = 'otter-progress';
    progress.innerHTML = `
      <div class="progress-spinner"></div>
      <span>${message}</span>
    `;
    
    this.overlayElement.appendChild(progress);
    
    return {
      update: (newMessage) => {
        progress.querySelector('span').textContent = newMessage;
      },
      remove: () => {
        progress.remove();
      }
    };
  }

  async checkForNewOrders() {
    if (this.isExtracting) return; // Don't run if already extracting
    
    try {
      // Instead of just checking for new orders, do a full refresh with detailed extraction
      console.log('Checking for updates...');
      
      // First, check for completed orders before refreshing
      this.checkForCompletedOrders();
      
      // Do a full refresh with detailed extraction to get actual sizes
      await this.extractAndRefreshDetailed();
      
      this.updateLiveStatus('Monitoring for new orders', 'live');
      
      // Broadcast updated data to other tabs
      await this.broadcastOrderData();
      
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  }
  
  checkForCompletedOrders() {
    console.log('[OrderMonitoring] Checking for completed orders...');
    
    // Get all visible order IDs from the DOM
    const visibleOrderIds = new Set();
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    
    orderRows.forEach(row => {
      // Try multiple methods to extract order ID
      const orderNumElement = row.querySelector('[data-testid="order-info-subtext"]');
      if (orderNumElement) {
        const orderText = orderNumElement.textContent;
        const match = orderText.match(/#([A-Z0-9]+)/);
        if (match) {
          visibleOrderIds.add(match[1]);
        }
      }
    });
    
    console.log(`[OrderMonitoring] Found ${visibleOrderIds.size} visible orders:`, Array.from(visibleOrderIds));
    
    // Check all orders in our batches
    const completedOrders = [];
    this.batchManager.batches.forEach(batch => {
      batch.orders.forEach((order, orderId) => {
        // Extract just the order number from our ID (format: "NUMBER_NAME")
        const orderNumber = orderId.split('_')[0];
        
        if (!order.completed && !visibleOrderIds.has(orderNumber)) {
          completedOrders.push(orderId);
          console.log(`[OrderMonitoring] Order ${orderId} (${orderNumber}) is no longer visible`);
        }
      });
    });
    
    // Mark completed orders
    if (completedOrders.length > 0) {
      console.log(`[OrderMonitoring] Marking ${completedOrders.length} orders as completed`);
      completedOrders.forEach(orderId => {
        this.batchManager.markOrderCompleted(orderId);
      });
      
      this.showNotification(`${completedOrders.length} order${completedOrders.length > 1 ? 's' : ''} completed`, 'success');
      this.render();
    }
  }
  
  extractOrderInfo(row, selector) {
    const el = row.querySelector(selector);
    return el ? el.textContent.trim() : null;
  }
  
  async processExtractionQueue() {
    if (this.isExtracting || this.extractionQueue.length === 0) return;
    
    this.isExtracting = true;
    const batchSize = 3; // Process 3 orders at a time
    
    while (this.extractionQueue.length > 0) {
      const batch = this.extractionQueue.splice(0, batchSize);
      this.updateLiveStatus(`Extracting ${batch.length} orders...`, 'extracting');
      
      await this.extractOrderBatch(batch);
      
      // Small delay between batches
      if (this.extractionQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    this.isExtracting = false;
    this.lastRefreshTime = Date.now();
    this.updateLiveStatus('Monitoring for new orders', 'live');
  }
  
  async extractOrderBatch(orderIds) {
    const orderRows = document.querySelectorAll('[data-testid="order-row"]');
    const newOrders = [];
    
    for (const row of orderRows) {
      const orderNumber = this.extractOrderInfo(row, '[data-testid="order-info-subtext"]');
      const customerName = this.extractOrderInfo(row, '.sc-dCesDq.kTVViB > div, .sc-gpaZuh.cMzcnw, h1.sc-khYOSX');
      const orderId = `${orderNumber}_${customerName}`;
      
      if (orderIds.includes(orderId)) {
        try {
          // Extract from preview only - no clicking
          const order = this.extractOrderFromPreview(row);
          
          if (order && order.items.length > 0) {
            order.isNew = true;
            newOrders.push(order);
            
            // Add to batcher
            this.orderBatcher.addOrder(order);
          }
        } catch (error) {
          console.error(`Error extracting order ${orderId}:`, error);
        }
      }
    }
    
    // Update waves with all new orders at once
    if (newOrders.length > 0) {
      this.batchManager.refreshBatchAssignments(newOrders);
      
      // Notify about new orders and their wave assignments
      newOrders.forEach(order => {
        for (const [batchIndex, batch] of this.batchManager.batches.entries()) {
          if (wave.orders.has(order.id)) {
            this.showNotification(
              `NEW ORDER: ${order.customerName} → Batch ${batch.number}`, 
              'warning',
              8000
            );
            // Play notification sound
            this.playNewOrderSound();
            break;
          }
        }
      });
    }
    
    // Update display
    this.render();
  }
  
  extractElapsedTime(orderRow) {
    try {
      const timeContainer = orderRow.querySelector('[data-testid="order-type-time"]');
      if (!timeContainer) {
        console.log('No time container found');
        return 0;
      }
      
      const timeText = timeContainer.textContent;
      console.log('Time text:', timeText);
      
      // Look for time in various formats (this is elapsed time, not wait time)
      let minutes = 0;
      
      // Pattern 1: "10m" or "10 m"
      const minuteMatch = timeText.match(/(\d+)\s*m/i);
      if (minuteMatch) {
        minutes = parseInt(minuteMatch[1]);
      }
      
      // Pattern 2: "1h 5m" or "1 h 5 m"
      const hourMinuteMatch = timeText.match(/(\d+)\s*h\s*(\d*)\s*m?/i);
      if (hourMinuteMatch && !minuteMatch) {
        const hours = parseInt(hourMinuteMatch[1]);
        const mins = hourMinuteMatch[2] ? parseInt(hourMinuteMatch[2]) : 0;
        minutes = hours * 60 + mins;
      }
      
      console.log(`Extracted elapsed time: ${minutes} minutes`);
      return minutes;
    } catch (error) {
      console.error('Error extracting elapsed time:', error);
      return 0;
    }
  }
  
  extractPreviewItems(orderRow) {
    const items = [];
    
    try {
      // Debug logging
      const itemContainer = orderRow.querySelector('.sc-aeBcf.fVhLeR');
      if (itemContainer) {
        console.log('Item container text:', itemContainer.textContent);
      }
      
      // Get the item list text
      const itemListEl = orderRow.querySelector('.sc-aeBcf.fVhLeR > div');
      const itemListText = itemListEl ? itemListEl.textContent.trim() : '';
      
      // Split items - try multiple separators
      let itemNames = [];
      if (itemListText.includes('•')) {
        itemNames = itemListText.split('•').map(name => name.trim()).filter(name => name);
      } else if (itemListText.includes(',')) {
        itemNames = itemListText.split(',').map(name => name.trim()).filter(name => name);
      } else if (itemListText) {
        // If no separator, might be just one item
        itemNames = [itemListText.trim()];
      }
      
      console.log('Extracted item names:', itemNames);
      
      // Create item objects - default all to 'no-size'
      itemNames.forEach(name => {
        if (name && name.length > 0) {
          // Determine size based on item name and category
          let size = 'no-size';
          const lowerName = name.toLowerCase();
          
          if (lowerName.includes('urban bowl')) {
            size = 'urban';
          } else if (lowerName.includes('small')) {
            size = 'small';
          } else if (lowerName.includes('medium')) {
            size = 'medium';
          } else if (lowerName.includes('large')) {
            size = 'large';
          }
          
          const categoryInfo = this.categoryManager.categorizeItem(name, size);
          
          items.push({
            name: name,
            baseName: name,
            size: size,
            quantity: 1,
            price: 0,
            category: categoryInfo.topCategory,
            categoryInfo: categoryInfo
          });
        }
      });
    } catch (error) {
      console.error('Error extracting preview items:', error);
    }
    
    console.log(`Extracted ${items.length} items from preview`);
    return items;
  }
  
  updateLiveStatus(message, status = 'live') {
    const statusElement = this.overlayElement.querySelector('.live-status');
    if (!statusElement) {
      // Create status element if it doesn't exist
      const refreshStatus = this.overlayElement.querySelector('.refresh-status');
      if (refreshStatus) {
        const liveStatus = document.createElement('div');
        liveStatus.className = 'live-status';
        refreshStatus.appendChild(liveStatus);
      }
    }
    
    const statusEl = this.overlayElement.querySelector('.live-status');
    if (statusEl) {
      statusEl.className = `live-status ${status}`;
      statusEl.innerHTML = `
        <span class="live-indicator ${status === 'extracting' ? 'extracting' : ''}"></span>
        <span>${message}</span>
      `;
    }
  }
  
  startAutoRefresh() {
    // Track refresh time
    this.lastRefreshTime = Date.now();
    this.processedOrderIds = new Set();
    this.isExtracting = false;
    this.extractionQueue = [];
    
    // Update refresh timer display
    setInterval(() => {
      const timeSinceRefresh = Math.floor((Date.now() - this.lastRefreshTime) / 1000);
      const refreshElement = this.overlayElement.querySelector('.last-refresh');
      if (refreshElement) {
        if (timeSinceRefresh < 5) {
          refreshElement.textContent = 'Last refresh: Just now';
        } else if (timeSinceRefresh < 60) {
          refreshElement.textContent = `Last refresh: ${timeSinceRefresh} seconds ago`;
        } else {
          const minutes = Math.floor(timeSinceRefresh / 60);
          refreshElement.textContent = `Last refresh: ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
      }
    }, 1000);
    
    // Auto refresh every 15 seconds
    this.autoRefreshInterval = setInterval(() => {
      this.checkForNewOrders();
    }, 15000);
    
    // Cleanup old completed orders every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.batchManager.cleanupCompletedOrders();
      this.batchManager.clearNewOrderStatus();
      this.render(); // Re-render to update UI
    }, 30000);
  }

  adjustPageLayout() {
    try {
      // Wait a bit for the page to fully load
      setTimeout(() => {
        // Find the main content container - Otter uses specific class patterns
        const possibleSelectors = [
          '[class*="LayoutContainer"]',
          '[class*="MainContent"]',
          '[class*="OrdersContainer"]',
          'main',
          '[role="main"]',
          '#root > div > div',
          'body > div:not(#otter-consolidator-overlay):not(.otter-floating-toggle):not(.otter-mode-toggle)'
        ];
        
        let mainContent = null;
        for (const selector of possibleSelectors) {
          const element = document.querySelector(selector);
          if (element && !element.hasAttribute('data-adjusted')) {
            mainContent = element;
            break;
          }
        }
        
        if (!mainContent) {
          // Fallback: find the parent of order rows
          const orderRow = document.querySelector('[data-testid="order-row"]');
          if (orderRow) {
            let parent = orderRow.parentElement;
            while (parent && parent !== document.body) {
              if (parent.offsetWidth > 800) { // Likely the main container
                mainContent = parent;
                break;
              }
              parent = parent.parentElement;
            }
          }
        }
        
        if (mainContent && !mainContent.hasAttribute('data-adjusted')) {
          // Store original styles
          mainContent.setAttribute('data-original-margin', mainContent.style.marginRight || '0');
          mainContent.setAttribute('data-original-width', mainContent.style.width || 'auto');
          
          // Apply new styles to shrink the content
          mainContent.style.marginRight = '600px';
          mainContent.style.width = 'calc(100% - 600px)';
          mainContent.style.transition = 'all 0.3s ease';
          mainContent.setAttribute('data-adjusted', 'true');
          
          console.log('Page layout adjusted for sidebar:', mainContent);
        } else if (!mainContent) {
          console.warn('Could not find main content container to adjust');
        }
      }, 500); // Small delay to ensure page is loaded
    } catch (error) {
      console.error('Error adjusting page layout:', error);
    }
  }
  
  resetPageLayout() {
    try {
      const mainContent = document.querySelector('[data-adjusted="true"]');
      if (mainContent) {
        // Restore original styles
        const originalMargin = mainContent.getAttribute('data-original-margin') || '0';
        const originalWidth = mainContent.getAttribute('data-original-width') || 'auto';
        
        mainContent.style.marginRight = originalMargin;
        mainContent.style.width = originalWidth;
        
        // Clean up attributes
        mainContent.removeAttribute('data-adjusted');
        mainContent.removeAttribute('data-original-margin');
        mainContent.removeAttribute('data-original-width');
        
        console.log('Page layout reset');
      }
    } catch (error) {
      console.error('Error resetting page layout:', error);
    }
  }

  async extractAndRefreshDetailed() {
    // Try React extraction first
    const progress = this.showProgress('Extracting order information...');
    
    try {
      // Save current order IDs before clearing
      const previousOrderIds = new Set();
      this.orderBatcher.getAllOrders().forEach(order => {
        previousOrderIds.add(order.id);
      });
      
      // Clear existing orders
      this.orderBatcher.clearBatches();
      
      // First try React extraction if available
      if (window.otterReactDataExtractor) {
        console.log('[Overlay] Trying React extraction first');
        progress.update('Extracting from React data...');
        
        const reactOrders = await window.otterReactDataExtractor.extractOrders();
        if (reactOrders && reactOrders.length > 0) {
          console.log(`[Overlay] React extraction successful: ${reactOrders.length} orders`);
          
          // Process React orders to add proper categoryInfo
          reactOrders.forEach((order, orderIndex) => {
            try {
              console.log(`[Overlay] Processing order ${orderIndex + 1}/${reactOrders.length}: ${order.orderNumber}`);
              // Update each item with proper categoryInfo
              if (order.items) {
              order.items = order.items.map(item => {
                console.log(`[Overlay] Processing item: ${item.name}, size: ${item.size}, existing category: ${item.category}`);
                
                // Enhanced debug for rice bowls
                if (item.name && item.name.toLowerCase().includes('rice bowl')) {
                  console.log(`[RICE BOWL FLOW] At overlay processing:`);
                  console.log(`[RICE BOWL FLOW] Item name: ${item.name}`);
                  console.log(`[RICE BOWL FLOW] Item size: ${item.size}`);
                  console.log(`[RICE BOWL FLOW] Size type: ${typeof item.size}`);
                  console.log(`[RICE BOWL FLOW] Size value passed to categorizer: ${item.size || 'no-size'}`);
                }
                
                try {
                  const categoryInfo = this.categoryManager.categorizeItem(
                    item.name, 
                    item.size || 'no-size',
                    item.modifiers || {}
                  );
                  
                  console.log(`[Overlay] Categorized as: ${categoryInfo.displayCategory}, topCategory: ${categoryInfo.topCategory}`);
                  console.log(`[Overlay] Full categoryInfo:`, JSON.stringify(categoryInfo));
                  
                  return {
                    ...item,
                    category: categoryInfo.topCategory,
                    categoryInfo: categoryInfo // Add full category info
                  };
                } catch (error) {
                  console.error(`[Overlay] Error categorizing item ${item.name}:`, error);
                  // Return item with default category if categorization fails
                  return {
                    ...item,
                    category: 'other',
                    categoryInfo: {
                      topCategory: 'other',
                      subCategory: 'other',
                      topCategoryName: 'Other',
                      subCategoryName: 'Other',
                      displayCategory: 'Other',
                      sizeCategory: 'other',
                      proteinCategory: 'other',
                      sizeName: 'Other',
                      proteinName: 'Other'
                    }
                  };
                }
              });
            }
            this.orderBatcher.addOrder(order);
            } catch (orderError) {
              console.error(`[Overlay] Error processing order ${order.orderNumber}:`, orderError);
              // Still try to add the order even if categorization failed
              this.orderBatcher.addOrder(order);
            }
          });
          
          progress.update(`Extracted ${reactOrders.length} orders from React`);
          
          // Update batch assignments with the orders
          const allOrders = this.orderBatcher.getAllOrders();
          this.batchManager.refreshBatchAssignments(allOrders);
          
          // Check for orders that were present before but are missing now
          const currentOrderIds = new Set(reactOrders.map(o => o.id));
          const missingOrders = [];
          previousOrderIds.forEach(oldId => {
            if (!currentOrderIds.has(oldId)) {
              missingOrders.push(oldId);
            }
          });
          
          if (missingOrders.length > 0) {
            console.log(`[Overlay] ${missingOrders.length} orders are no longer present:`, missingOrders);
            // Don't mark as completed here since they're already gone
          }
          
          setTimeout(() => progress.remove(), 1000);
          
          this.render();
          this.showNotification(`Loaded ${reactOrders.length} orders from React`, 'success');
          
          // Mark React extraction as successful
          if (window.reactExtractionSuccessful !== undefined) {
            window.reactExtractionSuccessful = true;
          }
          
          return;
        }
      }
      
      // No DOM extraction fallback - React is the primary method
      console.log('[Overlay] React extraction failed or returned no orders');
      progress.remove();
      
      this.showNotification('No orders found. Make sure you are on the orders page.', 'warning');
      
    } catch (error) {
      console.error('Error in detailed extraction:', error);
      progress.remove();
      this.showNotification('Error during detailed extraction', 'error');
    }
  }
  
  completeBatch(batchIndex) {
    const wave = this.batchManager.waves[waveIndex];
    if (!wave || wave.orders.size === 0) return;
    
    const orderCount = wave.orders.size;
    const itemCount = wave.items.size;
    
    if (confirm(`Complete Batch ${batch.number} with ${orderCount} orders and ${itemCount} items?`)) {
      // Clear the wave
      wave.orders.clear();
      wave.items.clear();
      wave.status = 'completed';
      wave.completedAt = Date.now();
      
      // Re-render
      this.render();
      
      this.showNotification(`Wave ${wave.number} completed!`, 'success');
    }
  }
  
  playNewOrderSound() {
    // Create a simple beep sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      gainNode.gain.value = 0.3; // Volume
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // Play for 200ms
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }
  
  async destroy() {
    // Release scraping role if we own it
    if (this.isScrapingMode) {
      const result = await chrome.storage.local.get('scrapingTabId');
      if (result.scrapingTabId === this.tabId) {
        await chrome.storage.local.remove('scrapingTabId');
        console.log('Released scraping role on destroy');
      }
    }
    
    // Remove data listener
    if (this.dataListener) {
      chrome.storage.onChanged.removeListener(this.dataListener);
    }
    
    if (this.overlayElement) {
      this.overlayElement.remove();
    }
    
    // Remove toggle button
    const toggleBtn = document.getElementById('otter-consolidator-toggle');
    if (toggleBtn) {
      toggleBtn.remove();
    }
    
    // Remove mode toggle button
    const modeBtn = document.getElementById('otter-mode-toggle');
    if (modeBtn) {
      modeBtn.remove();
    }
    
    // Clear all intervals
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    if (this.liveCheckInterval) {
      clearInterval(this.liveCheckInterval);
    }
    if (this.fullRefreshInterval) {
      clearInterval(this.fullRefreshInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.resetPageLayout();
  }
  
  async checkScrapingMode(userChoice = null) {
    // If user made explicit choice, use that
    if (userChoice !== null) {
      this.isScrapingMode = userChoice;
      
      if (this.isScrapingMode) {
        // User chose scraping mode - claim the role
        await chrome.storage.local.set({ 
          scrapingTabId: this.tabId,
          scrapingMode: true 
        });
      } else {
        // User chose view-only mode
        this.isScrapingMode = false;
      }
    } else {
      // No user choice - use automatic assignment (backward compatibility)
      const result = await chrome.storage.local.get(['scrapingTabId', 'scrapingMode']);
      
      if (result.scrapingTabId && result.scrapingTabId !== this.tabId) {
        // Another tab is scraping
        this.isScrapingMode = false;
      } else if (result.scrapingMode === false) {
        // Scraping is disabled globally
        this.isScrapingMode = false;
      } else {
        // This tab can scrape
        this.isScrapingMode = true;
        // Claim scraping role
        await chrome.storage.local.set({ scrapingTabId: this.tabId });
      }
    }
    
    this.updateModeIndicator();
    
    // Set up appropriate data handling based on mode
    if (this.isScrapingMode) {
      // Initialize processed orders tracking
      this.initializeProcessedOrders();
      // Start monitoring will be called from content.js after extraction
      console.log('Scraping mode confirmed - ready to extract');
    } else {
      // Listen for data from scraping tab
      this.listenForOrderData();
      console.log('View-only mode confirmed - listening for data sync');
    }
  }
  
  async toggleScrapingMode() {
    this.isScrapingMode = !this.isScrapingMode;
    
    if (this.isScrapingMode) {
      // Claim scraping role
      await chrome.storage.local.set({ 
        scrapingTabId: this.tabId,
        scrapingMode: true 
      });
      this.showNotification('Scraping mode enabled', 'success');
      
      // Initialize processed orders tracking
      this.initializeProcessedOrders();
      
      // Start live monitoring
      this.startLiveMonitoring();
      
      // Do initial extraction
      this.extractAndRefreshDetailed();
    } else {
      // Release scraping role if we own it
      const result = await chrome.storage.local.get('scrapingTabId');
      if (result.scrapingTabId === this.tabId) {
        await chrome.storage.local.remove('scrapingTabId');
      }
      await chrome.storage.local.set({ scrapingMode: false });
      this.showNotification('View-only mode enabled', 'info');
      
      // Stop live monitoring
      this.stopLiveMonitoring();
      
      // Listen for data updates
      this.listenForOrderData();
      
      // Request current data
      this.requestDataSync();
    }
    
    this.updateModeIndicator();
  }
  
  updateModeIndicator() {
    const modeBtn = document.getElementById('otter-mode-toggle');
    if (modeBtn) {
      modeBtn.innerHTML = this.isScrapingMode ? '🔍' : '👁️';
      modeBtn.title = this.isScrapingMode ? 'Scraping Mode Active - Click to disable' : 'View Only Mode - Click to enable scraping';
      modeBtn.style.background = this.isScrapingMode ? '#28a745' : '#6c757d';
    }
    
    // Update refresh button visibility
    const refreshBtn = this.overlayElement?.querySelector('#manual-refresh');
    if (refreshBtn) {
      refreshBtn.style.display = this.isScrapingMode ? 'block' : 'none';
    }
    
    // Update status indicator
    const liveStatus = this.overlayElement?.querySelector('.live-status');
    if (liveStatus) {
      if (this.isScrapingMode) {
        liveStatus.className = 'live-status live';
        liveStatus.innerHTML = '<span class="live-indicator"></span><span>Monitoring for new orders</span>';
      } else {
        liveStatus.className = 'live-status';
        liveStatus.innerHTML = '<span>View-only mode</span>';
      }
    }
  }
  
  startLiveMonitoring() {
    if (!this.isScrapingMode) return;
    
    // Start periodic checks for new orders
    if (!this.liveCheckInterval) {
      this.liveCheckInterval = setInterval(() => {
        this.checkForNewOrders();
      }, 10000); // Check every 10 seconds
    }
    
    // Start periodic full refresh
    if (!this.fullRefreshInterval) {
      this.fullRefreshInterval = setInterval(() => {
        this.extractAndRefreshDetailed();
      }, 300000); // Full refresh every 5 minutes
    }
  }
  
  stopLiveMonitoring() {
    if (this.liveCheckInterval) {
      clearInterval(this.liveCheckInterval);
      this.liveCheckInterval = null;
    }
    
    if (this.fullRefreshInterval) {
      clearInterval(this.fullRefreshInterval);
      this.fullRefreshInterval = null;
    }
  }
  
  async broadcastOrderData() {
    if (!this.isScrapingMode) return;
    
    // Get current order data
    const orders = this.orderBatcher.getAllOrders();
    
    // Convert batches Maps to plain objects for Chrome messaging
    const batchesData = this.batchManager.batches.map(batch => ({
      ...batch,
      orders: Object.fromEntries(batch.orders || new Map()),
      items: Object.fromEntries(batch.items || new Map())
    }));
    
    // Use Chrome runtime messaging to broadcast to other tabs
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'broadcastOrders',
        orders: orders,
        batches: batchesData,
        extractionTime: Date.now()
      });
      
      if (response && response.success) {
        console.log('[Overlay] Successfully broadcast order data');
      } else if (response) {
        console.error('[Overlay] Failed to broadcast:', response.error);
      }
    } catch (error) {
      // Extension context invalid - ignore error
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.log('[Overlay] Extension context invalid - skipping broadcast');
      } else {
        console.error('[Overlay] Error broadcasting order data:', error);
      }
    }
  }
  
  async listenForOrderData() {
    if (this.isScrapingMode) return;
    
    // Remove existing listener if any
    if (this.dataListener) {
      chrome.storage.onChanged.removeListener(this.dataListener);
    }
    
    // Create new listener
    this.dataListener = (changes, namespace) => {
      if (namespace === 'local' && changes.sharedOrderData) {
        const data = changes.sharedOrderData.newValue;
        if (data && data.sourceTabId !== this.tabId) {
          console.log('Received data sync from tab:', data.sourceTabId);
          // Update local data with received data
          this.updateFromSharedData(data);
        }
      }
    };
    
    // Listen for data updates from scraping tab
    chrome.storage.onChanged.addListener(this.dataListener);
  }
  
  updateFromSharedData(data) {
    // Update order batcher with new data
    if (data.orders) {
      this.orderBatcher.clearBatches();
      data.orders.forEach(order => {
        this.orderBatcher.addOrder(order);
      });
    }
    
    // Update batches - need to reconstruct Maps from plain objects
    if (data.batches) {
      this.batchManager.batches = data.batches.map(batch => ({
        ...batch,
        orders: new Map(Object.entries(batch.orders || {})),
        items: new Map(Object.entries(batch.items || {}))
      }));
    }
    
    // Re-render UI
    this.render();
    
    // Update last refresh time
    const refreshInfo = this.overlayElement?.querySelector('.last-refresh');
    if (refreshInfo) {
      refreshInfo.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
    }
  }
  
  async requestDataSync() {
    // Request current data from scraping tab
    console.log('Requesting data sync from scraping tab...');
    
    // Check if there's data available
    const result = await chrome.storage.local.get('sharedOrderData');
    if (result.sharedOrderData) {
      console.log('Found shared data, syncing...');
      this.updateFromSharedData(result.sharedOrderData);
    } else {
      console.log('No shared data available yet');
      this.showNotification('Waiting for scraping tab to share data...', 'info');
    }
  }
  
  updateModeIndicator() {
    // Update the mode toggle button to reflect current state
    const modeToggle = document.querySelector('.otter-mode-toggle');
    if (modeToggle) {
      const icon = this.isScrapingMode ? '🔍' : '👁️';
      const text = this.isScrapingMode ? 'Leader' : 'Follower';
      modeToggle.innerHTML = `${icon} ${text}`;
      modeToggle.title = this.isScrapingMode ? 
        'This tab is the leader (extracting orders)' : 
        'This tab is a follower (view-only)';
    }
  }
  
  startOrderChangeMonitoring() {
    if (this.orderChangeObserver) {
      this.orderChangeObserver.disconnect();
    }
    
    console.log('Starting order change monitoring...');
    
    // Find the container that holds order rows
    const orderContainer = document.querySelector('main') || document.body;
    
    this.orderChangeObserver = new MutationObserver((mutations) => {
      // Only process if we're in scraping mode
      if (!this.isScrapingMode) return;
      
      // Debounce rapid changes
      if (this.changeDebounceTimer) {
        clearTimeout(this.changeDebounceTimer);
      }
      
      this.changeDebounceTimer = setTimeout(() => {
        this.detectOrderChanges();
      }, 500);
    });
    
    // Start observing
    this.orderChangeObserver.observe(orderContainer, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    this.isMonitoringChanges = true;
    console.log('Order change monitoring started');
  }
  
  detectOrderChanges() {
    // Check if we're on the cooking tab
    const cookingTab = Array.from(document.querySelectorAll('button, a')).find(el => 
                        el.textContent && el.textContent.includes('Cooking'));
    
    // More comprehensive check for active tab
    const isOnCookingTab = cookingTab && (
      cookingTab.classList.contains('active') || 
      cookingTab.getAttribute('aria-selected') === 'true' ||
      cookingTab.getAttribute('data-state') === 'active' ||
      window.location.href.includes('cooking') ||
      // Check if Cooking tab shows orders count > 0
      (cookingTab.textContent.match(/\((\d+)\)/) && cookingTab.textContent.match(/\((\d+)\)/)[1] !== '0')
    );
    
    // Always log the detection status for debugging
    console.log('[OrderMonitoring] Cooking tab detection:', {
      cookingTab: !!cookingTab,
      isOnCookingTab: isOnCookingTab,
      tabText: cookingTab?.textContent,
      location: window.location.href
    });
    
    // For now, always run detection regardless of tab
    // if (!isOnCookingTab) {
    //   console.log('[OrderMonitoring] Not on cooking tab, skipping change detection');
    //   return;
    // }
    
    // Find all current order rows
    const currentOrderRows = document.querySelectorAll('[data-testid="order-row"]');
    const currentOrderIds = new Set();
    let hasChanges = false;
    
    // Extract order IDs from current DOM
    currentOrderRows.forEach(row => {
      // Try to find order ID from React props
      const fiber = this.findReactFiber(row);
      if (fiber?.memoizedProps?.order?.id) {
        currentOrderIds.add(fiber.memoizedProps.order.id);
      } else {
        // Fallback to extracting from DOM text
        const orderNumElement = row.querySelector('[data-testid="order-info-subtext"]');
        if (orderNumElement) {
          const orderText = orderNumElement.textContent;
          const match = orderText.match(/#([A-Z0-9]+)/);
          if (match) {
            currentOrderIds.add(match[1]);
          }
        }
      }
    });
    
    // Check if order count changed
    if (currentOrderIds.size !== this.lastOrderCount) {
      hasChanges = true;
      console.log(`Order count changed: ${this.lastOrderCount} → ${currentOrderIds.size}`);
    }
    
    // Check for added/removed orders
    const addedOrders = [];
    const removedOrders = [];
    
    currentOrderIds.forEach(id => {
      if (!this.lastOrderIds.has(id)) {
        addedOrders.push(id);
      }
    });
    
    this.lastOrderIds.forEach(id => {
      if (!currentOrderIds.has(id)) {
        removedOrders.push(id);
      }
    });
    
    if (addedOrders.length > 0 || removedOrders.length > 0) {
      hasChanges = true;
      
      if (addedOrders.length > 0) {
        console.log('New orders detected:', addedOrders);
        this.showNotification(`${addedOrders.length} new order${addedOrders.length > 1 ? 's' : ''} added`, 'info');
      }
      
      if (removedOrders.length > 0) {
        console.log('Orders removed:', removedOrders);
        
        // Mark orders as completed in batch manager
        removedOrders.forEach(orderId => {
          this.batchManager.markOrderCompleted(orderId);
          console.log(`[OrderMonitoring] Marked order ${orderId} as completed`);
        });
        
        this.showNotification(`${removedOrders.length} order${removedOrders.length > 1 ? 's' : ''} completed`, 'success');
        
        // Re-render immediately to show strikethrough
        this.render();
      }
    }
    
    // Update tracking
    this.lastOrderCount = currentOrderIds.size;
    this.lastOrderIds = currentOrderIds;
    
    // If changes detected, handle them appropriately
    if (hasChanges) {
      // If only orders were removed (completed), just re-render
      // If new orders were added, do a full refresh
      if (removedOrders.length > 0 && addedOrders.length === 0) {
        // Just re-render to show completed styling
        this.render();
      } else {
        // New orders added, do full refresh
        this.handleAutoRefresh();
      }
    }
  }
  
  handleAutoRefresh() {
    console.log('Auto-refreshing due to order changes...');
    
    // Show update indicator
    const header = this.overlayElement?.querySelector('.otter-header');
    if (header) {
      const updateIndicator = document.createElement('div');
      updateIndicator.className = 'update-indicator';
      updateIndicator.style.cssText = `
        position: absolute;
        top: 50%;
        right: 15px;
        transform: translateY(-50%);
        background: #28a745;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        animation: pulse 1s ease-in-out;
      `;
      updateIndicator.textContent = 'Updating...';
      header.appendChild(updateIndicator);
      
      // Remove after animation
      setTimeout(() => updateIndicator.remove(), 2000);
    }
    
    // Trigger the refresh
    const refreshButton = Array.from(this.overlayElement?.querySelectorAll('button') || [])
      .find(btn => btn.textContent.includes('Refresh Now'));
    if (refreshButton) {
      refreshButton.click();
    } else {
      // Direct extraction if button not found
      window.extractAndBatchOrders?.(false);
    }
  }
  
  clearCompletedOrders() {
    console.log('[OverlayUI] Clearing completed orders and cache...');
    
    // Clear all caches
    if (window.otterOrderCache) {
      window.otterOrderCache.clear();
      console.log('[OverlayUI] Cleared order cache');
    }
    
    if (window.categoryCache) {
      window.categoryCache.clear();
      console.log('[OverlayUI] Cleared category cache');
    }
    
    // Clear localStorage items related to the extension
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('otter') || key.includes('order') || key.includes('batch'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[OverlayUI] Cleared ${keysToRemove.length} localStorage items`);
    } catch (e) {
      console.error('[OverlayUI] Error clearing localStorage:', e);
    }
    
    // Clear all batches and orders
    let totalCleared = 0;
    
    // Clear batch manager
    if (this.batchManager) {
      // Count all orders (not just completed)
      this.batchManager.batches.forEach(batch => {
        totalCleared += batch.orders.size;
      });
      
      // Clear all batches
      this.batchManager.batches = [];
      this.batchManager.currentBatchIndex = 0;
      this.batchManager.nextBatchNumber = 1;
      
      // Reinitialize with first batch
      this.batchManager.initializeBatches();
    }
    
    // Clear order batcher
    if (this.orderBatcher) {
      if (this.orderBatcher.orders) {
        this.orderBatcher.orders.clear();
      }
      if (this.orderBatcher.batches) {
        this.orderBatcher.batches.clear();
      }
    }
    
    // Clear any extraction queue
    if (this.extractionQueue) {
      this.extractionQueue = [];
    }
    
    // Clear processed order IDs
    if (this.processedOrderIds) {
      this.processedOrderIds.clear();
    }
    
    // Clear last order IDs
    if (this.lastOrderIds) {
      this.lastOrderIds.clear();
    }
    
    // Show notification
    if (totalCleared > 0) {
      this.showNotification(`Cleared ${totalCleared} orders and all cache data`, 'success');
    } else {
      this.showNotification('Cleared all cache data', 'success');
    }
    
    // Refresh the display
    this.render();
    
    // Optionally trigger a fresh data extraction after a short delay
    setTimeout(() => {
      const refreshBtn = document.querySelector('#manual-refresh');
      if (refreshBtn && this.isScrapingMode) {
        refreshBtn.click();
      }
    }, 500);
  }
  
  findReactFiber(element) {
    const key = Object.keys(element).find(key => key.startsWith('__reactFiber'));
    return element[key];
  }
  
  async handlePrintLabels(batchId) {
    console.log('[OverlayUI] Print labels requested for batch:', batchId);
    
    try {
      // Find batch in array
      const batch = this.batchManager.batches.find(b => b.id === batchId);
      if (!batch) {
        this.showNotification('Batch not found', 'error');
        return;
      }
      
      // Show preview first
      const previewData = await this.batchLabelPrinter.previewBatchLabels(batch, this.batchManager);
      
      // Confirm with user
      const confirmed = confirm(`Print ${previewData.totalLabels} labels for ${previewData.customerCount} customers in ${batch.name}?`);
      
      if (confirmed) {
        // Show progress
        this.showNotification(`Preparing ${previewData.totalLabels} labels...`, 'info');
        
        // Print the labels
        const result = await this.batchLabelPrinter.printBatchLabels(batch, this.batchManager);
        
        if (result.success) {
          this.showNotification(`Opened label printer with ${result.labelCount} labels`, 'success');
        } else {
          this.showNotification(`Error: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('[OverlayUI] Error handling print labels:', error);
      this.showNotification('Failed to print labels', 'error');
    }
  }
  
  async handlePrintOrderLabels(orderId) {
    console.log('[OverlayUI] Print labels requested for order:', orderId);
    
    try {
      // Get order data
      const orderData = this.orderBatcher.getOrderById(orderId);
      if (!orderData) {
        this.showNotification('Order not found', 'error');
        return;
      }
      
      // Create a temporary batch-like structure for single order
      const singleOrderBatch = {
        id: `order_${orderId}`,
        name: `Order #${orderData.orderNumber}`,
        restaurantName: orderData.restaurantName,
        items: {}
      };
      
      // Get all items for this order
      const batchedItems = this.orderBatcher.getBatchedItems();
      
      // Filter items that belong to this order
      batchedItems.forEach(item => {
        const orderItem = item.orders.find(o => o.orderId === orderId);
        if (orderItem) {
          const category = item.category || 'Other';
          if (!singleOrderBatch.items[category]) {
            singleOrderBatch.items[category] = {};
          }
          
          const itemKey = this.orderBatcher.itemMatcher.generateItemKey(
            item.name, 
            item.size, 
            item.category, 
            item.riceSubstitution
          );
          
          singleOrderBatch.items[category][itemKey] = {
            ...item,
            orders: [{
              orderId: orderId,
              quantity: orderItem.quantity,
              customerName: orderData.customerName,
              orderNumber: orderData.orderNumber,
              recipientName: orderData.recipientName || orderData.customerName,
              orderNotes: orderData.orderNotes
            }],
            totalQuantity: orderItem.quantity
          };
        }
      });
      
      // Count total items
      let totalItems = 0;
      Object.values(singleOrderBatch.items).forEach(categoryItems => {
        Object.values(categoryItems).forEach(item => {
          totalItems += item.totalQuantity;
        });
      });
      
      // Confirm with user
      const customerName = orderData.recipientName || orderData.customerName;
      const confirmed = confirm(`Print ${totalItems} labels for ${customerName} (Order #${orderData.orderNumber})?`);
      
      if (confirmed) {
        // Show progress
        this.showNotification(`Preparing ${totalItems} labels for ${customerName}...`, 'info');
        
        // Print the labels
        const result = await this.batchLabelPrinter.printBatchLabels(singleOrderBatch, this.batchManager);
        
        if (result.success) {
          this.showNotification(`Opened label printer with ${result.labelCount} labels`, 'success');
        } else {
          this.showNotification(`Error: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('[OverlayUI] Error handling print order labels:', error);
      this.showNotification('Failed to print order labels', 'error');
    }
  }
}

// Make available globally
window.OverlayUI = OverlayUI;