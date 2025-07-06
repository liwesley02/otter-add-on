// Version: Fixed syntax errors - 2024
// Last updated: 2024-01-01T00:00:00.000Z
console.log('[OverlayUI] Loading version 1.0.1 - syntax fixed');
class OverlayUI {
  constructor(orderBatcher, categoryManager, batchManager, orderExtractor) {
    this.orderBatcher = orderBatcher;
    this.categoryManager = categoryManager;
    this.batchManager = batchManager;
    this.orderExtractor = orderExtractor;
    this.isCollapsed = false;
    this.selectedSize = 'all';
    this.overlayElement = null;
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
    } catch (error) {
      console.error('Critical error in OverlayUI init:', error);
      // Try to show error to user
      this.showInitError(error);
    }
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
  
  renderBatchView() {
    const container = this.overlayElement?.querySelector('#batch-view');
    if (!container) {
      console.warn('Batch view container not found');
      return;
    }
    
    try {
      let html = '';
    
    // Add refresh status indicator with mode info
    const modeText = this.isScrapingMode ? 'SCRAPING MODE' : 'VIEW-ONLY MODE';
    const modeClass = this.isScrapingMode ? 'scraping' : 'view-only';
    
    html += `
      <div class="refresh-status">
        <div class="mode-status ${modeClass}">
          <strong>${modeText}</strong> - Tab ID: ${this.tabId}
        </div>
        <div class="refresh-info">
          <span>${this.isScrapingMode ? 'Live updates: Every 10 seconds' : 'Syncing from scraping tab'}</span>
          <span class="last-refresh">Last refresh: Just now</span>
        </div>
        <div class="live-status ${this.isScrapingMode ? 'live' : ''}">
          <span class="live-indicator"></span>
          <span>${this.isScrapingMode ? 'Monitoring for new orders' : 'View-only mode'}</span>
        </div>
      </div>
    `;
    
    // Add batch controls
    html += `
      <div class="batch-controls">
        <div class="batch-capacity-control">
          <label for="batch-capacity">Orders per batch:</label>
          <input type="number" id="batch-capacity" class="batch-capacity-input" 
                 value="${this.batchManager.maxBatchCapacity}" min="1" max="20">
        </div>
        <button class="refresh-btn" id="manual-refresh">
          🔄 Refresh Now
        </button>
      </div>
    `;
    
    // Render each batch (skip completed batches)
    this.batchManager.batches.forEach((batch, index) => {
      if (batch.status === 'completed') return; // Skip completed batches
      const itemCount = batch.items.size;
      // Handle batch.orders as either Map or plain object (after Chrome messaging)
      const ordersMap = batch.orders instanceof Map ? batch.orders : new Map(Object.entries(batch.orders || {}));
      const orderCount = ordersMap.size;
      const urgencyClass = this.batchManager.getBatchUrgency(batch);
      const sizeGroups = this.batchManager.getBatchBySize(index);
      
      // Calculate oldest order wait time for display (excluding completed)
      let oldestWaitTime = 0;
      let activeOrderCount = 0;
      console.log(`Batch ${batch.number} orders:`, ordersMap.size);
      ordersMap.forEach((order, orderId) => {
        console.log(`  Order ${orderId}: wait time = ${order.waitTime}m, completed = ${order.completed}`);
        if (!order.completed) {
          activeOrderCount++;
          if (order.waitTime > oldestWaitTime) {
            oldestWaitTime = order.waitTime;
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
        
        // Get customers sorted by wait time (oldest first - FIFO)
        const customers = Array.from(batch.orders.values()).sort((a, b) => {
          // Sort by wait time descending (higher wait time = older = should be first)
          return (b.waitTime || 0) - (a.waitTime || 0);
        });
        customers.forEach(order => {
          const orderClass = order.completed ? 'order-completed' : (order.isNew ? 'order-new' : '');
          html += `
            <div class="batch-customer-badge ${orderClass}">
              <span class="customer-name">${order.customerName}</span>
              <span class="customer-order">${order.number}</span>
              <span class="customer-wait-time">${order.waitTime || 0}m</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      // Render items grouped by size
      Object.entries(sizeGroups).forEach(([sizeKey, sizeGroup]) => {
        if (sizeGroup.items.length > 0) {
          html += `
            <div class="wave-size-group">
              <h4 class="wave-size-header">${sizeGroup.name}</h4>
              <div class="wave-items-list">
          `;
          
          // Group items by category within size
          const byCategory = {};
          sizeGroup.items.forEach(item => {
            const category = item.category || 'uncategorized';
            if (!byCategory[category]) {
              byCategory[category] = [];
            }
            byCategory[category].push(item);
          });
          
          // Render each category
          Object.entries(byCategory).forEach(([category, items]) => {
            const categoryName = this.categoryManager.getCategoryDisplay(category);
            html += `
              <div class="wave-category-group">
                <h5 class="wave-category-header ${category}">${categoryName}</h5>
                <ul class="wave-item-list">
            `;
            
            items.forEach(item => {
              // Check if any order associated with this item is overdue (15+ minutes)
              let isOverdue = false;
              let maxWaitTime = 0;
              
              if (item.orderIds && batch.orders) {
                item.orderIds.forEach(orderId => {
                  const order = batch.orders.get ? batch.orders.get(orderId) : batch.orders[orderId];
                  if (order && !order.completed && order.waitTime) {
                    maxWaitTime = Math.max(maxWaitTime, order.waitTime);
                    if (order.waitTime >= 15) {
                      isOverdue = true;
                    }
                  }
                });
              }
              
              const itemClass = isOverdue ? 'wave-item overdue' : 'wave-item';
              
              html += `
                <li class="${itemClass}">
                  <span class="wave-item-quantity">${item.batchQuantity || item.totalQuantity || 0}x</span>
                  <span class="wave-item-name">${item.baseName || item.name}</span>
                  ${item.size && item.size !== 'no-size' ? `<span class="item-size">${item.size}</span>` : ''}
                  ${item.fromCache ? '<span class="api-badge" title="Data from API">API</span>' : ''}
                  ${item.isUrbanBowl ? '<span class="urban-bowl-badge">Urban</span>' : ''}
                  ${isOverdue ? `<span class="item-wait-time">${maxWaitTime}m</span>` : ''}
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
      
      // Batch actions
      // Batch actions removed - batches lock automatically when full
      
      html += `
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
    // Attach event listeners
    // Add complete wave button listeners
    container.querySelectorAll('.complete-wave-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const batchIndex = parseInt(e.target.dataset.batchIndex);
        this.completeBatch(batchIndex);
      });
    });
    
    // Add wave capacity change listener
    const capacityInput = container.querySelector('#batch-capacity');
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
    const refreshBtn = container.querySelector('#manual-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (!this.isScrapingMode) {
          this.showNotification('Enable scraping mode to refresh orders', 'warning');
          return;
        }
        
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
        
        // Always use detailed extraction to get actual sizes
        this.extractAndRefreshDetailed().then(() => {
          refreshBtn.classList.remove('refreshing');
          refreshBtn.disabled = false;
        })
      });
    }
    } catch (error) {
      console.error('Error in renderBatchView:', error);
      // Show error in the container if possible
      if (container) {
        container.innerHTML = '<div style="padding: 20px; color: #dc3545;">Error rendering view. Please refresh.</div>';
      }
    }
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
          Batch ${batch.number}
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
    const sizeGroups = this.orderBatcher.getBatchesBySize();
    
    let html = '';
    
    if (this.selectedSize === 'all') {
      // Show all sizes with their categories
      Object.entries(sizeGroups).forEach(([sizeKey, sizeGroup]) => {
        if (Object.keys(sizeGroup.categories).length > 0) {
          html += this.renderSizeSection(sizeKey, sizeGroup);
        }
      });
    } else {
      // Show only selected size
      const sizeGroup = sizeGroups[this.selectedSize];
      if (sizeGroup && Object.keys(sizeGroup.categories).length > 0) {
        html += this.renderSizeSection(this.selectedSize, sizeGroup, true);
      } else {
        html = '<p class="no-items">No items in this size</p>';
      }
    }
    
    container.innerHTML = html || '<p class="no-items">No orders yet</p>';
    
    container.querySelectorAll('.add-to-wave').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemKey = e.target.dataset.itemKey;
        const itemData = JSON.parse(e.target.dataset.itemData);
        this.addToWave(itemKey, itemData);
      });
    });
  }

  renderSizeSection(sizeKey, sizeGroup, hideHeader = false) {
    let html = '';
    
    if (!hideHeader) {
      html += `<div class="size-section">
        <h4 class="size-header">${sizeGroup.name}</h4>`;
    }
    
    // Render each category within this size
    Object.entries(sizeGroup.categories).forEach(([category, items]) => {
      if (items.length > 0) {
        const categoryName = this.categoryManager.getCategoryDisplay(category);
        html += `
          <div class="category-section ${category}">
            <h5 class="category-header">${categoryName}</h5>
            <div class="item-list">
        `;
        
        items.forEach(item => {
          const itemKey = this.orderBatcher.itemMatcher.generateItemKey(item.name, item.size, item.category);
          const itemDataStr = JSON.stringify({
            name: item.name,
            size: item.size,
            category: item.category,
            price: item.price
          });
          
          // Check if any orders for this item are new
          const hasNewOrders = item.orders.some(order => {
            const orderData = this.orderBatcher.getOrderById(order.orderId);
            return orderData && orderData.isNew;
          });
          
          html += `
            <div class="batch-item ${hasNewOrders ? 'new-item' : ''}">
              <div class="item-info">
                ${hasNewOrders ? '<span class="new-badge">NEW</span>' : ''}
                <span class="item-name">${item.name}</span>
                ${item.isUrbanBowl ? '<span class="urban-bowl-badge">Urban</span>' : ''}
                ${item.riceSubstitution && item.isUrbanBowl ? `<span class="rice-sub-indicator">${item.riceSubstitution}</span>` : ''}
                <span class="item-quantity">×${item.totalQuantity}</span>
              </div>
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
        
        html += '</div></div>';
      }
    });
    
    if (!hideHeader) {
      html += '</div>';
    }
    
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
            console.log(`Order ${index + 1}: ${order.customerName} - ${order.items.length} items, wait time: ${order.waitTime}m`);
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
      
      this.showNotification(`Refreshed ${orders.length} orders`, 'success');
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
      const waitTime = this.extractWaitTime(orderRow);
      const items = this.extractPreviewItems(orderRow);
      
      return {
        id: orderId,
        number: orderNumber,
        customerName: customerName,
        timestamp: Date.now(),
        waitTime: waitTime,
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
      
      // Do a full refresh with detailed extraction to get actual sizes
      await this.extractAndRefreshDetailed();
      
      this.updateLiveStatus('Monitoring for new orders', 'live');
      
      // Broadcast updated data to other tabs
      await this.broadcastOrderData();
      
    } catch (error) {
      console.error('Error checking for new orders:', error);
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
  
  extractWaitTime(orderRow) {
    try {
      const timeContainer = orderRow.querySelector('[data-testid="order-type-time"]');
      if (!timeContainer) {
        console.log('No time container found');
        return 0;
      }
      
      const timeText = timeContainer.textContent;
      console.log('Time text:', timeText);
      
      // Look for time in various formats
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
      
      console.log(`Extracted wait time: ${minutes} minutes`);
      return minutes;
    } catch (error) {
      console.error('Error extracting wait time:', error);
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
          items.push({
            name: name,
            baseName: name,
            size: 'no-size', // Will be updated by detailed extraction
            quantity: 1,
            price: 0,
            category: this.categoryManager.categorizeItem(name)
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
  }

  adjustPageLayout() {
    try {
      // Find the main content container more specifically
      // Look for the main app container that holds the orders
      const mainContent = document.querySelector('[class*="App"]:not(#otter-consolidator-overlay)') || 
                         document.querySelector('div[data-testid="app-container"]') ||
                         document.querySelector('#root > div') ||
                         document.querySelector('body > div:not(#otter-consolidator-overlay)');
      
      if (mainContent && !mainContent.hasAttribute('data-adjusted')) {
        mainContent.style.marginRight = '400px';
        mainContent.style.transition = 'margin-right 0.3s ease';
        mainContent.setAttribute('data-adjusted', 'true');
        console.log('Page layout adjusted for sidebar');
      }
    } catch (error) {
      console.error('Error adjusting page layout:', error);
    }
  }
  
  resetPageLayout() {
    try {
      const mainContent = document.querySelector('[data-adjusted="true"]');
      if (mainContent) {
        mainContent.style.marginRight = '';
        mainContent.removeAttribute('data-adjusted');
      }
    } catch (error) {
      console.error('Error resetting page layout:', error);
    }
  }

  async extractAndRefreshDetailed() {
    // Detailed extraction with clicking for sizes
    const progress = this.showProgress('Extracting detailed order information...');
    
    try {
      // Clear existing orders
      this.orderBatcher.clearBatches();
      
      // Use the detailed extraction from orderExtractor
      const orders = [];
      const orderRows = document.querySelectorAll('[data-testid="order-row"]');
      
      for (let i = 0; i < orderRows.length; i++) {
        progress.update(`Extracting order ${i + 1} of ${orderRows.length}...`);
        
        const order = await this.orderExtractor.extractOrderWithDetails(orderRows[i]);
        if (order && order.items.length > 0) {
          orders.push(order);
          this.orderBatcher.addOrder(order);
        }
        
        // Small delay between orders
        if (i < orderRows.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Ensure we're back on the main page
      await this.orderExtractor.ensureOnOrdersPage();
      
      // Update batch assignments
      this.batchManager.refreshBatchAssignments(orders);
      
      this.render();
      progress.remove();
      
      this.showNotification(`Extracted ${orders.length} orders with detailed sizes`, 'success');
      
      // Broadcast updated data to other tabs
      await this.broadcastOrderData();
      
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
    
    // Update waves - need to reconstruct Maps from plain objects
    if (data.waves) {
      this.batchManager.batches = data.batches.map(batch => ({
        ...wave,
        orders: new Map(Object.entries(wave.orders || {})),
        items: new Map(Object.entries(wave.items || {}))
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
}