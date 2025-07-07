// Tab management and leader election
const tabManager = {
  tabs: new Map(), // tabId -> { url, isLeader, connectedAt }
  leaderId: null,
  
  addTab(tabId, url) {
    const isFirstTab = this.tabs.size === 0;
    this.tabs.set(tabId, {
      url,
      isLeader: isFirstTab,
      connectedAt: Date.now()
    });
    
    if (isFirstTab) {
      this.leaderId = tabId;
      console.log(`[TabManager] Tab ${tabId} elected as leader`);
    }
    
    return isFirstTab;
  },
  
  removeTab(tabId) {
    const wasLeader = this.leaderId === tabId;
    this.tabs.delete(tabId);
    
    if (wasLeader && this.tabs.size > 0) {
      // Elect new leader - oldest tab
      let oldestTab = null;
      let oldestTime = Infinity;
      
      for (const [id, info] of this.tabs.entries()) {
        if (info.connectedAt < oldestTime) {
          oldestTime = info.connectedAt;
          oldestTab = id;
        }
      }
      
      if (oldestTab) {
        this.leaderId = oldestTab;
        this.tabs.get(oldestTab).isLeader = true;
        console.log(`[TabManager] Tab ${oldestTab} elected as new leader`);
        
        // Notify the new leader
        chrome.tabs.sendMessage(oldestTab, {
          action: 'leadershipChanged',
          isLeader: true
        });
      }
    }
  },
  
  isLeader(tabId) {
    return this.leaderId === tabId;
  },
  
  getLeaderId() {
    return this.leaderId;
  },
  
  getAllTabs() {
    return Array.from(this.tabs.keys());
  }
};

// Storage for shared order data
let sharedOrderData = {
  orders: [],
  batches: [],
  lastUpdate: null,
  lastExtraction: null
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('Otter Order Consolidator extension installed');
  
  chrome.storage.local.set({
    categories: {
      appetizers: ['Dumplings', 'Spring Rolls', 'Salads'],
      entrees: ['Meals', 'Rice', 'Noodles', 'Bowls'],
      sides: ['Sides', 'Vegetables', 'Fries'],
      desserts: ['Bao-Nut', 'Ice Cream', 'Sweets', 'Dessert'],
      drinks: ['Beverages', 'Drinks', 'Tea', 'Coffee', 'Soda']
    },
    batches: [],
    settings: {
      maxBatchCapacity: 5, // Default batch size
      enableNotifications: true,
      collapseOnStart: false
    }
  });
});

// Handle tab/window close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabManager.tabs.has(tabId)) {
    console.log(`[Background] Tab ${tabId} closed`);
    tabManager.removeTab(tabId);
    
    // Notify remaining tabs about the change
    broadcastToAllTabs({
      action: 'tabClosed',
      tabId: tabId,
      remainingTabs: tabManager.getAllTabs()
    });
  }
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  
  switch (request.action) {
    case 'registerTab':
      // Tab is registering itself
      if (tabId) {
        const isLeader = tabManager.addTab(tabId, sender.tab.url);
        console.log(`[Background] Tab ${tabId} registered, isLeader: ${isLeader}`);
        
        sendResponse({
          isLeader,
          tabId,
          existingData: isLeader ? null : sharedOrderData,
          totalTabs: tabManager.tabs.size
        });
        
        // Notify all tabs about the new tab
        broadcastToAllTabs({
          action: 'tabRegistered',
          tabId: tabId,
          totalTabs: tabManager.tabs.size
        }, tabId);
      }
      break;
      
    case 'checkLeadership':
      // Tab checking if it's still the leader
      sendResponse({
        isLeader: tabManager.isLeader(tabId),
        leaderId: tabManager.getLeaderId()
      });
      break;
      
    case 'broadcastOrders':
      // Leader broadcasting extracted orders
      if (tabManager.isLeader(tabId)) {
        sharedOrderData = {
          orders: request.orders,
          batches: request.batches,
          lastUpdate: Date.now(),
          lastExtraction: request.extractionTime
        };
        
        // Broadcast to all non-leader tabs
        broadcastToAllTabs({
          action: 'ordersUpdated',
          data: sharedOrderData
        }, tabId);
        
        // Also save to storage for persistence
        chrome.storage.local.set({ sharedOrderData });
        
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Not the leader' });
      }
      break;
      
    case 'requestOrders':
      // Non-leader requesting current orders
      sendResponse(sharedOrderData);
      break;
      
    case 'getCategories':
      chrome.storage.local.get('categories', (data) => {
        sendResponse(data.categories);
      });
      break;
      
    case 'saveBatch':
      chrome.storage.local.get('batches', (data) => {
        const batches = data.batches || [];
        batches.push(request.batch);
        chrome.storage.local.set({ batches }, () => {
          sendResponse({ success: true });
        });
      });
      break;
      
    case 'getTabInfo':
      sendResponse({
        isLeader: tabManager.isLeader(tabId),
        totalTabs: tabManager.tabs.size,
        leaderId: tabManager.getLeaderId(),
        allTabs: tabManager.getAllTabs()
      });
      break;
      
    case 'forceLeader':
      // Force a specific tab to become leader
      if (tabId || request.tabId) {
        const targetTabId = tabId || request.tabId;
        console.log(`[Background] Forcing tab ${targetTabId} to become leader`);
        
        // Update the tab manager
        tabManager.leaderId = targetTabId;
        if (tabManager.tabs.has(targetTabId)) {
          tabManager.tabs.get(targetTabId).isLeader = true;
        }
        
        // Mark all other tabs as followers
        for (const [id, info] of tabManager.tabs.entries()) {
          if (id !== targetTabId) {
            info.isLeader = false;
          }
        }
        
        sendResponse({ success: true });
      }
      break;
      
    case 'openLabelPrinter':
      // Handle request to open label printer tab
      console.log('[Background] Open label printer request received');
      
      chrome.tabs.create({ url: request.url }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Error opening label printer:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[Background] Label printer opened in tab:', tab.id);
          sendResponse({ success: true, tab: tab });
        }
      });
      break;
      
    case 'createLabels':
      // Handle label creation request
      console.log('[Background] Create labels request received:', request.data);
      
      // Store the order data for the label printer
      chrome.storage.local.set({ currentOrderForLabels: request.data }, () => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Error storing label data:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          // Open the label printer page
          const labelPrinterUrl = chrome.runtime.getURL('label_printer.html');
          chrome.tabs.create({ url: labelPrinterUrl }, (tab) => {
            if (chrome.runtime.lastError) {
              console.error('[Background] Error opening label printer:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log('[Background] Label printer opened in tab:', tab.id);
              sendResponse({ success: true, tabId: tab.id });
            }
          });
        }
      });
      break;
  }
  
  return true; // Keep message channel open for async response
});

// Broadcast message to all tabs except sender
function broadcastToAllTabs(message, excludeTabId = null) {
  for (const [tabId] of tabManager.tabs) {
    if (tabId !== excludeTabId) {
      chrome.tabs.sendMessage(tabId, message).catch(() => {
        // Tab might be closed or not ready
        console.log(`[Background] Failed to send message to tab ${tabId}`);
      });
    }
  }
}

// Clean up stale tabs periodically
setInterval(() => {
  // Check if tabs are still valid
  for (const [tabId] of tabManager.tabs) {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        console.log(`[Background] Removing stale tab ${tabId}`);
        tabManager.removeTab(tabId);
      }
    });
  }
}, 30000); // Every 30 seconds