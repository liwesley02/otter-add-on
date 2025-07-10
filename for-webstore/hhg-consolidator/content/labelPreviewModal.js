/**
 * Label Preview Modal
 * Shows a preview of labels before printing
 * Allows selection of specific orders within a batch
 */

class LabelPreviewModal {
  constructor() {
    this.modalElement = null;
    this.onConfirm = null;
    this.onCancel = null;
  }

  /**
   * Show the label preview modal
   * @param {Object} previewData - Preview data from BatchLabelPrinter
   * @param {Object} batch - Batch object
   * @param {Function} onConfirm - Callback when user confirms
   * @param {Function} onCancel - Callback when user cancels
   */
  show(previewData, batch, onConfirm, onCancel) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    
    // Create modal if it doesn't exist
    if (!this.modalElement) {
      this.createModal();
    }
    
    // Update modal content
    this.updateContent(previewData, batch);
    
    // Show modal
    this.modalElement.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  createModal() {
    // Create modal container
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'label-preview-modal';
    this.modalElement.className = 'otter-label-modal';
    this.modalElement.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Label Preview</h2>
          <button class="modal-close" title="Close">×</button>
        </div>
        <div class="modal-body">
          <!-- Content will be inserted here -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-btn">Cancel</button>
          <button class="btn btn-primary print-btn">Print Labels</button>
        </div>
      </div>
    `;
    
    // Add styles
    const styles = `
      <style>
        .otter-label-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999999;
        }
        
        .otter-label-modal .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
        }
        
        .otter-label-modal .modal-content {
          position: relative;
          width: 90%;
          max-width: 1200px;
          height: 90%;
          margin: 2% auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
        }
        
        .otter-label-modal .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .otter-label-modal .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }
        
        .otter-label-modal .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          line-height: 30px;
        }
        
        .otter-label-modal .modal-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        
        .otter-label-modal .modal-footer {
          padding: 20px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        .otter-label-modal .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .otter-label-modal .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .otter-label-modal .btn-primary:hover {
          background: #0056b3;
        }
        
        .otter-label-modal .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .otter-label-modal .btn-secondary:hover {
          background: #545b62;
        }
        
        .otter-label-modal .preview-info {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        .otter-label-modal .preview-stats {
          display: flex;
          gap: 30px;
          margin-bottom: 10px;
        }
        
        .otter-label-modal .stat-item {
          display: flex;
          flex-direction: column;
        }
        
        .otter-label-modal .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        
        .otter-label-modal .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        
        .otter-label-modal .customer-selection {
          margin-bottom: 20px;
        }
        
        .otter-label-modal .customer-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        
        .otter-label-modal .customer-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }
        
        .otter-label-modal .customer-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }
        
        .otter-label-modal .label-preview-container {
          background: #e0e0e0;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .otter-label-modal .label-sheet-preview {
          width: 8.5in;
          min-height: 5in;
          background: white;
          padding: 0.5in 0.1875in;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
      </style>
    `;
    
    // Add styles to head
    document.head.insertAdjacentHTML('beforeend', styles);
    
    // Append to body
    document.body.appendChild(this.modalElement);
    
    // Add event listeners
    this.attachEventListeners();
  }

  updateContent(previewData, batch) {
    const modalBody = this.modalElement.querySelector('.modal-body');
    
    let contentHTML = `
      <div class="preview-info">
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">Batch</span>
            <span class="stat-value">${batch.name}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Labels</span>
            <span class="stat-value">${previewData.totalLabels}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Customers</span>
            <span class="stat-value">${previewData.customerCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pages Required</span>
            <span class="stat-value">${Math.ceil(previewData.totalLabels / 10)}</span>
          </div>
        </div>
      </div>
      
      <div class="customer-selection">
        <h3>Select Customers to Print:</h3>
        <label>
          <input type="checkbox" id="select-all-customers" checked> Select All
        </label>
        <div class="customer-list">
    `;
    
    // Add customer checkboxes
    const customerMap = new Map();
    previewData.items.forEach(item => {
      if (!customerMap.has(item.customer)) {
        customerMap.set(item.customer, {
          name: item.customer,
          itemCount: 0,
          labelCount: 0
        });
      }
      const customer = customerMap.get(item.customer);
      customer.itemCount++;
      customer.labelCount += item.quantity;
    });
    
    customerMap.forEach((customer, customerId) => {
      contentHTML += `
        <div class="customer-item">
          <input type="checkbox" class="customer-checkbox" data-customer="${window.escapeHtml(customerId)}" checked>
          <label>
            <strong>${window.escapeHtml(customer.name)}</strong>
            <br>
            <small>${customer.itemCount} items, ${customer.labelCount} labels</small>
          </label>
        </div>
      `;
    });
    
    contentHTML += `
        </div>
      </div>
      
      <div class="label-preview-container">
        <h3>Label Preview (First 10 labels):</h3>
        <div class="label-sheet-preview" id="label-preview-sheet">
          <!-- Label preview will be inserted here -->
        </div>
      </div>
    `;
    
    modalBody.innerHTML = contentHTML;
    
    // Generate label preview
    this.generateLabelPreview(previewData.items);
    
    // Add select all functionality
    const selectAllCheckbox = this.modalElement.querySelector('#select-all-customers');
    const customerCheckboxes = this.modalElement.querySelectorAll('.customer-checkbox');
    
    selectAllCheckbox.addEventListener('change', (e) => {
      customerCheckboxes.forEach(cb => cb.checked = e.target.checked);
      this.updateLabelPreview(previewData.items);
    });
    
    customerCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        this.updateLabelPreview(previewData.items);
      });
    });
  }

  generateLabelPreview(items) {
    const previewSheet = this.modalElement.querySelector('#label-preview-sheet');
    if (!previewSheet) return;
    
    // Get selected customers
    const selectedCustomers = this.getSelectedCustomers();
    
    // Filter items by selected customers
    const filteredItems = items.filter(item => 
      selectedCustomers.has(item.customer)
    );
    
    // Use BatchLabelPrinter to generate preview
    if (window.batchLabelPrinter) {
      const previewHTML = window.batchLabelPrinter.generatePreviewSheet(
        filteredItems, 
        'Restaurant', // This should be passed from batch data
        10 // Max labels for preview
      );
      previewSheet.innerHTML = previewHTML;
    }
  }

  updateLabelPreview(items) {
    this.generateLabelPreview(items);
  }

  getSelectedCustomers() {
    const selectedCustomers = new Set();
    const checkboxes = this.modalElement.querySelectorAll('.customer-checkbox:checked');
    checkboxes.forEach(cb => {
      selectedCustomers.add(cb.dataset.customer);
    });
    return selectedCustomers;
  }

  attachEventListeners() {
    // Close button
    this.modalElement.querySelector('.modal-close').addEventListener('click', () => {
      this.hide();
      if (this.onCancel) this.onCancel();
    });
    
    // Backdrop click
    this.modalElement.querySelector('.modal-backdrop').addEventListener('click', () => {
      this.hide();
      if (this.onCancel) this.onCancel();
    });
    
    // Cancel button
    this.modalElement.querySelector('.cancel-btn').addEventListener('click', () => {
      this.hide();
      if (this.onCancel) this.onCancel();
    });
    
    // Print button
    this.modalElement.querySelector('.print-btn').addEventListener('click', () => {
      const selectedCustomers = this.getSelectedCustomers();
      this.hide();
      if (this.onConfirm) this.onConfirm(selectedCustomers);
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalElement.style.display === 'block') {
        this.hide();
        if (this.onCancel) this.onCancel();
      }
    });
  }

  hide() {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
}

// Make available globally
window.LabelPreviewModal = LabelPreviewModal;