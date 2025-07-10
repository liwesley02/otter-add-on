/**
 * Batch Label Printer
 * Manages the printing of labels for entire batches
 * Interfaces with the label printer HTML and handles Chrome extension messaging
 */

class BatchLabelPrinter {
  constructor() {
    this.labelTransformer = new LabelDataTransformer();
    this.labelPrinterUrl = chrome.runtime.getURL('label_printer.html');
  }

  /**
   * Print labels for an entire batch
   * @param {Object} batch - Batch object from BatchManager
   * @param {Object} batchManager - Reference to BatchManager
   */
  async printBatchLabels(batch, batchManager) {
    console.log('[BatchLabelPrinter] Starting label print for batch:', batch.id);
    console.log('[BatchLabelPrinter] Batch data:', batch);
    
    try {
      // Transform batch data to label format
      console.log('[BatchLabelPrinter] Transforming batch to labels...');
      const labelData = this.labelTransformer.transformBatchToLabels(batch, batchManager);
      console.log('[BatchLabelPrinter] Label data:', labelData);
      
      // Format for label printer
      console.log('[BatchLabelPrinter] Formatting for label printer...');
      const printerData = this.labelTransformer.formatForLabelPrinter(labelData);
      console.log('[BatchLabelPrinter] Printer data:', printerData);
      
      // Store data for the label printer page to retrieve
      console.log('[BatchLabelPrinter] Storing label data...');
      await this.storeLabelData(printerData);
      console.log('[BatchLabelPrinter] Data stored successfully');
      
      // Open label printer in new tab
      console.log('[BatchLabelPrinter] Opening label printer tab...');
      const printerTab = await this.openLabelPrinter();
      
      console.log('[BatchLabelPrinter] Label printer opened in tab:', printerTab.id);
      
      return {
        success: true,
        labelCount: labelData.totalLabels,
        tabId: printerTab.id
      };
    } catch (error) {
      console.error('[BatchLabelPrinter] Error printing labels:', error);
      console.error('[BatchLabelPrinter] Error stack:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Preview labels before printing
   * @param {Object} batch - Batch object
   * @param {Object} batchManager - Reference to BatchManager
   * @returns {Object} Preview data
   */
  async previewBatchLabels(batch, batchManager) {
    const labelData = this.labelTransformer.transformBatchToLabels(batch, batchManager);
    
    return {
      batchId: batch.id,
      batchName: batch.name,
      totalLabels: labelData.totalLabels,
      customerCount: labelData.customerOrders.length,
      items: labelData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        customer: item.customerName,
        size: item.size,
        notes: item.notes
      }))
    };
  }

  /**
   * Store label data in Chrome storage for the printer page
   */
  async storeLabelData(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ currentOrderForLabels: data }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Open the label printer page in a new tab
   */
  async openLabelPrinter() {
    return new Promise((resolve, reject) => {
      console.log('[BatchLabelPrinter] Opening label printer...');
      console.log('[BatchLabelPrinter] Label printer URL:', this.labelPrinterUrl);
      
      // Check if we're in a content script
      if (typeof chrome.tabs === 'undefined' || !chrome.tabs.create) {
        console.log('[BatchLabelPrinter] Running in content script, sending message to background');
        
        // Send message to background script to open tab
        chrome.runtime.sendMessage(
          { action: 'openLabelPrinter', url: this.labelPrinterUrl },
          (response) => {
            console.log('[BatchLabelPrinter] Background response:', response);
            
            if (chrome.runtime.lastError) {
              console.error('[BatchLabelPrinter] Chrome runtime error:', chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.success) {
              console.log('[BatchLabelPrinter] Successfully opened label printer');
              resolve(response.tab);
            } else {
              console.error('[BatchLabelPrinter] Failed response:', response);
              reject(new Error(response ? response.error : 'Failed to open label printer'));
            }
          }
        );
      } else {
        console.log('[BatchLabelPrinter] Have tabs API access, creating tab directly');
        
        // We're in a context with chrome.tabs access
        chrome.tabs.create({ url: this.labelPrinterUrl }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('[BatchLabelPrinter] Tab creation error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            console.log('[BatchLabelPrinter] Tab created successfully:', tab.id);
            resolve(tab);
          }
        });
      }
    });
  }

  /**
   * Generate label HTML for preview (used in modal)
   */
  generateLabelPreviewHTML(item, logoUrl) {
    const itemName = item.name || 'N/A';
    const itemSize = item.size || '';
    const customerName = item.customerName || 'No Name';
    const itemNotes = item.notes || [];
    
    // Filter out customer and batch notes since we're showing them separately
    const filteredNotes = itemNotes.filter(note => 
      !note.toLowerCase().startsWith('size choice') &&
      !note.toLowerCase().startsWith('customer:') &&
      !note.toLowerCase().startsWith('batch:')
    );
    
    let logoHTML = '';
    if (logoUrl) {
      logoHTML = `<div class="logo-container"><img src="${chrome.runtime.getURL(logoUrl)}" alt="Logo"></div>`;
    }
    
    let sizeHTML = '';
    if (itemSize) {
      sizeHTML = `<div class="item-size-line">${itemSize}</div>`;
    }
    
    const notesHTML = filteredNotes
      .map(note => `<div class="note-line">${note}</div>`)
      .join('');
    
    return `
      <div class="label-item">
        ${logoHTML}
        <div class="text-container">
          <div class="customer-name-prominent">${customerName}</div>
          <div class="item-name">${itemName}</div>
          <hr class="separator-line">
          ${sizeHTML}
          ${notesHTML ? `<div class="item-notes">${notesHTML}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate a preview sheet of labels
   */
  generatePreviewSheet(items, restaurantName, maxLabels = 10) {
    const logoUrl = this.labelTransformer.getLogoUrl(restaurantName);
    let labelsHTML = '';
    let labelCount = 0;
    
    // Generate labels for each item based on quantity
    for (const item of items) {
      const quantity = item.quantity || 1;
      for (let i = 0; i < quantity && labelCount < maxLabels; i++) {
        labelsHTML += this.generateLabelPreviewHTML(item, logoUrl);
        labelCount++;
      }
      if (labelCount >= maxLabels) break;
    }
    
    // Fill remaining spots with empty labels
    while (labelCount < maxLabels) {
      labelsHTML += '<div class="label-item"></div>';
      labelCount++;
    }
    
    return `
      <div class="label-sheet">
        ${labelsHTML}
      </div>
    `;
  }

  /**
   * Print labels for selected orders within a batch
   */
  async printSelectedOrders(batch, batchManager, selectedOrderIds) {
    console.log('[BatchLabelPrinter] Printing labels for selected orders:', selectedOrderIds);
    
    // Create a filtered batch with only selected orders
    const filteredBatch = this.filterBatchByOrders(batch, selectedOrderIds);
    
    return this.printBatchLabels(filteredBatch, batchManager);
  }

  /**
   * Filter batch to include only specific orders
   */
  filterBatchByOrders(batch, orderIds) {
    const filteredBatch = {
      ...batch,
      items: {}
    };
    
    // Deep clone and filter items
    Object.entries(batch.items || {}).forEach(([category, categoryItems]) => {
      filteredBatch.items[category] = {};
      
      Object.entries(categoryItems).forEach(([itemKey, item]) => {
        const filteredOrders = item.orders.filter(order => 
          orderIds.includes(order.orderId)
        );
        
        if (filteredOrders.length > 0) {
          filteredBatch.items[category][itemKey] = {
            ...item,
            orders: filteredOrders,
            totalQuantity: filteredOrders.reduce((sum, o) => sum + o.quantity, 0)
          };
        }
      });
      
      // Remove empty categories
      if (Object.keys(filteredBatch.items[category]).length === 0) {
        delete filteredBatch.items[category];
      }
    });
    
    return filteredBatch;
  }

  /**
   * Send message to background script
   */
  async sendMessage(action, data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Check if label printer tab is still open
   */
  async isLabelPrinterOpen(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.get(tabId, (tab) => {
        resolve(!chrome.runtime.lastError && tab);
      });
    });
  }

  /**
   * Reprint labels for a completed batch
   */
  async reprintBatch(batchId, batchManager) {
    const batch = batchManager.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }
    
    console.log('[BatchLabelPrinter] Reprinting batch:', batchId);
    return this.printBatchLabels(batch, batchManager);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BatchLabelPrinter;
}