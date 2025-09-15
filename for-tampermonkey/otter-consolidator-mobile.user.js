// ==UserScript==
// @name         Otter Order Consolidator v4 - Tampermonkey Edition
// @namespace    http://tampermonkey.net/
// @version      6.0.1
// @description  Consolidate orders for Otter - Optimized for Firefox Mobile & Tablets
// v6.0.1: Fixed Orange Chicken categorization:
//         - Orange Chicken now correctly grouped under Crispy Chicken
//         - Orange is a sauce, not a protein type
//         - Grilled Orange items go under Grilled Chicken
// v6.0.0: MAJOR UPDATE - Protein-First Categorization:
//         - Complete restructure: Items grouped by protein type FIRST
//         - All crispy chicken items together (rice bowls, urban bowls, baos, etc.)
//         - All grilled chicken items together regardless of dish type
//         - Much faster sorting and packing process
//         - Previous category-first version backed up as v5.4.17
// v5.4.17: Improved Rice Bowl Categorization - Sauce-specific groups:
//         - Rice bowls now grouped by protein AND sauce type
//         - Each sauce variation gets its own category
//         - Faster, more specific categorization
//         - E.g., "Crispy Chicken Herb Aioli Rice Bowls" instead of just "Crispy Chicken Rice Bowls"
// v5.4.16: Enhanced Quantity Display - Larger and bolder:
//         - Increased font size from 11px to 14px
//         - Made font extra bold (900 weight)
//         - Added stronger border for definition
//         - Quantities now more prominent and easier to read
// v5.4.15: Fixed Quantity Visibility - Better contrast:
//         - Darker quantity text color for better readability
//         - Changed from light blue to dark blue/black
//         - Improved background contrast for quantity badges
//         - Better visibility for all quantity indicators
// v5.4.14: Improved Category Readability - Better contrast:
//         - Darker, more saturated gradient colors for better contrast
//         - All categories now readable with white text
//         - Consistent color coding maintained
//         - Better visual hierarchy and accessibility
// v5.4.13: Enhanced Category Colors - Complete coverage:
//         - Added colors for all category types found in the app
//         - Urban Bowls, Fried Rice, Shrimp, Steak, Salmon categories
//         - Better differentiation between similar categories
//         - More specific category detection logic
// v5.4.12: Colorful Category Headers - Better visual distinction:
//         - Added vibrant gradient colors to category headers
//         - Each category gets unique color scheme
//         - Improved visibility and organization
//         - Categories now pop out for easier identification
// v5.4.11: Adjusted Overlay Position - Prevent content overlap:
//         - Reduced overlay width from 40vw to 35vw
//         - Changed min-width from 1000px to 850px
//         - Adjusted column widths from 320px to 270px
//         - Total grid width now 830px to fit narrower overlay
//         - Ensures left side content remains visible
// v5.4.10: Increased Column Width - Better text display:
//         - Increased column width from 280px to 320px (total 984px)
//         - Reduced font size from 18px to 13px for better fit
//         - Fixed conflicting styles causing text cutoff
//         - Improved word wrapping with hyphens and overflow-wrap
//         - Ensured consistent styling across all wave items
// v5.4.9: Fixed Overlay Scrolling - Accounting for overlay nature:
//         - Changed main overlay from overflow:hidden to overflow-x:auto
//         - otter-wave-view now has overflow-x:auto
//         - Fixed overlay container to allow horizontal scrolling
//         - Recognized this is an overlay app, not standalone
//         - Scrolling now works within the overlay sidebar
// v5.4.8: Fixed Horizontal Scrolling - See all columns:
//         - Fixed 3-column grid with 200px width each
//         - Total grid width 624px ensures scrolling
//         - wave-size-group has overflow-x: auto
//         - wave-items-list also scrolls horizontally
//         - Can now scroll to see hidden third column
// v5.4.7: Full Text Display - No truncation with scroll:
//         - Removed ellipsis (...) - shows full item names
//         - Grid columns expand to fit content (minmax(200px, max-content))
//         - Items and details expand to show full text
//         - Horizontal scrolling to see all content
//         - Text wraps naturally within expanded columns
// v5.4.6: Restored 3-Column Layout - Fixed grid display:
//         - Restored forced 3-column layout (was showing 2)
//         - Fixed grid columns to use calc(33.33% - 6px)
//         - Each size group now scrolls horizontally
//         - Maintained proper spacing between columns
// v5.4.5: Fixed Batch Capacity Input - Now editable:
//         - Fixed Orders/batch input not being editable
//         - Added better event handling (change, blur, Enter key)
//         - Improved input styling for mobile touch interaction
//         - Removed readonly/disabled attributes and spin buttons
// v5.4.4: Horizontal Scrolling - Fixed column cutoff:
//         - Added horizontal scrolling to wave view
//         - 3-column grid now has minimum width to prevent cutoff
//         - Improved scrollbar visibility with blue color
//         - Touch-friendly scrolling for mobile devices
// v5.4.3: Vertical Stack Layout - Better readability:
//         - Changed item layout to vertical stacking
//         - Item name on top line with no wrapping (ellipsis for overflow)
//         - Quantity and badges on second line
//         - Color dots moved to top-right corner
//         - Improved text readability without wrapping
// v5.4.1: UI Improvements - Fixed close button and compacted interface:
//         - Added dedicated close button (✕) to overlay header
//         - Implemented Escape key support to close overlay
//         - Reduced UI spacing by ~40% for more compact display
//         - Team can now see significantly more items on screen
// v5.4.0: MAJOR FIX - Complete overhaul of modifier extraction logic:
//         - Fixed isIntegratedModifier to use fuzzy matching and smart defaults
//         - Added content-based fallback detection for dumplings, sauces, and rice
//         - Changed default behavior to integrate unknown modifiers (was: separate)
//         - Added comprehensive debug logging with emoji markers
//         - Fixed Urban Bowl dumpling detection with multiple section name formats
//         - Ensured modifier data propagation through entire pipeline
// v5.3.1: Fixed Urban Bowl isUrbanBowl flag, added dumpling debug logging, improved sauce detection
// v5.3.0: Fixed Urban Bowl dumpling badges, Rice Bowl sauce/rice type badges, added more sauce types
// v5.2.9: Optimized clear completed orders - now much faster, only removes completed without full rebuild
// v5.2.8: Changed green to softer shade (#5cb85c), disabled all notifications, removed auto-clear and related code
// v5.2.7: Completed orders shown with strikethrough only (manual mode)
// v5.2.6: Updated packing - click entire item to mark as packed (turns green), removed checkboxes
// @author       HHG Team
// @match        https://app.tryotter.com/*
// @match        https://www.tryotter.com/*
// @match        https://tryotter.com/*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        window.close
// @grant        window.focus
// @run-at       document-idle
// @connect      localhost
// @connect      tryotter.com
// @connect      *.tryotter.com
// ==/UserScript==

(function() {
  'use strict';
  
  // Show immediate visual feedback
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'otter-loading-indicator';
  loadingIndicator.innerHTML = '🔄 Otter Consolidator Loading...';
  loadingIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff6b6b;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 2147483647; /* Maximum z-index value */
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  // Wait for body to be available
  function addIndicator() {
      if (document.body) {
          document.body.appendChild(loadingIndicator);
          
          // Add a simple button to manually trigger the consolidator
          const triggerBtn = document.createElement('button');
          triggerBtn.innerHTML = '📦 Open Consolidator';
          triggerBtn.style.cssText = `
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: #4CAF50;
              color: white;
              border: none;
              padding: 15px 20px;
              border-radius: 50px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              z-index: 2147483647; /* Maximum z-index value */
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `;
          triggerBtn.onclick = async () => {
              loadingIndicator.innerHTML = '⚡ Initializing...';
              loadingIndicator.style.background = '#ff9800';
              
              // Ensure components are created first
              if (!window.ItemMatcher || !window.OrderBatcher || !window.CategoryManager) {
                  console.log('[Button Click] Components not ready, waiting...');
                  loadingIndicator.innerHTML = '⏳ Loading components...';
                  
                  // Wait a bit for components to load
                  let retries = 0;
                  const checkInterval = setInterval(() => {
                      retries++;
                      if (window.ItemMatcher && window.OrderBatcher && window.CategoryManager) {
                          clearInterval(checkInterval);
                          console.log('[Button Click] Components are now ready!');
                          triggerBtn.click(); // Retry the click
                      } else if (retries > 20) { // 10 seconds timeout
                          clearInterval(checkInterval);
                          loadingIndicator.innerHTML = '❌ Components failed to load';
                          console.error('Components still not available after 10 seconds');
                      }
                  }, 500);
                  return;
              }
              
              // Create a simple overlay if init fails
              setTimeout(() => {
                  try {
                      // Try to create the overlay directly
                      let overlay = document.getElementById('otter-consolidator-overlay');
                      if (!overlay) {
                          overlay = document.createElement('div');
                          overlay.id = 'otter-consolidator-overlay';
                          overlay.style.cssText = `
                              position: fixed;
                              top: 0;
                              right: 0;
                              width: 400px;
                              height: 100vh;
                              background: white;
                              box-shadow: -2px 0 10px rgba(0,0,0,0.2);
                              z-index: 2147483646; /* Just below maximum */
                              overflow-y: auto;
                              padding: 20px;
                          `;
                          overlay.innerHTML = `
                              <h2 style="margin-top:0">Order Consolidator</h2>
                              <p style="color:#666">Manual mode - Click Extract Orders below</p>
                              <button id="extract-orders-btn" style="
                                  background: #4CAF50;
                                  color: white;
                                  border: none;
                                  padding: 10px 20px;
                                  border-radius: 5px;
                                  font-size: 16px;
                                  cursor: pointer;
                                  width: 100%;
                                  margin: 10px 0;
                              ">📦 Extract Orders</button>
                              <button id="close-overlay-btn" style="
                                  background: #f44336;
                                  color: white;
                                  border: none;
                                  padding: 10px 20px;
                                  border-radius: 5px;
                                  font-size: 16px;
                                  cursor: pointer;
                                  width: 100%;
                              ">❌ Close</button>
                              <div id="order-results" style="margin-top:20px"></div>
                          `;
                          document.body.appendChild(overlay);
                          
                          // Add functionality
                          document.getElementById('close-overlay-btn').onclick = () => {
                              overlay.remove();
                              loadingIndicator.innerHTML = '✅ Closed';
                          };
                          
                          document.getElementById('extract-orders-btn').onclick = () => {
                              const results = document.getElementById('order-results');
                              results.innerHTML = '<p>Searching for orders...</p>';
                              
                              // Simple order extraction
                              const orderElements = document.querySelectorAll('[data-testid*="order"], [class*="order-card"], [class*="OrderCard"]');
                              results.innerHTML = `<p>Found ${orderElements.length} potential orders</p>`;
                              
                              if (orderElements.length === 0) {
                                  results.innerHTML += '<p style="color:red">No orders found. Make sure you are on the orders page.</p>';
                              }
                          };
                          
                          loadingIndicator.innerHTML = '✅ Overlay Open';
                          loadingIndicator.style.background = '#4CAF50';
                      }
                      
                      // Also try the real init
                      if (window.init) {
                          console.log('[Button Click] Attempting to call window.init()...');
                          window.init().catch(err => {
                              console.error('Init failed:', err);
                              console.error('Init error stack:', err.stack);
                              loadingIndicator.innerHTML = '⚠️ Using Manual Mode';
                              
                              // Check if components were created successfully
                              if (window.componentsError) {
                                  console.error('Components creation had failed earlier:', window.componentsError);
                                  loadingIndicator.innerHTML = '❌ Components Error';
                              }
                          });
                      } else {
                          console.error('[Button Click] window.init is not defined!');
                          loadingIndicator.innerHTML = '❌ Init Not Found';
                          
                          // Check component status
                          console.log('Component status:', {
                              ItemMatcher: typeof window.ItemMatcher,
                              OrderBatcher: typeof window.OrderBatcher,
                              CategoryManager: typeof window.CategoryManager,
                              BatchManager: typeof window.BatchManager,
                              OrderExtractor: typeof window.OrderExtractor,
                              OverlayUI: typeof window.OverlayUI,
                              overlayUI: typeof window.otterOverlayUI,
                              componentsError: window.componentsError
                          });
                      }
                  } catch (err) {
                      console.error('Manual overlay creation failed:', err);
                      loadingIndicator.innerHTML = '❌ Error: ' + err.message;
                      loadingIndicator.style.background = '#f44336';
                  }
              }, 500);
          };
          document.body.appendChild(triggerBtn);
          
          // Add manual trigger button
          const manualTrigger = document.createElement('button');
          manualTrigger.innerHTML = '📦 Open Consolidator';
          manualTrigger.style.cssText = `
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: #4CAF50;
              color: white;
              border: none;
              padding: 15px 20px;
              border-radius: 50px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              z-index: 2147483647; /* Maximum z-index value */
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              transition: all 0.3s ease;
          `;
          manualTrigger.onmouseover = () => { manualTrigger.style.transform = 'scale(1.05)'; };
          manualTrigger.onmouseout = () => { manualTrigger.style.transform = 'scale(1)'; };
          manualTrigger.onclick = async () => {
              console.log('[Manual Trigger] Button clicked');
              if (window.otterOverlayUI && window.otterOverlayUI.toggleVisibility) {
                  window.otterOverlayUI.toggleVisibility();
              } else if (window.init) {
                  try {
                      await window.init();
                  } catch (err) {
                      console.error('[Manual Trigger] Init failed:', err);
                      alert('Failed to initialize: ' + err.message);
                  }
              } else {
                  alert('Consolidator not ready yet. Please wait a moment and try again.');
              }
          };
          document.body.appendChild(manualTrigger);
          
          setTimeout(() => {
              loadingIndicator.style.background = '#4CAF50';
              loadingIndicator.innerHTML = '✅ Otter Consolidator Ready - Click button or press Ctrl+Shift+O';
              setTimeout(() => {
                  loadingIndicator.style.opacity = '0.7';
              }, 2000);
          }, 1000);
      } else {
          setTimeout(addIndicator, 100);
      }
  }
  addIndicator();

  // ===== GM Storage Wrapper =====
  // Provides Chrome storage API compatibility using Tampermonkey storage
  const storage = {
      local: {
          get: async (keys) => {
              if (typeof keys === 'string') {
                  keys = [keys];
              } else if (!Array.isArray(keys) && keys !== null) {
                  keys = Object.keys(keys);
              }
              
              const result = {};
              if (keys === null) {
                  // Get all values
                  const allKeys = GM_listValues();
                  for (const key of allKeys) {
                      result[key] = await GM_getValue(key);
                  }
              } else {
                  for (const key of keys) {
                      const value = await GM_getValue(key);
                      if (value !== undefined) {
                          result[key] = value;
                      }
                  }
              }
              return result;
          },
          
          set: async (items) => {
              for (const [key, value] of Object.entries(items)) {
                  await GM_setValue(key, value);
              }
          },
          
          remove: async (keys) => {
              if (typeof keys === 'string') {
                  keys = [keys];
              }
              for (const key of keys) {
                  await GM_deleteValue(key);
              }
          },
          
          clear: async () => {
              const allKeys = GM_listValues();
              for (const key of allKeys) {
                  await GM_deleteValue(key);
              }
          }
      }
  };

  // ===== Chrome API Replacement =====
  if (typeof chrome === 'undefined') {
      window.chrome = {};
  }
  
  // Expose storage API on chrome object
  if (!window.chrome.storage) {
      window.chrome.storage = storage;
  }
  
  if (!window.chrome.runtime) {
      window.chrome.runtime = {
          sendMessage: async (message, callback) => {
              // For Tampermonkey, always return default values
              if (message.action === 'registerTab') {
                  const result = {
                      isLeader: true,
                      tabId: Date.now(),
                      existingData: null,
                      totalTabs: 1
                  };
                  if (callback) callback(result);
                  return Promise.resolve(result);
              }
              if (callback) callback({});
              return Promise.resolve({});
          },
          onMessage: {
              addListener: (listener) => {
                  // Messages will be handled internally
              }
          },
          getURL: (path) => {
              // Return data URLs for resources
              return path;
          }
      };
  }

  // ===== Fix fetch for CORS =====
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
      // Only intercept API calls to localhost
      if (typeof url === 'string' && url.includes('localhost:8000')) {
          return new Promise((resolve, reject) => {
              GM_xmlhttpRequest({
                  method: options.method || 'GET',
                  url: url,
                  headers: options.headers || {},
                  data: options.body,
                  responseType: 'text',
                  onload: function(response) {
                      // Create a fetch-like response object
                      const mockResponse = {
                          ok: response.status >= 200 && response.status < 300,
                          status: response.status,
                          statusText: response.statusText,
                          headers: new Headers(),
                          text: () => Promise.resolve(response.responseText),
                          json: () => {
                              try {
                                  return Promise.resolve(JSON.parse(response.responseText));
                              } catch (e) {
                                  return Promise.reject(e);
                              }
                          },
                          blob: () => Promise.resolve(new Blob([response.responseText])),
                          arrayBuffer: () => Promise.resolve(new TextEncoder().encode(response.responseText).buffer)
                      };
                      
                      // Parse response headers
                      if (response.responseHeaders) {
                          response.responseHeaders.split('\r\n').forEach(line => {
                              const [key, value] = line.split(': ');
                              if (key && value) {
                                  mockResponse.headers.append(key, value);
                              }
                          });
                      }
                      
                      resolve(mockResponse);
                  },
                  onerror: function(response) {
                      reject(new Error('Network request failed'));
                  },
                  ontimeout: function() {
                      reject(new Error('Request timeout'));
                  }
              });
          });
      }
      // For non-API URLs, use original fetch
      return originalFetch.apply(this, arguments);
  };

  // ===== Chrome Tabs API Replacement =====
  if (!window.chrome.tabs) {
      window.chrome.tabs = {
          create: (options, callback) => {
              if (options.url) {
                  const newTab = GM_openInTab(options.url, {
                      active: options.active !== false,
                      insert: true
                  });
                  if (callback) {
                      // Simulate a tab object
                      callback({ id: Date.now(), url: options.url });
                  }
              }
          },
          get: (tabId, callback) => {
              // Can't really get tab info in Tampermonkey, return a mock
              if (callback) {
                  callback({ id: tabId, url: window.location.href });
              }
          }
      };
  }

  // Add extension API
  if (!window.chrome.extension) {
      window.chrome.extension = {
          getURL: (path) => path
      };
  }

  // ===== Inline CSS Styles =====
  const overlayStyles = `
      
/* ----- styles/overlay.css ----- */
#otter-consolidator-overlay {
position: fixed;
top: 0;
right: 0;
width: 35vw;
min-width: 850px;
max-width: 950px;
height: 100vh;
background: #1a1a1a;
box-shadow: -2px 0 10px rgba(0, 0, 0, 0.5);
z-index: 2147483647; /* Maximum z-index value */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-size: 13px;
transition: transform 0.3s ease;
display: flex;
flex-direction: column;
color: #ffffff;
overflow-x: auto;
overflow-y: hidden;
}

/* Ensure the main Otter content is properly adjusted */
body:has(#otter-consolidator-overlay) > div:not(#otter-consolidator-overlay):not(.otter-floating-toggle) {
transition: all 0.3s ease;
}

/* Force proper stacking context */
#otter-consolidator-overlay * {
position: relative;
z-index: 2147483647; /* Maximum z-index value */
}

/* Floating Toggle Button */
.otter-floating-toggle {
position: fixed !important;
bottom: 20px !important;
right: 20px !important;
width: 50px !important;
height: 50px !important;
background: #007bff !important;
color: white !important;
border: none !important;
border-radius: 50% !important;
font-size: 24px !important;
cursor: pointer !important;
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
z-index: 1000000 !important;
transition: all 0.2s ease !important;
display: flex !important;
align-items: center !important;
justify-content: center !important;
}

.otter-floating-toggle:hover {
background: #0056b3 !important;
transform: scale(1.1) !important;
}

/* Mode Toggle Button - Removed */

/* Hidden state for UI elements */
.otter-ui-hidden {
display: none !important;
}

/* Update indicator animation */
@keyframes pulse {
0% {
  opacity: 0;
  transform: translateY(-50%) scale(0.8);
}
50% {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}
100% {
  opacity: 0;
  transform: translateY(-50%) scale(0.8);
}
}

#otter-consolidator-overlay.collapsed {
transform: translateX(calc(100% - 50px));
}

.otter-header {
background: #0d0d0d;
color: white;
padding: 6px 10px;
display: flex;
align-items: center;
gap: 6px;
flex-shrink: 0;
border-bottom: 1px solid #333;
height: 36px;
position: relative;
}

.otter-clear-btn {
position: absolute;
right: 50px;
top: 50%;
transform: translateY(-50%);
background: #dc3545;
border: 1px solid #dc3545;
color: white;
font-size: 13px;
cursor: pointer;
padding: 3px 6px;
border-radius: 4px;
transition: all 0.2s ease;
line-height: 1;
font-weight: 600;
}

.otter-clear-btn:hover {
background: #b02a37;
border-color: #b02a37;
box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.otter-close-btn {
position: absolute;
right: 8px;
top: 50%;
transform: translateY(-50%);
background: #6c757d;
border: none;
color: white;
font-size: 18px;
cursor: pointer;
padding: 2px 8px;
border-radius: 4px;
line-height: 1;
transition: all 0.2s ease;
font-weight: bold;
}

.otter-close-btn:hover {
background: #5a6268;
box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}

.otter-toggle {
background: none;
border: none;
color: #a0a0a0;
font-size: 24px;
cursor: pointer;
padding: 0;
width: 30px;
height: 30px;
display: flex;
align-items: center;
justify-content: center;
transition: color 0.2s;
}

.otter-toggle:hover {
color: #ffffff;
background: rgba(255, 255, 255, 0.05);
border-radius: 4px;
}

.otter-title {
flex: 1;
margin: 0;
font-size: 14px;
font-weight: 500;
}

.otter-stats {
display: flex;
flex-direction: column;
align-items: flex-end;
font-size: 10px;
color: #a0a0a0;
}

.otter-prep-stats {
display: flex;
gap: 6px;
align-items: center;
font-size: 10px;
color: #888;
margin-top: 2px;
}

.prep-time-label {
color: #666;
}

.prep-time-hour,
.prep-time-today {
padding: 2px 6px;
background: rgba(0, 150, 0, 0.2);
border: 1px solid rgba(0, 200, 0, 0.3);
border-radius: 3px;
color: #4CAF50;
font-weight: 500;
cursor: help;
}

.prep-time-hour:hover,
.prep-time-today:hover {
background: rgba(0, 150, 0, 0.3);
border-color: rgba(0, 200, 0, 0.5);
}

.otter-content {
flex: 1;
overflow-y: auto;
overflow-x: hidden;
display: flex;
flex-direction: column;
background: #1a1a1a;
width: 100%;
}

/* Batch System Styles */
.batch-section {
background: #2a2a2a;
border-radius: 8px;
margin-bottom: 15px;
overflow: hidden;
transition: all 0.3s ease;
border: 1px solid #333;
}

.batch-section.urgent {
border-color: #dc3545;
box-shadow: 0 0 10px rgba(220, 53, 69, 0.3);
}

.batch-section.warning {
border-color: #ffc107;
box-shadow: 0 0 10px rgba(255, 193, 7, 0.3);
}

.batch-section.batch-locked {
background: #1f1f1f;
opacity: 0.9;
border-color: #555;
}

.batch-header {
background: #333;
padding: 5px 8px;
display: flex;
justify-content: space-between;
align-items: center;
border-bottom: 1px solid #444;
}

.batch-locked .batch-header {
background: #2a2a2a;
}

.batch-header h3 {
margin: 0;
font-size: 12px;
font-weight: 500;
color: #fff;
}

.batch-stats {
display: flex;
gap: 8px;
font-size: 11px;
color: #aaa;
align-items: center;
}

.est-completion {
padding: 2px 6px;
background: rgba(100, 100, 100, 0.3);
border: 1px solid rgba(150, 150, 150, 0.4);
border-radius: 3px;
color: #ddd;
font-weight: 500;
cursor: help;
font-size: 10px;
}

.est-completion.ready {
background: rgba(40, 167, 69, 0.3);
border-color: rgba(40, 167, 69, 0.6);
color: #5cb85c;
animation: pulse 1s ease-in-out infinite;
}

.est-completion.soon {
background: rgba(255, 193, 7, 0.3);
border-color: rgba(255, 193, 7, 0.6);
color: #ffc107;
}


.batch-content {
padding: 6px;
}

/* Customer section styles */
.batch-customers {
margin-bottom: 6px;
padding: 5px;
background: rgba(0, 0, 0, 0.2);
border-radius: 4px;
}

.batch-customers-header {
font-size: 10px;
color: #888;
margin-bottom: 4px;
}

.batch-customer-list {
display: flex;
flex-wrap: wrap;
gap: 4px;
}

/* Order State Styles */
.batch-customer-badge {
display: inline-flex;
align-items: center;
gap: 3px;
background: #404040;
padding: 2px 6px;
border-radius: 10px;
margin: 0;
font-size: 10px;
transition: all 0.3s ease;
}

.batch-customer-badge.order-new {
background: rgba(40, 167, 69, 0.3);
border: 1px solid #5cb85c;
animation: newOrderPulse 2s ease-in-out infinite;
}

@keyframes newOrderPulse {
0%, 100% { opacity: 1; }
50% { opacity: 0.7; }
}

.batch-customer-badge.order-completed {
text-decoration: line-through;
opacity: 0.6;
color: #6c757d;
background: #2a2a2a;
}

.batch-customer-badge.order-completed::before {
content: "✓ ";
color: #5cb85c;
text-decoration: none;
font-weight: bold;
}

.batch-customer-badge.prep-time-late {
background: rgba(255, 152, 0, 0.3);
border: 1px solid #ff9800;
animation: latePulse 2s ease-in-out infinite;
}

@keyframes latePulse {
0%, 100% { 
  opacity: 1; 
  box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);
}
50% { 
  opacity: 0.8;
  box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
}
}

.batch-customer-badge.elapsed-overdue {
background: rgba(220, 53, 69, 0.3);
border: 1px solid #dc3545;
}

.customer-name {
font-weight: 500;
}

.customer-order {
font-size: 11px;
color: #888;
}

.customer-name {
font-weight: 500;
font-size: 10px;
}

.customer-order {
font-size: 9px;
color: #a0a0a0;
}

.customer-wait-time {
font-size: 9px;
color: #ffc107;
font-weight: 500;
margin-left: 4px;
}

/* Batch Controls */
.batch-controls {
padding: 15px;
background: #1f1f1f;
border-bottom: 1px solid #333;
display: flex;
flex-direction: column;
gap: 10px;
}

.batch-capacity-control {
display: flex;
align-items: center;
gap: 10px;
}

.batch-capacity-control label {
font-size: 13px;
color: #ccc;
}

.batch-capacity-input {
width: 50px;
padding: 5px 8px;
background: #2a2a2a;
border: 2px solid #555;
border-radius: 4px;
color: #fff;
font-size: 13px;
text-align: center;
height: 30px;
cursor: pointer;
-webkit-appearance: none;
-moz-appearance: textfield;
}

.batch-capacity-input:focus {
outline: none;
border-color: #4a90e2;
background: #333;
}

.batch-capacity-input:hover {
border-color: #666;
background: #333;
}

/* Remove spin buttons for better mobile experience */
.batch-capacity-input::-webkit-inner-spin-button,
.batch-capacity-input::-webkit-outer-spin-button {
-webkit-appearance: none;
margin: 0;
}

.save-indicator {
animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
from { opacity: 0; transform: translateX(-10px); }
to { opacity: 1; transform: translateX(0); }
}

/* Update existing wave controls to batch */
.otter-batch-controls {
padding: 15px;
background: #f8f9fa;
border-bottom: 1px solid #e9ecef;
display: flex;
flex-direction: column;
gap: 10px;
}

.otter-btn {
padding: 8px 16px;
border: none;
border-radius: 4px;
cursor: pointer;
font-size: 14px;
font-weight: 500;
transition: all 0.2s;
background: #404040;
color: #ffffff;
}

.otter-btn-primary {
background: #4a4a4a;
color: white;
}

.otter-btn-primary:hover:not(:disabled) {
background: #5a5a5a;
}

.otter-btn-primary:disabled {
background: #bdc3c7;
cursor: not-allowed;
}

#clear-wave {
background: #e74c3c;
color: white;
}

#clear-wave:hover {
background: #c0392b;
}


.otter-current-wave {
padding: 15px;
background: #fff8dc;
border-bottom: 2px solid #e9ecef;
max-height: 200px;
overflow-y: auto;
}

.otter-current-wave h4 {
margin: 0 0 10px 0;
font-size: 16px;
color: #2c3e50;
}

.wave-items {
display: flex;
flex-direction: column;
gap: 8px;
}

.wave-category {
margin-bottom: 6px;
}

.wave-category h6 {
margin: 0 0 3px 0;
font-size: 10px;
text-transform: uppercase;
color: #7f8c8d;
}

.wave-item {
display: flex;
flex-direction: column;
align-items: flex-start;
padding: 6px 8px;
background: white;
border-radius: 3px;
font-size: 10px;
position: relative;
min-height: auto;
gap: 3px;
width: 100%;
box-sizing: border-box;
}
.wave-item.packed {
background-color: #5cb85c !important;
border-color: #5cb85c !important;
}
.wave-item.packed .wave-item-name,
.wave-item.packed .wave-item-quantity,
.wave-item.packed span {
color: white !important;
}
.wave-item {
cursor: pointer;
transition: all 0.3s ease;
-webkit-tap-highlight-color: transparent;
user-select: none;
}
.wave-item:hover:not(.packed) {
background-color: #f0f0f0;
transform: translateX(2px);
}

.wave-item-name {
font-size: 13px;
line-height: 1.3;
font-weight: 600;
color: #2c3e50;
white-space: normal;
word-wrap: break-word;
word-break: normal;
width: 100%;
max-width: 100%;
display: block;
overflow-wrap: break-word;
hyphens: auto;
}

.wave-item-qty {
font-weight: 900;
color: #000000;
font-size: 13px;
margin-right: 4px;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.remove-from-wave {
background: #e74c3c;
color: white;
border: none;
border-radius: 3px;
width: 16px;
height: 16px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
font-size: 12px;
line-height: 1;
}

.remove-from-wave:hover {
background: #c0392b;
}

.empty-wave {
text-align: center;
color: #7f8c8d;
font-style: italic;
margin: 0;
}

.otter-tabs {
display: flex;
background: #f8f9fa;
border-bottom: 1px solid #e9ecef;
overflow-x: auto;
flex-shrink: 0;
}


.otter-items {
flex: 1;
padding: 8px;
overflow-y: auto;
font-size: 14px;
}

.size-section {
margin-bottom: 12px;
padding: 6px;
background: #f0f0f0;
border-radius: 6px;
}

.size-header {
margin: 0 0 8px 0;
font-size: 14px;
font-weight: 700;
color: #2c3e50;
text-transform: uppercase;
padding-bottom: 4px;
border-bottom: 2px solid #3498db;
}

.category-section {
margin-bottom: 10px;
}

.category-header {
margin: 0 0 6px 0;
font-size: 12px;
font-weight: 600;
color: #2c3e50;
text-transform: uppercase;
}

.item-list {
display: flex;
flex-direction: column;
gap: 4px;
}

.batch-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 6px;
background: #f8f9fa;
border-radius: 4px;
transition: background 0.2s;
min-height: 32px;
}

.batch-item:hover {
background: #e9ecef;
}
.batch-item.packed {
background-color: #5cb85c !important;
border-color: #5cb85c !important;
}
.batch-item.packed .item-name,
.batch-item.packed .item-quantity,
.batch-item.packed .item-price,
.batch-item.packed span {
color: white !important;
}
.batch-item {
cursor: pointer;
transition: all 0.3s ease;
-webkit-tap-highlight-color: transparent;
user-select: none;
}
.batch-item:hover:not(.packed) {
background-color: #e0e0e0;
transform: translateX(2px);
}
/* Pack checkbox removed - clicking entire item toggles packed state */

.item-info {
display: flex;
align-items: center;
gap: 10px;
flex: 1;
}

.item-name {
font-weight: 600;
color: #2c3e50;
font-size: 14px;
line-height: 1.2;
}

.item-quantity {
font-weight: bold;
color: #3498db;
font-size: 14px;
}

/* Completed order styles */
.order-info.completed {
opacity: 0.6;
text-decoration: line-through;
}

.order-info.completed .order-customer {
color: #7f8c8d;
}

.wave-item.completed {
opacity: 0.5;
}

.wave-item.completed .wave-item-name {
text-decoration: line-through;
color: #7f8c8d;
}

.wave-item.completed .wave-item-qty {
text-decoration: line-through;
}

/* Order color coding */
.wave-item {
position: relative;
padding-left: 20px;
}

/* Remove the bar style - we'll use dots for everything */
.wave-item[data-order-color]::before {
display: none;
}

/* Multiple order colors - dots */
.order-color-dots {
position: absolute;
right: 2px;
top: 2px;
display: flex;
gap: 2px;
z-index: 1;
}

.order-color-dot {
width: 6px;
height: 6px;
border-radius: 50%;
border: 1px solid rgba(0, 0, 0, 0.2);
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Color dot backgrounds */
.order-color-dot[data-color="0"] { background: #FFE082; }
.order-color-dot[data-color="1"] { background: #81D4FA; }
.order-color-dot[data-color="2"] { background: #A5D6A7; }
.order-color-dot[data-color="3"] { background: #CE93D8; }
.order-color-dot[data-color="4"] { background: #FFAB91; }
.order-color-dot[data-color="5"] { background: #80CBC4; }
.order-color-dot[data-color="6"] { background: #F48FB1; }
.order-color-dot[data-color="7"] { background: #90CAF9; }
.order-color-dot[data-color="8"] { background: #FFF59D; }
.order-color-dot[data-color="9"] { background: #BCAAA4; }

/* Adjust item spacing for consistent alignment */
.wave-item .wave-item-details {
display: flex;
flex-wrap: nowrap;
align-items: center;
gap: 4px;
width: auto;
}

/* Customer badge colors remain the same */

/* Matching customer badge colors */
.batch-customer-badge[data-order-color] {
border-left: 4px solid;
}

.batch-customer-badge[data-order-color="0"] { border-left-color: #FFE082; }
.batch-customer-badge[data-order-color="1"] { border-left-color: #81D4FA; }
.batch-customer-badge[data-order-color="2"] { border-left-color: #A5D6A7; }
.batch-customer-badge[data-order-color="3"] { border-left-color: #CE93D8; }
.batch-customer-badge[data-order-color="4"] { border-left-color: #FFAB91; }
.batch-customer-badge[data-order-color="5"] { border-left-color: #80CBC4; }
.batch-customer-badge[data-order-color="6"] { border-left-color: #F48FB1; }
.batch-customer-badge[data-order-color="7"] { border-left-color: #90CAF9; }
.batch-customer-badge[data-order-color="8"] { border-left-color: #FFF59D; }
.batch-customer-badge[data-order-color="9"] { border-left-color: #BCAAA4; }

/* Legend for order colors */
.order-color-legend {
display: flex;
flex-wrap: wrap;
gap: 8px;
margin-top: 10px;
padding-top: 10px;
border-top: 1px solid #e9ecef;
}

.order-color-item {
display: flex;
align-items: center;
gap: 4px;
font-size: 11px;
color: #495057;
}

.order-color-swatch {
width: 12px;
height: 12px;
border-radius: 2px;
}

/* Order indicator for split items */
.order-indicator {
font-size: 11px;
color: #6c757d;
font-style: italic;
margin-left: 8px;
}

.item-actions {
display: flex;
align-items: center;
gap: 10px;
}

.item-price {
font-weight: 600;
color: #27ae60;
font-size: 16px;
}

.add-to-wave {
background: #3498db;
color: white;
border: none;
border-radius: 4px;
padding: 5px 10px;
cursor: pointer;
font-size: 12px;
transition: background 0.2s;
}

.add-to-wave:hover {
background: #2980b9;
}

.no-items {
text-align: center;
color: #7f8c8d;
font-style: italic;
margin: 20px 0;
}

.otter-notification {
position: absolute;
top: 60px;
right: 20px;
padding: 12px 20px;
border-radius: 4px;
color: white;
font-weight: 500;
opacity: 0;
transform: translateX(100px);
transition: all 0.3s;
z-index: 1000;
}

.otter-notification.show {
opacity: 1;
transform: translateX(0);
}

.otter-notification.success {
background: #27ae60;
}

.otter-notification.error {
background: #e74c3c;
}

.otter-notification.info {
background: #3498db;
}

.otter-notification.warning {
background: #ff9800;
color: white;
font-weight: 600;
box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
animation: shake 0.5s ease-in-out;
}

@keyframes shake {
0%, 100% { transform: translateX(0); }
25% { transform: translateX(-10px); }
75% { transform: translateX(10px); }
}

::-webkit-scrollbar {
width: 8px;
height: 8px;
}

::-webkit-scrollbar-track {
background: rgba(241, 241, 241, 0.3);
border-radius: 4px;
}

::-webkit-scrollbar-thumb {
background: #888;
border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
background: #555;
}

/* Horizontal scrollbar for wave view */
.otter-wave-view::-webkit-scrollbar,
.wave-size-group::-webkit-scrollbar {
height: 10px;
}

.otter-wave-view::-webkit-scrollbar-thumb,
.wave-size-group::-webkit-scrollbar-thumb {
background: #3498db;
}

.otter-progress {
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
background: white;
padding: 20px 30px;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
display: flex;
align-items: center;
gap: 15px;
z-index: 1001;
}

.progress-spinner {
width: 24px;
height: 24px;
border: 3px solid #f3f3f3;
border-top: 3px solid #3498db;
border-radius: 50%;
animation: spin 1s linear infinite;
}

@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}

.wave-tabs {
display: flex;
gap: 8px;
padding: 10px 15px;
background: #f0f0f0;
border-bottom: 1px solid #ddd;
overflow-x: auto;
}

.wave-tab {
padding: 6px 12px;
background: white;
border: 1px solid #ddd;
border-radius: 4px;
cursor: pointer;
font-size: 13px;
display: flex;
align-items: center;
gap: 8px;
white-space: nowrap;
transition: all 0.2s;
}

.wave-tab:hover {
background: #f8f9fa;
}

.wave-tab.active {
background: #3498db;
color: white;
border-color: #3498db;
}

.wave-tab.full {
background: #e74c3c;
color: white;
border-color: #e74c3c;
}

.wave-count {
font-size: 11px;
background: rgba(0, 0, 0, 0.1);
padding: 2px 6px;
border-radius: 10px;
}

.wave-capacity {
font-size: 12px;
color: #666;
margin-top: 4px;
}

.wave-capacity.full {
color: #e74c3c;
font-weight: bold;
}

.new-item {
background: #fff3cd;
border-left: 3px solid #ffc107;
}

.new-badge {
background: #ffc107;
color: #000;
font-size: 13px;
font-weight: bold;
padding: 3px 8px;
border-radius: 4px;
margin-right: 10px;
}

/* Category-specific styling */
.category-section {
margin-bottom: 10px;
}

.category-section.hierarchical {
background: #f9f9f9;
border-radius: 8px;
padding: 15px;
margin-bottom: 25px;
}

.category-header {
font-size: 18px;
font-weight: 600;
margin-bottom: 15px;
color: #333;
}

.category-header.main-category {
font-size: 20px;
color: #2c3e50;
border-bottom: 2px solid #e0e0e0;
padding-bottom: 10px;
margin-bottom: 20px;
}

/* Hierarchical category colors */
.category-section.riceBowls .main-category {
color: #e74c3c;
border-color: #e74c3c;
}

.category-section.urbanBowls .main-category {
color: #3498db;
border-color: #3498db;
}

.category-section.noodles .main-category {
color: #f39c12;
border-color: #f39c12;
}

.category-section.friedRice .main-category {
color: #27ae60;
border-color: #27ae60;
}

/* Subcategory styling */
.subcategory-section {
margin-bottom: 15px;
background: white;
border-radius: 6px;
padding: 12px;
border: 1px solid #eee;
}

.subcategory-header {
font-size: 16px;
font-weight: 600;
color: #333;
margin-bottom: 12px;
padding: 8px 12px;
border-left: 4px solid #ddd;
background: rgba(0, 0, 0, 0.03);
border-radius: 0 4px 4px 0;
}

/* Three-level hierarchy for rice bowls */
.protein-group {
margin-left: 15px;
margin-bottom: 10px;
background: #2a2a2a;
border-radius: 4px;
padding: 8px;
}

.protein-header {
font-size: 13px;
font-weight: 600;
color: #4ade80;
margin-bottom: 8px;
}

.sauce-group {
margin-left: 10px;
margin-bottom: 8px;
}

.sauce-label {
font-size: 11px;
font-weight: 500;
color: #a0a0a0;
display: inline-block;
margin-bottom: 5px;
font-style: italic;
}

/* Protein-specific subcategory colors with outlines */
.subcategory-header {
border: 2px solid transparent;
padding: 10px 15px !important;
border-radius: 8px;
font-weight: 700;
}

/* Grilled Chicken - Orange */
.subcategory-section.grilled-chicken .subcategory-header,
.subcategory-section.grilledChickenRiceBowls .subcategory-header,
.subcategory-section.chickenUrbanBowls .subcategory-header {
color: #ff9800;
border-color: #ff9800;
background: rgba(255, 152, 0, 0.1);
}

/* Crispy Chicken - Deep Orange */
.subcategory-section.crispy-chicken .subcategory-header,
.subcategory-section.crispyChickenRiceBowls .subcategory-header,
.subcategory-section.chickenNoodles .subcategory-header,
.subcategory-section.chickenFriedRice .subcategory-header {
color: #ff5722;
border-color: #ff5722;
background: rgba(255, 87, 34, 0.1);
}

/* Steak - Brown */
.subcategory-section.steak .subcategory-header,
.subcategory-section.steakRiceBowls .subcategory-header,
.subcategory-section.beefNoodles .subcategory-header {
color: #795548;
border-color: #795548;
background: rgba(121, 85, 72, 0.1);
}

/* Salmon - Pink */
.subcategory-section.salmon .subcategory-header,
.subcategory-section.salmonRiceBowls .subcategory-header {
color: #ff4081;
border-color: #ff4081;
background: rgba(255, 64, 129, 0.1);
}

/* Shrimp - Light Pink */
.subcategory-section.shrimp .subcategory-header,
.subcategory-section.shrimpRiceBowls .subcategory-header,
.subcategory-section.shrimpNoodles .subcategory-header,
.subcategory-section.shrimpFriedRice .subcategory-header {
color: #ff6b9d;
border-color: #ff6b9d;
background: rgba(255, 107, 157, 0.1);
}

/* Tofu - Green */
.subcategory-section.tofu .subcategory-header,
.subcategory-section.tofuRiceBowls .subcategory-header {
color: #4caf50;
border-color: #4caf50;
background: rgba(76, 175, 80, 0.1);
}

/* Cauliflower - Light Green */
.subcategory-section.cauliflower .subcategory-header,
.subcategory-section.cauliflowerUrbanBowls .subcategory-header,
.subcategory-section.vegetableFriedRice .subcategory-header {
color: #8bc34a;
border-color: #8bc34a;
background: rgba(139, 195, 74, 0.1);
}

/* Pork - Pink-Red */
.subcategory-section.pork .subcategory-header,
.subcategory-section.porkRiceBowls .subcategory-header {
color: #e91e63;
border-color: #e91e63;
background: rgba(233, 30, 99, 0.1);
}

/* Fish - Light Blue */
.subcategory-section.fish .subcategory-header,
.subcategory-section.fishRiceBowls .subcategory-header {
color: #03a9f4;
border-color: #03a9f4;
background: rgba(3, 169, 244, 0.1);
}

/* Regular category styling */
.category-section.appetizers .category-header {
color: #9b59b6;
border-left: 3px solid #9b59b6;
padding-left: 8px;
}

.category-section.dumplings .category-header {
color: #D2691E;
border-left: 3px solid #D2691E;
padding-left: 8px;
}

.category-section.sides .category-header {
color: #34495e;
border-left: 3px solid #34495e;
padding-left: 8px;
}

.category-section.desserts .category-header {
color: #e91e63;
border-left: 3px solid #e91e63;
padding-left: 8px;
}

.category-section.drinks .category-header {
color: #00bcd4;
border-left: 3px solid #00bcd4;
padding-left: 8px;
}

.category-section.uncategorized .category-header {
color: #7f8c8d;
border-left: 3px solid #7f8c8d;
padding-left: 8px;
font-style: italic;
}

/* Size badge */
.size-badge {
color: white;
font-size: 13px;
font-weight: 600;
padding: 4px 10px;
border-radius: 3px;
margin-left: 5px;
text-transform: capitalize;
display: inline-block;
vertical-align: middle;
}

/* Stacked size badge */
.size-badge.stacked {
display: inline-flex;
flex-direction: column;
text-align: center;
padding: 4px 10px;
line-height: 1.2;
min-width: 60px;
}

.size-badge.stacked .size-line {
font-weight: 600;
font-size: 10px;
text-transform: uppercase;
}

.size-badge.stacked .rice-line {
font-size: 10px;
font-weight: 500;
margin-top: 2px;
}

/* Size-specific colors - using !important to override .item-size styles */
.size-badge[data-size="small"],
.size-badge[data-size="sm"] {
background: #5cb85c !important; /* Green for small */
color: white !important;
}

.size-badge[data-size="medium"],
.size-badge[data-size="md"],
.size-badge[data-size="regular"] {
background: #ffc107 !important; /* Yellow/amber for medium/regular */
color: #212529 !important; /* Dark text for better contrast */
}

.size-badge[data-size="large"],
.size-badge[data-size="lg"] {
background: #dc3545 !important; /* Red for large */
color: white !important;
}

.size-badge[data-size="xl"] {
background: #6f42c1 !important; /* Purple for extra large */
color: white !important;
}

.size-badge[data-size="urban"] {
background: #17a2b8 !important; /* Teal for Urban Bowls */
color: white !important;
}

.size-badge[data-size="no-size"] {
background: #6c757d !important; /* Gray for no size */
color: white !important;
font-style: italic;
}

/* Default gray for unknown sizes */
.size-badge:not([data-size]) {
background: #6c757d !important;
color: white !important;
}

/* Rice type badges */
.rice-type-badge {
font-size: 12px;
font-weight: 600;
padding: 4px 10px;
border-radius: 12px;
margin-left: 5px;
text-transform: uppercase;
letter-spacing: 0.5px;
}


/* White rice - default */
.rice-type-badge.white-rice {
background: #f8f9fa;
color: #495057;
border: 1px solid #dee2e6;
}

/* Fried rice */
.rice-type-badge.fried-rice {
background: #ffc107;
color: #212529;
border: 1px solid #ffb300;
}

/* Garlic butter fried rice */
.rice-type-badge.garlic-butter {
background: #9c27b0;
color: white;
border: 1px solid #7b1fa2;
}

/* Noodles */
.rice-type-badge.noodles {
background: #4ecdc4;
color: white;
border: 1px solid #45b7aa;
}

/* Generic substitute */
.rice-type-badge.substitute {
background: #e9ecef;
color: #495057;
border: 1px solid #ced4da;
}

/* Size placeholder when size is unknown */
.size-badge:has-text('?') {
background: #999;
opacity: 0.7;
font-style: italic;
}

/* Urban Bowl indicator */
.urban-bowl-badge {
background: #555;
color: #e0e0e0;
font-size: 9px;
font-weight: bold;
padding: 2px 4px;
border-radius: 3px;
margin-left: 5px;
text-transform: uppercase;
border: 1px solid #666;
}

/* Rice Bowl indicator */
.rice-bowl-badge {
background: #e67e22;
color: white;
font-size: 9px;
font-weight: bold;
padding: 2px 4px;
border-radius: 3px;
margin-left: 5px;
text-transform: uppercase;
border: 1px solid #d35400;
}

/* Rice substitution indicator */
.rice-sub-indicator {
background: #3498db;
color: white;
font-size: 10px;
padding: 2px 6px;
border-radius: 3px;
margin-left: 5px;
}

/* Wave View Styles */
.otter-wave-view {
padding: 8px;
overflow-y: auto;
overflow-x: auto;
height: 100%;
-webkit-overflow-scrolling: touch;
width: 100%;
}

.wave-section {
margin-bottom: 20px;
border-radius: 8px;
overflow: hidden;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Urgency-based wave colors - Dark theme */
.wave-section.urgent {
border: 3px solid #dc3545;
background: #2d2d2d;
position: relative;
animation: urgent-pulse 3s ease-in-out infinite;
}

@keyframes urgent-pulse {
0%, 100% { border-color: #dc3545; box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
50% { border-color: #ff6b7a; box-shadow: 0 0 10px 3px rgba(220, 53, 69, 0.3); }
}

.wave-section.urgent .wave-header {
background: #3d1f23;
color: white;
position: relative;
border-bottom: 1px solid #dc3545;
}

.wave-section.urgent .wave-header::after {
content: '⚡ URGENT';
position: absolute;
right: 15px;
top: 8px;
font-size: 11px;
font-weight: bold;
color: #ff6b7a;
background: rgba(220, 53, 69, 0.2);
padding: 2px 8px;
border-radius: 3px;
animation: pulse-text 2s infinite;
}

.wave-section.warning {
border: 3px solid #fd7e14;
background: #2d2d2d;
}

.wave-section.warning .wave-header {
background: #3d2f1f;
color: white;
border-bottom: 1px solid #fd7e14;
}

.wave-section.warning .wave-header::after {
content: '⏰ APPROACHING';
position: absolute;
right: 15px;
top: 8px;
font-size: 11px;
color: #ffb066;
background: rgba(253, 126, 20, 0.2);
padding: 2px 8px;
border-radius: 3px;
}

.wave-section.normal {
border: 3px solid #5cb85c;
background: #2d2d2d;
}

.wave-section.normal .wave-header {
background: #1f3d29;
color: white;
border-bottom: 1px solid #28a745;
}

@keyframes pulse-text {
0% { opacity: 1; }
50% { opacity: 0.6; }
100% { opacity: 1; }
}

/* Age transition animation */
.wave-section {
transition: all 0.3s ease;
}

.wave-section.age-transition {
animation: age-transition 0.5s ease;
}

@keyframes age-transition {
0% { transform: translateX(0); }
25% { transform: translateX(-10px); }
75% { transform: translateX(10px); }
100% { transform: translateX(0); }
}

.wave-header {
padding: 15px;
padding-right: 120px; /* Make room for badge */
position: relative;
}

.wave-header h3 {
margin: 0;
font-size: 18px;
font-weight: 600;
margin-bottom: 5px;
}

.wave-stats {
display: flex;
gap: 15px;
font-size: 14px;
color: #a0a0a0;
}

.wave-stats span {
background: rgba(255, 255, 255, 0.1);
padding: 2px 8px;
border-radius: 4px;
}

.wave-content {
padding: 15px;
}

/* Customer names in waves */
.wave-customers {
margin-bottom: 15px;
padding: 10px;
background: rgba(255, 255, 255, 0.05);
border-radius: 6px;
}

.wave-customers-header {
font-size: 12px;
color: #a0a0a0;
margin-bottom: 8px;
font-weight: 500;
}

.wave-customer-list {
display: flex;
flex-wrap: wrap;
gap: 6px;
}

.wave-customer-badge {
background: rgba(255, 255, 255, 0.1);
color: #ffffff;
padding: 4px 10px;
border-radius: 15px;
font-size: 12px;
display: inline-flex;
align-items: center;
gap: 5px;
border: 1px solid rgba(255, 255, 255, 0.2);
transition: all 0.2s;
}

.batch-customer-badge {
background: rgba(255, 255, 255, 0.1);
color: #ffffff;
padding: 4px 10px;
border-radius: 15px;
font-size: 12px;
display: inline-flex;
align-items: center;
gap: 5px;
border: 1px solid rgba(255, 255, 255, 0.2);
transition: all 0.2s;
margin: 2px;
}

.batch-customer-badge.elapsed-overdue {
background: rgba(220, 53, 69, 0.2);
border-color: #dc3545;
animation: overduePulse 2s ease-in-out infinite;
}

.batch-customer-badge.order-new {
background: rgba(255, 193, 7, 0.2);
border-color: #ffc107;
}

.batch-customer-badge.order-completed {
background: rgba(40, 167, 69, 0.2);
border-color: #5cb85c;
opacity: 0.7;
}

.wave-customer-badge:hover {
background: rgba(255, 255, 255, 0.15);
border-color: rgba(255, 255, 255, 0.3);
}

.wave-customer-order {
color: #a0a0a0;
font-size: 10px;
background: #242424;
}

.wave-size-group {
margin-bottom: 10px;
padding: 8px;
background: rgba(255, 255, 255, 0.02);
border-radius: 4px;
overflow-x: auto;
overflow-y: visible;
-webkit-overflow-scrolling: touch;
position: relative;
width: 100%;
max-width: 100%;
}

.wave-size-header {
font-size: 13px;
font-weight: 600;
color: #ffffff;
margin: 0 0 6px 0;
padding-bottom: 3px;
border-bottom: 1px solid #404040;
}

.wave-category-group {
margin-bottom: 8px;
}

/* Three column layout with adjusted columns for narrower overlay */
.wave-items-wrapper {
display: grid;
grid-template-columns: repeat(3, 270px);
gap: 8px;
width: 830px;
overflow-x: visible;
}

.wave-items-list {
overflow-x: auto;
overflow-y: visible;
-webkit-overflow-scrolling: touch;
width: 100%;
}

.batch-content-wrapper {
display: flex;
flex-direction: column;
gap: 6px;
}

.wave-category-header {
font-size: 14px;
font-weight: 700;
margin: 0 0 8px 0;
padding: 6px 12px;
color: #ffffff;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border-radius: 6px;
text-transform: uppercase;
letter-spacing: 0.5px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Dynamic category colors - Darker for better contrast */
.wave-category-header[data-category="rice-bowls"] {
background: linear-gradient(135deg, #d63031 0%, #e17055 100%);
}

.wave-category-header[data-category="dumplings"] {
background: linear-gradient(135deg, #5f27cd 0%, #341f97 100%);
}

.wave-category-header[data-category="drinks"] {
background: linear-gradient(135deg, #0984e3 0%, #00b894 100%);
}

.wave-category-header[data-category="grilled"] {
background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
}

.wave-category-header[data-category="crispy"] {
background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
}

.wave-category-header[data-category="cauliflower"] {
background: linear-gradient(135deg, #27ae60 0%, #16a085 100%);
}

.wave-category-header[data-category="other"] {
background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
}

.wave-category-header[data-category="uncategorized"] {
background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
}

.wave-category-header[data-category="noodles"] {
background: linear-gradient(135deg, #d63031 0%, #ff6b6b 100%);
}

.wave-category-header[data-category="sides"] {
background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
}

.wave-category-header[data-category="appetizers"] {
background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

/* Rice Bowl Variations - Distinct darker colors */
.wave-category-header[data-category="crispy-rice-bowls"] {
background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
}

.wave-category-header[data-category="grilled-rice-bowls"] {
background: linear-gradient(135deg, #d35400 0%, #f39c12 100%);
}

.wave-category-header[data-category="urban-bowls"] {
background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
}

.wave-category-header[data-category="fried-rice"] {
background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
}

/* Protein Categories - Saturated colors */
.wave-category-header[data-category="shrimp"] {
background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
}

.wave-category-header[data-category="steak"] {
background: linear-gradient(135deg, #6d4c41 0%, #8d6e63 100%);
}

.wave-category-header[data-category="salmon"] {
background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
}

.wave-category-header[data-category="tofu"] {
background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
}

.wave-category-header[data-category="pork"] {
background: linear-gradient(135deg, #c2185b 0%, #880e4f 100%);
}

.wave-category-header[data-category="chicken"] {
background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.wave-category-header[data-category="desserts"] {
background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
}

.wave-item-list {
list-style: none;
padding: 0;
margin: 0;
}

.wave-item {
display: flex;
align-items: flex-start;
padding: 6px 10px;
background: #333;
margin-bottom: 4px;
border-radius: 3px;
color: #e0e0e0;
position: relative;
font-size: 12px;
min-height: 32px;
max-width: 100%;
box-sizing: border-box;
}

.wave-item.overdue {
background: rgba(220, 53, 69, 0.2);
border: 1px solid #dc3545;
animation: overduePulse 2s ease-in-out infinite;
}

@keyframes overduePulse {
0%, 100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
50% { box-shadow: 0 0 5px 2px rgba(220, 53, 69, 0.5); }
}

.item-wait-time {
margin-left: auto;
font-size: 11px;
color: #666;
font-weight: 500;
background: rgba(0, 0, 0, 0.05);
padding: 2px 6px;
border-radius: 10px;
}

.item-wait-time.overdue {
color: #dc3545;
font-weight: 600;
background: rgba(220, 53, 69, 0.1);
}

.customer-wait-time {
font-size: 11px;
color: #999;
font-weight: 500;
}

.wave-item-quantity {
font-weight: 900;
color: #000000;
margin-right: 4px;
font-size: 14px;
background: #ffffff;
padding: 3px 7px;
border-radius: 4px;
display: inline-block;
border: 2px solid #333333;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
letter-spacing: 0.5px;
}

.wave-item-name {
flex: 1;
color: #ffffff;
word-wrap: break-word;
word-break: normal;
line-height: 1.3;
padding-right: 8px;
font-size: 13px;
font-weight: 600;
min-width: 0;
max-width: 100%;
overflow-wrap: break-word;
hyphens: auto;
}

.size-estimated {
color: #ffc107;
font-size: 16px;
font-weight: bold;
margin-left: 5px;
cursor: help;
vertical-align: super;
}

.wave-actions {
margin-top: 15px;
padding-top: 15px;
border-top: 1px solid #404040;
text-align: center;
}

.complete-wave-btn {
width: 100%;
padding: 10px;
background: #5cb85c;
color: white;
border: none;
border-radius: 4px;
font-size: 14px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
}

.complete-wave-btn:hover {
background: #218838;
transform: translateY(-1px);
box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.complete-wave-btn:active {
transform: translateY(0);
}

.send-wave-btn {
width: 100%;
padding: 12px;
font-size: 16px;
font-weight: 600;
border: 1px solid #555;
}

.wave-section.urgent .send-wave-btn {
background: #4a4a4a;
border: 2px solid #666;
}

.wave-section.urgent .send-wave-btn:hover {
background: #5a5a5a;
}

.wave-section.warning .send-wave-btn {
background: #4a4a4a;
}

.wave-section.warning .send-wave-btn:hover {
background: #5a5a5a;
}

/* Refresh status indicator */
.refresh-status {
padding: 6px 12px;
background: #2d2d2d;
border-bottom: 1px solid #404040;
font-size: 11px;
color: #a0a0a0;
display: flex;
align-items: center;
justify-content: space-between;
height: 35px;
}

/* Status bar elements */
.status-left {
display: flex;
align-items: center;
gap: 8px;
}

.status-right {
display: flex;
align-items: center;
}

.mode-badge {
padding: 2px 6px;
border-radius: 3px;
font-size: 10px;
font-weight: bold;
letter-spacing: 0.5px;
}

.mode-badge.scraping {
background: rgba(40, 167, 69, 0.3);
color: #5cb85c;
border: 1px solid #5cb85c;
}

.mode-badge.view-only {
background: rgba(108, 117, 125, 0.3);
color: #6c757d;
border: 1px solid #6c757d;
}

.status-text {
font-size: 11px;
color: #888;
}

.refresh-info {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 8px;
}

.last-refresh {
font-style: italic;
}

/* Live status indicator */
.live-status {
display: flex;
align-items: center;
gap: 8px;
padding: 5px 10px;
background: rgba(40, 167, 69, 0.1);
border-radius: 4px;
font-size: 11px;
transition: all 0.3s ease;
}

.live-status.live {
background: rgba(40, 167, 69, 0.1);
color: #5cb85c;
}

.live-status.new {
background: rgba(255, 193, 7, 0.1);
color: #ffc107;
}

.live-status.extracting {
background: rgba(0, 123, 255, 0.1);
color: #007bff;
}

.live-indicator {
width: 8px;
height: 8px;
background: currentColor;
border-radius: 50%;
display: inline-block;
position: relative;
}

.live-indicator::after {
content: '';
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: currentColor;
border-radius: 50%;
animation: pulse-indicator 2s infinite;
}

.live-indicator.extracting {
animation: spin 1s linear infinite;
}

@keyframes pulse-indicator {
0% {
  transform: scale(1);
  opacity: 1;
}
50% {
  transform: scale(1.5);
  opacity: 0.5;
}
100% {
  transform: scale(1);
  opacity: 1;
}
}

/* API and size badges */
.item-size {
font-size: 11px;
color: #17a2b8;
font-weight: 600;
background: rgba(23, 162, 184, 0.1);
padding: 2px 6px;
border-radius: 10px;
margin-left: 5px;
}

.api-badge {
font-size: 10px;
color: #5cb85c;
font-weight: 600;
background: rgba(40, 167, 69, 0.1);
padding: 2px 5px;
border-radius: 8px;
margin-left: 5px;
text-transform: uppercase;
}

.react-badge {
font-size: 10px;
color: #61dafb;
font-weight: 600;
background: rgba(97, 218, 251, 0.1);
padding: 2px 5px;
border-radius: 8px;
margin-left: 5px;
text-transform: uppercase;
}

/* Wave controls section */
.wave-controls {
display: flex;
justify-content: space-between;
align-items: center;
padding: 10px 15px;
background: #1f1f1f;
border-bottom: 1px solid #333;
gap: 10px;
}

.wave-capacity-control {
display: flex;
align-items: center;
gap: 8px;
}

.wave-capacity-control label {
font-size: 12px;
color: #a0a0a0;
}

.wave-capacity-input {
width: 60px;
padding: 4px 8px;
background: #2d2d2d;
border: 1px solid #404040;
color: #ffffff;
border-radius: 4px;
font-size: 12px;
text-align: center;
}

.wave-capacity-input:focus {
outline: none;
border-color: #5cb85c;
}

.refresh-btn {
padding: 4px 8px;
background: #404040;
color: #ffffff;
border: none;
border-radius: 3px;
font-size: 11px;
cursor: pointer;
display: flex;
align-items: center;
gap: 3px;
transition: all 0.2s;
height: 26px;
}

.refresh-btn:hover {
background: #4a4a4a;
}

.refresh-btn:active {
background: #333;
}

.refresh-btn.refreshing {
animation: spin 1s linear infinite;
pointer-events: none;
opacity: 0.7;
}

@keyframes spin {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}

/* Floating toggle button */
.otter-floating-toggle {
position: fixed;
bottom: 30px;
right: 30px;
width: 60px;
height: 60px;
background: #5cb85c;
border: none;
border-radius: 50%;
color: white;
font-size: 24px;
cursor: pointer;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
z-index: 2147483646; /* Just below maximum */
transition: all 0.3s ease;
display: flex;
align-items: center;
justify-content: center;
}

.otter-floating-toggle:hover {
background: #218838;
transform: scale(1.1);
box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.otter-floating-toggle:active {
transform: scale(0.95);
}

/* Mode toggle button - Removed */

/* Mode Selection Modal */
.otter-modal-backdrop {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.8);
display: flex;
align-items: center;
justify-content: center;
z-index: 1000000;
opacity: 0;
transition: opacity 0.3s ease;
}

.otter-modal-backdrop.show {
opacity: 1;
}

.otter-mode-modal {
background: #1a1a1a;
border-radius: 12px;
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
max-width: 600px;
width: 90%;
transform: scale(0.9);
opacity: 0;
transition: all 0.3s ease;
}

.otter-mode-modal.show {
transform: scale(1);
opacity: 1;
}

.otter-modal-content {
padding: 30px;
}

.otter-modal-content h2 {
margin: 0 0 10px 0;
font-size: 24px;
color: #ffffff;
text-align: center;
}

.otter-modal-subtitle {
color: #a0a0a0;
text-align: center;
margin: 0 0 30px 0;
font-size: 14px;
}

.otter-mode-options {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 20px;
margin-bottom: 20px;
}

.otter-mode-option {
background: #2d2d2d;
border: 2px solid #404040;
border-radius: 8px;
padding: 25px 20px;
cursor: pointer;
transition: all 0.2s ease;
text-align: center;
position: relative;
}

.otter-mode-option:hover {
border-color: #606060;
background: #333333;
transform: translateY(-2px);
}

.otter-mode-option.scraping:hover {
border-color: #5cb85c;
box-shadow: 0 5px 20px rgba(40, 167, 69, 0.3);
}

.otter-mode-option.view-only:hover {
border-color: #6c757d;
box-shadow: 0 5px 20px rgba(108, 117, 125, 0.3);
}

.mode-icon {
font-size: 48px;
margin-bottom: 15px;
}

.otter-mode-option h3 {
margin: 0 0 10px 0;
font-size: 18px;
color: #ffffff;
}

.otter-mode-option p {
margin: 0;
font-size: 13px;
color: #a0a0a0;
line-height: 1.4;
}

.mode-shortcut {
position: absolute;
top: 10px;
right: 10px;
background: rgba(255, 255, 255, 0.1);
padding: 4px 8px;
border-radius: 4px;
font-size: 11px;
color: #808080;
}

.otter-modal-note {
text-align: center;
font-size: 12px;
color: #666;
margin: 0;
}

/* View Tabs */
.view-tabs {
display: flex;
background: #2a2a2a;
border-bottom: 1px solid #3a3a3a;
}

.view-tab {
flex: 1;
padding: 10px;
background: transparent;
color: #808080;
border: none;
cursor: pointer;
font-size: 14px;
font-weight: 500;
transition: all 0.2s ease;
border-bottom: 2px solid transparent;
}

.view-tab:hover {
color: #b0b0b0;
background: rgba(255, 255, 255, 0.05);
}

.view-tab.active {
color: #ffffff;
background: rgba(0, 123, 255, 0.1);
border-bottom-color: #007bff;
}


.batched-items-container {
display: flex;
flex-direction: column;
gap: 20px;
}

/* Item Modifiers */
.item-modifiers {
margin-left: 20px;
margin-top: 5px;
margin-bottom: 5px;
font-size: 12px;
color: #a0a0a0;
}

/* Item Notes */
.item-note {
margin-left: 20px;
margin-top: 5px;
margin-bottom: 5px;
font-size: 12px;
background: rgba(255, 193, 7, 0.1);
padding: 5px 10px;
border-radius: 4px;
border-left: 3px solid #ffc107;
}

.item-note .note-label {
color: #ffc107;
font-weight: 600;
margin-right: 5px;
}

.item-note .note-text {
color: #f0f0f0;
}

.modifier-item {
display: flex;
justify-content: space-between;
padding: 2px 0;
}

.modifier-name {
flex: 1;
font-size: 14px;
line-height: 1.4;
color: #b0b0b0;
}

.modifier-price {
color: #4ade80;
font-weight: 500;
margin-left: 10px;
}

/* Adjust batch item styling for modifiers */
.batch-item {
background: #2a2a2a;
border-radius: 8px;
padding: 16px;
margin-bottom: 12px;
display: flex;
flex-direction: column;
transition: all 0.2s ease;
}

.batch-item:hover {
background: #333333;
}

.batch-item .item-info {
display: flex;
align-items: center;
gap: 12px;
margin-bottom: 8px;
}

.batch-item .item-actions {
display: flex;
justify-content: space-between;
align-items: center;
margin-top: 5px;
}



/* Footer styles */
.otter-footer {
border-top: 1px solid #333;
background: #1f1f1f;
padding: 0;
flex-shrink: 0;
}

.otter-footer .batch-controls {
padding: 6px 8px;
display: flex;
gap: 8px;
align-items: center;
background: #252525;
border: none;
border-radius: 0;
margin: 0;
flex-wrap: nowrap;
}

.button-group {
display: flex;
gap: 4px;
flex: 1;
justify-content: center;
}

.otter-footer .batch-capacity-control {
display: flex;
align-items: center;
gap: 5px;
}

.otter-footer .batch-capacity-control label {
font-size: 11px;
white-space: nowrap;
}

.otter-footer .debug-toggle {
margin-left: auto;
}

.update-status {
padding: 10px 15px;
background: #2a3f5f;
display: flex;
align-items: center;
gap: 10px;
font-size: 12px;
color: #64b5f6;
}

.update-indicator {
width: 8px;
height: 8px;
background: #64b5f6;
border-radius: 50%;
animation: pulse 1.5s infinite;
}

@keyframes pulse {
0% { opacity: 1; transform: scale(1); }
50% { opacity: 0.5; transform: scale(1.2); }
100% { opacity: 1; transform: scale(1); }
}

/* Order Notes Styling */

.order-notes.clickable {
cursor: pointer;
color: #ffa726;
font-weight: bold;
transition: all 0.2s ease;
}

.order-notes.clickable:hover {
color: #ffb74d;
transform: scale(1.1);
}

/* Order Note Modal */
.otter-modal-backdrop {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.7);
display: flex;
align-items: center;
justify-content: center;
z-index: 1000001;
opacity: 0;
transition: opacity 0.3s ease;
}

.otter-modal-backdrop.show {
opacity: 1;
}

.otter-modal-backdrop.fade-out {
opacity: 0;
}

.otter-note-modal {
background: #2a2a2a;
border-radius: 8px;
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
max-width: 500px;
width: 90%;
max-height: 80vh;
display: flex;
flex-direction: column;
transform: scale(0.9);
transition: transform 0.3s ease;
}

.otter-modal-backdrop.show .otter-note-modal {
transform: scale(1);
}

.otter-note-modal .modal-header {
padding: 20px;
border-bottom: 1px solid #404040;
display: flex;
justify-content: space-between;
align-items: center;
}

.otter-note-modal .modal-header h3 {
margin: 0;
color: #ffa726;
font-size: 18px;
}

.otter-note-modal .modal-close {
background: none;
border: none;
color: #999;
font-size: 24px;
cursor: pointer;
padding: 0;
width: 30px;
height: 30px;
display: flex;
align-items: center;
justify-content: center;
transition: color 0.2s ease;
}

.otter-note-modal .modal-close:hover {
color: #fff;
}

.otter-note-modal .modal-body {
padding: 20px;
overflow-y: auto;
flex: 1;
}

.otter-note-modal .modal-customer {
margin: 0 0 15px 0;
color: #999;
}

.otter-note-modal .modal-note-content {
background: #1a1a1a;
padding: 15px;
border-radius: 4px;
color: #fff;
line-height: 1.5;
white-space: pre-wrap;
}

.otter-note-modal .modal-footer {
padding: 15px 20px;
border-top: 1px solid #404040;
display: flex;
justify-content: flex-end;
}

.otter-note-modal .modal-acknowledge {
background: #ffa726;
color: #000;
border: none;
padding: 10px 30px;
border-radius: 4px;
font-weight: bold;
cursor: pointer;
transition: background-color 0.2s ease;
}

.otter-note-modal .modal-acknowledge:hover {
background: #ffb74d;
}

/* Item Type Badges */
.protein-badge {
display: inline-block;
padding: 3px 10px;
color: white;
border-radius: 12px;
font-size: 13px;
font-weight: 600;
margin-left: 8px;
}

/* Protein-specific colors */
.protein-badge.grilled-chicken {
background: #ff9800; /* Orange */
}

.protein-badge.crispy-chicken {
background: #ff5722; /* Deep Orange */
}

.protein-badge.steak {
background: #795548; /* Brown */
}

.protein-badge.salmon {
background: #ff4081; /* Pink */
}

.protein-badge.shrimp {
background: #ff6b9d; /* Light Pink */
}

.protein-badge.tofu {
background: #4caf50; /* Green */
}

.protein-badge.cauliflower {
background: #8bc34a; /* Light Green */
}

.protein-badge.pork {
background: #e91e63; /* Pink-Red */
}

.protein-badge.fish {
background: #03a9f4; /* Light Blue */
}

/* Default protein badge color */
.protein-badge.default {
background: #9c27b0; /* Purple */
}

/* Sauce highlighting */
.sauce-highlight {
background-color: #ffeb3b !important;
color: #000000 !important;
font-weight: bold !important;
padding: 0 2px;
border-radius: 2px;
}

.rice-type-badge {
display: inline-block;
padding: 3px 10px;
background: #4ecdc4;
color: white;
border-radius: 12px;
font-size: 13px;
font-weight: 600;
margin-left: 6px;
}

.rice-type-badge.garlic-butter {
background: #f39c12;
}

.rice-type-badge.fried-rice {
background: #e67e22;
}

.rice-type-badge.noodles {
background: #9b59b6;
}

.rice-type-badge.white-rice {
background: #95a5a6;
}

/* Dumpling Badges */
.dumpling-protein-badge {
display: inline-block;
padding: 3px 10px;
color: white;
border-radius: 12px;
font-size: 13px;
font-weight: 600;
margin-left: 8px;
}

/* Specific dumpling colors */
.dumpling-protein-badge.pork {
background: #ffc107; /* Yellow for pork */
}

.dumpling-protein-badge.chicken {
background: #2196f3; /* Blue for chicken */
}

.dumpling-protein-badge.vegetable {
background: #388e3c; /* Green for vegetable */
}

/* Default dumpling color */
.dumpling-protein-badge.default {
background: #8e24aa; /* Purple for unknown */
}

.dumpling-sauce-badge {
display: inline-block;
padding: 1px 4px;
background: #e91e63;
color: white;
border-radius: 6px;
font-size: 9px;
font-weight: 500;
margin-left: 2px;
}

/* Sauce Badges for Steak/Salmon */
.sauce-badge {
display: inline-block;
padding: 1px 4px;
color: white;
border-radius: 6px;
font-size: 9px;
font-weight: 500;
margin-left: 2px;
}

/* Specific sauce colors */
.sauce-badge.orange {
background: #ff9800; /* Orange */
}

.sauce-badge.chipotle {
background: #795548; /* Brown */
}

.sauce-badge.jalapeno {
background: #4caf50; /* Green */
}

.sauce-badge.sesame {
background: #9e9e9e; /* Gray */
}

.sauce-badge.garlic {
background: #fdd835; /* Yellow */
}

.sauce-badge.sriracha {
background: #f44336; /* Red */
}

.sauce-badge.garlic-sesame {
background: #ff6f00; /* Deep Orange */
}

.sauce-badge.shoyu {
background: #795548; /* Brown */
}

.sauce-badge.soy-ginger {
background: #3f51b5; /* Indigo */
}

.sauce-badge.yuzu {
background: #ffeb3b; /* Yellow */
color: #333; /* Dark text for light background */
}

.sauce-badge.teriyaki {
background: #5d4037; /* Dark Brown */
}

.sauce-badge.default {
background: #9c27b0; /* Purple for unknown */
}

/* Clear Button Styling */
.clear-button-container {
display: flex;
align-items: center;
margin: 0 15px;
}

.clear-all-btn {
padding: 8px 20px;
background: #dc3545;
color: white;
border: none;
border-radius: 4px;
font-size: 14px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s ease;
white-space: nowrap;
}

.clear-all-btn:hover {
background: #c82333;
transform: scale(1.05);
}

.clear-all-btn:active {
background: #bd2130;
transform: scale(0.98);
}

/* Mobile-specific styles */
@media (max-width: 768px) {
.clear-all-btn {
  padding: 12px 24px;
  font-size: 16px;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.clear-button-container {
  position: static;
  margin: 0;
}

.batch-controls {
  padding-bottom: 80px; /* Make room for fixed button */
}
}


/* ----- label_styles.css ----- */
/* label_styles.css - V2.8 - Avery 5163: Further logo size increase */

/* --- Global Styles & Variables --- */
:root {
  --primary-color: #2563eb; /* Blue */
  --secondary-color: #16a34a; /* Green */
  --accent-color: #4f46e5; /* Indigo for highlights */
  --light-gray: #f3f4f6;
  --medium-gray: #d1d5db;
  --dark-gray: #374151;
  --text-color: #1f2937;
  --card-bg: #ffffff;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

/* --- Basic Page Structure --- */
body {
  font-family: 'Inter', sans-serif;
  background-color: var(--light-gray);
  color: var(--text-color);
  margin: 0;
  padding: 0;
  line-height: 1.5;
  font-size: 14px;
}

.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 15px;
}

.page-header {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--medium-gray);
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--dark-gray);
  margin-bottom: 0.4rem;
}

.page-header p {
  font-size: 0.9rem;
  color: #6b7280;
}

.main-content {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
}

.controls-column {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.preview-column {
  flex: 2;
  min-width: 380px; 
}

/* --- Card Styles --- */
.card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 15px;
  border: 1px solid #e5e7eb;
}

.card-header {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dark-gray);
  margin-top: 0;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-header .icon {
  width: 18px;
  height: 18px;
  color: var(--accent-color);
}
#selectedOrderName {
  font-weight: 500;
  color: var(--accent-color);
}


/* --- Item List in Controls --- */
.item-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 15px;
}

.item-list .placeholder-text {
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 15px;
  font-size: 0.85rem;
}

#orderItemsList > div {
  padding: 8px 10px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid var(--medium-gray);
  margin-bottom: 6px;
  font-size: 0.85rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
#orderItemsList > div span:first-child {
  font-weight: 600;
  color: var(--text-color);
  display: block;
  margin-bottom: 3px;
}
#orderItemsList > div .text-xs.text-purple-600 { /* Add-on tag */
  background-color: #eef2ff;
  color: #4338ca;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  margin-left: 4px;
}
#orderItemsList > div .text-xs.text-green-600 { /* Meal Part tag */
  background-color: #f0fdf4; 
  color: #15803d; 
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  margin-left: 4px;
}
#orderItemsList > div .text-xs.text-gray-600 { /* Size */
  color: #4b5563;
  font-style: italic;
  font-size: 0.75rem;
}
#orderItemsList > div .text-xs.text-blue-600 { /* Notes */
  color: #1e40af;
  font-size: 0.75rem;
  padding-left: 6px;
  border-left: 2px solid #60a5fa;
  margin-top: 3px;
  display: block;
}


/* --- Action Buttons --- */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.button {
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  color: white;
}
.button .icon {
  width: 14px;
  height: 14px;
}

.button-primary {
  background-color: var(--primary-color);
}
.button-primary:hover {
  background-color: #1d4ed8;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.button-secondary {
  background-color: var(--secondary-color);
}
.button-secondary:hover {
  background-color: #15803d;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* --- Instructions Card --- */
.instructions-card {
  background-color: #eef2ff;
  border: 1px solid #c7d2fe;
}
.instructions-card .card-header {
  color: #3730a3;
}
.instructions-card .card-header .icon {
  color: #3730a3;
}
.instructions-card ul {
  list-style-position: inside;
  padding-left: 0;
  margin: 0;
  font-size: 0.85rem;
  color: #4338ca;
}
.instructions-card ul li {
  margin-bottom: 6px;
}
.instructions-card ul li strong {
  font-weight: 600;
}

/* --- Preview Area --- */
.preview-header {
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
  color: var(--dark-gray);
}
.label-placeholder-message {
  grid-column: span 2; 
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 30px 15px;
  font-size: 0.85rem;
}

.label-count-message {
  text-align: center;
  margin-top: 12px;
  font-size: 0.85rem;
  color: #6b7280;
}



/* --- Responsive Adjustments for UI (not print) --- */
@media (max-width: 900px) { 
  .preview-column {
     min-width: auto; 
  }
}

@media (max-width: 768px) {
  body {
      font-size: 13px;
  }
  .main-content {
      flex-direction: column;
  }
  .controls-column, .preview-column {
      flex: none;
      width: 100%;
  }
  .action-buttons {
      grid-template-columns: 1fr; 
  }
  .page-header h1 {
      font-size: 1.6rem;
  }
  .preview-header {
      font-size: 1.15rem;
  }
  .page-container {
      padding: 10px;
  }
  .card {
      padding: 12px;
  }
}


  `;

  const labelStyles = `
      /* Label styles will be added here */
  `;

  // Add styles to page
  GM_addStyle(overlayStyles);
  GM_addStyle(labelStyles);
  
  // Ensure consolidator stays above plasmo-csui overlay
  GM_addStyle(`
    /* Force consolidator above plasmo-csui elements */
    plasmo-csui#ff-overlay-container {
      z-index: 999999 !important; /* Lower than our consolidator */
    }
    
    #otter-consolidator-overlay,
    #otter-overlay,
    .otter-floating-toggle,
    .otter-toggle-button {
      z-index: 2147483647 !important; /* Maximum z-index */
    }
    
    /* Ensure all child elements also have high z-index */
    #otter-consolidator-overlay * {
      position: relative;
      z-index: inherit !important;
    }
  `);

  // ===== Main Application Code =====
  // Content scripts will be concatenated here
  
  console.log('Otter Order Consolidator v4 (Tampermonkey) - Initializing...');

  
  // ===== Combined Content Scripts =====

  // ----- utils/storage.js -----
  console.log('[Storage.js] Script loaded at:', new Date().toISOString());
  
  const Storage = {
    async get(key) {
      return new Promise((resolve) => {
        chrome.storage.local.get(key, (data) => {
          resolve(data[key]);
        });
      });
    },
  
    async set(key, value) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    },
  
    async getAll(keys) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (data) => {
          resolve(data);
        });
      });
    }
  };

  // ----- utils/logger.js -----
  // Logger utility with debug mode toggle
  class Logger {
    constructor() {
      this.debugMode = false;
      this.loadSettings();
    }
    
    async loadSettings() {
      try {
        const settings = await chrome.storage.local.get('debugMode');
        this.debugMode = settings.debugMode || false;
      } catch (error) {
        // Default to false if storage access fails
        this.debugMode = false;
      }
    }
    
    setDebugMode(enabled) {
      this.debugMode = enabled;
      chrome.storage.local.set({ debugMode: enabled });
    }
    
    log(...args) {
      if (this.debugMode) {
        console.log(...args);
      }
    }
    
    warn(...args) {
      if (this.debugMode) {
        console.warn(...args);
      }
    }
    
    error(...args) {
      // Always log errors
      console.error(...args);
    }
    
    // Performance-sensitive logging that should be disabled in production
    debug(...args) {
      if (this.debugMode) {
        console.log('[DEBUG]', ...args);
      }
    }
    
    // Check if debug mode is enabled
    isDebugEnabled() {
      return this.debugMode;
    }
  }
  
  // Create singleton instance
  const logger = new Logger();
  
  // Make it available globally
  if (typeof window !== 'undefined') {
    window.logger = logger;
  }

  // ----- utils/htmlEscape.js -----
  // HTML escape utility to prevent XSS attacks
  
  function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
      return String(unsafe);
    }
    
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Make available globally
  window.escapeHtml = escapeHtml;
  
  // Export for module usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtml };
  }

  // ----- utils/categoryCache.js -----
  // Category cache to avoid re-categorizing same items
  class CategoryCache {
    constructor() {
      this.cache = new Map();
      this.maxSize = 1000; // Limit cache size to prevent memory issues
    }
    
    // Generate cache key from item properties
    getCacheKey(itemName, itemSize = 'no-size', modifiers = {}) {
      // Create a stable key from item properties
      const modifierKey = modifiers.riceSubstitution || '';
      return `${itemName}|${itemSize}|${modifierKey}`.toLowerCase();
    }
    
    get(itemName, itemSize, modifiers) {
      const key = this.getCacheKey(itemName, itemSize, modifiers);
      return this.cache.get(key);
    }
    
    set(itemName, itemSize, modifiers, categoryInfo) {
      // Implement simple LRU by removing oldest entries when at capacity
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      const key = this.getCacheKey(itemName, itemSize, modifiers);
      this.cache.set(key, categoryInfo);
    }
    
    clear() {
      this.cache.clear();
    }
    
    size() {
      return this.cache.size;
    }
  }
  
  // Create singleton instance
  const categoryCache = new CategoryCache();
  
  // Make it available globally
  if (typeof window !== 'undefined') {
    window.categoryCache = categoryCache;
  }

  // ----- utils/apiClient.js -----
  /**
   * API Client for communicating with Otter KDS Python backend
   */
  
  class OtterAPIClient {
    constructor() {
      // API configuration - will be updated for production
      this.baseUrl = 'http://localhost:8000';
      this.wsUrl = 'ws://localhost:8000';
      
      // Auth state
      this.token = null;
      this.tokenExpiry = null;
      this.restaurantId = null;
      this.restaurantName = null;
      
      // WebSocket connection
      this.ws = null;
      this.wsReconnectInterval = 5000;
      this.wsReconnectAttempts = 0;
      this.maxReconnectAttempts = 10;
      
      // Initialize from storage
      this.loadAuthFromStorage();
    }
    
    /**
     * Load authentication data from Chrome storage
     */
    async loadAuthFromStorage() {
      console.log('[APIClient] Loading auth from storage...');
      try {
        const data = await chrome.storage.local.get(['apiToken', 'tokenExpiry', 'restaurantId', 'restaurantName']);
        
        console.log('[APIClient] Storage data:', {
          hasToken: !!data.apiToken,
          hasExpiry: !!data.tokenExpiry,
          restaurantName: data.restaurantName
        });
        
        this.token = data.apiToken || null;
        this.tokenExpiry = data.tokenExpiry ? new Date(data.tokenExpiry) : null;
        this.restaurantId = data.restaurantId || null;
        this.restaurantName = data.restaurantName || null;
        
        // Check if token is expired
        if (this.tokenExpiry && new Date() > this.tokenExpiry) {
          console.log('[APIClient] Token expired, clearing auth');
          await this.clearAuth();
        } else if (this.token) {
          console.log('[APIClient] Valid token loaded from storage');
        }
      } catch (error) {
        console.error('[APIClient] Error loading auth from storage:', error);
      }
    }
    
    /**
     * Save authentication data to Chrome storage
     */
    async saveAuthToStorage() {
      try {
        await chrome.storage.local.set({
          apiToken: this.token,
          tokenExpiry: this.tokenExpiry?.toISOString(),
          restaurantId: this.restaurantId,
          restaurantName: this.restaurantName
        });
      } catch (error) {
        console.error('Error saving auth to storage:', error);
      }
    }
    
    /**
     * Clear authentication data
     */
    async clearAuth() {
      this.token = null;
      this.tokenExpiry = null;
      this.restaurantId = null;
      this.restaurantName = null;
      await chrome.storage.local.remove(['apiToken', 'tokenExpiry', 'restaurantId', 'restaurantName']);
      
      // Close WebSocket if connected
      if (this.ws) {
        this.ws.close();
      }
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(message) {
      console.log('WebSocket message:', message);
      
      switch (message.type) {
        case 'connection':
          console.log('WebSocket connection confirmed:', message.data);
          break;
          
        case 'order_update':
          // Notify UI of order update
          this.notifyOrderUpdate(message.data);
          break;
          
        case 'batch_created':
          // Notify UI of new batch
          this.notifyBatchCreated(message.data);
          break;
          
        case 'pong':
          // Heartbeat response
          break;
          
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    }
    
    /**
     * Send ping to keep connection alive
     */
    sendPing() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }
    
    /**
     * Disconnect WebSocket
     */
    disconnectWebSocket() {
      if (this.ws) {
        this.wsReconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
        this.ws.close();
        this.ws = null;
      }
    }
    
    /**
     * Store order ID mapping for tracking
     */
    async storeOrderMapping(orderNumber, apiOrderId) {
      try {
        const mappings = await chrome.storage.local.get('orderMappings') || {};
        mappings[orderNumber] = {
          apiOrderId,
          timestamp: new Date().toISOString()
        };
        await chrome.storage.local.set({ orderMappings });
      } catch (error) {
        console.error('Error storing order mapping:', error);
      }
    }
    
    /**
     * Notify UI of connection status change
     */
    notifyConnectionStatus(connected) {
      window.postMessage({
        type: 'OTTER_API_CONNECTION_STATUS',
        connected,
        restaurantName: this.restaurantName
      }, '*');
    }
    
    /**
     * Notify UI of order update
     */
    notifyOrderUpdate(order) {
      window.postMessage({
        type: 'OTTER_ORDER_UPDATE',
        order
      }, '*');
    }
    
    /**
     * Notify UI of batch creation
     */
    notifyBatchCreated(batch) {
      window.postMessage({
        type: 'OTTER_BATCH_CREATED',
        batch
      }, '*');
    }
  }
  
  // Create singleton instance
  window.otterAPIClient = new OtterAPIClient();
  
  console.log('[OtterAPIClient] Initialized');

  // ----- components/itemMatcher.js -----
  console.log('[ItemMatcher.js] Script loaded at:', new Date().toISOString());
  
  class ItemMatcher {
    constructor() {
      this.normalizeRules = {
        removeSpaces: false,
        lowercase: true,
        removeSpecialChars: false
      };
    }
  
    normalize(itemName) {
      // Handle non-string inputs
      if (!itemName || typeof itemName !== 'string') {
        console.warn('ItemMatcher.normalize: Invalid itemName:', itemName);
        return '';
      }
      
      let normalized = itemName.trim();
      
      if (this.normalizeRules.lowercase) {
        normalized = normalized.toLowerCase();
      }
      
      if (this.normalizeRules.removeSpaces) {
        normalized = normalized.replace(/\s+/g, '');
      }
      
      if (this.normalizeRules.removeSpecialChars) {
        normalized = normalized.replace(/[^a-zA-Z0-9\s]/g, '');
      }
      
      return normalized;
    }
  
    extractModifiers(itemText) {
      const modifierMatch = itemText.match(/\(([^)]+)\)/);
      if (modifierMatch) {
        return {
          baseName: itemText.replace(/\s*\([^)]+\)/, '').trim(),
          modifiers: modifierMatch[1].split(',').map(m => m.trim())
        };
      }
      return {
        baseName: itemText.trim(),
        modifiers: []
      };
    }
    
    extractSize(itemText) {
      // Extract size from parentheses (e.g., "Item Name (Small)")
      const sizeMatch = itemText.match(/\((Small|Medium|Large|Regular)\)/i);
      if (sizeMatch) {
        return sizeMatch[1];
      }
      
      // Check for size in modifiers
      const modifiers = this.extractModifiers(itemText).modifiers;
      const sizeModifier = modifiers.find(m => 
        /^(Small|Medium|Large|Regular)$/i.test(m.trim())
      );
      
      return sizeModifier || null;
    }
  
    areItemsIdentical(item1, item2) {
      const parsed1 = this.extractModifiers(item1);
      const parsed2 = this.extractModifiers(item2);
      
      if (this.normalize(parsed1.baseName) !== this.normalize(parsed2.baseName)) {
        return false;
      }
      
      if (parsed1.modifiers.length !== parsed2.modifiers.length) {
        return false;
      }
      
      const sorted1 = parsed1.modifiers.map(m => this.normalize(m)).sort();
      const sorted2 = parsed2.modifiers.map(m => this.normalize(m)).sort();
      
      return sorted1.every((mod, index) => mod === sorted2[index]);
    }
  
    generateItemKey(itemName, size = null, category = null, riceSubstitution = null) {
      const parsed = this.extractModifiers(itemName);
      let normalizedBase = this.normalize(parsed.baseName);
      
      // Extract size if not provided
      if (!size) {
        size = this.extractSize(itemName) || 'no-size';
      }
      
      // Special handling for rice items with size in the name
      // "Large - Fried Rice" should be different from "Regular Fried Rice"
      if (normalizedBase.includes('fried rice') && size && size !== 'no-size') {
        // Check if the size is already in the base name
        const sizeInName = normalizedBase.match(/^(small|medium|large|regular)\s*-?\s*/);
        if (sizeInName) {
          // Size is part of the item name, keep it in the base name
          // This ensures "Large - Fried Rice" stays distinct from "Fried Rice"
        } else if (size.toLowerCase().includes('fried rice')) {
          // This is a rice substitution being used as size
          normalizedBase = `${normalizedBase} - ${size}`;
        }
      }
      
      // For Urban Bowls with rice substitution, use that as the size
      if (normalizedBase.includes('urban bowl') && riceSubstitution) {
        size = riceSubstitution;
      }
      
      // Normalize size
      const normalizedSize = this.normalize(size || 'no-size');
      
      // Create a compound key: size|category|itemName|modifiers
      const keyParts = [normalizedSize];
      
      if (category) {
        // Handle category object or string
        const categoryStr = typeof category === 'string' ? category : (category?.category || 'uncategorized');
        keyParts.push(this.normalize(categoryStr));
      }
      
      keyParts.push(normalizedBase);
      
      // Include sorted modifiers in the key to ensure items with different modifiers are batched separately
      if (parsed.modifiers.length > 0) {
        const sortedModifiers = parsed.modifiers.map(m => this.normalize(m)).sort().join(',');
        keyParts.push(sortedModifiers);
      }
      
      return keyParts.join('|');
    }
    
    generateSizeGroupKey(size) {
      return this.normalize(size || 'no-size');
    }
  }
  
  // Make available globally
  window.ItemMatcher = ItemMatcher;

  // ----- components/orderBatcher.js -----
  console.log('[OrderBatcher.js] Script loaded at:', new Date().toISOString());
  
  class OrderBatcher {
    constructor(itemMatcher) {
      this.itemMatcher = itemMatcher;
      this.batches = new Map();
      this.orders = new Map(); // Store full order data
      this.processedOrderIds = new Set(); // Track which orders have been added
    }
  
    addOrder(order) {
      // Check if order has already been processed
      if (this.processedOrderIds.has(order.id)) {
        console.log(`[OrderBatcher] Skipping duplicate order: ${order.id}`);
        return;
      }
      
      // Mark order as processed
      this.processedOrderIds.add(order.id);
      
      // Store the full order data
      this.orders.set(order.id, order);
      
      order.items.forEach(item => {
        // For Urban Bowls, include dumpling choice in the key to separate by dumpling type
        let itemNameForKey = item.baseName || item.name;
        if ((item.isUrbanBowl || item.name.toLowerCase().includes('urban bowl')) && 
            item.modifierDetails?.dumplingChoice) {
          // Append dumpling choice to the name for key generation
          itemNameForKey = `${itemNameForKey} - ${item.modifierDetails.dumplingChoice}`;
          console.log(`[OrderBatcher] Urban Bowl with dumplings, key name: ${itemNameForKey}`);
        }
        
        // Generate key with size, category, base name, and rice substitution
        const key = this.itemMatcher.generateItemKey(
          itemNameForKey, 
          item.size, 
          item.category,
          item.riceSubstitution
        );
        
        if (!this.batches.has(key)) {
          console.log(`[OrderBatcher] Creating new batch for key: ${key}`);
          console.log(`[OrderBatcher] Item categoryInfo:`, JSON.stringify(item.categoryInfo));
          
          // Debug Urban Bowl items
          if (item.isUrbanBowl || item.name.toLowerCase().includes('urban bowl')) {
            console.log(`[OrderBatcher] Urban Bowl item details:`, {
              name: item.name,
              modifiers: item.modifiers,
              categoryInfo: item.categoryInfo,
              isUrbanBowl: item.isUrbanBowl
            });
          }
          
          this.batches.set(key, {
            name: item.baseName || item.name,
            fullName: item.name, // Full name with modifiers
            originalName: item.name,
            size: item.size || 'no-size',
            price: item.price,
            category: item.category,
            categoryInfo: item.categoryInfo, // Store full category info
            modifiers: item.modifiers || [], // Store modifiers
            modifierDetails: item.modifierDetails || {}, // Store modifierDetails for Urban Bowls
            isUrbanBowl: item.isUrbanBowl || false,
            isRiceBowl: item.isRiceBowl || false,
            riceSubstitution: item.riceSubstitution || null,
            // Add top-level properties
            dumplingType: item.dumplingType || null,
            riceSubType: item.riceSubType || null,
            sauceType: item.sauceType || null,
            orders: [],
            totalQuantity: 0
          });
          console.log(`[OrderBatcher] Batch created with categoryInfo:`, JSON.stringify(this.batches.get(key).categoryInfo));
          
          // Extra debug for Urban Bowls
          if (item.isUrbanBowl || item.name.toLowerCase().includes('urban bowl')) {
            const batch = this.batches.get(key);
            console.log(`[OrderBatcher] Urban Bowl batch details:`, {
              name: batch.name,
              categoryInfo: batch.categoryInfo,
              hasDumplingChoice: !!(batch.categoryInfo?.modifiers?.dumplingChoice),
              dumplingChoice: batch.categoryInfo?.modifiers?.dumplingChoice
            });
          }
        }
        
        const batch = this.batches.get(key);
        batch.orders.push({
          orderId: order.id,
          orderNumber: order.number,
          quantity: item.quantity || 1,
          timestamp: order.timestamp,
          isNew: order.isNew || false
        });
        batch.totalQuantity += (item.quantity || 1);
      });
    }
    
    getOrderById(orderId) {
      return this.orders.get(orderId);
    }
    
    getAllOrders() {
      return Array.from(this.orders.values());
    }
  
    getBatchedItems() {
      const batchedArray = Array.from(this.batches.values());
      
      return batchedArray.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return b.totalQuantity - a.totalQuantity;
      });
    }
  
    getBatchesByCategory() {
      const categorized = {};
      
      console.log('[OrderBatcher] Getting batches by category. Total batches:', this.batches.size);
      
      this.batches.forEach((batch, key) => {
        const category = batch.category || 'uncategorized';
        const categoryInfo = batch.categoryInfo;
        
        console.log('[OrderBatcher] Processing batch:', {
          key: key,
          name: batch.name,
          category: category,
          categoryInfo: categoryInfo,
          isRiceBowl: batch.isRiceBowl,
          topCategory: categoryInfo?.topCategory,
          subCategory: categoryInfo?.subCategory
        });
        
        // For hierarchical categories (food types with protein subcategories)
        if (categoryInfo && categoryInfo.subCategory && 
            ['riceBowls', 'urbanBowls', 'noodles', 'friedRice'].includes(category)) {
          // Create nested structure for food types
          if (!categorized[category]) {
            categorized[category] = {
              name: categoryInfo.topCategoryName,
              subcategories: {},
              items: [] // For items without subcategory
            };
          }
          
          const subcategory = categoryInfo.subCategory;
          if (!categorized[category].subcategories[subcategory]) {
            categorized[category].subcategories[subcategory] = {
              name: categoryInfo.subCategoryName,
              items: []
            };
          }
          
          categorized[category].subcategories[subcategory].items.push(batch);
          console.log('[OrderBatcher] Added to subcategory:', subcategory, 'in category:', category);
        } else {
          // Regular categories (non-hierarchical)
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(batch);
        }
      });
      
      // Sort items within categories and subcategories
      Object.keys(categorized).forEach(category => {
        if (Array.isArray(categorized[category])) {
          // Regular category
          categorized[category].sort((a, b) => b.totalQuantity - a.totalQuantity);
        } else {
          // Hierarchical category
          Object.keys(categorized[category].subcategories).forEach(subcategory => {
            categorized[category].subcategories[subcategory].items.sort(
              (a, b) => b.totalQuantity - a.totalQuantity
            );
          });
        }
      });
      
      return categorized;
    }
    
    getBatchesBySize() {
      const sizeGroups = {
        'small': { name: 'Small', categories: {} },
        'medium': { name: 'Medium', categories: {} },
        'large': { name: 'Large', categories: {} },
        'regular': { name: 'Regular', categories: {} },
        'no-size': { name: 'No Size', categories: {} }
      };
      
      this.batches.forEach((batch) => {
        const sizeKey = batch.size ? batch.size.toLowerCase() : 'no-size';
        const category = batch.category || 'uncategorized';
        
        if (!sizeGroups[sizeKey]) {
          sizeGroups[sizeKey] = { name: batch.size, categories: {} };
        }
        
        if (!sizeGroups[sizeKey].categories[category]) {
          sizeGroups[sizeKey].categories[category] = [];
        }
        
        sizeGroups[sizeKey].categories[category].push(batch);
      });
      
      // Sort items within each category by quantity
      Object.values(sizeGroups).forEach(sizeGroup => {
        Object.values(sizeGroup.categories).forEach(items => {
          items.sort((a, b) => b.totalQuantity - a.totalQuantity);
        });
      });
      
      return sizeGroups;
    }
  
    clearBatches() {
      this.batches.clear();
      this.processedOrderIds.clear();
    }
  
    removeBatch(itemKey) {
      this.batches.delete(itemKey);
    }
  
    updateBatchQuantity(itemKey, orderId, newQuantity) {
      const batch = this.batches.get(itemKey);
      if (!batch) return;
      
      const orderIndex = batch.orders.findIndex(o => o.orderId === orderId);
      if (orderIndex === -1) return;
      
      const oldQuantity = batch.orders[orderIndex].quantity;
      batch.orders[orderIndex].quantity = newQuantity;
      batch.totalQuantity = batch.totalQuantity - oldQuantity + newQuantity;
      
      if (newQuantity === 0) {
        batch.orders.splice(orderIndex, 1);
        if (batch.orders.length === 0) {
          this.batches.delete(itemKey);
        }
      }
    }
    
    getAllOrders() {
      return Array.from(this.orders.values());
    }
  }
  
  // Make available globally
  window.OrderBatcher = OrderBatcher;

  // ----- components/categoryManager.js -----
  // Log when script loads
  try {
    if (window.logger && window.logger.log) {
      window.logger.log('[CategoryManager.js] Script loaded at:', new Date().toISOString());
    } else {
      console.log('[CategoryManager.js] Script loaded at:', new Date().toISOString());
    }
  } catch (e) {
    console.log('[CategoryManager.js] Script loaded (logger error):', e.message);
  }
  
  class CategoryManager {
    constructor() {
      // Top-level categories - all at same hierarchy level
      this.topCategories = {
        'large': { name: 'Large', order: 1 },
        'large - garlic butter fried rice substitute': { name: 'Large - Garlic Butter Fried Rice Substitute', order: 2 },
        'large - fried rice substitute': { name: 'Large - Fried Rice Substitute', order: 3 },
        'large - fried rice': { name: 'Large - Fried Rice', order: 4 },
        'large - stir fry rice noodles substitute': { name: 'Large - Stir Fry Rice Noodles Substitute', order: 5 },
        'large - noodles': { name: 'Large - Noodles', order: 6 },
        'small': { name: 'Small', order: 7 },
        'small - garlic butter fried rice substitute': { name: 'Small - Garlic Butter Fried Rice Substitute', order: 8 },
        'small - fried rice substitute': { name: 'Small - Fried Rice Substitute', order: 9 },
        'small - fried rice': { name: 'Small - Fried Rice', order: 10 },
        'small - stir fry rice noodles substitute': { name: 'Small - Stir Fry Rice Noodles Substitute', order: 11 },
        'small - noodles': { name: 'Small - Noodles', order: 12 },
        'riceBowls': { name: 'Rice Bowls', order: 1 },  // Add rice bowls as top category
        'urban-bowls': { name: 'Urban Bowls', order: 2 },
        'bao': { name: 'Bao', order: 14 },
        'meals': { name: 'Meals', order: 15 },
        'appetizers': { name: 'Appetizers', order: 16 },
        'dumplings': { name: 'Dumplings', order: 17 },
        'desserts': { name: 'Desserts', order: 18 },
        'drinks': { name: 'Drinks', order: 19 },
        'sides': { name: 'Sides', order: 20 },
        'other': { name: 'Other', order: 21 }
      };
  
      // Protein/type subcategories
      this.proteinCategories = {
        'grilled-chicken': {
          name: 'Grilled Chicken',
          keywords: ['grilled chicken', 'grilled orange chicken', 'grilled sweet', 'grilled garlic aioli chicken', 'grilled jalapeño', 'grilled chipotle', 'grilled bulgogi', 'chicken bulgogi']
        },
        'crispy-chicken': {
          name: 'Crispy Chicken',
          keywords: ['crispy chicken', 'crispy orange chicken', 'crispy garlic', 'crispy chipotle', 'crispy jalapeño', 'crispy sesame']
        },
        'steak': {
          name: 'Steak',
          keywords: ['steak', 'grilled steak']
        },
        'salmon': {
          name: 'Salmon',
          keywords: ['salmon', 'grilled salmon']
        },
        'shrimp': {
          name: 'Shrimp',
          keywords: ['shrimp', 'crispy shrimp', 'grilled shrimp']
        },
        'fish': {
          name: 'Fish',
          keywords: ['fish', 'crispy fish', 'grilled fish']
        },
        'tofu': {
          name: 'Tofu',
          keywords: ['tofu', 'ponzu chili tofu', 'teriyaki tofu']
        },
        'vegetarian': {
          name: 'Vegetarian',
          keywords: ['cauliflower', 'vegetable', 'veggie', 'nugget']
        },
        'dumplings': {
          name: 'Dumplings',
          keywords: ['dumpling', 'pork dumpling', 'chicken dumpling', 'vegetable dumpling']
        },
        'appetizers': {
          name: 'Appetizers',
          keywords: ['crab rangoon', 'spring roll', 'egg roll', 'starter']
        },
        'sides': {
          name: 'Sides',
          keywords: ['waffle fries', 'side', 'fried rice', 'white rice', 'brown rice']
        },
        'desserts': {
          name: 'Desserts',
          keywords: ['bao-nut', 'baonut', 'bao nut', 'dessert', 'sweet', 'ice cream', 'mochi', 'cinnamon']
        },
        'drinks': {
          name: 'Drinks',
          keywords: ['drink', 'beverage', 'tea', 'coffee', 'soda', 'juice', 'water', 'lemonade', 'cucumber']
        },
        'other': {
          name: 'Other',
          keywords: []
        }
      };
    }
  
    categorizeItem(itemName, itemSize = 'no-size', itemData = {}) {
      // Handle both old format (modifiers object) and new format (full item data)
      const modifiers = itemData.modifiers || itemData;
      const proteinType = itemData.proteinType || modifiers.proteinType || '';
      const sauce = itemData.sauce || modifiers.sauce || '';
      const modifierDetails = itemData.modifierDetails || {};
      const isRiceBowl = itemData.isRiceBowl || (itemName && itemName.toLowerCase().includes('rice bowl'));
      const isUrbanBowl = itemData.isUrbanBowl || (itemName && itemName.toLowerCase().includes('urban bowl'));
      
      // Check cache first
      if (window.categoryCache) {
        const cached = window.categoryCache.get(itemName, itemSize, modifiers);
        if (cached) {
          if (window.logger) {
            window.logger.debug(`[CategoryManager] Using cached category for: ${itemName}`);
          }
          return cached;
        }
      }
      
      // Enhanced logging for debugging
      const debugEnabled = window.logger && typeof window.logger.isDebugEnabled === 'function' && window.logger.isDebugEnabled();
      
      if (isRiceBowl || debugEnabled) {
        console.log(`[CategoryManager] === CATEGORIZATION START ===`);
        console.log(`[CategoryManager] Item: "${itemName}"`);
        console.log(`[CategoryManager] Size: "${itemSize}" (type: ${typeof itemSize})`);
        console.log(`[CategoryManager] Item Data:`, {
          proteinType: proteinType,
          sauce: sauce,
          isRiceBowl: isRiceBowl,
          isUrbanBowl: isUrbanBowl,
          modifierDetails: modifierDetails
        });
      }
      
      // Handle non-string inputs
      if (!itemName || typeof itemName !== 'string') {
        if (window.logger) {
          window.logger.warn('CategoryManager: Invalid itemName:', itemName);
        }
        return {
          topCategory: 'other',
          subCategory: 'other',
          topCategoryName: 'Other',
          subCategoryName: 'Other',
          displayCategory: 'Other'
        };
      }
      
      const lowerName = itemName.toLowerCase();
      
      // Handle potential object or undefined sizes
      let normalizedSize = itemSize;
      if (typeof itemSize === 'object' && itemSize !== null) {
        // If size is an object, try to extract the string value
        normalizedSize = itemSize.toString() || 'no-size';
        console.log(`[CategoryManager] Size was an object, converted to: ${normalizedSize}`);
      } else if (itemSize === undefined || itemSize === null || itemSize === '') {
        normalizedSize = 'no-size';
      }
      
      let lowerSize = normalizedSize.toLowerCase().trim();
      
      // Debug logging for rice substitutions
      if (lowerSize.includes('fried rice') || lowerSize.includes('garlic butter')) {
        console.log(`[CategoryManager] Rice substitution detected - original: "${itemSize}", normalized: "${normalizedSize}", lowercase: "${lowerSize}"`);
      }
      
      // Keep the size exactly as provided - no normalization
      // This allows us to handle whatever size variations come from the order system
      
      // First, determine if this is a size-based item or a non-bowl item
      let topCategoryKey = null;
      let topCategoryName = null;
      let subCategoryKey = null;
      let subCategoryName = null;
      
      // Check if this is a rice bowl FIRST - this takes priority over everything
      const isRiceBowlItem = lowerName.includes('rice bowl') || 
                            lowerName.includes('ricebowl') || 
                            (lowerName.includes('rice') && lowerName.includes('bowl'));
      
      if (isRiceBowlItem) {
        // All rice bowls go to riceBowls category
        topCategoryKey = 'riceBowls';
        topCategoryName = 'Rice Bowls';
        console.log(`[CategoryManager] Categorized as Rice Bowl: ${itemName}`);
      }
      
      // If not a rice bowl, check if it's an Urban Bowl
      if (!topCategoryKey && lowerName.includes('urban bowl')) {
        topCategoryKey = 'urban-bowls';
        topCategoryName = 'Urban Bowls';
      }
      
      // If still no category, check non-bowl categories
      if (!topCategoryKey) {
        const nonBowlCategories = {
          // Check desserts first to catch bao-nut before generic bao
          'desserts': ['bao-nut', 'baonut', 'bao nut', 'dessert', 'sweet treat', 'cinnamon sugar bao'],
          'bao': ['bao'],
          'meals': ['bao out', 'bowl of rice meal'],
          'appetizers': ['crab rangoon', 'spring roll', 'egg roll', 'starter'],
          'dumplings': ['dumpling'],
          'drinks': ['tea', 'coffee', 'soda', 'juice', 'water', 'lemonade'],
          'sides': ['waffle fries']
        };
        
        // Check for non-bowl categories
        for (const [category, keywords] of Object.entries(nonBowlCategories)) {
          for (const keyword of keywords) {
            if (category === 'bao') {
              // For bao category, ensure we're matching actual bao items
              // But exclude bao-nut items which are desserts
              if (keyword === 'bao' && (lowerName.includes(' bao') || lowerName.endsWith('bao')) && 
                  !lowerName.includes('bao out') && !lowerName.includes('bao-nut') && !lowerName.includes('baonut') && !lowerName.includes('bao nut')) {
                topCategoryKey = category;
                topCategoryName = this.topCategories[category].name;
                break;
              } else if (keyword !== 'bao' && lowerName === keyword) {
                // For specific bao types, match exact name
                topCategoryKey = category;
                topCategoryName = this.topCategories[category].name;
                break;
              }
            } else if (lowerName.includes(keyword)) {
              topCategoryKey = category;
              topCategoryName = this.topCategories[category].name;
              break;
            }
          }
          if (topCategoryKey) break;
        }
      }
      
      
      // Default to 'other' if no category found
      if (!topCategoryKey) {
        console.log(`[CategoryManager] No category found for item: "${itemName}", defaulting to 'other'`);
        console.log(`[CategoryManager] Item analysis:`, {
          isRiceBowl: isRiceBowlItem,
          lowerName: lowerName,
          size: lowerSize
        });
        topCategoryKey = 'other';
        topCategoryName = 'Other';
      }
      
      // Now determine subcategory (protein type for bowls, or specific type for others)
      if (topCategoryKey === 'riceBowls') {
        // For rice bowls, use PROTEIN as subcategory, not size!
        // Extract protein from passed data or item name
        let extractedProtein = proteinType;
        if (!extractedProtein) {
          // Fallback to extracting from name
          if (lowerName.includes('pork belly')) {
            extractedProtein = 'Pork Belly';
          } else if (lowerName.includes('grilled') && lowerName.includes('chicken')) {
            // Handle both "grilled chicken" and "grilled orange chicken" patterns
            extractedProtein = 'Grilled Chicken';
          } else if (lowerName.includes('crispy') && lowerName.includes('chicken')) {
            // Handle both "crispy chicken" and "crispy orange chicken" patterns
            extractedProtein = 'Crispy Chicken';
          } else if (lowerName.includes('steak')) {
            extractedProtein = 'Steak';
          } else if (lowerName.includes('salmon')) {
            extractedProtein = 'Salmon';
          } else if (lowerName.includes('shrimp')) {
            extractedProtein = 'Shrimp';
          } else if (lowerName.includes('fish')) {
            extractedProtein = 'Crispy Fish';
          } else if (lowerName.includes('tofu')) {
            extractedProtein = 'Tofu';
          } else if (lowerName.includes('cauliflower')) {
            extractedProtein = 'Cauliflower Nugget';
          }
        }
        
        // Set subcategory based on protein
        if (extractedProtein === 'Pork Belly') {
          subCategoryKey = 'pork-belly';
          subCategoryName = 'Pork Belly';
        } else if (extractedProtein === 'Grilled Chicken') {
          subCategoryKey = 'grilled-chicken';
          subCategoryName = 'Grilled Chicken';
        } else if (extractedProtein === 'Crispy Chicken') {
          subCategoryKey = 'crispy-chicken';
          subCategoryName = 'Crispy Chicken';
        } else if (extractedProtein === 'Steak') {
          subCategoryKey = 'steak';
          subCategoryName = 'Steak';
        } else if (extractedProtein === 'Salmon') {
          subCategoryKey = 'salmon';
          subCategoryName = 'Salmon';
        } else if (extractedProtein === 'Shrimp') {
          subCategoryKey = 'shrimp';
          subCategoryName = 'Shrimp';
        } else if (extractedProtein === 'Crispy Fish') {
          subCategoryKey = 'fish';
          subCategoryName = 'Crispy Fish';
        } else if (extractedProtein === 'Tofu') {
          subCategoryKey = 'tofu';
          subCategoryName = 'Tofu';
        } else if (extractedProtein === 'Cauliflower Nugget') {
          subCategoryKey = 'vegetarian';
          subCategoryName = 'Cauliflower Nugget';
        } else {
          subCategoryKey = 'other';
          subCategoryName = 'Other';
        }
        
        // REMOVED: Logic that was overriding riceBowls category with size-based categories
        // Rice bowls should stay in riceBowls category, not be moved to size categories
        
        // Store extracted values for result
        modifiers.proteinType = extractedProtein;
        modifiers.sauceType = sauce || this.getSauceFromName(itemName);
      } else if (topCategoryKey.startsWith('large') || topCategoryKey.startsWith('medium') || topCategoryKey.startsWith('small')) {
        // For old-style size-based rice bowl categories, determine protein
        if (lowerName.includes('chicken')) {
          if (lowerName.includes('grilled')) {
            subCategoryKey = 'grilled-chicken';
            subCategoryName = 'Grilled Chicken';
          } else if (lowerName.includes('crispy')) {
            subCategoryKey = 'crispy-chicken';
            subCategoryName = 'Crispy Chicken';
          } else {
            subCategoryKey = 'chicken';
            subCategoryName = 'Chicken';
          }
        } else if (lowerName.includes('steak')) {
          subCategoryKey = 'steak';
          subCategoryName = 'Steak';
        } else if (lowerName.includes('salmon')) {
          subCategoryKey = 'salmon';
          subCategoryName = 'Salmon';
        } else if (lowerName.includes('shrimp')) {
          subCategoryKey = 'shrimp';
          subCategoryName = 'Shrimp';
        } else if (lowerName.includes('fish')) {
          subCategoryKey = 'fish';
          subCategoryName = 'Fish';
        } else if (lowerName.includes('cauliflower') || lowerName.includes('tofu') || lowerName.includes('vegetable')) {
          subCategoryKey = 'vegetarian';
          subCategoryName = 'Vegetarian';
        } else {
          subCategoryKey = 'other';
          subCategoryName = 'Other';
        }
      } else if (topCategoryKey === 'urban-bowls') {
        // For Urban Bowls, use PROTEIN as subcategory (same as rice bowls)
        let extractedProtein = proteinType;
        if (!extractedProtein) {
          // Fallback to extracting from name
          if (lowerName.includes('pork belly')) {
            extractedProtein = 'Pork Belly';
          } else if (lowerName.includes('grilled') && lowerName.includes('chicken')) {
            // Handle both "grilled chicken" and "grilled orange chicken" patterns
            extractedProtein = 'Grilled Chicken';
          } else if (lowerName.includes('crispy') && lowerName.includes('chicken')) {
            // Handle both "crispy chicken" and "crispy orange chicken" patterns
            extractedProtein = 'Crispy Chicken';
          } else if (lowerName.includes('steak')) {
            extractedProtein = 'Steak';
          } else if (lowerName.includes('salmon')) {
            extractedProtein = 'Salmon';
          } else if (lowerName.includes('shrimp')) {
            extractedProtein = 'Shrimp';
          } else if (lowerName.includes('fish')) {
            extractedProtein = 'Crispy Fish';
          } else if (lowerName.includes('tofu')) {
            extractedProtein = 'Tofu';
          } else if (lowerName.includes('cauliflower')) {
            extractedProtein = 'Cauliflower Nugget';
          }
        }
        
        // Set subcategory based on protein
        if (extractedProtein === 'Pork Belly') {
          subCategoryKey = 'pork-belly';
          subCategoryName = 'Pork Belly';
        } else if (extractedProtein === 'Grilled Chicken') {
          subCategoryKey = 'grilled-chicken';
          subCategoryName = 'Grilled Chicken';
        } else if (extractedProtein === 'Crispy Chicken') {
          subCategoryKey = 'crispy-chicken';
          subCategoryName = 'Crispy Chicken';
        } else if (extractedProtein === 'Steak') {
          subCategoryKey = 'steak';
          subCategoryName = 'Steak';
        } else if (extractedProtein === 'Salmon') {
          subCategoryKey = 'salmon';
          subCategoryName = 'Salmon';
        } else if (extractedProtein === 'Shrimp') {
          subCategoryKey = 'shrimp';
          subCategoryName = 'Shrimp';
        } else if (extractedProtein === 'Crispy Fish') {
          subCategoryKey = 'fish';
          subCategoryName = 'Crispy Fish';
        } else if (extractedProtein === 'Tofu') {
          subCategoryKey = 'tofu';
          subCategoryName = 'Tofu';
        } else if (extractedProtein === 'Cauliflower Nugget') {
          subCategoryKey = 'vegetarian';
          subCategoryName = 'Cauliflower Nugget';
        } else {
          subCategoryKey = 'other';
          subCategoryName = 'Other';
        }
        
        // Store protein type for display
        modifiers.proteinType = extractedProtein;
      } else {
        // For non-bowl categories that aren't size-based, still try to extract protein
        if (topCategoryKey === 'other' || topCategoryKey === 'sides') {
          // Still extract protein information for "other" items
          if (lowerName.includes('chicken')) {
            if (lowerName.includes('grilled')) {
              subCategoryKey = 'grilled-chicken';
              subCategoryName = 'Grilled Chicken';
            } else if (lowerName.includes('crispy')) {
              subCategoryKey = 'crispy-chicken';
              subCategoryName = 'Crispy Chicken';
            } else {
              subCategoryKey = 'chicken';
              subCategoryName = 'Chicken';
            }
          } else if (lowerName.includes('steak')) {
            subCategoryKey = 'steak';
            subCategoryName = 'Steak';
          } else if (lowerName.includes('salmon')) {
            subCategoryKey = 'salmon';
            subCategoryName = 'Salmon';
          } else if (lowerName.includes('shrimp')) {
            subCategoryKey = 'shrimp';
            subCategoryName = 'Shrimp';
          } else if (lowerName.includes('fish')) {
            subCategoryKey = 'fish';
            subCategoryName = 'Fish';
          } else if (lowerName.includes('tofu')) {
            subCategoryKey = 'tofu';
            subCategoryName = 'Tofu';
          } else if (lowerName.includes('cauliflower') || lowerName.includes('vegetable') || lowerName.includes('nugget')) {
            subCategoryKey = 'vegetarian';
            subCategoryName = 'Vegetarian';
          } else {
            subCategoryKey = 'general';
            subCategoryName = 'General';
          }
        } else {
          // For categories like desserts, drinks, appetizers, bao
          // Still try to extract protein for Bao items
          if (topCategoryKey === 'bao') {
            if (lowerName.includes('tofu')) {
              subCategoryKey = 'tofu';
              subCategoryName = 'Tofu';
            } else if (lowerName.includes('cauliflower') || lowerName.includes('nugget')) {
              subCategoryKey = 'vegetarian';
              subCategoryName = 'Vegetarian';
            } else if (lowerName.includes('chicken')) {
              subCategoryKey = 'chicken';
              subCategoryName = 'Chicken';
            } else if (lowerName.includes('steak')) {
              subCategoryKey = 'steak';
              subCategoryName = 'Steak';
            } else {
              subCategoryKey = 'general';
              subCategoryName = 'General';
            }
          } else {
            subCategoryKey = 'general';
            subCategoryName = 'General';
          }
        }
      }
      
      // Get sauce if it's a bowl (now using passed sauce or extracting from name)
      const isBowl = isRiceBowl || isUrbanBowl;
      const extractedSauce = sauce || (isBowl ? this.getSauceFromName(itemName) : '');
      
      // Build display category
      let displayCategory = topCategoryName;
      
      // Store rice substitution info for Urban Bowls (but don't change subcategory)
      if (topCategoryKey === 'urban-bowls' && modifierDetails.riceSubstitution) {
        modifiers.riceSubstitution = modifierDetails.riceSubstitution;
      }
      
      if (subCategoryName && subCategoryName !== 'General') {
        displayCategory += ` > ${subCategoryName}`;
      }
      
      // Add sauce to display category for bowls
      if ((topCategoryKey === 'urban-bowls' || topCategoryKey === 'riceBowls') && extractedSauce) {
        displayCategory += ` > ${extractedSauce}`;
      }
      
      const result = {
        topCategory: topCategoryKey,
        subCategory: subCategoryKey,
        sauce: extractedSauce,
        topCategoryName: topCategoryName,
        subCategoryName: subCategoryName,
        displayCategory: displayCategory,
        fullSize: itemSize, // Store the full size info for rice type display
        proteinType: modifiers.proteinType || '', // For rice bowls
        sauceType: modifiers.sauceType || '', // For rice bowls
        modifiers: modifiers, // Include all modifiers (including dumplingChoice for urban bowls)
        // Legacy properties for compatibility
        sizeCategory: topCategoryKey,
        proteinCategory: subCategoryKey,
        sizeName: topCategoryName,
        proteinName: subCategoryName
      };
      
      // Debug logging for Urban Bowls
      if (isUrbanBowl) {
        console.log(`[CategoryManager] Urban Bowl categorization result:`, JSON.stringify(result));
        console.log(`[CategoryManager] Urban Bowl dumplingChoice in input modifiers:`, modifiers.dumplingChoice);
        console.log(`[CategoryManager] Urban Bowl dumplingChoice in result:`, result.modifiers?.dumplingChoice);
      }
      
      // Debug log for rice bowls showing as "Other"
      if (isRiceBowl && topCategoryKey === 'other') {
        console.log(`[CategoryManager] WARNING: Rice bowl categorized as Other!`, {
          itemName: itemName,
          itemSize: itemSize,
          lowerSize: lowerSize,
          result: result
        });
      }
      
      // Enhanced debug logging for results
      if (isRiceBowl || debugEnabled) {
        console.log(`[CategoryManager] === CATEGORIZATION RESULT ===`);
        console.log(`[CategoryManager] Top Category: ${topCategoryKey} (${topCategoryName})`);
        console.log(`[CategoryManager] Sub Category: ${subCategoryKey} (${subCategoryName})`);
        console.log(`[CategoryManager] Display: ${displayCategory}`);
        console.log(`[CategoryManager] Full Result:`, result);
        console.log(`[CategoryManager] === END ===`);
      }
      
      // Cache the result
      if (window.categoryCache) {
        window.categoryCache.set(itemName, itemSize, modifiers, result);
      }
      
      return result;
    }
    
    formatSizeName(size) {
      if (!size || size === 'no-size') return 'NO SIZE';
      
      // Capitalize each word
      return size.split(/[\s-]+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    
    extractSizeInfo(sizeString) {
      // Extract base size and rice type from size string
      const result = {
        baseSize: '',
        riceType: ''
      };
      
      if (!sizeString) return result;
      
      const lower = sizeString.toLowerCase();
      
      // Extract base size
      if (lower.includes('large')) {
        result.baseSize = 'large';
      } else if (lower.includes('small')) {
        result.baseSize = 'small';
      }
      
      // Extract rice type
      if (lower.includes('garlic butter fried rice')) {
        result.riceType = 'garlic butter fried rice substitute';
      } else if (lower.includes('fried rice')) {
        result.riceType = 'fried rice substitute';
      } else if (lower.includes('stir fry rice noodles') || lower.includes('stir fry noodles')) {
        result.riceType = 'stir fry rice noodles substitute';
      } else if (lower.includes('noodles')) {
        result.riceType = 'noodles';
      }
      
      return result;
    }
    
    getSauceFromName(itemName) {
      if (!itemName) return '';
      
      const lowerName = itemName.toLowerCase();
      
      // Extract sauce for different patterns
      // Pattern: [Cooking Method] [Sauce] [Protein] Rice/Urban Bowl
      
      // List of known sauces
      const sauces = [
        'orange',
        'chipotle aioli',
        'jalapeño herb aioli',
        'sesame aioli',
        'garlic aioli',
        'sweet sriracha aioli',
        'garlic sesame fusion',
        'teriyaki',
        'sweet sriracha',
        'spicy yuzu',
        'yuzu',
        'crispy garlic sesame fusion',
        'crispy sesame',
        'crispy jalapeño herb aioli',
        'crispy sweet sriracha aioli',
        'crispy chipotle aioli',
        'crispy orange'
      ];
      
      for (const sauce of sauces) {
        if (lowerName.includes(sauce)) {
          // Capitalize first letter of each word
          return sauce.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
      
      return 'Original'; // Default sauce
    }
  
    getCategoryDisplay(categoryInfo) {
      // Handle new size-first format
      if (categoryInfo.displayCategory) {
        return categoryInfo.displayCategory;
      }
      
      // Fallback for any old format
      return 'Uncategorized';
    }
  
    getTopCategories() {
      return Object.entries(this.topCategories)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, value]) => ({
          key,
          ...value
        }));
    }
  
    getSubCategories() {
      // Return protein categories as subcategories
      return Object.entries(this.proteinCategories)
        .map(([key, value]) => ({
          key,
          ...value
        }));
    }
  
    // For backward compatibility
    getAllCategories() {
      const categories = [];
      
      // Add all top-level categories
      this.getTopCategories().forEach(cat => {
        categories.push({
          key: cat.key,
          name: cat.name,
          isMainCategory: true,
          type: 'top'
        });
      });
      
      // Add subcategories
      this.getSubCategories().forEach(subcat => {
        categories.push({
          key: subcat.key,
          name: subcat.name,
          isMainCategory: false,
          type: 'sub'
        });
      });
      
      return categories;
    }
    
    // Legacy method names for compatibility
    getSizeCategories() {
      return this.getTopCategories();
    }
    
    getProteinCategories() {
      return this.getSubCategories();
    }
  }
  
  // Make available globally
  window.CategoryManager = CategoryManager;
  console.log('[CategoryManager.js] Class exposed to window:', typeof window.CategoryManager);
  
  // Export for Node.js testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
  }

  // ----- components/batchManager.js -----
  if (window.logger) {
    window.logger.log('[BatchManager.js] Script loaded at:', new Date().toISOString());
  }
  
  class BatchManager {
    // Order completion tracking
    static COMPLETED_ORDER_TIMEOUT = 30 * 1000; // 30 seconds
    constructor() {
      this.batches = [];
      this.completedBatches = [];
      this.autoBatchTimer = null;
      this.maxBatchCapacity = 5; // Default batch size is 5
      this.currentBatchIndex = 0;
      this.nextBatchNumber = 1;
      
      // FIFO batching - no time-based assignment
      // Orders stay in their original batch
      
      this.loadSettings();
      this.initializeBatches();
    }
    
    initializeBatches() {
      // Create first batch
      this.createNewBatch();
    }
    
    get currentBatch() {
      // Ensure we always have at least one batch
      if (this.batches.length === 0) {
        this.createNewBatch();
      }
      return this.batches[this.currentBatchIndex] || this.batches[0];
    }
    
    getBatchForOrder(order) {
      // FIFO: Always assign to current batch unless it's full or locked
      const currentBatch = this.currentBatch;
      
      // Check if current batch is full or locked
      if (currentBatch.locked || currentBatch.orders.size >= this.maxBatchCapacity) {
        // Find first unlocked batch with space
        for (const batch of this.batches) {
          if (!batch.locked && batch.orders.size < this.maxBatchCapacity) {
            return batch;
          }
        }
        // No unlocked batches with space, create new one
        return this.createNewBatch();
      }
      
      return currentBatch;
    }
    
    assignOrderToBatches(orders) {
      if (window.logger) {
        window.logger.log(`[BatchManager] Assigning ${orders.length} orders to batches`);
      }
      
      // Track which orders are already in batches
      const existingOrderIds = new Set();
      const currentOrderIds = new Set();
      
      // Get all current order IDs from incoming orders
      orders.forEach(order => currentOrderIds.add(order.id));
      
      this.batches.forEach(batch => {
        batch.orders.forEach((order, id) => {
          existingOrderIds.add(id);
          
          // Mark orders as completed if they're no longer in the current list
          if (!currentOrderIds.has(id) && !order.completed) {
            order.completed = true;
            order.completedAt = Date.now();
            
            // Track prep time
            if (window.otterPrepTimeTracker && order.orderedAt) {
              try {
                const orderedDate = new Date(order.orderedAt);
                const completedDate = new Date(order.completedAt);
                window.otterPrepTimeTracker.trackOrderCompletion(id, orderedDate, completedDate);
                console.log(`[BatchManager] Order ${id} auto-completed, prep time tracked`);
              } catch (error) {
                console.error(`[BatchManager] Error tracking prep time for auto-completed order ${id}:`, error);
              }
            }
          }
        });
      });
      
      // Sort all orders by elapsed time (highest first) - orders with highest wait time at top
      const sortedOrders = [...orders].sort((a, b) => {
        // Calculate elapsed time for each order
        const getElapsedMinutes = (order) => {
          // If we have elapsedTime directly, use it
          if (order.elapsedTime) return order.elapsedTime;
          
          // If we have orderedAt timestamp, calculate from that
          if (order.orderedAt) {
            const orderedDate = new Date(order.orderedAt);
            const now = new Date();
            return Math.floor((now - orderedDate) / 60000);
          }
          
          // Fall back to waitTime
          return order.waitTime || 0;
        };
        
        const aElapsed = getElapsedMinutes(a);
        const bElapsed = getElapsedMinutes(b);
        
        // Sort by highest elapsed time first (descending order)
        return bElapsed - aElapsed;
      });
      
      // Clear items from all UNLOCKED batches only
      this.batches.forEach(batch => {
        if (!batch.locked) {
          const itemCount = batch.items.size;
          batch.items.clear();
          console.log(`[BatchManager] Cleared ${itemCount} items from unlocked batch ${batch.number}`);
        }
      });
      
      // Process orders
      sortedOrders.forEach(order => {
        let batch;
        
        // Check if order is already assigned to a batch
        let orderBatch = null;
        for (const b of this.batches) {
          if (b.orders.has(order.id)) {
            orderBatch = b;
            break;
          }
        }
        
        if (orderBatch) {
          // Order already assigned, keep it in same batch
          batch = orderBatch;
          // Update the order data (in case wait time changed)
          batch.orders.set(order.id, order);
        } else {
          // New order, assign to appropriate batch
          batch = this.getBatchForOrder(order);
          // Add timestamp for new order tracking
          order.addedAt = Date.now();
          batch.orders.set(order.id, order);
          // Mark as new for highlighting
          batch.newOrderIds.add(order.id);
          
          // Check if batch should be locked
          if (batch.orders.size >= this.maxBatchCapacity) {
            batch.locked = true;
          }
        }
        
        // Process items for the batch
        order.items.forEach(item => {
          const key = `${item.size}|${item.category}|${item.baseName || item.name}`;
          
          if (!batch.items.has(key)) {
            if (window.logger) {
              window.logger.debug(`[BatchManager] Creating new batch item for: ${item.name}`);
            }
            
            // Debug logging for Rice/Urban Bowls
            if (item.isRiceBowl || item.isUrbanBowl || (item.name && (item.name.toLowerCase().includes('rice bowl') || item.name.toLowerCase().includes('urban bowl')))) {
              console.log(`[BatchManager] Creating batch item with modifierDetails:`, {
                name: item.name,
                modifierDetails: item.modifierDetails,
                isRiceBowl: item.isRiceBowl,
                isUrbanBowl: item.isUrbanBowl
              });
            }
            
            const batchItem = {
              ...item,
              orderIds: [],
              totalQuantity: 0,
              batchQuantity: 0,
              // Explicitly copy modifierDetails to ensure it's not lost
              modifierDetails: item.modifierDetails || {},
              isRiceBowl: item.isRiceBowl || false,
              isUrbanBowl: item.isUrbanBowl || false,
              // Preserve top-level properties for tags
              dumplingType: item.dumplingType || null,
              riceSubType: item.riceSubType || null,
              sauceType: item.sauceType || null
            };
            
            // Debug log for Urban Bowls
            if (item.isUrbanBowl || item.name.toLowerCase().includes('urban bowl')) {
              console.log(`[BatchManager] Creating batch item for Urban Bowl:`, {
                name: item.name,
                modifierDetails: batchItem.modifierDetails,
                dumplingType: batchItem.dumplingType,
                riceSubType: batchItem.riceSubType
              });
            }
            
            batch.items.set(key, batchItem);
          }
          
          const batchItem = batch.items.get(key);
          // Only add this order's items if we haven't already processed this order
          if (!batchItem.orderIds.includes(order.id)) {
            batchItem.orderIds.push(order.id);
            const quantityToAdd = item.quantity || 1;
            batchItem.totalQuantity += quantityToAdd;
            batchItem.batchQuantity += quantityToAdd;
            console.log(`[BatchManager] Added ${quantityToAdd} of "${item.name}" from order ${order.id}. Total now: ${batchItem.totalQuantity}`);
          } else {
            console.log(`[BatchManager] Skipping duplicate item "${item.name}" from order ${order.id} - already processed`);
          }
        });
      });
    }
    
    async loadSettings() {
      const settings = await Storage.get('settings');
      if (settings && settings.maxBatchCapacity) {
        this.maxBatchCapacity = settings.maxBatchCapacity;
      } else if (settings && settings.maxWaveCapacity) {
        // Backward compatibility
        this.maxBatchCapacity = settings.maxWaveCapacity;
      }
      // Don't update existing batches - only affects new batches
    }
  
    generateBatchId() {
      return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  
    // Time-based system doesn't allow manual adding - orders are assigned automatically
    refreshBatchAssignments(orders) {
      this.assignOrderToBatches(orders);
    }
    
    getCurrentBatchItemCount() {
      let totalItems = 0;
      const batch = this.currentBatch;
      if (batch && batch.items) {
        batch.items.forEach(item => {
          totalItems += item.batchQuantity || 0;
        });
      }
      return totalItems;
    }
    
    createNewBatch() {
      const newBatch = {
        id: this.generateBatchId(),
        number: this.nextBatchNumber++,
        name: `Batch ${this.nextBatchNumber - 1}`,
        items: new Map(),
        orders: new Map(),
        createdAt: Date.now(),
        status: 'active',
        capacity: this.maxBatchCapacity,
        locked: false,
        newOrderIds: new Set(),
        urgency: 'normal' // Will be updated based on oldest order
      };
      
      this.batches.push(newBatch);
      this.currentBatchIndex = this.batches.length - 1;
      
      console.log(`Created new batch #${newBatch.number}`);
      this.onNewBatchCreated?.(newBatch);
      
      return newBatch;
    }
    
    getCurrentBatch() {
      // Return the last batch that's not full or locked
      for (let i = this.batches.length - 1; i >= 0; i--) {
        const batch = this.batches[i];
        if (!batch.locked && batch.orders.size < this.maxBatchCapacity) {
          return batch;
        }
      }
      // All batches are full, create a new one
      return this.createNewBatch();
    }
    
    getBatchUrgency(batch) {
      // Calculate urgency based on oldest order in the batch
      let maxElapsedTime = 0;
      let isRunningLate = false;
      
      batch.orders.forEach(order => {
        if (!order.completed) {
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
          
          // Check if order is running late based on prep time data
          if (window.otterPrepTimeTracker && elapsedTime > 0) {
            const stats = window.otterPrepTimeTracker.getLastHourAverage();
            const avgPrepTime = stats.orderCount > 0 ? stats.averageMinutes : 
                               window.otterPrepTimeTracker.getTodayAverage().averageMinutes;
            
            // Consider it late if elapsed time exceeds average prep time
            if (avgPrepTime > 0 && elapsedTime > avgPrepTime) {
              isRunningLate = true;
            }
          }
        }
      });
      
      // Determine urgency based on elapsed time and prep time performance
      if (maxElapsedTime >= 15 || isRunningLate) {
        return 'urgent'; // 15+ minutes old or running late
      } else if (maxElapsedTime >= 8) {
        return 'warning'; // 8-15 minutes old
      } else {
        return 'normal'; // 0-8 minutes old
      }
    }
  
    removeItemFromBatch(itemKey, quantity = 1) {
      if (!this.currentBatch.items.has(itemKey)) return;
      
      const batchItem = this.currentBatch.items.get(itemKey);
      batchItem.batchQuantity -= quantity;
      
      if (batchItem.batchQuantity <= 0) {
        this.currentBatch.items.delete(itemKey);
      }
    }
  
    getCurrentBatchItems() {
      return Array.from(this.currentBatch.items.values());
    }
    
    getBatchItems(batchIndex) {
      if (batchIndex >= 0 && batchIndex < this.batches.length) {
        return Array.from(this.batches[batchIndex].items.values());
      }
      return [];
    }
  
    getBatchByCategory(batchIndex, categoryManager) {
      const batch = this.batches[batchIndex];
      if (!batch) return {};
      
      const categorized = {};
      
      batch.items.forEach((item, key) => {
        const category = item.category || 'uncategorized';
        if (!categorized[category]) {
          categorized[category] = [];
        }
        // Debug logging for Rice/Urban Bowls
        if (item.isRiceBowl || item.isUrbanBowl || (item.name && (item.name.toLowerCase().includes('rice bowl') || item.name.toLowerCase().includes('urban bowl')))) {
          console.log(`[BatchManager.getBatchByCategory] Item being categorized:`, {
            name: item.name,
            modifierDetails: item.modifierDetails,
            isRiceBowl: item.isRiceBowl,
            isUrbanBowl: item.isUrbanBowl,
            hasModifierDetails: !!item.modifierDetails
          });
        }
        
        categorized[category].push({
          ...item,
          key,
          // Ensure modifierDetails is preserved
          modifierDetails: item.modifierDetails || {},
          isRiceBowl: item.isRiceBowl || false,
          isUrbanBowl: item.isUrbanBowl || false
        });
      });
      
      return categorized;
    }
  
    getCurrentBatchByCategory(categoryManager) {
      return this.getBatchByCategory(this.currentBatchIndex, categoryManager);
    }
    
    getBatchBySize(batchIndex) {
      const batch = this.batches[batchIndex];
      if (!batch) return {};
      
      const sizeGroups = {};
      
      batch.items.forEach((item, key) => {
        // Use the item's category (which should be the topCategory from categoryManager)
        let groupKey = item.category || 'other';
        let displayName = 'Other';
        
        // Get display name from categoryInfo if available
        if (item.categoryInfo && item.categoryInfo.topCategoryName) {
          displayName = item.categoryInfo.topCategoryName;
          groupKey = item.categoryInfo.topCategory || item.category || 'other';
        }
        
        // Sanitize key for object property
        const sanitizedKey = groupKey.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        if (!sizeGroups[sanitizedKey]) {
          sizeGroups[sanitizedKey] = { name: displayName, items: [] };
        }
        
        // Add item to the appropriate group
        const sizeGroupItem = {
          ...item,
          key,
          // Explicitly preserve these properties
          modifierDetails: item.modifierDetails || {},
          modifiers: item.modifiers || [],
          // Preserve top-level properties for tags
          dumplingType: item.dumplingType || null,
          riceSubType: item.riceSubType || null,
          sauceType: item.sauceType || null,
          isRiceBowl: item.isRiceBowl || false,
          isUrbanBowl: item.isUrbanBowl || false
        };
        
        // Debug logging for Rice/Urban Bowls
        if (item.isRiceBowl || item.isUrbanBowl || (item.name && (item.name.toLowerCase().includes('rice bowl') || item.name.toLowerCase().includes('urban bowl')))) {
          console.log(`[BatchManager.getBatchBySize] Creating sizeGroupItem:`, {
            name: item.name,
            modifierDetails: sizeGroupItem.modifierDetails,
            isRiceBowl: sizeGroupItem.isRiceBowl,
            isUrbanBowl: sizeGroupItem.isUrbanBowl,
            hasModifierDetails: !!sizeGroupItem.modifierDetails,
            sauceInModifierDetails: sizeGroupItem.modifierDetails?.sauce,
            dumplingType: sizeGroupItem.dumplingType,
            riceSubType: sizeGroupItem.riceSubType,
            sauceType: sizeGroupItem.sauceType
          });
        }
        
        if (window.logger) {
          window.logger.debug(`[BatchManager] Adding item to group ${displayName}: ${sizeGroupItem.name}`);
        }
        
        sizeGroups[sanitizedKey].items.push(sizeGroupItem);
      });
      
      // Sort size groups in the order defined by categoryManager
      const orderedGroups = {};
      const categoryOrder = [
        'ricebowls',
        'rice-bowls',
        'urbanBowls',
        'urban-bowls',
        'bao',
        'meals',
        'appetizers',
        'dumplings',
        'desserts',
        'drinks',
        'sides',
        'chicken',
        'pork',
        'vegetarian',
        'other'
      ];
      
      // Add groups in predefined order
      categoryOrder.forEach(key => {
        if (sizeGroups[key]) {
          orderedGroups[key] = sizeGroups[key];
        }
      });
      
      // Add any remaining groups not in the predefined order
      Object.keys(sizeGroups).forEach(key => {
        if (!orderedGroups[key]) {
          orderedGroups[key] = sizeGroups[key];
        }
      });
      
      return orderedGroups;
    }
    
    getBatchItemCount(batch) {
      let count = 0;
      batch.items.forEach(item => {
        count += item.batchQuantity || item.totalQuantity || 0;
      });
      return count;
    }
    getAllBatches() {
      return this.batches.filter(batch => batch.status === 'active');
    }
    
    switchToBatch(batchIndex) {
      if (batchIndex >= 0 && batchIndex < this.batches.length) {
        this.currentBatchIndex = batchIndex;
        return true;
      }
      return false;
    }
  
    // Auto-batch functionality removed - batches are created as needed
  
    // Mark an order as completed
    markOrderCompleted(orderId) {
      console.log(`[BatchManager] Marking order ${orderId} as completed`);
      
      // Find the order across all batches
      for (const batch of this.batches) {
        if (batch.orders.has(orderId)) {
          const order = batch.orders.get(orderId);
          if (!order.completed) {
            order.completed = true;
            order.completedAt = Date.now();
            console.log(`[BatchManager] Order ${orderId} marked as completed in batch ${batch.number}`);
            
            // Track prep time if we have the necessary data
            if (window.otterPrepTimeTracker && order.orderedAt) {
              try {
                const orderedDate = new Date(order.orderedAt);
                const completedDate = new Date(order.completedAt);
                window.otterPrepTimeTracker.trackOrderCompletion(orderId, orderedDate, completedDate);
                console.log(`[BatchManager] Prep time tracked for order ${orderId}`);
              } catch (error) {
                console.error(`[BatchManager] Error tracking prep time for order ${orderId}:`, error);
              }
            }
          }
          break;
        }
      }
    }
  
    // Remove completed orders that have been displayed for too long
    cleanupCompletedOrders() {
      const now = Date.now();
      const timeout = BatchManager.COMPLETED_ORDER_TIMEOUT;
      
      this.batches.forEach(batch => {
        batch.orders.forEach((order, orderId) => {
          if (order.completed && order.completedAt && (now - order.completedAt > timeout)) {
            // Remove the order from the batch
            batch.orders.delete(orderId);
            // Remove from new orders set if present
            batch.newOrderIds.delete(orderId);
          }
        });
      });
    }
    
    // Clear "new" status from orders after 30 seconds
    clearNewOrderStatus() {
      const now = Date.now();
      const NEW_ORDER_TIMEOUT = 30000; // 30 seconds
      
      this.batches.forEach(batch => {
        batch.newOrderIds.forEach(orderId => {
          const order = batch.orders.get(orderId);
          if (order && order.addedAt && (now - order.addedAt > NEW_ORDER_TIMEOUT)) {
            batch.newOrderIds.delete(orderId);
          }
        });
      });
    }
  
    getBatchStats() {
      return {
        currentBatchSize: this.currentBatch ? this.currentBatch.items.size : 0,
        currentBatchAge: this.currentBatch ? Date.now() - this.currentBatch.createdAt : 0,
        activeBatches: this.batches.filter(b => !b.locked).length,
        lockedBatches: this.batches.filter(b => b.locked).length,
        totalBatches: this.batches.length,
        totalItems: this.batches.reduce((total, batch) => {
          if (!batch || !batch.items) return total;
          let batchTotal = 0;
          batch.items.forEach(item => {
            batchTotal += item.totalQuantity || item.quantity || 0;
          });
          return total + batchTotal;
        }, 0)
      };
    }
    
    getBatchOrders(batchId) {
      const batch = this.batches.find(b => b.id === batchId);
      if (!batch || !batch.orders) {
        return [];
      }
      
      // Handle orders as Map or plain object
      if (batch.orders instanceof Map) {
        return Array.from(batch.orders.keys());
      } else {
        return Object.keys(batch.orders);
      }
    }
  }
  
  // Make available globally
  window.BatchManager = BatchManager;



  // ----- components/prepTimeTracker.js -----
  /**
   * Prep Time Tracker
   * Tracks order completion times and calculates average preparation times
   */
  
  class PrepTimeTracker {
    constructor() {
      this.completedOrders = new Map(); // orderId -> completion data
      this.storageKey = 'prepTimeData';
      this.loadFromStorage();
    }
  
    /**
     * Track when an order transitions from cooking to completed
     * @param {string} orderId - The order ID
     * @param {Date} orderedAt - When the order was placed
     * @param {Date} completedAt - When the order was completed
     */
    trackOrderCompletion(orderId, orderedAt, completedAt = new Date()) {
      if (this.completedOrders.has(orderId)) {
        console.log(`[PrepTimeTracker] Order ${orderId} already tracked`);
        return;
      }
  
      const prepTimeMinutes = Math.floor((completedAt - orderedAt) / 60000);
      
      const completionData = {
        orderId,
        orderedAt: orderedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        prepTimeMinutes,
        dayOfWeek: completedAt.getDay(),
        hourOfDay: completedAt.getHours()
      };
  
      this.completedOrders.set(orderId, completionData);
      console.log(`[PrepTimeTracker] Tracked order ${orderId}: ${prepTimeMinutes} minutes prep time`);
      
      // Clean up old data (keep last 7 days)
      this.cleanupOldData();
      
      // Save to storage
      this.saveToStorage();
    }
  
    /**
     * Get average prep time for the last hour
     * @returns {Object} { averageMinutes, orderCount }
     */
    getLastHourAverage() {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const relevantOrders = [];
  
      this.completedOrders.forEach(order => {
        const completedAt = new Date(order.completedAt);
        if (completedAt >= oneHourAgo) {
          relevantOrders.push(order);
        }
      });
  
      if (relevantOrders.length === 0) {
        return { averageMinutes: 0, orderCount: 0 };
      }
  
      const totalMinutes = relevantOrders.reduce((sum, order) => sum + order.prepTimeMinutes, 0);
      return {
        averageMinutes: Math.round(totalMinutes / relevantOrders.length),
        orderCount: relevantOrders.length
      };
    }
  
    /**
     * Get average prep time for today
     * @returns {Object} { averageMinutes, orderCount }
     */
    getTodayAverage() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const relevantOrders = [];
  
      this.completedOrders.forEach(order => {
        const completedAt = new Date(order.completedAt);
        if (completedAt >= today) {
          relevantOrders.push(order);
        }
      });
  
      if (relevantOrders.length === 0) {
        return { averageMinutes: 0, orderCount: 0 };
      }
  
      const totalMinutes = relevantOrders.reduce((sum, order) => sum + order.prepTimeMinutes, 0);
      return {
        averageMinutes: Math.round(totalMinutes / relevantOrders.length),
        orderCount: relevantOrders.length
      };
    }
  
    /**
     * Get hourly breakdown for today
     * @returns {Array} Array of { hour, averageMinutes, orderCount }
     */
    getTodayHourlyBreakdown() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hourlyData = {};
  
      this.completedOrders.forEach(order => {
        const completedAt = new Date(order.completedAt);
        if (completedAt >= today) {
          const hour = order.hourOfDay;
          if (!hourlyData[hour]) {
            hourlyData[hour] = { totalMinutes: 0, count: 0 };
          }
          hourlyData[hour].totalMinutes += order.prepTimeMinutes;
          hourlyData[hour].count++;
        }
      });
  
      const breakdown = [];
      for (let hour = 0; hour < 24; hour++) {
        if (hourlyData[hour]) {
          breakdown.push({
            hour,
            averageMinutes: Math.round(hourlyData[hour].totalMinutes / hourlyData[hour].count),
            orderCount: hourlyData[hour].count
          });
        }
      }
  
      return breakdown;
    }
  
    /**
     * Get statistics for display
     */
    getStatistics() {
      const lastHour = this.getLastHourAverage();
      const today = this.getTodayAverage();
      const hourlyBreakdown = this.getTodayHourlyBreakdown();
  
      // Calculate peak hours
      const peakHours = hourlyBreakdown
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 3)
        .map(h => h.hour);
  
      return {
        lastHour,
        today,
        hourlyBreakdown,
        peakHours,
        totalOrdersTracked: this.completedOrders.size
      };
    }
  
    /**
     * Clean up data older than 7 days
     */
    cleanupOldData() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const toDelete = [];
  
      this.completedOrders.forEach((order, orderId) => {
        const completedAt = new Date(order.completedAt);
        if (completedAt < sevenDaysAgo) {
          toDelete.push(orderId);
        }
      });
  
      toDelete.forEach(orderId => this.completedOrders.delete(orderId));
      
      if (toDelete.length > 0) {
        console.log(`[PrepTimeTracker] Cleaned up ${toDelete.length} old orders`);
      }
    }
  
    /**
     * Save data to Chrome storage
     */
    async saveToStorage() {
      const data = Array.from(this.completedOrders.entries());
      chrome.storage.local.set({ 
        [this.storageKey]: {
          orders: data,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  
    /**
     * Load data from Chrome storage
     */
    async loadFromStorage() {
      chrome.storage.local.get(this.storageKey, (result) => {
        if (result[this.storageKey]) {
          const { orders, lastUpdated } = result[this.storageKey];
          this.completedOrders = new Map(orders);
          console.log(`[PrepTimeTracker] Loaded ${this.completedOrders.size} orders from storage`);
          console.log(`[PrepTimeTracker] Last updated: ${lastUpdated}`);
          
          // Clean up old data on load
          this.cleanupOldData();
        }
      });
    }
  
    /**
     * Check if an order is already completed
     */
    isOrderCompleted(orderId) {
      return this.completedOrders.has(orderId);
    }
  
    /**
     * Get completion data for a specific order
     */
    getOrderCompletionData(orderId) {
      return this.completedOrders.get(orderId);
    }
  
    /**
     * Export data for analysis
     */
    exportData() {
      const data = Array.from(this.completedOrders.values());
      return {
        orders: data,
        summary: this.getStatistics(),
        exportedAt: new Date().toISOString()
      };
    }
  }
  
  // Make available globally
  window.PrepTimeTracker = PrepTimeTracker;

  // ----- content/networkMonitor.js -----
  console.log('[NetworkMonitor.js] Script loaded at:', new Date().toISOString());
  
  class NetworkMonitor {
    constructor() {
      this.apiEndpoints = new Map();
      this.orderDataResponses = [];
      this.allRequests = []; // Store all requests for debugging
      this.isMonitoring = false;
      this.debugMode = false;
      this.verboseMode = false; // New verbose mode
      this.requestCount = 0;
    }
  
    startMonitoring() {
      if (this.isMonitoring) return;
      
      console.log('[NetworkMonitor] 🚀 Starting network monitoring...');
      this.isMonitoring = true;
      this.interceptFetch();
      this.interceptXHR();
      console.log('[NetworkMonitor] ✅ Network monitoring active');
      
      // Log initial state
      console.log('[NetworkMonitor] Monitoring state:', {
        isMonitoring: this.isMonitoring,
        fetchIntercepted: typeof window.fetch === 'function' && window.fetch.toString().includes('originalFetch'),
        xhrIntercepted: XMLHttpRequest.prototype.open.toString().includes('_url'),
        timestamp: new Date().toISOString()
      });
      
      // Log every 5 seconds to show we're still monitoring
      setInterval(() => {
        if (this.isMonitoring) {
          console.log(`[NetworkMonitor] 📊 Status: ${this.requestCount} requests captured, ${this.apiEndpoints.size} endpoints found, ${this.orderDataResponses.length} order responses`);
        }
      }, 5000);
    }
  
    stopMonitoring() {
      this.isMonitoring = false;
      console.log('[NetworkMonitor] Stopped monitoring');
    }
  
    interceptFetch() {
      // Check if already intercepted
      if (window._originalFetch) {
        console.log('[NetworkMonitor] Fetch already intercepted');
        return;
      }
      
      const originalFetch = window.fetch;
      window._originalFetch = originalFetch; // Store reference
      const monitor = this;
      
      console.log('[NetworkMonitor] Intercepting fetch...');
      console.log('[NetworkMonitor] Original fetch:', typeof originalFetch);
  
      window.fetch = async function(...args) {
        const [url, options = {}] = args;
        
        // ALWAYS log the URL to verify interception is working
        console.log('[NetworkMonitor] 🌐 FETCH:', url);
        
        try {
          const response = await originalFetch.apply(this, args);
          
          if (monitor.isMonitoring) {
            monitor.requestCount++;
            
            // Store request info
            monitor.allRequests.push({ 
              method: options.method || 'GET', 
              url: url, 
              timestamp: Date.now() 
            });
            
            // Process Otter API requests
            if (monitor.isOtterAPI(url)) {
              console.log(`[NetworkMonitor] 📥 Response received from: ${url}`);
              console.log(`[NetworkMonitor] Response status: ${response.status}`);
              console.log(`[NetworkMonitor] Response type: ${response.type}`);
              
              // Clone BEFORE any consumption
              const clonedResponse = response.clone();
              
              // Try to parse as JSON
              clonedResponse.json().then(data => {
                console.log(`[NetworkMonitor] ✅ Successfully parsed JSON from: ${url}`);
                console.log(`[NetworkMonitor] Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
                
                // Log first bit of data for debugging
                if (data) {
                  const preview = JSON.stringify(data).substring(0, 200);
                  console.log(`[NetworkMonitor] Data preview: ${preview}...`);
                }
                
                // Always analyze api.tryotter.com responses
                monitor.analyzeResponse(url, data, options.method || 'GET');
              }).catch(err => {
                console.log(`[NetworkMonitor] ❌ Failed to parse JSON from: ${url}`);
                console.log(`[NetworkMonitor] Error: ${err.message}`);
                
                // Still store the endpoint even if JSON parsing fails
                monitor.apiEndpoints.set(url, {
                  url: url,
                  method: options.method || 'GET',
                  error: 'JSON parse failed',
                  timestamp: Date.now()
                });
              });
            }
          }
          
          return response;
        } catch (error) {
          throw error;
        }
      };
    }
  
    interceptXHR() {
      // Check if already intercepted
      if (window._originalXHROpen) {
        console.log('[NetworkMonitor] XHR already intercepted');
        return;
      }
      
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;
      window._originalXHROpen = originalOpen; // Store reference
      window._originalXHRSend = originalSend;
      const monitor = this;
      
      console.log('[NetworkMonitor] Intercepting XMLHttpRequest...');
  
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        this._method = method;
        
        // Always log in debug mode
        if (monitor.debugMode || monitor.verboseMode) {
          console.log('[NetworkMonitor] XHR.open intercepted:', method, url);
        }
        
        return originalOpen.apply(this, [method, url, ...rest]);
      };
  
      XMLHttpRequest.prototype.send = function(body) {
        const xhr = this;
        
        // ALWAYS log XHR requests to verify interception
        console.log('[NetworkMonitor] 🌍 XHR:', xhr._method, xhr._url);
        
        if (monitor.isMonitoring) {
          monitor.requestCount++;
          
          // Store request info
          monitor.allRequests.push({ 
            method: `xhr-${xhr._method}`, 
            url: xhr._url, 
            timestamp: Date.now() 
          });
          
          if (monitor.isOtterAPI(xhr._url)) {
            const originalOnReadyStateChange = xhr.onreadystatechange;
            
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                console.log(`[NetworkMonitor] 📥 XHR Response from: ${xhr._url}`);
                console.log(`[NetworkMonitor] Status: ${xhr.status}, Method: ${xhr._method}`);
                
                if (xhr.status === 200 || xhr.status === 201) {
                  try {
                    const responseText = xhr.responseText;
                    console.log(`[NetworkMonitor] Response length: ${responseText.length} chars`);
                    
                    const data = JSON.parse(responseText);
                    console.log(`[NetworkMonitor] ✅ Successfully parsed XHR JSON`);
                    
                    // Log preview
                    const preview = JSON.stringify(data).substring(0, 200);
                    console.log(`[NetworkMonitor] Data preview: ${preview}...`);
                    
                    monitor.analyzeResponse(xhr._url, data, `xhr-${xhr._method}`);
                  } catch (e) {
                    console.log(`[NetworkMonitor] ❌ Failed to parse XHR JSON: ${e.message}`);
                    
                    // Store endpoint anyway
                    monitor.apiEndpoints.set(xhr._url, {
                      url: xhr._url,
                      method: `xhr-${xhr._method}`,
                      error: 'JSON parse failed',
                      status: xhr.status,
                      timestamp: Date.now()
                    });
                  }
                } else {
                  console.log(`[NetworkMonitor] Non-200 status: ${xhr.status}`);
                }
              }
              
              if (originalOnReadyStateChange) {
                originalOnReadyStateChange.apply(xhr, arguments);
              }
            };
          }
        }
        
        return originalSend.apply(this, [body]);
      };
    }
  
    isOtterAPI(url) {
      if (!url) return false;
      const urlStr = url.toString().toLowerCase();
      
      // Capture ALL tryotter.com subdomains (app, api, rosetta, etc.)
      const isOtter = urlStr.includes('.tryotter.com') || urlStr.includes('://tryotter.com');
      
      if (isOtter) {
        console.log('[NetworkMonitor] 🎯 Capturing tryotter.com request:', url.toString());
        
        // Log URL components for analysis
        try {
          const urlObj = new URL(url);
          console.log('[NetworkMonitor] URL breakdown:', {
            host: urlObj.host,
            pathname: urlObj.pathname,
            search: urlObj.search
          });
          
          // Special logging for API endpoints
          if (urlObj.host === 'api.tryotter.com') {
            console.log('[NetworkMonitor] 🚀 API ENDPOINT DETECTED!');
          }
        } catch (e) {
          // Invalid URL
        }
      }
      
      return isOtter;
    }
  
    analyzeResponse(url, data, method) {
      const endpoint = this.extractEndpoint(url);
      const urlStr = url.toString();
      
      console.log(`[NetworkMonitor] 📦 Analyzing response from: ${endpoint}`);
      
      // ALWAYS store tryotter.com responses for analysis
      if (urlStr.toLowerCase().includes('tryotter.com')) {
        // Store endpoint info (use full URL as key to differentiate POST/GET)
        const endpointKey = `${method}:${endpoint}`;
        
        this.apiEndpoints.set(endpointKey, {
          url: url,
          endpoint: endpoint,
          method: method,
          sampleData: data,
          timestamp: Date.now(),
          hasOrderData: this.looksLikeOrderData(data)
        });
        
        console.log(`[NetworkMonitor] ✅ Stored endpoint: ${endpointKey}`);
        console.log(`[NetworkMonitor] Total endpoints discovered: ${this.apiEndpoints.size}`);
        
        // Special handling for api.tryotter.com - always analyze deeply
        if (urlStr.includes('api.tryotter.com')) {
          console.log(`[NetworkMonitor] 🔍 Analyzing api.tryotter.com response...`);
          
          // Log data structure for analysis
          if (data && typeof data === 'object') {
            const dataInfo = {
              isArray: Array.isArray(data),
              length: Array.isArray(data) ? data.length : undefined,
              keys: Array.isArray(data) ? 'array' : Object.keys(data).slice(0, 20),
              hasOrderIndicators: this.looksLikeOrderData(data)
            };
            console.log('[NetworkMonitor] Response structure:', dataInfo);
            
            // For batch_json endpoint, log the structure
            if (endpoint.includes('batch_json')) {
              console.log('[NetworkMonitor] 🎯 BATCH_JSON endpoint data:', data);
              
              // Check common batch structures
              if (data.batch) console.log('Found data.batch:', data.batch);
              if (data.events) console.log('Found data.events:', data.events);
              if (data.data) console.log('Found data.data:', data.data);
              if (data.payload) console.log('Found data.payload:', data.payload);
            }
          }
        }
      }
      
      // For api.tryotter.com, ALWAYS store and notify
      if (urlStr.includes('api.tryotter.com')) {
        console.log('[NetworkMonitor] 🎯 Storing api.tryotter.com response');
        this.orderDataResponses.push({
          url: url,
          data: data,
          timestamp: Date.now(),
          isApiResponse: true
        });
        
        // ALWAYS notify for api.tryotter.com responses
        this.notifyOrderDataFound(url, data);
      } else if (this.looksLikeOrderData(data)) {
        // For other domains, only store if it looks like order data
        this.orderDataResponses.push({
          url: url,
          data: data,
          timestamp: Date.now()
        });
        
        // Notify extension that we found order data
        this.notifyOrderDataFound(url, data);
      }
    }
  
    looksLikeOrderData(data) {
      if (!data || typeof data !== 'object') return false;
      
      // Check for order-like properties - expanded list
      const orderIndicators = [
        'order', 'orders', 'items', 'customer', 'customerName',
        'orderNumber', 'orderId', 'orderItems', 'menuItems',
        'total', 'subtotal', 'status', 'createdAt', 'orderType',
        'lineItems', 'line_items', 'modifiers', 'modifier',
        'size', 'price', 'quantity', 'displayId', 'display_id',
        'product', 'sku', 'variant', 'option',
        // Add more Otter-specific terms
        'receipt', 'restaurant', 'delivery', 'pickup',
        'item_name', 'item_price', 'item_quantity',
        // Add Otter-specific fields we've seen
        'customerOrder', 'customerItemsContainer', 'stationOrders',
        'menuReconciledItemsContainer', 'sectionName', 'entityPath',
        'stationItemDetail', 'modifierCustomerItemIds'
      ];
      
      const dataStr = JSON.stringify(data).toLowerCase();
      
      // Special check for batch_json which might have nested data
      if (data.batch || data.events || data.data) {
        console.log('[NetworkMonitor] Found batch/events/data wrapper, checking nested content...');
        const nestedData = data.batch || data.events || data.data;
        if (this.looksLikeOrderData(nestedData)) return true;
      }
      
      // Check for Otter-specific structures
      if (data.customerOrder || data.customerItemsContainer) {
        console.log('[NetworkMonitor] Found Otter-specific order structure!');
        return true;
      }
      
      // Also check for arrays that might contain orders
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = JSON.stringify(data[0]).toLowerCase();
        const hasOrderIndicators = orderIndicators.some(indicator => 
          firstItem.includes(indicator.toLowerCase())
        );
        if (hasOrderIndicators) return true;
      }
      
      return orderIndicators.some(indicator => dataStr.includes(indicator.toLowerCase()));
    }
  
    extractEndpoint(url) {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname;
      } catch (e) {
        return url;
      }
    }
  
    notifyOrderDataFound(url, data) {
      // Send message to background script or content script
      window.dispatchEvent(new CustomEvent('otter-api-order-data', {
        detail: {
          url: url,
          data: data,
          timestamp: Date.now()
        }
      }));
    }
  
    getDiscoveredEndpoints() {
      return Array.from(this.apiEndpoints.entries()).map(([endpoint, info]) => ({
        endpoint,
        ...info
      }));
    }
  
    getLatestOrderData() {
      return this.orderDataResponses[this.orderDataResponses.length - 1] || null;
    }
  
    enableDebugMode() {
      this.debugMode = true;
      console.log('[NetworkMonitor] Debug mode enabled');
    }
  
    enableVerboseMode() {
      this.verboseMode = true;
      console.log('[NetworkMonitor] Verbose mode enabled - logging all requests');
    }
  
    disableVerboseMode() {
      this.verboseMode = false;
      console.log('[NetworkMonitor] Verbose mode disabled');
    }
  
    toggleVerboseMode() {
      this.verboseMode = !this.verboseMode;
      console.log(`[NetworkMonitor] Verbose mode ${this.verboseMode ? 'enabled' : 'disabled'}`);
      return this.verboseMode;
    }
  
    getAllRequests() {
      return this.allRequests;
    }
  
    exportFindings() {
      const findings = {
        discoveredEndpoints: this.getDiscoveredEndpoints(),
        sampleResponses: this.orderDataResponses.slice(-5), // Last 5 responses
        allRequestsCount: this.allRequests.length,
        recentRequests: this.allRequests.slice(-20), // Last 20 requests
        timestamp: new Date().toISOString()
      };
      
      console.log('[NetworkMonitor] 📋 API FINDINGS REPORT');
      console.log('='.repeat(50));
      console.log(`Total Requests Captured: ${this.allRequests.length}`);
      console.log(`Discovered Endpoints: ${this.apiEndpoints.size}`);
      console.log(`Order Data Responses: ${this.orderDataResponses.length}`);
      console.log('='.repeat(50));
      
      // List all discovered endpoints
      if (this.apiEndpoints.size > 0) {
        console.log('\n🎯 DISCOVERED ENDPOINTS:');
        this.apiEndpoints.forEach((info, endpoint) => {
          console.log(`  ${endpoint}`);
          console.log(`    Method: ${info.method}`);
          console.log(`    Has Order Data: ${info.hasOrderData || false}`);
          if (info.sampleData) {
            console.log(`    Data Type: ${Array.isArray(info.sampleData) ? 'Array' : 'Object'}`);
          }
        });
      } else {
        console.log('\n⚠️ No endpoints discovered yet!');
        console.log('Try interacting with the page (click orders, refresh, etc.)');
      }
      
      // Group requests by domain for analysis
      const requestsByDomain = {};
      this.allRequests.forEach(req => {
        try {
          const url = new URL(req.url);
          const domain = url.hostname;
          if (!requestsByDomain[domain]) {
            requestsByDomain[domain] = new Set();
          }
          requestsByDomain[domain].add(url.pathname);
        } catch (e) {
          // Invalid URL
        }
      });
      
      console.log('\n🌐 REQUESTS BY DOMAIN:');
      Object.entries(requestsByDomain).forEach(([domain, paths]) => {
        console.log(`  ${domain}: ${paths.size} unique paths`);
        if (domain.includes('tryotter.com')) {
          console.log('    Paths:', Array.from(paths).slice(0, 10).join(', '));
        }
      });
      
      console.log('\n💡 TIP: If you see tryotter.com paths above, we\'re capturing them!');
      console.log('Full findings object:', findings);
      
      return findings;
    }
  }
  
  // Create global instance immediately
  try {
    console.log('[NetworkMonitor] Creating global instance...');
    window.otterNetworkMonitor = new NetworkMonitor();
    console.log('[NetworkMonitor] Global instance created successfully');
    
    // Start monitoring immediately
    window.otterNetworkMonitor.startMonitoring();
    window.otterNetworkMonitor.enableDebugMode();
    console.log('[NetworkMonitor] Monitoring started automatically');
  } catch (error) {
    console.error('[NetworkMonitor] Failed to create instance:', error);
    // Create a stub so other code doesn't crash
    window.otterNetworkMonitor = {
      startMonitoring: () => console.warn('NetworkMonitor not available'),
      stopMonitoring: () => console.warn('NetworkMonitor not available'),
      toggleVerboseMode: () => false,
      exportFindings: () => ({ error: 'NetworkMonitor failed to initialize' }),
      isMonitoring: false,
      error: error.message
    };
  }

  // ----- content/orderCache.js -----
  console.log('[OrderCache.js] Script loaded at:', new Date().toISOString());
  
  class OrderCache {
    constructor() {
      this.apiResponses = new Map(); // URL -> response data
      this.orderDetails = new Map(); // orderId -> order details
      this.itemSizes = new Map(); // itemId -> size info
      this.discoveryMode = true; // Log everything for analysis
      this.knownEndpoints = new Set();
      
      console.log('[OrderCache] Initialized');
    }
  
    storeApiResponse(url, data, timestamp) {
      console.log('[OrderCache] Storing API response from:', url);
      
      // Store raw response
      this.apiResponses.set(url, {
        data: data,
        timestamp: timestamp,
        url: url
      });
      
      // Track endpoint
      try {
        const urlObj = new URL(url);
        this.knownEndpoints.add(urlObj.pathname);
      } catch (e) {
        // Invalid URL
      }
      
      // Try to extract order information
      this.extractOrderData(data, url);
      
      if (this.discoveryMode) {
        console.log('[OrderCache] Response stored. Total responses:', this.apiResponses.size);
      }
    }
  
    extractOrderData(data, sourceUrl) {
      // Handle arrays of orders
      if (Array.isArray(data)) {
        console.log(`[OrderCache] Processing array of ${data.length} items from ${sourceUrl}`);
        data.forEach(item => this.tryExtractOrder(item));
        return;
      }
      
      // Handle single order
      if (typeof data === 'object' && data !== null) {
        // Check for Otter-specific structure (customerOrder)
        if (data.customerOrder) {
          console.log('[OrderCache] Found Otter customerOrder structure!');
          this.extractOtterOrder(data);
          return;
        }
        
        // Check if it's a wrapper object
        if (data.orders && Array.isArray(data.orders)) {
          console.log(`[OrderCache] Found orders array with ${data.orders.length} orders`);
          data.orders.forEach(order => this.tryExtractOrder(order));
        } else if (data.data && typeof data.data === 'object') {
          this.extractOrderData(data.data, sourceUrl);
        } else {
          this.tryExtractOrder(data);
        }
      }
    }
  
    tryExtractOrder(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      // Look for order-like fields
      const orderId = this.findOrderId(obj);
      if (!orderId) return;
      
      const orderInfo = {
        id: orderId,
        customerName: this.findCustomerName(obj),
        orderNumber: this.findOrderNumber(obj),
        items: this.findItems(obj),
        total: this.findTotal(obj),
        timestamp: Date.now(),
        raw: obj // Keep raw data for analysis
      };
      
      if (orderInfo.items.length > 0 || orderInfo.customerName || orderInfo.orderNumber) {
        this.orderDetails.set(orderId, orderInfo);
        
        if (this.discoveryMode) {
          console.log('[OrderCache] Extracted order:', {
            id: orderId,
            customer: orderInfo.customerName,
            itemCount: orderInfo.items.length,
            hasSize: orderInfo.items.some(item => item.size && item.size !== 'no-size')
          });
        }
        
        // Store item sizes
        orderInfo.items.forEach(item => {
          if (item.id && item.size && item.size !== 'no-size') {
            this.itemSizes.set(item.id, item.size);
          }
        });
      }
    }
  
    extractOtterOrder(data) {
      // Extract from Otter-specific customerOrder structure
      const co = data.customerOrder;
      if (!co) return;
      
      console.log('[OrderCache] Extracting Otter order structure');
      
      // Extract basic order info
      const orderId = co.id || co.uuid || co.orderId || data.id;
      const orderNumber = co.displayId || co.orderNumber || co.number;
      const customerName = co.customerName || co.customer?.name || co.recipientName;
      
      // Extract items from customerItemsContainer
      const items = [];
      if (co.customerItemsContainer?.items) {
        const itemsData = co.customerItemsContainer.items;
        const modifiersData = co.customerItemsContainer.modifiers || {};
        
        // Process each item
        for (const item of itemsData) {
          const itemInfo = {
            id: item.id,
            name: item.name || item.itemName,
            quantity: item.quantity || 1,
            price: item.price || item.totalPrice,
            size: 'no-size', // Default, will be updated from modifiers
            modifiers: []
          };
          
          // Look for size in modifiers
          if (item.modifierCustomerItemIds) {
            for (const modId of item.modifierCustomerItemIds) {
              const modifier = modifiersData[modId];
              if (modifier) {
                const modName = modifier.name || '';
                // Check if this is a size modifier
                if (modName.match(/^(Small|Medium|Large)$/i)) {
                  itemInfo.size = modName.toLowerCase();
                } else {
                  itemInfo.modifiers.push({
                    name: modName,
                    price: modifier.price
                  });
                }
              }
            }
          }
          
          items.push(itemInfo);
        }
      }
      
      // Store the order
      if (orderId && items.length > 0) {
        const orderInfo = {
          id: orderId,
          customerName: customerName,
          orderNumber: orderNumber,
          items: items,
          total: co.total || co.totalPrice,
          timestamp: Date.now(),
          raw: data,
          source: 'otter-api'
        };
        
        this.orderDetails.set(orderId, orderInfo);
        console.log('[OrderCache] Stored Otter order:', {
          id: orderId,
          number: orderNumber,
          customer: customerName,
          itemCount: items.length,
          itemsWithSizes: items.filter(i => i.size !== 'no-size').length
        });
      }
    }
  
    findOrderId(obj) {
      // Common order ID field names
      const idFields = ['id', 'orderId', 'order_id', 'uuid', '_id', 'orderUuid', 'order_uuid'];
      
      for (const field of idFields) {
        if (obj[field]) {
          return String(obj[field]);
        }
      }
      return null;
    }
  
    findCustomerName(obj) {
      // Common customer name fields
      const nameFields = ['customerName', 'customer_name', 'name', 'customer', 'recipientName', 'recipient_name'];
      
      for (const field of nameFields) {
        if (obj[field]) {
          if (typeof obj[field] === 'string') {
            return obj[field];
          } else if (obj[field].name) {
            return obj[field].name;
          }
        }
      }
      
      // Check nested customer object
      if (obj.customer && typeof obj.customer === 'object') {
        return this.findCustomerName(obj.customer);
      }
      
      return null;
    }
  
    findOrderNumber(obj) {
      const numberFields = ['orderNumber', 'order_number', 'number', 'displayId', 'display_id', 'orderDisplayId'];
      
      for (const field of numberFields) {
        if (obj[field]) {
          return String(obj[field]);
        }
      }
      return null;
    }
  
    findItems(obj) {
      const items = [];
      
      // Common item field names
      const itemFields = ['items', 'orderItems', 'order_items', 'lineItems', 'line_items', 'products'];
      
      for (const field of itemFields) {
        if (obj[field] && Array.isArray(obj[field])) {
          obj[field].forEach(item => {
            const extractedItem = this.extractItemInfo(item);
            if (extractedItem) {
              items.push(extractedItem);
            }
          });
          break;
        }
      }
      
      return items;
    }
  
    extractItemInfo(item) {
      if (!item || typeof item !== 'object') return null;
      
      const info = {
        id: item.id || item.itemId || item.item_id || item.uuid,
        name: item.name || item.itemName || item.item_name || item.title || item.productName || item.product_name,
        quantity: item.quantity || item.qty || item.count || 1,
        price: item.price || item.amount || item.cost,
        size: this.findItemSize(item),
        modifiers: this.findModifiers(item)
      };
      
      // Only return if we have at least a name
      return info.name ? info : null;
    }
  
    findItemSize(item) {
      // Direct size fields
      const sizeFields = ['size', 'variant', 'variation', 'option', 'selectedSize', 'selected_size'];
      
      for (const field of sizeFields) {
        if (item[field]) {
          if (typeof item[field] === 'string') {
            return item[field];
          } else if (item[field].name || item[field].value) {
            return item[field].name || item[field].value;
          }
        }
      }
      
      // Check modifiers for size
      if (item.modifiers && Array.isArray(item.modifiers)) {
        const sizeModifier = item.modifiers.find(mod => 
          mod.name && mod.name.toLowerCase().includes('size')
        );
        if (sizeModifier && sizeModifier.value) {
          return sizeModifier.value;
        }
      }
      
      // Check options
      if (item.options && Array.isArray(item.options)) {
        const sizeOption = item.options.find(opt => 
          opt.name && opt.name.toLowerCase().includes('size')
        );
        if (sizeOption && sizeOption.value) {
          return sizeOption.value;
        }
      }
      
      return null;
    }
  
    findModifiers(item) {
      const modifiers = [];
      
      // Common modifier field names
      const modifierFields = ['modifiers', 'options', 'additions', 'customizations'];
      
      for (const field of modifierFields) {
        if (item[field] && Array.isArray(item[field])) {
          item[field].forEach(mod => {
            if (mod.name || mod.label) {
              modifiers.push({
                name: mod.name || mod.label,
                value: mod.value || mod.option || mod.selection
              });
            }
          });
        }
      }
      
      return modifiers;
    }
  
    findTotal(obj) {
      const totalFields = ['total', 'totalAmount', 'total_amount', 'grandTotal', 'grand_total', 'price'];
      
      for (const field of totalFields) {
        if (obj[field]) {
          return obj[field];
        }
      }
      return null;
    }
  
    getOrderDetails(orderId) {
      return this.orderDetails.get(orderId);
    }
  
    getItemSize(itemId) {
      return this.itemSizes.get(itemId);
    }
  
    getSizeForItem(itemName, orderContext = null) {
      // Try to find size based on item name and order context
      if (!itemName) return null;
      
      // First, try exact item ID match
      if (orderContext && orderContext.items) {
        const item = orderContext.items.find(i => 
          i.name && i.name.toLowerCase() === itemName.toLowerCase()
        );
        if (item && item.size) {
          return item.size;
        }
      }
      
      // Search through all cached orders for this item
      for (const [orderId, order] of this.orderDetails) {
        const item = order.items.find(i => 
          i.name && i.name.toLowerCase() === itemName.toLowerCase()
        );
        if (item && item.size && item.size !== 'no-size') {
          return item.size;
        }
      }
      
      return null;
    }
    
    findMatchingOrder(domOrder) {
      // Try to find a cached order that matches the DOM order
      if (!domOrder) return null;
      
      // Try to match by order number
      if (domOrder.number) {
        for (const [orderId, cachedOrder] of this.orderDetails) {
          if (cachedOrder.orderNumber === domOrder.number ||
              cachedOrder.orderNumber === domOrder.number.replace('#', '') ||
              '#' + cachedOrder.orderNumber === domOrder.number) {
            console.log(`[OrderCache] Found match by order number: ${domOrder.number}`);
            return cachedOrder;
          }
        }
      }
      
      // Try to match by customer name and item count
      if (domOrder.customerName && domOrder.items) {
        for (const [orderId, cachedOrder] of this.orderDetails) {
          if (cachedOrder.customerName && 
              cachedOrder.customerName.toLowerCase() === domOrder.customerName.toLowerCase() &&
              cachedOrder.items.length === domOrder.items.length) {
            console.log(`[OrderCache] Found match by customer name and item count: ${domOrder.customerName}`);
            return cachedOrder;
          }
        }
      }
      
      // Try fuzzy match by customer name similarity
      if (domOrder.customerName) {
        for (const [orderId, cachedOrder] of this.orderDetails) {
          if (cachedOrder.customerName && 
              this.isSimilarName(cachedOrder.customerName, domOrder.customerName)) {
            console.log(`[OrderCache] Found fuzzy match by customer name: ${domOrder.customerName} ~ ${cachedOrder.customerName}`);
            return cachedOrder;
          }
        }
      }
      
      return null;
    }
    
    isSimilarName(name1, name2) {
      // Simple similarity check
      const clean1 = name1.toLowerCase().trim();
      const clean2 = name2.toLowerCase().trim();
      
      // Exact match
      if (clean1 === clean2) return true;
      
      // One contains the other
      if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
      
      // First name match
      const first1 = clean1.split(' ')[0];
      const first2 = clean2.split(' ')[0];
      if (first1 === first2 && first1.length > 2) return true;
      
      return false;
    }
    
    getCache() {
      return Object.fromEntries(this.orderDetails);
    }
    
    getAllOrders() {
      // Return all cached orders as an array
      return Array.from(this.orderDetails.values());
    }
    
    hasOrders() {
      return this.orderDetails.size > 0;
    }
    
    getOrderCount() {
      return this.orderDetails.size;
    }
  
    getDiscoveryReport() {
      const report = {
        knownEndpoints: Array.from(this.knownEndpoints),
        totalResponses: this.apiResponses.size,
        ordersWithDetails: this.orderDetails.size,
        itemsWithSizes: this.itemSizes.size,
        orderSummaries: []
      };
      
      // Add sample order summaries
      let count = 0;
      for (const [orderId, order] of this.orderDetails) {
        if (count++ >= 5) break; // Only show first 5
        
        report.orderSummaries.push({
          id: orderId,
          customer: order.customerName,
          itemCount: order.items.length,
          itemsWithSize: order.items.filter(i => i.size && i.size !== 'no-size').length
        });
      }
      
      // Add sample order structure if available
      if (this.orderDetails.size > 0) {
        const [firstOrderId, firstOrder] = this.orderDetails.entries().next().value;
        report.sampleOrder = {
          id: firstOrderId,
          structure: this.getObjectStructure(firstOrder.raw)
        };
      }
      
      return report;
    }
  
    getObjectStructure(obj, depth = 0, maxDepth = 3) {
      if (depth > maxDepth || !obj) return '...';
      
      if (Array.isArray(obj)) {
        return obj.length > 0 ? [`[${obj.length}] ` + this.getObjectStructure(obj[0], depth + 1, maxDepth)] : '[]';
      }
      
      if (typeof obj !== 'object') {
        return typeof obj;
      }
      
      const structure = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          structure[key] = this.getObjectStructure(obj[key], depth + 1, maxDepth);
        }
      }
      
      return structure;
    }
  
    clear() {
      this.apiResponses.clear();
      this.orderDetails.clear();
      this.itemSizes.clear();
      this.knownEndpoints.clear();
      console.log('[OrderCache] Cleared all cached data');
    }
  }
  
  // Create global instance immediately
  try {
    console.log('[OrderCache] Creating global instance...');
    window.otterOrderCache = new OrderCache();
    console.log('[OrderCache] Global instance created successfully');
  } catch (error) {
    console.error('[OrderCache] Failed to create instance:', error);
    // Create a stub so other code doesn't crash
    window.otterOrderCache = {
      storeApiResponse: () => console.warn('OrderCache not available'),
      getOrderDetails: () => null,
      findMatchingOrder: () => null,
      getDiscoveryReport: () => ({ error: 'OrderCache failed to initialize' }),
      clear: () => console.warn('OrderCache not available'),
      error: error.message
    };
  }

  // ----- content/reactDataExtractor.js -----
  console.log('[ReactDataExtractor.js] Script loaded at:', new Date().toISOString());
  
  // React Data Extractor for Otter Order Consolidator
  // Extracts order data directly from React component props
  
  class ReactDataExtractor {
    constructor() {
      this.enabled = true;
      this.debug = false;
      this.pageContextInjected = false;
      this.extractionTimeout = null;
    }
  
    enable() {
      this.enabled = true;
      console.log('[ReactDataExtractor] Enabled');
    }
  
    disable() {
      this.enabled = false;
      console.log('[ReactDataExtractor] Disabled');
    }
  
    enableDebug() {
      this.debug = true;
      console.log('[ReactDataExtractor] Debug mode enabled');
    }
    
    findReactFiber(element) {
      if (!element) return null;
      
      // Get all keys from the element
      const allKeys = Object.keys(element);
      
      // Look specifically for keys starting with __react (matching user's working pattern)
      const reactKeys = allKeys.filter(key => key.startsWith('__react'));
      
      if (this.debug && allKeys.length > 0) {
        console.log('[ReactDataExtractor] Element keys:', allKeys);
        console.log('[ReactDataExtractor] React keys found:', reactKeys);
      }
      
      // Return the first React fiber found
      if (reactKeys.length > 0) {
        const fiber = element[reactKeys[0]];
        if (this.debug) {
          console.log('[ReactDataExtractor] Found React fiber at key:', reactKeys[0]);
        }
        return fiber;
      }
      
      if (this.debug) {
        console.log('[ReactDataExtractor] No React fiber found on element');
      }
      
      return null;
    }
  
    // Inject page context script if not already done
    injectPageContextScript() {
      if (this.pageContextInjected) return;
      
      console.log('[ReactDataExtractor] Injecting page context script...');
      
      const script = document.createElement('script');
      script.textContent = `
// This script is injected into the page context to access React internals directly
// It communicates with the content script via custom events

(function() {
console.log('[PageContextExtractor] Injected into page context');

// Check if React is ready on the page
function isReactReady() {
  const orderRows = document.querySelectorAll('[data-testid="order-row"]');
  if (orderRows.length === 0) return false;
  
  // Check if at least one row has React fiber
  for (const row of orderRows) {
    const keys = Object.keys(row);
    const hasReactFiber = keys.some(k => 
      k.startsWith('__reactFiber$') || 
      k.startsWith('__reactInternalInstance$') ||
      k.startsWith('__react')
    );
    if (hasReactFiber) return true;
  }
  
  return false;
}

// Function to extract orders from React (runs in page context)
// Based on user's working function that finds data at depth 2
function extractOrdersFromReact() {
  console.log('[PageContextExtractor] Starting React extraction in page context');
  
  const orderRows = document.querySelectorAll('[data-testid="order-row"]');
  console.log(\`[PageContextExtractor] Found \${orderRows.length} order rows\`);
  
  if (orderRows.length === 0) {
    console.log('[PageContextExtractor] No order rows found');
    return [];
  }
  
  const orders = [];
  
  orderRows.forEach((row, index) => {
    console.log(\`\\n--- Extracting Order \${index} ---\`);
    try {
      // Get all properties of the element
      const keys = Object.keys(row);
      console.log(\`Row \${index} keys:\`, keys);
      
      // Find React fiber keys - match any React internal key pattern
      const reactKeys = keys.filter(k => 
        k.startsWith('__react') ||
        k.startsWith('__reactFiber$') ||
        k.startsWith('__reactInternalInstance$')
      );
      console.log(\`Row \${index} React keys found:\`, reactKeys);
      
      if (reactKeys.length === 0) {
        console.log(\`No React keys found on row \${index}\`);
        return;
      }
      
      // Get the first React fiber key (matching user's approach)
      const fiber = row[reactKeys[0]];
      if (!fiber) {
        console.log(\`No fiber found for row \${index}\`);
        return;
      }
      
      // Navigate up the fiber tree - user's function finds data at depth 2
      let current = fiber;
      let depth = 0;
      let orderData = null;
      
      // Look for order prop at various depths (matching user's working function)
      while (current && depth < 10) {
        console.log(\`Depth \${depth}: checking memoizedProps...\`, current.memoizedProps ? Object.keys(current.memoizedProps) : 'no memoizedProps');
        
        if (current.memoizedProps && current.memoizedProps.order) {
          orderData = current.memoizedProps.order;
          console.log(\`Found order data at depth \${depth}!\`);
          break;
        }
        current = current.return;
        depth++;
      }
      
      if (orderData) {
        console.log('Order object:', orderData);
        
        // Check if orderData has customerOrder property (the actual API structure)
        const hasCustomerOrder = orderData.customerOrder && typeof orderData.customerOrder === 'object';
        const co = hasCustomerOrder ? orderData.customerOrder : orderData;
        
        console.log('Has customerOrder property:', hasCustomerOrder);
        
        // Extract order ID - it's at customerOrder.orderId.id
        let orderId = 'unknown';
        if (co.orderId && co.orderId.id) {
          orderId = co.orderId.id;
        } else if (co.id) {
          orderId = typeof co.id === 'object' && co.id.id ? co.id.id : co.id;
        }
        console.log('Order ID:', orderId);
        
        // Extract order number from orderIdentifier.displayId
        let orderNumber = 'unknown';
        if (co.orderIdentifier && co.orderIdentifier.displayId) {
          orderNumber = co.orderIdentifier.displayId;
        } else if (co.externalOrderIdentifier && co.externalOrderIdentifier.displayId) {
          orderNumber = co.externalOrderIdentifier.displayId;
        } else if (co.externalOrderId && co.externalOrderId.displayId) {
          orderNumber = co.externalOrderId.displayId;
        } else if (orderData.orderNumber) {
          orderNumber = orderData.orderNumber;
        } else if (orderData.displayId) {
          orderNumber = orderData.displayId;
        }
        console.log('Order Number:', orderNumber);
        
        // Extract restaurant/store name
        let restaurantName = 'Unknown Restaurant';
        if (co.store && co.store.name) {
          restaurantName = co.store.name;
        } else if (co.storeName) {
          restaurantName = co.storeName;
        } else if (co.brand && co.brand.name) {
          restaurantName = co.brand.name;
        } else if (co.brandName) {
          restaurantName = co.brandName;
        } else if (co.merchant && co.merchant.name) {
          restaurantName = co.merchant.name;
        } else if (co.merchantName) {
          restaurantName = co.merchantName;
        } else if (co.restaurant && co.restaurant.name) {
          restaurantName = co.restaurant.name;
        } else if (co.restaurantName) {
          restaurantName = co.restaurantName;
        }
        console.log('Restaurant:', restaurantName);
        
        // Extract order status/state
        let orderStatus = 'UNKNOWN';
        if (co.state) {
          orderStatus = co.state;
        } else if (co.status) {
          orderStatus = co.status;
        } else if (co.orderState) {
          orderStatus = co.orderState;
        } else if (co.order && co.order.state) {
          orderStatus = co.order.state;
        } else if (orderData.state) {
          orderStatus = orderData.state;
        } else if (orderData.status) {
          orderStatus = orderData.status;
        }
        console.log('Order Status:', orderStatus);
        
        // Extract orderedAt timestamp
        let orderedAt = null;
        if (co.orderedAt) {
          orderedAt = co.orderedAt;
        } else if (co.createdAt) {
          orderedAt = co.createdAt;
        } else if (co.timestamp) {
          orderedAt = co.timestamp;
        } else if (co.orderDate) {
          orderedAt = co.orderDate;
        } else if (orderData.orderedAt) {
          orderedAt = orderData.orderedAt;
        } else if (orderData.createdAt) {
          orderedAt = orderData.createdAt;
        }
        console.log('Ordered At:', orderedAt);
        
        // Extract customer name from customer.displayName
        let customerName = 'Unknown';
        if (co.customer && co.customer.displayName) {
          customerName = co.customer.displayName;
        } else if (co.customer && (co.customer.firstName || co.customer.lastName)) {
          customerName = \`\${co.customer.firstName || ''} \${co.customer.lastName || ''}\`.trim();
        } else if (orderData.customerName) {
          customerName = orderData.customerName;
        } else if (orderData.customer && orderData.customer.name) {
          customerName = orderData.customer.name;
        }
        console.log('Customer:', customerName);
        
        // Extract order notes/instructions that might contain recipient names
        let orderNotes = '';
        let recipientName = '';
        
        // Check various possible locations for notes
        const noteSources = [
          co.deliveryInstructions,
          co.specialInstructions,
          co.notes,
          co.customerNotes,
          co.orderNotes,
          co.deliveryNotes,
          co.customer?.notes,
          co.additionalInfo,
          co.instructions,
          co.recipientNotes
        ];
        
        for (const source of noteSources) {
          if (source && typeof source === 'string' && source.trim()) {
            orderNotes = source.trim();
            console.log('Found order notes:', orderNotes);
            break;
          }
        }
        
        // Try to extract recipient name from notes if they follow common patterns
        if (orderNotes) {
          // Common patterns: "For: Name", "Deliver to: Name", "Name:", "To: Name"
          const namePatterns = [
            /(?:for|deliver to|to|name):\\s*([^,\\n]+)/i,
            /^([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s*$/m, // Name on its own line
            /(?:pick\\s*up|pickup).*?([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)/i
          ];
          
          for (const pattern of namePatterns) {
            const match = orderNotes.match(pattern);
            if (match && match[1]) {
              recipientName = match[1].trim();
              console.log('Extracted recipient name from notes:', recipientName);
              break;
            }
          }
        }
        
        // Extract wait time if available
        let waitTime = 0;
        if (co.confirmationInfo && co.confirmationInfo.estimatedPrepTimeMinutes) {
          waitTime = co.confirmationInfo.estimatedPrepTimeMinutes;
        } else if (co.stationOrders && co.stationOrders[0] && co.stationOrders[0].stationPrepInfo) {
          // Extract from estimatedPrepTime (format: "516.281372784s")
          const prepTimeStr = co.stationOrders[0].stationPrepInfo.estimatedPrepTime;
          if (prepTimeStr && prepTimeStr.endsWith('s')) {
            const seconds = parseFloat(prepTimeStr.slice(0, -1));
            waitTime = Math.round(seconds / 60); // Convert to minutes
          }
        }
        
        // Extract items from customerItemsContainer if available
        const items = [];
        if (co.customerItemsContainer) {
          console.log('Found customerItemsContainer!');
          const itemsArray = co.customerItemsContainer.items || [];
          const modifiersMap = co.customerItemsContainer.modifiers || {};
          
          console.log(\`Processing \${itemsArray.length} items with modifiers map\`);
          console.log(\`Modifiers map has \${Object.keys(modifiersMap).length} entries\`);
          
          // Debug: Log first few modifiers to see their structure
          const modifierKeys = Object.keys(modifiersMap);
          if (modifierKeys.length > 0) {
            console.log(\`[MODIFIER MAP SAMPLE] First modifier:\`, {
              id: modifierKeys[0],
              data: modifiersMap[modifierKeys[0]]
            });
          }
          
          // Also get modifiers from stationOrders for section names
          let stationModifiers = {};
          if (co.stationOrders && co.stationOrders[0] && 
              co.stationOrders[0].menuReconciledItemsContainer &&
              co.stationOrders[0].menuReconciledItemsContainer.modifiers) {
            stationModifiers = co.stationOrders[0].menuReconciledItemsContainer.modifiers;
          }
          
          itemsArray.forEach((item, idx) => {
            if (item.orderItemDetail) {
              const itemDetail = item.orderItemDetail;
              const itemName = itemDetail.name || 'Unknown Item';
              const quantity = itemDetail.quantity || 1;
              let itemNote = '';
              
              // Extract item-level note if available
              if (itemDetail.note) {
                itemNote = itemDetail.note;
                console.log(\`Found note for \${itemName}: \${itemNote}\`);
              }
              
              let size = 'no-size';
              let sizeModifiers = []; // Collect ALL size-related modifiers
              const additionalItems = []; // Track items that should be extracted separately
              const modifierDetails = {}; // Store detailed modifier info like dumplingChoice
              const modifiersList = []; // Array of modifier objects
              
              // Check if Urban Bowl first
              if (itemName.toLowerCase().includes('urban bowl')) {
                size = 'urban';
                modifierDetails.riceSubstitution = 'White Rice'; // Default
                modifierDetails.dumplingChoice = null;
                console.log(\`Detected Urban Bowl: \${itemName} - set size to 'urban'\`);
              }
              
              // Look for size in modifiers
              console.log(\`Item has modifierCustomerItemIds: \${!!item.modifierCustomerItemIds}, count: \${item.modifierCustomerItemIds ? item.modifierCustomerItemIds.length : 0}\`);
              if (item.modifierCustomerItemIds && size !== 'urban') {
                console.log(\`Checking \${item.modifierCustomerItemIds.length} modifiers for \${itemName}\`);
                
                item.modifierCustomerItemIds.forEach(modId => {
                  const modifier = modifiersMap[modId];
                  const stationMod = stationModifiers[modId];
                  
                  console.log(\`Checking modifier ID \${modId}, found in map: \${!!modifier}\`);
                  
                  // Check if this is an additional item based on section
                  if (stationMod && stationMod.sectionName) {
                    const sectionName = stationMod.sectionName.toLowerCase();
                    const modName = stationMod.stationItemDetail ? 
                      stationMod.stationItemDetail.name : 
                      (modifier && modifier.orderItemDetail ? modifier.orderItemDetail.name : '');
                    
                    console.log(\`  Station modifier section: "\${stationMod.sectionName}", item: "\${modName}"\`);
                    
                    // Extra debug for dumpling sections
                    if (sectionName.includes('dumpling') || modName.toLowerCase().includes('dumpling')) {
                      console.log(\`  [DUMPLING DEBUG] Section: "\${sectionName}", Item: "\${modName}", ItemName: "\${itemName}"\`);
                    }
                    
                    // Check for Rice Bowl sauce modifiers
                    if (itemName.toLowerCase().includes('rice bowl') && 
                        (sectionName.includes('top steak with our signature sauces') || 
                         sectionName.includes('top salmon with our signature sauces'))) {
                      // This is a sauce choice for Rice Bowl
                      modifierDetails.sauce = modName;
                      modifiersList.push({ name: modName, integrated: true });
                      console.log(\`  Rice Bowl sauce detected: "\${modName}"\`);
                    }
                    // Check for Urban Bowl dumplings
                    else if (itemName.toLowerCase().includes('urban bowl') && 
                        (sectionName.includes('choice of 3 piece dumplings') || 
                         sectionName.includes('3 piece dumpling') ||
                         sectionName.includes('3-piece dumpling') ||
                         sectionName.includes('3pc dumpling') ||
                         sectionName.includes('dumpling') ||
                         modName.toLowerCase().includes('dumpling'))) {
                      // This is a dumpling choice for Urban Bowl
                      modifierDetails.dumplingChoice = modName;
                      modifiersList.push({ name: modName, integrated: true });
                      console.log(\`  Urban Bowl dumpling choice detected: "\${modName}"\`);
                    }
                    // Check if this should be a separate item
                    else if (sectionName.includes('add') || 
                        sectionName.includes('side') || 
                        sectionName.includes('drink') || 
                        sectionName.includes('dessert') ||
                        sectionName.includes('bao-nut') ||
                        modName.toLowerCase().includes('bao-nut') ||
                        modName.toLowerCase().includes('tea') ||
                        modName.toLowerCase().includes('cinnamon sugar')) {
                      // This is an additional item, not a size modifier
                      if (modName) {
                        additionalItems.push(modName);
                        console.log(\`  Marked as additional item: "\${modName}"\`);
                      }
                    } else {
                      // This is a size modifier or other integrated modifier
                      if (modName && !sizeModifiers.includes(modName)) {
                        // Check for rice substitution in Urban Bowl
                        if (itemName.toLowerCase().includes('urban bowl') && 
                            (modName.toLowerCase().includes('fried rice') || 
                             modName.toLowerCase().includes('noodle'))) {
                          modifierDetails.riceSubstitution = modName;
                          modifiersList.push({ name: modName, integrated: true });
                          console.log(\`  Urban Bowl rice substitution: "\${modName}"\`);
                        } else {
                          sizeModifiers.push(modName);
                          console.log(\`  Added as size modifier: "\${modName}"\`);
                        }
                      }
                    }
                  } else if (modifier && modifier.orderItemDetail) {
                    const modName = modifier.orderItemDetail.name || '';
                    const modNameLower = modName.toLowerCase();
                    console.log(\`  Modifier name: "\${modName}"\`);
                    
                    // Check for Rice Bowl sauce (no section)
                    if (itemName.toLowerCase().includes('rice bowl') && 
                        (modNameLower.includes('sauce') || modNameLower.includes('aioli'))) {
                      modifierDetails.sauce = modName;
                      modifiersList.push({ name: modName, integrated: true });
                      console.log(\`  Rice Bowl sauce (no section): "\${modName}"\`);
                    }
                    // Check for Urban Bowl dumplings
                    else if (itemName.toLowerCase().includes('urban bowl') && 
                        modNameLower.includes('dumpling')) {
                      modifierDetails.dumplingChoice = modName;
                      modifiersList.push({ name: modName, integrated: true });
                      console.log(\`  Urban Bowl dumpling choice (no section): "\${modName}"\`);
                    }
                    // Check for Urban Bowl rice substitution
                    else if (itemName.toLowerCase().includes('urban bowl') && 
                             (modNameLower.includes('fried rice') || 
                              modNameLower.includes('noodle'))) {
                      modifierDetails.riceSubstitution = modName;
                      modifiersList.push({ name: modName, integrated: true });
                      console.log(\`  Urban Bowl rice substitution (no section): "\${modName}"\`);
                    }
                    // Only add as size modifier if it's actually about size/rice
                    else if (modNameLower.includes('small') || 
                        modNameLower.includes('large') || 
                        modNameLower.includes('rice') || 
                        modNameLower.includes('noodle')) {
                      sizeModifiers.push(modName);
                      console.log(\`Added to size modifiers: \${modName}\`);
                    } else {
                      // Otherwise it might be an additional item
                      additionalItems.push(modName);
                      console.log(\`Added as additional item: \${modName}\`);
                    }
                  }
                });
                
                // Process collected modifiers to determine size
                console.log(\`Collected size modifiers for \${itemName}:\`, sizeModifiers);
                
                if (sizeModifiers.length > 0) {
                  // Look for base size first
                  const baseSize = sizeModifiers.find(m => 
                    m.toLowerCase() === 'small' || 
                    m.toLowerCase() === 'large'
                  );
                  
                  // Look for any rice/noodle substitution
                  const substitution = sizeModifiers.find(m => {
                    const lower = m.toLowerCase();
                    return lower.includes('rice') || 
                           lower.includes('noodle') || 
                           lower.includes('stir fry');
                  });
                  
                  if (baseSize && substitution) {
                    // Combine them exactly as they are
                    size = \`\${baseSize.toLowerCase()} - \${substitution.toLowerCase()}\`;
                    console.log(\`Combined size: \${size}\`);
                  } else if (baseSize) {
                    // Just the base size
                    size = baseSize.toLowerCase();
                    console.log(\`Using base size: \${size}\`);
                  } else if (sizeModifiers.length === 1) {
                    // If we only have one modifier, use it as-is
                    size = sizeModifiers[0].toLowerCase();
                    console.log(\`Using single modifier as size: \${size}\`);
                  } else {
                    // Multiple modifiers but no clear base size - join them
                    size = sizeModifiers.join(' - ').toLowerCase();
                    console.log(\`Joining all modifiers: \${size}\`);
                  }
                }
              }
              
              items.push({
                name: itemName,
                quantity: quantity,
                size: size,
                note: itemNote,
                isRiceBowl: itemName.toLowerCase().includes('rice bowl'),
                isUrbanBowl: itemName.toLowerCase().includes('urban bowl'),
                modifiers: modifiersList,
                modifierDetails: modifierDetails,
                // Add top-level properties for tags
                dumplingType: modifierDetails.dumplingChoice || null,
                riceSubType: modifierDetails.riceSubstitution || null,
                sauceType: modifierDetails.sauce || null // Populated from sauce modifiers
              });
              
              // Debug log for Urban Bowls
              if (itemName.toLowerCase().includes('urban bowl')) {
                console.log(\`[PageContext] Urban Bowl item pushed with modifierDetails:\`, modifierDetails);
                console.log(\`[PageContext] Urban Bowl top-level properties:\`, {
                  dumplingType: modifierDetails.dumplingChoice || null,
                  riceSubType: modifierDetails.riceSubstitution || null
                });
              }
              
              // Debug log for Rice Bowls
              if (itemName.toLowerCase().includes('rice bowl')) {
                console.log(\`[PageContext] Rice Bowl item pushed with modifierDetails:\`, modifierDetails);
                console.log(\`[PageContext] Rice Bowl top-level properties:\`, {
                  sauceType: modifierDetails.sauce || null,
                  riceSubType: modifierDetails.riceSubstitution || null
                });
              }
              
              console.log(\`Item \${idx + 1}: \${itemName} (\${size}) x\${quantity}\`);
              
              // Add any additional items that were found
              if (additionalItems && additionalItems.length > 0) {
                console.log(\`Adding \${additionalItems.length} additional items from modifiers\`);
                additionalItems.forEach(additionalItemName => {
                  items.push({
                    name: additionalItemName,
                    quantity: 1,
                    size: 'no-size'
                  });
                  console.log(\`Added additional item: \${additionalItemName}\`);
                });
              }
            }
          });
        } else {
          // Try simpler structure from user's example
          const simpleItems = co.items || co.orderItems || co.lineItems || [];
          console.log(\`Found \${simpleItems.length} items in simple structure\`);
          
          simpleItems.forEach((item, idx) => {
            const itemName = item.name || item.itemName || item.title || 'Unknown Item';
            const quantity = item.quantity || item.qty || 1;
            let size = item.size || item.variant || item.option || 'no-size';
            const itemNote = item.note || item.notes || item.specialInstructions || '';
            
            // Check if Urban Bowl
            if (itemName.toLowerCase().includes('urban bowl')) {
              size = 'urban';
            }
            
            const modifierDetails = {};
            const modifiersList = [];
            
            // Initialize modifierDetails based on item type
            if (itemName.toLowerCase().includes('urban bowl')) {
              modifierDetails.riceSubstitution = 'White Rice';
              modifierDetails.dumplingChoice = null;
            } else if (itemName.toLowerCase().includes('rice bowl')) {
              modifierDetails.sauce = null;
              modifierDetails.riceSubstitution = null;
            }
            
            items.push({
              name: itemName,
              quantity: quantity,
              size: size,
              note: itemNote,
              isRiceBowl: itemName.toLowerCase().includes('rice bowl'),
              isUrbanBowl: itemName.toLowerCase().includes('urban bowl'),
              modifiers: modifiersList,
              modifierDetails: modifierDetails,
              // Add top-level properties for tags
              dumplingType: modifierDetails.dumplingChoice || null,
              riceSubType: modifierDetails.riceSubstitution || null,
              sauceType: modifierDetails.sauce || null // Populated from sauce modifiers
            });
            
            console.log(\`Item \${idx + 1}: \${itemName} (\${size}) x\${quantity}\`);
          });
        }
        
        const order = {
          id: orderId,
          customerName: customerName,
          orderNumber: orderNumber,
          waitTime: waitTime,
          items: items,
          orderNotes: orderNotes,
          recipientName: recipientName || customerName, // Use recipient name if found, otherwise customer name
          restaurantName: restaurantName,
          orderStatus: orderStatus,
          orderedAt: orderedAt,
          source: hasCustomerOrder ? 'react-customerOrder' : 'react-simple'
        };
        
        console.log('Created order object:', order);
        console.log(\`Extracted \${items.length} items with sizes\`);
        
        // Store for later use
        orders.push(order);
        console.log(\`Successfully extracted order \${index}: \${orderNumber} (\${order.items.length} items)\`);
        
      } else {
        console.log(\`No order data found for row \${index} after checking depths 0-10\`);
      }
    } catch (error) {
      console.error(\`[PageContextExtractor] Error extracting row \${index}:\`, error);
    }
  });
  
  console.log(\`[PageContextExtractor] Extraction complete:\`, {
    totalOrders: orders.length,
    ordersWithItems: orders.filter(o => o.items.length > 0).length,
    totalItems: orders.reduce((sum, o) => sum + o.items.length, 0)
  });
  
  if (orders.length === 0) {
    console.log('[PageContextExtractor] No valid orders found. Check console for debugging info.');
  }
  
  return orders;
}

// Listen for React ready check requests
window.addEventListener('otter-react-ready-check', function(e) {
  console.log('[PageContextExtractor] React ready check requested');
  const ready = isReactReady();
  window.dispatchEvent(new CustomEvent('otter-react-ready-response', {
    detail: { ready: ready }
  }));
});

// Listen for extraction requests from content script
window.addEventListener('otter-extract-request', function(e) {
  console.log('[PageContextExtractor] Received extraction request');
  
  try {
    // Check if React is ready first
    if (!isReactReady()) {
      console.log('[PageContextExtractor] React not ready yet');
      window.dispatchEvent(new CustomEvent('otter-extract-response', {
        detail: {
          success: false,
          error: 'React not ready',
          orders: [],
          timestamp: Date.now()
        }
      }));
      return;
    }
    
    const orders = extractOrdersFromReact();
    
    // Debug: Check orders structure before sending
    console.log('[PageContextExtractor] Orders before sending:', orders);
    if (orders.length > 0) {
      console.log('[PageContextExtractor] First order detail:', {
        id: orders[0].id,
        idType: typeof orders[0].id,
        customerName: orders[0].customerName,
        fullOrder: JSON.stringify(orders[0])
      });
    }
    
    // Send results back to content script
    window.dispatchEvent(new CustomEvent('otter-extract-response', {
      detail: {
        success: true,
        orders: orders,
        timestamp: Date.now()
      }
    }));
  } catch (error) {
    console.error('[PageContextExtractor] Extraction error:', error);
    
    window.dispatchEvent(new CustomEvent('otter-extract-response', {
      detail: {
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }));
  }
});

// Also expose functions globally for debugging
window.__otterExtractOrders = extractOrdersFromReact;
window.__otterIsReactReady = isReactReady;

console.log('[PageContextExtractor] Ready. Available functions:');
console.log('  - window.__otterExtractOrders() - Extract orders');
console.log('  - window.__otterIsReactReady() - Check if React is ready');
})();
      `;
      
      script.onload = () => {
        console.log('[ReactDataExtractor] Page context script loaded');
        this.pageContextInjected = true;
      };
      (document.head || document.documentElement).appendChild(script);
      this.pageContextInjected = true; // Mark as injected immediately since it's inline
    }
    
    // Extract orders using page context (main method)
    async extractOrdersViaPageContext(retryCount = 0) {
      return new Promise((resolve, reject) => {
        console.log(`[ReactDataExtractor] Requesting extraction via page context (attempt ${retryCount + 1})...`);
        
        // Set up response listener
        const responseHandler = (event) => {
          console.log('[ReactDataExtractor] Received response from page context:', event.detail);
          
          // Debug: Check what we received
          if (event.detail.success && event.detail.orders && event.detail.orders.length > 0) {
            console.log('[ReactDataExtractor] First order received:', {
              order: event.detail.orders[0],
              id: event.detail.orders[0].id,
              idType: typeof event.detail.orders[0].id,
              customerName: event.detail.orders[0].customerName
            });
          }
          
          window.removeEventListener('otter-extract-response', responseHandler);
          
          if (event.detail.success) {
            resolve(event.detail.orders || []);
          } else {
            reject(new Error(event.detail.error || 'Unknown error'));
          }
        };
        
        window.addEventListener('otter-extract-response', responseHandler);
        
        // Send extraction request
        window.dispatchEvent(new CustomEvent('otter-extract-request', {
          detail: { timestamp: Date.now() }
        }));
        
        // Timeout after 5 seconds
        setTimeout(() => {
          window.removeEventListener('otter-extract-response', responseHandler);
          reject(new Error('Extraction timeout'));
        }, 5000);
      });
    }
    
    // Retry extraction with delays
    async extractOrdersWithRetry(maxRetries = 3) {
      const delays = [0, 500, 1000, 2000]; // Increasing delays between retries
      
      for (let i = 0; i <= maxRetries; i++) {
        try {
          if (i > 0) {
            console.log(`[ReactDataExtractor] Waiting ${delays[i]}ms before retry ${i}...`);
            await new Promise(resolve => setTimeout(resolve, delays[i]));
          }
          
          const orders = await this.extractOrdersViaPageContext(i);
          
          if (orders.length > 0) {
            console.log(`[ReactDataExtractor] Success on attempt ${i + 1}: found ${orders.length} orders`);
            return orders;
          } else {
            console.log(`[ReactDataExtractor] Attempt ${i + 1}: No orders found, will retry...`);
          }
        } catch (error) {
          console.error(`[ReactDataExtractor] Attempt ${i + 1} failed:`, error.message);
          
          if (i === maxRetries) {
            throw error;
          }
        }
      }
      
      return [];
    }
  
    async extractOrders() {
      if (!this.enabled) {
        console.log('[ReactDataExtractor] Extractor is disabled');
        return [];
      }
  
      console.log('[ReactDataExtractor] Starting order extraction...');
      
      // First ensure page context script is injected
      this.injectPageContextScript();
      
      // Wait a bit for script to load
      if (!this.pageContextInjected) {
        console.log('[ReactDataExtractor] Waiting for page context script to load...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      try {
        // Try page context extraction with retries
        const orders = await this.extractOrdersWithRetry();
        
        if (orders.length === 0) {
          console.log('[ReactDataExtractor] No orders found after retries');
          return [];
        }
        
        console.log(`[ReactDataExtractor] Successfully extracted ${orders.length} orders via page context`);
        
        // Convert to our format
        return orders.map(order => {
          // Calculate elapsed time if orderedAt exists
          let elapsedTime = order.elapsedTime || 0;
          if (order.orderedAt && !order.elapsedTime) {
            const orderedDate = new Date(order.orderedAt);
            const now = new Date();
            const elapsedMs = now - orderedDate;
            elapsedTime = Math.floor(elapsedMs / 60000); // Convert to minutes
          }
          
          return {
            ...order,
            source: 'react',
            timestamp: Date.now(),
            elapsedTime: elapsedTime,
            items: order.items.map(item => ({
              ...item,
              baseName: item.name,
              modifiers: item.modifiers || [], // Preserve modifiers from React data
              modifierDetails: item.modifierDetails || {} // Preserve modifierDetails from page context
            }))
          };
        });
        
      } catch (error) {
        console.error('[ReactDataExtractor] Page context extraction failed after retries:', error);
        
        // Fallback to content script method (won't work but try anyway)
        console.log('[ReactDataExtractor] Falling back to content script method...');
        return this.extractOrdersContentScript();
      }
    }
    
    // Old method kept as fallback
    extractOrdersContentScript() {
      const orders = [];
      
      try {
        const orderRows = document.querySelectorAll('[data-testid="order-row"]');
        console.log(`[ReactDataExtractor] Found ${orderRows.length} order rows`);
        
        orderRows.forEach((row, index) => {
          const order = this.extractOrderFromRow(row, index);
          if (order) {
            orders.push(order);
          }
        });
        
        console.log(`[ReactDataExtractor] Extracted ${orders.length} orders`);
        
        // If no orders found, try alternative method
        if (orders.length === 0 && this.debug) {
          console.log('[ReactDataExtractor] No orders found with primary method, trying alternative...');
          return this.extractOrdersAlternative();
        }
        
        return orders;
        
      } catch (error) {
        console.error('[ReactDataExtractor] Error during extraction:', error);
        return orders;
      }
    }
  
    extractOrderFromRow(row, index) {
      try {
        // Find React fiber with comprehensive search
        let fiber = this.findReactFiber(row);
        
        if (!fiber) {
          if (this.debug) {
            console.log(`[ReactDataExtractor] No React fiber found for row ${index}`);
            console.log(`[ReactDataExtractor] Element properties:`, Object.keys(row));
            console.log(`[ReactDataExtractor] Element:`, row);
          }
          return null;
        }
        
        if (this.debug) {
          console.log(`[ReactDataExtractor] Found React fiber for row ${index}`);
        }
        let current = fiber;
        let depth = 0;
        
        // Navigate up the fiber tree to find the order data (matching user's working pattern)
        while (current && depth < 20) {
          if (current.memoizedProps) {
            // Check for customerOrder first (user's working pattern shows this is the key)
            if (current.memoizedProps.customerOrder) {
              console.log(`[ReactDataExtractor] Found customerOrder at depth ${depth}`);
              if (this.debug) {
                console.log('[ReactDataExtractor] CustomerOrder structure:', current.memoizedProps.customerOrder);
              }
              return this.parseOrderData({ customerOrder: current.memoizedProps.customerOrder });
            }
            
            // Log what's available in memoizedProps for debugging
            if (this.debug && depth < 10) {
              const propKeys = Object.keys(current.memoizedProps);
              if (propKeys.length > 0 && propKeys.length < 20) {
                console.log(`[ReactDataExtractor] Depth ${depth} - memoizedProps keys:`, propKeys);
              }
            }
            
            // Check for order in various locations as fallback
            if (current.memoizedProps.order) {
              const orderData = current.memoizedProps.order;
              console.log(`[ReactDataExtractor] Found order data at depth ${depth}:`, orderData);
              return this.parseOrderData(orderData);
            }
            
            // Check for data prop that might contain order
            if (current.memoizedProps.data && current.memoizedProps.data.order) {
              const orderData = current.memoizedProps.data.order;
              console.log(`[ReactDataExtractor] Found order in data prop at depth ${depth}:`, orderData);
              return this.parseOrderData(orderData);
            }
          }
          
          // Move up the fiber tree
          current = current.return;
          depth++;
        }
        
        if (this.debug) {
          console.log(`[ReactDataExtractor] No order data found in React props for row ${index}`);
        }
        return null;
        
      } catch (error) {
        console.error(`[ReactDataExtractor] Error extracting from row ${index}:`, error);
        return null;
      }
    }
  
    parseOrderData(orderData) {
      try {
        // Handle different order data structures
        let order;
        
        // Check if it's the newer structure with customerOrder
        if (orderData.customerOrder) {
          order = this.parseCustomerOrderStructure(orderData.customerOrder);
        } else {
          // Original structure
          order = {
            id: this.extractOrderId(orderData),
            customerName: this.extractCustomerName(orderData),
            orderNumber: this.extractOrderNumber(orderData),
            waitTime: this.extractWaitTime(orderData),
            items: this.extractItems(orderData),
            source: 'react',
            timestamp: Date.now()
          };
        }
        
        if (this.debug) {
          console.log('[ReactDataExtractor] Parsed order:', order);
        }
        
        return order;
        
      } catch (error) {
        console.error('[ReactDataExtractor] Error parsing order data:', error);
        return null;
      }
    }
    
    parseCustomerOrderStructure(customerOrder) {
      // Extract from the newer API structure
      const orderId = customerOrder.orderIdentifier?.displayId || 
                      customerOrder.orderId?.id || 
                      'unknown';
      
      const customerName = customerOrder.customer?.displayName || 
                          customerOrder.customer?.firstName || 
                          'Unknown';
      
      const orderNumber = customerOrder.orderIdentifier?.displayId || 
                         customerOrder.externalOrderIdentifier?.displayId || 
                         'N/A';
      
      // Extract items from customerItemsContainer
      const items = [];
      const processedModifierIds = new Set(); // Track which modifiers we've processed
      
      if (customerOrder.customerItemsContainer) {
        const container = customerOrder.customerItemsContainer;
        
        // Process main items
        if (container.items) {
          container.items.forEach(item => {
            const parsedItem = this.parseCustomerItem(item, container.modifiers, customerOrder.stationOrders);
            if (parsedItem) {
              items.push(parsedItem);
              // Mark these modifiers as processed
              if (parsedItem.modifierItemIds) {
                parsedItem.modifierItemIds.forEach(id => processedModifierIds.add(id));
              }
            }
          });
        }
        
        // Process modifiers that weren't attached to any item
        // These are truly standalone items (including upsells)
        if (container.modifiers) {
          Object.entries(container.modifiers).forEach(([modId, modifier]) => {
            if (!processedModifierIds.has(modId)) {
              const modName = modifier.orderItemDetail?.name || '';
              
              // If this is NOT a size modifier and wasn't processed with an item
              if (!this.isSizeName(modName)) {
                // Try to extract size from the modifier name itself
                let itemSize = 'no-size';
                const modNameLower = modName.toLowerCase();
                
                // Check if size is in the name (e.g., "Small Cucumber Lemon Soda")
                if (modNameLower.includes('small')) {
                  itemSize = 'small';
                } else if (modNameLower.includes('medium')) {
                  itemSize = 'medium';
                } else if (modNameLower.includes('large')) {
                  itemSize = 'large';
                }
                
                // Check if this is from an upsell section using stationOrders
                let isUpsellItem = false;
                if (customerOrder.stationOrders && customerOrder.stationOrders[0]) {
                  const stationMods = customerOrder.stationOrders[0].menuReconciledItemsContainer?.modifiers;
                  if (stationMods && stationMods[modId]) {
                    const sectionName = stationMods[modId].sectionName || '';
                    const upsellSections = ['Add a Dessert', 'Add a Drink', 'Side Addition'];
                    const separateItemSections = []; // Removed dumplings - they should be integrated for Urban Bowls
                    isUpsellItem = upsellSections.includes(sectionName) || separateItemSections.includes(sectionName);
                    
                    if (isUpsellItem) {
                      console.log(`[ReactDataExtractor] Found upsell item: ${modName} from section: ${sectionName}`);
                    }
                  }
                }
                
                items.push({
                  name: modName,
                  quantity: modifier.orderItemDetail?.quantity || 1,
                  size: itemSize,
                  category: 'Other',
                  price: this.extractPriceFromMonetary(modifier.orderItemDetail?.salePrice),
                  isStandaloneModifier: true,
                  isUpsellItem: isUpsellItem
                });
                console.log(`[ReactDataExtractor] Added standalone modifier as item: ${modName} (size: ${itemSize})`);
              }
            }
          });
        }
      }
      
      // Also check stationOrders for additional item details
      if (customerOrder.stationOrders && customerOrder.stationOrders[0]) {
        const stationOrder = customerOrder.stationOrders[0];
        const reconciledItems = stationOrder.menuReconciledItemsContainer;
        
        if (reconciledItems && reconciledItems.modifiers) {
          // Map to track which items have which size modifiers
          const itemSizeMap = new Map();
          
          // First pass: identify size modifiers
          Object.entries(reconciledItems.modifiers).forEach(([modId, modifier]) => {
            const sectionName = modifier.sectionName || '';
            const itemName = modifier.stationItemDetail?.name || '';
            
            // Check if this is a size section or the modifier name is a size
            if (sectionName.toLowerCase().includes('size') || this.isSizeName(itemName)) {
              console.log(`[ReactDataExtractor] Found size in station order: ${itemName} (section: ${sectionName})`);
              
              // Find which items use this modifier
              if (reconciledItems.items) {
                reconciledItems.items.forEach(item => {
                  if (item.modifierStationItemIds && item.modifierStationItemIds.includes(modId)) {
                    const mainItemName = item.stationItemDetail?.name;
                    if (mainItemName) {
                      itemSizeMap.set(mainItemName, itemName.toLowerCase());
                    }
                  }
                });
              }
            }
          });
          
          // Second pass: update item sizes
          items.forEach(item => {
            if (itemSizeMap.has(item.name)) {
              const size = itemSizeMap.get(item.name);
              if (this.isSizeName(size)) {
                item.size = size;
                console.log(`[ReactDataExtractor] Updated ${item.name} size to: ${size}`);
              }
            }
          });
        }
      }
      
      // Calculate wait time
      const estimatedPrepTime = customerOrder.confirmationInfo?.estimatedPrepTimeMinutes || 0;
      
      return {
        id: orderId,
        customerName: customerName,
        orderNumber: orderNumber,
        waitTime: estimatedPrepTime,
        items: items,
        source: 'react-customer-order',
        timestamp: Date.now()
      };
    }
    
    parseCustomerItem(item, allModifiers, stationOrders) {
      const itemDetail = item.orderItemDetail;
      if (!itemDetail) return null;
      
      const parsedItem = {
        name: itemDetail.name || 'Unknown Item',
        quantity: itemDetail.quantity || 1,
        size: 'no-size',
        category: null, // Will be set based on categorization
        price: this.extractPriceFromMonetary(itemDetail.salePrice),
        modifierItemIds: [], // Track which modifiers are processed with this item
        modifiers: {}, // Store modifier details for categorization
        modifierDetails: {}, // Store modifier details for UI display (tags)
        modifierList: [], // Store full modifier information
        proteinType: '', // Will be extracted from name or modifiers
        sauce: '', // Will be extracted from name or modifiers
        isRiceBowl: false,
        isUrbanBowl: false,
        // Top-level properties for tags
        dumplingType: null,
        riceSubType: null,
        sauceType: null
      };
      
      // Check if this is a meal item (Bao Out, Bowl of Rice Meal)
      const isMealItem = parsedItem.name.toLowerCase().includes('bao out') || 
                        parsedItem.name.toLowerCase().includes('bowl of rice meal') ||
                        parsedItem.name.toLowerCase().includes('meal');
      
      if (isMealItem) {
        console.log(`[ReactDataExtractor] Detected meal item: ${parsedItem.name} - ALL modifiers will be separate items`);
      }
      
      // Check if this is an Urban Bowl FIRST (before any modifier checks)
      const isUrbanBowl = parsedItem.name.toLowerCase().includes('urban bowl');
      if (isUrbanBowl) {
        parsedItem.isUrbanBowl = true; // Set the flag!
        parsedItem.size = 'urban';
        parsedItem.modifiers.riceSubstitution = 'White Rice'; // Default
        parsedItem.modifiers.dumplingChoice = null;
        parsedItem.modifierDetails.riceSubstitution = 'White Rice';
        parsedItem.modifierDetails.dumplingChoice = null;
        console.log(`[ReactDataExtractor] Detected Urban Bowl: ${parsedItem.name} - set size to 'urban'`);
      }
      
      // Check if this item has modifiers
      if (item.modifierCustomerItemIds && allModifiers) {
        console.log(`[ReactDataExtractor] Item ${parsedItem.name} has ${item.modifierCustomerItemIds.length} modifiers`);
        item.modifierCustomerItemIds.forEach(modId => {
          const modifier = allModifiers[modId];
          if (modifier && modifier.orderItemDetail) {
            const modName = modifier.orderItemDetail.name || '';
            const modNameLower = modName.toLowerCase();
            console.log(`[ReactDataExtractor] Processing modifier: ${modName} for item ${parsedItem.name}`);
            
            // Check if this is a size modifier
            let isSize = false;
            let sectionName = '';
            
            // Check station orders for section name
            if (stationOrders && stationOrders[0]) {
              const stationMods = stationOrders[0].menuReconciledItemsContainer?.modifiers;
              if (stationMods && stationMods[modId]) {
                sectionName = stationMods[modId].sectionName || '';
                console.log(`[ReactDataExtractor] Modifier ${modName} has section: "${sectionName}"`);
                // Check if it's from a size choice section
                if (sectionName.toLowerCase().includes('size choice')) {
                  isSize = true;
                  console.log(`[ReactDataExtractor] Found size from section "${sectionName}": ${modName}`);
                }
              }
            }
            
            // Also check if the modifier name itself is a size
            if (!isSize && this.isSizeName(modName)) {
              isSize = true;
            }
            
            // Only check for size modifiers if this is NOT an Urban Bowl
            if (!isUrbanBowl && isSize) {
              // This is a size modifier - apply it to the main item
              parsedItem.size = modNameLower.trim();
              console.log(`[ReactDataExtractor] Applied size modifier: ${modName} to item ${parsedItem.name}`);
              
              // Add to the item price if the size modifier has a price
              const modPrice = this.extractPriceFromMonetary(modifier.orderItemDetail.salePrice);
              if (modPrice > 0) {
                parsedItem.price += modPrice;
              }
              
              // Mark this modifier as processed
              parsedItem.modifierItemIds.push(modId);
            } 
            // Check if this modifier is integrated into the main item
            else {
              // For meal items, NO modifiers are integrated - all are separate
              // Pass the section name we already retrieved to avoid duplicate lookups
              const isIntegrated = isMealItem ? false : this.shouldIntegrateModifierWithSection(parsedItem.name, modName, sectionName, modifier, stationOrders);
              console.log(`[ReactDataExtractor] Integration check for ${modName}: section="${sectionName}", integrated=${isIntegrated}`);
              
              if (isIntegrated) {
                // This modifier is part of the main item, not separate
                console.log(`[ReactDataExtractor] ${modName} is integrated into ${parsedItem.name}`, { section: sectionName });
                parsedItem.modifierItemIds.push(modId);
                
                // Special handling for Urban Bowl modifiers
                if (isUrbanBowl) {
                  // Check for rice substitution
                  if (modNameLower.includes('fried rice') || modNameLower.includes('noodle')) {
                    parsedItem.modifiers.riceSubstitution = modName;
                    parsedItem.modifierDetails.riceSubstitution = modName;
                    parsedItem.riceSubType = modName; // Set top-level property
                    console.log(`[ReactDataExtractor] Urban Bowl rice substitution: ${modName}`);
                  }
                  // Check for dumpling choice
                  else if (modNameLower.includes('dumpling')) {
                    parsedItem.modifiers.dumplingChoice = modName;
                    parsedItem.modifierDetails.dumplingChoice = modName;
                    parsedItem.dumplingType = modName; // Set top-level property
                    console.log(`[ReactDataExtractor] Urban Bowl dumpling choice: ${modName}`);
                    console.log(`[ReactDataExtractor] Full modifiers object:`, JSON.stringify(parsedItem.modifiers));
                    console.log(`[ReactDataExtractor] ✅ DUMPLING DATA SET:`, {
                      modifiers_dumplingChoice: parsedItem.modifiers.dumplingChoice,
                      modifierDetails_dumplingChoice: parsedItem.modifierDetails.dumplingChoice,
                      topLevel_dumplingType: parsedItem.dumplingType,
                      itemName: parsedItem.name,
                      isUrbanBowl: parsedItem.isUrbanBowl
                    });
                  }
                }
                // Special handling for Rice Bowl sauce modifiers
                else if (parsedItem.isRiceBowl && (sectionName === 'Top Steak with Our Signature Sauces' || sectionName === 'Top Salmon with Our Signature Sauces')) {
                  parsedItem.modifierDetails.sauce = modName;
                  parsedItem.sauceType = modName; // Set top-level property
                  console.log(`[ReactDataExtractor] Rice Bowl sauce: ${modName}`);
                }
                // Special handling for rice substitutions on Rice Bowls - append to size
                else if (this.isRiceSubstitution(modName, modifier, stationOrders)) {
                  // Append the rice substitution to the size
                  const currentSize = parsedItem.size !== 'no-size' ? parsedItem.size : '';
                  // Use the full modifier name exactly as it appears
                  parsedItem.size = currentSize ? `${currentSize} - ${modName.toLowerCase()}` : modName.toLowerCase();
                  // Also store in modifierDetails for tag display
                  parsedItem.modifierDetails.riceSubstitution = modName;
                  console.log(`[ReactDataExtractor] Updated size with rice substitution: ${parsedItem.size}`);
                }
              } else {
                // This is an upsell modifier - DON'T mark it as processed
                // It will be added as a separate item in parseOrderData
                console.log(`[ReactDataExtractor] ${modName} is an upsell item - will be added separately`);
              }
            }
          }
        });
      }
      
      // Check if this is a Rice Bowl and extract additional info
      if (parsedItem.name.toLowerCase().includes('rice bowl')) {
        parsedItem.isRiceBowl = true;
        console.log(`[ReactDataExtractor] Detected Rice Bowl: ${parsedItem.name}`);
        
        // If size wasn't found in modifiers, try to extract from name
        if (parsedItem.size === 'no-size') {
          const nameLower = parsedItem.name.toLowerCase();
          if (nameLower.includes('small')) parsedItem.size = 'small';
          else if (nameLower.includes('medium')) parsedItem.size = 'medium';
          else if (nameLower.includes('large')) parsedItem.size = 'large';
        }
      }
      
      // Extract protein type from item name
      const nameLower = parsedItem.name.toLowerCase();
      if (nameLower.includes('pork belly')) {
        parsedItem.proteinType = 'Pork Belly';
      } else if (nameLower.includes('grilled') && nameLower.includes('chicken')) {
        // Handle both "grilled chicken" and "grilled orange chicken" patterns
        parsedItem.proteinType = 'Grilled Chicken';
      } else if (nameLower.includes('crispy') && nameLower.includes('chicken')) {
        // Handle both "crispy chicken" and "crispy orange chicken" patterns
        parsedItem.proteinType = 'Crispy Chicken';
      } else if (nameLower.includes('steak')) {
        parsedItem.proteinType = 'Steak';
      } else if (nameLower.includes('salmon')) {
        parsedItem.proteinType = 'Salmon';
      } else if (nameLower.includes('shrimp')) {
        parsedItem.proteinType = 'Shrimp';
      } else if (nameLower.includes('fish')) {
        parsedItem.proteinType = 'Crispy Fish';
      } else if (nameLower.includes('tofu')) {
        parsedItem.proteinType = 'Tofu';
      } else if (nameLower.includes('cauliflower')) {
        parsedItem.proteinType = 'Cauliflower Nugget';
      }
      
      // Extract sauce from item name if not already in modifiers
      if (!parsedItem.sauce) {
        const sauces = ['sesame aioli', 'garlic aioli', 'chipotle aioli', 'jalapeño herb aioli', 
                        'sweet sriracha aioli', 'orange', 'teriyaki', 'spicy yuzu', 'garlic sesame fusion'];
        for (const sauce of sauces) {
          if (nameLower.includes(sauce)) {
            parsedItem.sauce = sauce.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
          }
        }
      }
      
      // Store all modifiers in modifierList for complete information
      if (item.modifierCustomerItemIds && allModifiers) {
        item.modifierCustomerItemIds.forEach(modId => {
          const modifier = allModifiers[modId];
          if (modifier && modifier.orderItemDetail) {
            parsedItem.modifierList.push({
              id: modId,
              name: modifier.orderItemDetail.name || '',
              price: this.extractPriceFromMonetary(modifier.orderItemDetail.salePrice),
              integrated: parsedItem.modifierItemIds.includes(modId)
            });
          }
        });
      }
      
      // Log final parsed item state for debugging
      if (parsedItem.isUrbanBowl || parsedItem.isRiceBowl) {
        console.log(`[ReactDataExtractor] 🎯 FINAL PARSED ITEM:`, {
          name: parsedItem.name,
          isUrbanBowl: parsedItem.isUrbanBowl,
          isRiceBowl: parsedItem.isRiceBowl,
          modifierDetails: parsedItem.modifierDetails,
          modifiers: parsedItem.modifiers,
          modifierList: parsedItem.modifierList,
          // Top-level properties that should be preserved
          dumplingType: parsedItem.dumplingType,
          riceSubType: parsedItem.riceSubType,
          sauceType: parsedItem.sauceType,
          // Check what's actually set
          hasDumplingData: !!(parsedItem.dumplingType || parsedItem.modifierDetails?.dumplingChoice),
          hasRiceData: !!(parsedItem.riceSubType || parsedItem.modifierDetails?.riceSubstitution),
          hasSauceData: !!(parsedItem.sauceType || parsedItem.modifierDetails?.sauce)
        });
      }
      
      return parsedItem;
    }
    
    shouldIntegrateModifierWithSection(itemName, modifierName, sectionName, modifier, stationOrders) {
      // Version that accepts pre-fetched section name
      const sectionLower = (sectionName || '').toLowerCase();
      const itemLower = itemName.toLowerCase();
      
      // Special case: Dumplings in Urban Bowls should be integrated (not separate)
      // Use fuzzy matching instead of exact comparison
      if (itemLower.includes('urban bowl')) {
        // Check if this is a dumpling section with various possible formats
        if ((sectionLower.includes('choice') && sectionLower.includes('dumpling')) ||
            (sectionLower.includes('3') && sectionLower.includes('dumpling')) ||
            sectionLower === 'choice of 3 piece dumplings' ||
            sectionLower === 'choice of 3pc dumplings' ||
            sectionLower.includes('dumpling choice')) {
          console.log(`[ReactDataExtractor] Urban Bowl dumpling detected (fuzzy match): section="${sectionName}", modifier="${modifierName}"`);
          return true; // Integrate as modifiers
        }
        
        // Also check modifier content if section name doesn't match
        const modLower = modifierName.toLowerCase();
        if (modLower.includes('dumpling') || 
            (modLower.includes('pc') && (modLower.includes('pork') || modLower.includes('chicken') || modLower.includes('vegetable')))) {
          console.log(`[ReactDataExtractor] Urban Bowl dumpling detected by content: modifier="${modifierName}"`);
          return true;
        }
      }
      
      return this.isIntegratedModifier(itemName, modifierName, sectionName);
    }
    
    shouldIntegrateModifier(itemName, modifierName, modifier, stationOrders) {
      // Determine if a modifier should be integrated into the main item
      // or treated as a separate item
      
      // First check station orders for section name
      let sectionName = '';
      if (stationOrders && stationOrders[0]) {
        const stationMods = stationOrders[0].menuReconciledItemsContainer?.modifiers;
        if (stationMods) {
          for (const [id, stationMod] of Object.entries(stationMods)) {
            if (stationMod.stationItemDetail?.name === modifierName) {
              sectionName = stationMod.sectionName || '';
              break;
            }
          }
        }
      }
      
      return this.shouldIntegrateModifierWithSection(itemName, modifierName, sectionName, modifier, stationOrders);
    }
    
    isUrbanBowlComponent(modifierName, modifier, stationOrders) {
      // Check if this modifier is part of an Urban Bowl (like choice of dumplings)
      const modNameLower = modifierName.toLowerCase();
      
      // Check if it's dumplings that are part of "Choice of 3 piece Dumplings"
      if (modNameLower.includes('dumpling')) {
        // Check the station orders for section name
        if (stationOrders && stationOrders[0]) {
          const stationMods = stationOrders[0].menuReconciledItemsContainer?.modifiers;
          if (stationMods) {
            // Find this modifier in station orders
            for (const [id, stationMod] of Object.entries(stationMods)) {
              if (stationMod.stationItemDetail?.name === modifierName) {
                const sectionName = stationMod.sectionName || '';
                // If it's part of "Choice of X piece Dumplings", it's part of the bowl
                if (sectionName.toLowerCase().includes('choice') && sectionName.toLowerCase().includes('dumpling')) {
                  return true;
                }
              }
            }
          }
        }
      }
      
      // Rice substitutions are also part of Urban Bowls
      if (modNameLower.includes('rice') && (modNameLower.includes('garlic butter') || modNameLower.includes('substitute'))) {
        return true;
      }
      
      // Sauces for Urban Bowls are part of the bowl
      if (modNameLower.includes('sauce') || modNameLower.includes('aioli')) {
        return true;
      }
      
      return false;
    }
    
    isIntegratedModifier(itemName, modifierName, sectionName) {
      // Determines if a modifier is integrated into the main item
      const itemLower = itemName.toLowerCase();
      const modLower = modifierName.toLowerCase();
      const section = sectionName || '';
      const sectionLower = section.toLowerCase();
      
      // Log for debugging
      console.log(`[isIntegratedModifier] Checking: item="${itemName}", modifier="${modifierName}", section="${section}"`);
      
      // These sections are ALWAYS integrated with the main item
      const integratedSections = [
        'Size Choice',
        'Size Choice - Salmon',
        'Boba Option',
        'Choice of Dressing',
        'Choice of Protein',
        'House Sauces',
        'Substitute Rice',
        'Top Steak with Our Signature Sauces',  // Sauce ON the steak - integrated
        'Top Salmon with Our Signature Sauces'  // Sauce ON the salmon - integrated
      ];
      
      if (integratedSections.includes(section)) {
        return true; // These modify/complete the main item
      }
      
      // Check section names that indicate SEPARATE items
      const separateItemSections = [
        'Add a Dessert',
        'Add a Drink', 
        'Side Addition'
      ];
      
      if (separateItemSections.includes(section)) {
        return false; // These are always separate items
      }
      
      // Special case: Required modifiers that create combo items
      if (section === '(Dessert)' || section === '(Dumplings)' || section === '(Small Rice Bowl)') {
        // These create new combo items, so they're integrated
        return true;
      }
      
      // === NEW FUZZY MATCHING LOGIC ===
      
      // Check for dumpling sections with fuzzy matching
      if ((sectionLower.includes('choice') && sectionLower.includes('dumpling')) ||
          (sectionLower.includes('3') && sectionLower.includes('dumpling')) ||
          sectionLower.includes('dumpling choice')) {
        console.log(`[isIntegratedModifier] Detected dumpling section via fuzzy match: "${section}"`);
        return true; // Dumplings should be integrated with Urban Bowls
      }
      
      // Check for sauce sections with fuzzy matching
      if ((sectionLower.includes('top') && sectionLower.includes('sauce')) ||
          (sectionLower.includes('signature') && sectionLower.includes('sauce')) ||
          sectionLower.includes('sauce choice')) {
        console.log(`[isIntegratedModifier] Detected sauce section via fuzzy match: "${section}"`);
        return true; // Sauces should be integrated
      }
      
      // Check for rice substitution sections
      if (sectionLower.includes('substitute') || 
          sectionLower.includes('rice') && sectionLower.includes('choice')) {
        console.log(`[isIntegratedModifier] Detected rice substitution section: "${section}"`);
        return true;
      }
      
      // === FALLBACK: CONTENT-BASED DETECTION ===
      
      // For Urban Bowls, check if modifier is a dumpling or rice substitution
      if (itemLower.includes('urban bowl')) {
        if (modLower.includes('dumpling') || 
            modLower.includes('pork') && modLower.includes('pc') ||
            modLower.includes('chicken') && modLower.includes('pc') ||
            modLower.includes('vegetable') && modLower.includes('pc')) {
          console.log(`[isIntegratedModifier] Urban Bowl dumpling detected by content: "${modifierName}"`);
          return true;
        }
        if (modLower.includes('fried rice') || 
            modLower.includes('garlic butter') ||
            modLower.includes('noodle')) {
          console.log(`[isIntegratedModifier] Urban Bowl rice substitution detected: "${modifierName}"`);
          return true;
        }
      }
      
      // For Rice Bowls, check if modifier is a sauce
      if (itemLower.includes('rice bowl')) {
        if (modLower.includes('sauce') || 
            modLower.includes('aioli') ||
            modLower.includes('orange') ||
            modLower.includes('teriyaki') ||
            modLower.includes('chipotle')) {
          console.log(`[isIntegratedModifier] Rice Bowl sauce detected by content: "${modifierName}"`);
          return true;
        }
      }
      
      // === SMART DEFAULT BASED ON CONTEXT ===
      
      // If no section name provided, make intelligent guess based on modifier content
      if (!section || section === '') {
        // Check if modifier looks like a customization (should be integrated)
        if (modLower.includes('no ') || modLower.includes('extra ') || 
            modLower.includes('light ') || modLower.includes('add ')) {
          console.log(`[isIntegratedModifier] Customization modifier detected: "${modifierName}"`);
          return true;
        }
        
        // Check if modifier looks like a separate item (price > 0 usually means separate)
        if (modLower.includes('drink') || modLower.includes('dessert') || 
            modLower.includes('side') || modLower.includes('add on')) {
          return false;
        }
        
        // For Urban/Rice Bowls, default to integrated
        if (itemLower.includes('urban bowl') || itemLower.includes('rice bowl')) {
          console.log(`[isIntegratedModifier] Defaulting to integrated for bowl item: "${itemName}"`);
          return true;
        }
      }
      
      // Default: For unknown cases, integrate modifiers instead of separating
      console.log(`[isIntegratedModifier] Using smart default (integrated) for: "${modifierName}"`);
      return true; // Changed from false to true - better to integrate unknown modifiers
    }
    
    isDrinkItem(itemName) {
      return itemName.includes('tea') || 
             itemName.includes('drink') || 
             itemName.includes('latte') || 
             itemName.includes('coffee') || 
             itemName.includes('smoothie') ||
             itemName.includes('juice') ||
             itemName.includes('soda');
    }
    
    isRiceSubstitution(modifierName, modifier, stationOrders) {
      // Check if this is a rice substitution modifier
      if (stationOrders && stationOrders[0]) {
        const stationMods = stationOrders[0].menuReconciledItemsContainer?.modifiers;
        if (stationMods) {
          for (const [id, stationMod] of Object.entries(stationMods)) {
            if (stationMod.stationItemDetail?.name === modifierName) {
              const sectionName = stationMod.sectionName || '';
              if (sectionName === 'Substitute Rice') {
                return true;
              }
            }
          }
        }
      }
      
      // Also check by name patterns
      const modLower = modifierName.toLowerCase();
      return (modLower.includes('rice') && modLower.includes('substitute')) ||
             modLower.includes('garlic butter fried rice') ||
             modLower.includes('stir fry rice noodles');
    }
    
    // Helper function to determine section type based on Otter's naming patterns
    getSectionType(sectionName) {
      if (!sectionName) return 'unknown';
      
      // Map of exact section names to their types
      const sectionMap = {
        // Separate items
        'Add a Dessert': 'separate',
        'Add a Drink': 'separate',
        'Side Addition': 'separate',
        'House Sauces': 'separate',
        
        // Integrated modifiers
        'Size Choice': 'integrated',
        'Size Choice - Salmon': 'integrated',
        'Boba Option': 'integrated-conditional', // Only integrated for drinks
        'Choice of 3 piece Dumplings': 'integrated-urban-bowl',
        'Substitute Rice': 'integrated-urban-bowl',
        'Top Steak with Our Signature Sauces': 'integrated',
        'Top Salmon with Our Signature Sauces': 'integrated',
        
        // Combo creators (create new items)
        '(Dessert)': 'combo',
        '(Dumplings)': 'combo',
        '(Small Rice Bowl)': 'combo',
        
        // Optional modifiers
        'Add-ons': 'optional',
        'Add-Ons Vegetarian': 'optional'
      };
      
      return sectionMap[sectionName] || 'unknown';
    }
    
    isSizeName(name) {
      if (!name) return false;
      const nameLower = name.toLowerCase().trim();
      
      // Exact matches for size names
      const sizeNames = ['small', 'medium', 'large', 'regular', 'xl', 'extra large', 'extra-large'];
      if (sizeNames.includes(nameLower)) return true;
      
      // Check for size abbreviations
      if (nameLower === 'sm' || nameLower === 'md' || nameLower === 'lg' || nameLower === 'xs') return true;
      
      // Check if it's just "Large" or "Small" etc. (exact match)
      const exactSizeNames = ['Large', 'Small', 'Medium', 'Regular', 'XL', 'Extra Large'];
      if (exactSizeNames.includes(name.trim())) return true;
      
      // Check for patterns like "Size: Large" or "Large Size"
      if (nameLower.includes('size') && (nameLower.includes('small') || nameLower.includes('medium') || nameLower.includes('large'))) {
        return true;
      }
      
      return false;
    }
    
    extractPriceFromMonetary(priceObj) {
      if (!priceObj) return 0;
      
      const units = priceObj.units || 0;
      const nanos = priceObj.nanos || 0;
      
      return units + (nanos / 1000000000);
    }
  
    extractOrderId(orderData) {
      return orderData.id || 
             orderData.orderId || 
             orderData.uuid || 
             orderData._id || 
             `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  
    extractCustomerName(orderData) {
      return orderData.customerName || 
             orderData.customer?.name || 
             orderData.customer?.firstName || 
             orderData.name || 
             'Unknown Customer';
    }
  
    extractOrderNumber(orderData) {
      return orderData.orderNumber || 
             orderData.displayId || 
             orderData.code || 
             orderData.number || 
             'N/A';
    }
  
    extractWaitTime(orderData) {
      // Try various fields that might contain wait time
      const waitTime = orderData.estimatedReadyTime || 
                       orderData.prepTime || 
                       orderData.waitTime ||
                       orderData.estimatedTime;
      
      if (waitTime) {
        // If it's a timestamp, calculate minutes from now
        if (waitTime > 1000000000) {
          const now = Date.now();
          const diffMs = waitTime - now;
          return Math.max(0, Math.floor(diffMs / 60000));
        }
        return parseInt(waitTime) || 0;
      }
      
      return 0;
    }
  
    extractItems(orderData) {
      const items = [];
      
      // Find items in various possible locations
      const itemsArray = orderData.items || 
                         orderData.orderItems || 
                         orderData.lineItems || 
                         orderData.products || 
                         [];
      
      itemsArray.forEach(itemData => {
        const item = this.parseItemData(itemData);
        if (item) {
          items.push(item);
          
          // Check for modifiers that might be separate items (like dumplings in Urban Bowls)
          const additionalItems = this.extractAdditionalItems(itemData);
          items.push(...additionalItems);
        }
      });
      
      return items;
    }
  
    parseItemData(itemData) {
      try {
        const item = {
          name: this.extractItemName(itemData),
          quantity: this.extractItemQuantity(itemData),
          size: this.extractItemSize(itemData),
          category: 'Other', // Will be categorized later
          price: this.extractItemPrice(itemData)
        };
        
        // Skip items without valid names
        if (!item.name || item.name === 'Unknown Item') {
          return null;
        }
        
        // Log size extraction for debugging
        if (this.debug && item.size === 'no-size') {
          console.log('[ReactDataExtractor] No size found for item:', itemData);
        }
        
        return item;
        
      } catch (error) {
        console.error('[ReactDataExtractor] Error parsing item:', error);
        return null;
      }
    }
  
    extractItemName(itemData) {
      return itemData.name || 
             itemData.itemName || 
             itemData.title || 
             itemData.productName || 
             itemData.description || 
             'Unknown Item';
    }
  
    extractItemQuantity(itemData) {
      const qty = itemData.quantity || 
                  itemData.qty || 
                  itemData.count || 
                  itemData.amount || 
                  1;
      return parseInt(qty) || 1;
    }
  
    extractItemPrice(itemData) {
      const price = itemData.price || 
                    itemData.amount || 
                    itemData.total || 
                    itemData.subtotal || 
                    0;
      
      if (typeof price === 'string') {
        return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
      }
      
      return parseFloat(price) || 0;
    }
  
    extractItemSize(itemData) {
      // Check for Urban Bowl FIRST (before checking any size fields)
      const name = this.extractItemName(itemData);
      if (name && name.toLowerCase().includes('urban bowl')) {
        console.log(`[ReactDataExtractor] Detected Urban Bowl in extractItemSize: ${name} - returning 'urban' size`);
        return 'urban'; // Special size category for Urban Bowls
      }
      
      // Direct size fields
      if (itemData.size) return itemData.size;
      if (itemData.variant) return itemData.variant;
      if (itemData.variation) return itemData.variation;
      if (itemData.option) return itemData.option;
      if (itemData.selectedSize) return itemData.selectedSize;
      if (itemData.selected_size) return itemData.selected_size;
      
      // Check in selectedOptions array
      if (itemData.selectedOptions && Array.isArray(itemData.selectedOptions)) {
        const sizeOption = itemData.selectedOptions.find(opt => {
          const name = (opt.name || opt.label || '').toLowerCase();
          return name.includes('size') || name.includes('variant');
        });
        
        if (sizeOption) {
          return sizeOption.value || sizeOption.selection || sizeOption.choice || 'no-size';
        }
      }
      
      // Check in modifiers array
      if (itemData.modifiers && Array.isArray(itemData.modifiers)) {
        const sizeModifier = itemData.modifiers.find(mod => {
          const name = (mod.name || mod.label || '').toLowerCase();
          return name.includes('size') || 
                 name.includes('small') || 
                 name.includes('medium') || 
                 name.includes('large');
        });
        
        if (sizeModifier) {
          return sizeModifier.value || 
                 sizeModifier.selection || 
                 sizeModifier.choice || 
                 sizeModifier.name || 
                 'no-size';
        }
        
        // For Urban Bowls, rice substitution might indicate size
        const riceMod = itemData.modifiers.find(mod => {
          const name = (mod.name || mod.label || '').toLowerCase();
          return name.includes('rice') && name.includes('substitute');
        });
        
        if (riceMod && itemData.name && itemData.name.includes('Urban Bowl')) {
          return riceMod.value || riceMod.selection || riceMod.name || 'no-size';
        }
      }
      
      // Check in options object
      if (itemData.options && typeof itemData.options === 'object') {
        if (itemData.options.size) return itemData.options.size;
        if (itemData.options.variant) return itemData.options.variant;
        
        // Check nested options
        const optionKeys = Object.keys(itemData.options);
        for (const key of optionKeys) {
          if (key.toLowerCase().includes('size') || key.toLowerCase().includes('variant')) {
            return itemData.options[key];
          }
        }
      }
      
      // Check in attributes
      if (itemData.attributes && Array.isArray(itemData.attributes)) {
        const sizeAttr = itemData.attributes.find(attr => {
          const name = (attr.name || attr.key || '').toLowerCase();
          return name.includes('size') || name.includes('variant');
        });
        
        if (sizeAttr) {
          return sizeAttr.value || sizeAttr.text || 'no-size';
        }
      }
      
      // Try to extract from item name
      const itemName = this.extractItemName(itemData);
      const sizeMatch = itemName.match(/\b(small|medium|large|sm|md|lg|xl|regular)\b/i);
      if (sizeMatch) {
        return sizeMatch[1].toLowerCase();
      }
      
      // Check SKU patterns (specific to Otter)
      if (itemData.sku || itemData.skuId) {
        const sku = itemData.sku || itemData.skuId;
        // Common SKU patterns for sizes
        if (sku.includes('_SM') || sku.includes('-SM')) return 'small';
        if (sku.includes('_MD') || sku.includes('-MD')) return 'medium';
        if (sku.includes('_LG') || sku.includes('-LG')) return 'large';
        if (sku.includes('_XL') || sku.includes('-XL')) return 'xl';
      }
      
      // Default to no-size
      return 'no-size';
    }
  
    extractAdditionalItems(itemData) {
      const additionalItems = [];
      
      // Check modifiers for items that should be separate (like dumplings)
      if (itemData.modifiers && Array.isArray(itemData.modifiers)) {
        itemData.modifiers.forEach(modifier => {
          // Check if this modifier is actually a separate item
          const modName = (modifier.name || modifier.label || '').toLowerCase();
          
          // Dumplings in Urban Bowls are separate items
          if (modName.includes('dumpling') && modifier.value) {
            additionalItems.push({
              name: modifier.value || modifier.selection || modifier.name,
              quantity: modifier.quantity || 1,
              size: 'no-size',
              category: 'Other',
              price: modifier.price || 0
            });
          }
        });
      }
      
      return additionalItems;
    }
  
    // Integration method to be called by OrderExtractor
    async extractOrdersForIntegration() {
      console.log('[ReactDataExtractor] Extracting orders for integration...');
      const orders = this.extractOrders();
      
      // Format orders to match expected structure
      return orders.map(order => ({
        ...order,
        source: 'react-props',
        extractedAt: Date.now()
      }));
    }
    
    // Debug method to inspect React fibers
    inspectReactFibers() {
      console.log('=== REACT FIBER INSPECTION ===');
      const orderRows = document.querySelectorAll('[data-testid="order-row"]');
      console.log(`Found ${orderRows.length} order rows`);
      
      if (orderRows.length === 0) return;
      
      // Inspect first order row
      const row = orderRows[0];
      const reactKeys = Object.keys(row).filter(k => k.startsWith('__react'));
      
      if (reactKeys.length === 0) {
        console.log('No React fiber found on order row');
        return;
      }
      
      console.log('React keys found:', reactKeys);
      const fiber = row[reactKeys[0]];
      let current = fiber;
      let depth = 0;
      
      console.log('\nTraversing fiber tree:');
      while (current && depth < 10) {
        console.log(`\nDepth ${depth}:`);
        console.log('- Type:', current.type?.name || current.type || 'unknown');
        console.log('- StateNode:', current.stateNode?.constructor?.name || 'none');
        
        if (current.memoizedProps) {
          const props = current.memoizedProps;
          console.log('- Props keys:', Object.keys(props));
          
          // Check for order-related props
          if (props.order) {
            console.log('  ✓ Found order prop!');
            console.log('  Order structure:', props.order);
          }
          if (props.data) {
            console.log('  ✓ Found data prop!');
            console.log('  Data keys:', Object.keys(props.data));
          }
          if (props.customerOrder) {
            console.log('  ✓ Found customerOrder prop!');
            console.log('  CustomerOrder:', props.customerOrder);
          }
          
          // Log any prop that might contain order data
          Object.keys(props).forEach(key => {
            if (key.toLowerCase().includes('order') || 
                key.toLowerCase().includes('customer') ||
                key.toLowerCase().includes('item')) {
              console.log(`  → ${key}:`, props[key]);
            }
          });
        }
        
        current = current.return;
        depth++;
      }
      
      console.log('\n=== END INSPECTION ===');
      return fiber;
    }
    
    // Alternative extraction method that matches the working function
    extractOrdersAlternative() {
      console.log('[ReactDataExtractor] Using alternative extraction method');
      const orderRows = document.querySelectorAll('[data-testid="order-row"]');
      console.log(`[ReactDataExtractor] Found ${orderRows.length} order rows`);
      
      const orders = [];
      
      orderRows.forEach((row, index) => {
        // Try all possible React keys
        const allKeys = Object.keys(row);
        const reactKeys = allKeys.filter(k => 
          k.startsWith('__react') || 
          k.includes('Fiber') || 
          k.includes('Instance')
        );
        
        if (reactKeys.length === 0) {
          console.log(`[ReactDataExtractor] Row ${index}: No React keys found. All keys:`, allKeys);
          return;
        }
        
        console.log(`[ReactDataExtractor] Row ${index}: Found React keys:`, reactKeys);
        
        try {
          const fiber = row[reactKeys[0]];
          let current = fiber;
          let depth = 0;
          let orderData = null;
          
          // Navigate up the fiber tree
          while (current && depth < 20) {
            // Log what we find at each level
            if (depth < 5) {
              console.log(`[ReactDataExtractor] Depth ${depth}:`, {
                type: current.type?.name || current.type,
                hasProps: !!current.memoizedProps,
                propKeys: current.memoizedProps ? Object.keys(current.memoizedProps) : []
              });
            }
            
            if (current.memoizedProps) {
              // Check for order in any prop
              const props = current.memoizedProps;
              
              // Direct order prop
              if (props.order) {
                orderData = props.order;
                console.log(`[ReactDataExtractor] Found order at depth ${depth}`);
                break;
              }
              
              // Check all props for order-like data
              Object.keys(props).forEach(key => {
                const value = props[key];
                if (value && typeof value === 'object') {
                  if (value.customerOrder || value.orderId || value.orderNumber) {
                    orderData = value;
                    console.log(`[ReactDataExtractor] Found order data in prop '${key}' at depth ${depth}`);
                  }
                }
              });
              
              if (orderData) break;
            }
            
            current = current.return;
            depth++;
          }
          
          if (orderData) {
            const parsed = this.parseOrderData(orderData);
            if (parsed) {
              orders.push(parsed);
            }
          }
        } catch (e) {
          console.log(`[ReactDataExtractor] Error processing row ${index}:`, e.message);
        }
      });
      
      console.log(`[ReactDataExtractor] Alternative method extracted ${orders.length} orders`);
      return orders;
    }
  }
  
  // Create global instance
  window.otterReactDataExtractor = new ReactDataExtractor();
  console.log('[ReactDataExtractor] Global instance created: window.otterReactDataExtractor');
  
  // Enable debug mode if needed
  if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
    window.otterReactDataExtractor.enableDebug();
  }

  // ----- content/orderExtractor.js -----
  console.log('[OrderExtractor.js] Script loaded at:', new Date().toISOString());
  
  class OrderExtractor {
    constructor(categoryManager) {
      this.categoryManager = categoryManager;
      this.orderSelectors = {
        // Main order list selectors - will be updated dynamically
        orderRow: '[data-testid="order-row"]',
        orderNumber: '[data-testid="order-info-subtext"]',
        customerName: '.sc-dCesDq.kTVViB > div, .sc-gpaZuh.cMzcnw, h1.sc-khYOSX',
        itemQuantityCircle: '.sc-hGsGDS.iSFqHC',
        itemCategoryText: '.sc-aeBcf.fVhLeR > p, p.sc-gpaZuh',
        itemListText: '.sc-aeBcf.fVhLeR > div',
        courierStatus: '[data-testid="order-type-time"]',
        // Detail view selectors (when clicking order)
        detailModal: '[data-testid="order-details-receipt-items"]',
        detailItemRow: '[data-testid="order-details-receipt-item-row"]',
        detailItemName: '.sc-jsFtja.hSUmFW, p.sc-jsFtja.hSUmFW',
        detailItemQuantity: '.sc-einZSS.hnbVZg',
        detailItemPrice: '.sc-jsFtja.epewNT, p.sc-jsFtja.epewNT',
        modifierSection: '.sc-ixKSzz.sc-cCAuRX.irfKLT.ECGcy',
        modifierLabel: '.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA',
        modifierValue: '.sc-jsFtja.epewNT, p.sc-jsFtja.epewNT',
        closeButton: 'button[aria-label="Close"], svg[aria-label="Close"], button svg path[d*="M"]'
      };
      this.processedOrders = new Set();
    }
    
    // Update the order row selector dynamically
    updateOrderRowSelector(newSelector) {
      console.log(`Updating order row selector from ${this.orderSelectors.orderRow} to ${newSelector}`);
      this.orderSelectors.orderRow = newSelector;
    }
  
    async extractOrders() {
      const orders = [];
      const orderRows = document.querySelectorAll(this.orderSelectors.orderRow);
      
      console.log(`Found ${orderRows.length} order rows`);
      
      for (let i = 0; i < orderRows.length; i++) {
        const orderRow = orderRows[i];
        
        // Call progress callback if available
        if (this.onProgress) {
          this.onProgress(i + 1, orderRows.length);
        }
        
        try {
          // Use preview-only extraction
          const order = this.extractOrderFromPreview(orderRow);
          if (order && order.items.length > 0) {
            orders.push(order);
          }
        } catch (error) {
          console.error('Error extracting order:', error);
        }
      }
      
      return orders;
    }
    
    async ensureOnOrdersPage() {
      const currentUrl = window.location.href;
      const isMainOrdersPage = currentUrl === 'https://app.tryotter.com/orders' || 
                              currentUrl === 'https://app.tryotter.com/orders/';
      
      if (!isMainOrdersPage) {
        console.log('Not on main orders page, navigating back...');
        // Try to click the orders link
        const ordersLink = document.querySelector('a[href="/orders"]');
        if (ordersLink) {
          ordersLink.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Fallback: navigate directly
          window.location.href = 'https://app.tryotter.com/orders';
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    extractOrderFromPreview(orderRow) {
      try {
        // Validate order row
        if (!orderRow || !orderRow.querySelector) {
          console.warn('Invalid order row element');
          return null;
        }
        
        // Extract basic order info from row
        const orderNumber = this.extractText(orderRow, this.orderSelectors.orderNumber) || 'Unknown';
        const customerName = this.extractText(orderRow, this.orderSelectors.customerName) || 'Unknown';
        
        // Extract elapsed time
        const elapsedTime = this.extractElapsedTime(orderRow);
        
        // Generate order ID
        const orderId = `${orderNumber}_${customerName}`;
        
        // Calculate orderedAt from elapsed time
        const now = new Date();
        const orderedAt = new Date(now - (elapsedTime * 60000)).toISOString();
        
        // Extract items from the preview only
        const previewItems = this.extractPreviewItems(orderRow);
        
        if (!previewItems || previewItems.length === 0) {
          console.warn(`No items found for order ${orderId}`);
          return null;
        }
        
        // Update sizes for Urban Bowls and Rice Bowls in preview items
        previewItems.forEach(item => {
          const nameLower = item.name.toLowerCase();
          if (nameLower.includes('urban bowl')) {
            item.size = 'urban';
            item.isUrbanBowl = true;
          } else if (nameLower.includes('rice bowl')) {
            item.isRiceBowl = true;
            // Try to extract size from name if not already set
            if (item.size === 'no-size') {
              if (nameLower.includes('small')) item.size = 'small';
              else if (nameLower.includes('medium')) item.size = 'medium';
              else if (nameLower.includes('large')) item.size = 'large';
            }
          }
          
          // Detect rice substitutions from cached data if available
          if (item.size && item.size.includes('-')) {
            // Size includes substitution like "large - fried rice substitute"
            const parts = item.size.split('-').map(s => s.trim());
            if (parts.length > 1) {
              const substitution = parts.slice(1).join(' - ');
              if (substitution.toLowerCase().includes('fried rice') || 
                  substitution.toLowerCase().includes('noodle')) {
                item.riceSubstitution = substitution;
              }
            }
          }
        });
        
        const order = {
          id: orderId,
          number: orderNumber,
          customerName: customerName,
          orderedAt: orderedAt,
          elapsedTime: elapsedTime,
          timestamp: Date.now(),
          waitTime: 0, // No longer using wait time
          items: previewItems
        };
        
        // Check if we have cached API data for this order
        if (window.otterOrderCache) {
          const cachedOrder = window.otterOrderCache.findMatchingOrder(order);
          if (cachedOrder) {
            console.log(`[OrderExtractor] Found cached API data for order ${orderNumber}:`, cachedOrder);
            
            // Merge cached item details with preview items
            if (cachedOrder.items && cachedOrder.items.length > 0) {
              // Replace preview items with more detailed cached items
              order.items = cachedOrder.items.map(cachedItem => {
                const size = cachedItem.size || 'no-size';
                const categoryInfo = this.categoryManager.categorizeItem(cachedItem.name, size);
                return {
                  name: cachedItem.name,
                  baseName: cachedItem.name,
                  size: size,
                  quantity: cachedItem.quantity || 1,
                  price: cachedItem.price || 0,
                  category: categoryInfo.category,
                  categoryInfo: categoryInfo, // Store full category info
                  modifiers: cachedItem.modifiers || [],
                  fromCache: true // Flag to indicate data source
                };
              });
              
              console.log(`[OrderExtractor] Using ${order.items.length} items from cache with sizes`);
            }
          }
        }
        
        console.log(`Order ${orderNumber} - ${customerName}: wait time = ${order.waitTime}m, items: ${order.items.length}`);
        
        return order;
      } catch (error) {
        console.error('Error extracting order from preview:', error);
        return null;
      }
    }
    
    // DISABLED: Modal-based extraction causes page refresh loops
    // Keep the detailed extraction for manual refresh only
    async extractOrderWithDetails(orderRow) {
      // IMPORTANT: Disabled to prevent page refresh loops
      // The modal closing mechanism was causing constant page navigation
      // Using preview-only extraction for stability
      console.log('Detailed extraction disabled - using preview only');
      return this.extractOrderFromPreview(orderRow);
      
      /* Original code disabled:
      try {
        // First get preview data
        const previewOrder = this.extractOrderFromPreview(orderRow);
        if (!previewOrder) return null;
        
        // Check if we already processed this order
        if (this.processedOrders.has(previewOrder.id)) {
          return null;
        }
        
        // For manual detailed extraction, click to get sizes
        try {
          // Click on the order row to open details
          if (orderRow.click) {
            orderRow.click();
          } else {
            // Fallback click method
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            orderRow.dispatchEvent(clickEvent);
          }
          
          // Wait for details modal to appear
          await this.waitForElement(this.orderSelectors.detailModal, 3000);
          
          // Extract detailed items with sizes
          const items = await this.extractDetailedItems();
          
          // Close the modal
          await this.closeOrderDetails();
          
          // Mark as processed
          this.processedOrders.add(previewOrder.id);
          
          // Return order with detailed items if we got them
          if (items && items.length > 0) {
            return {
              ...previewOrder,
              items: items
            };
          }
        } catch (error) {
          console.log(`Using preview items for order ${previewOrder.id}:`, error.message);
        }
        
        // Fallback to preview items
        this.processedOrders.add(previewOrder.id);
        return previewOrder;
      } catch (error) {
        console.error('Error extracting order with details:', error);
        return null;
      }
      */
    }
    
    extractPreviewItems(orderRow) {
      const items = [];
      
      try {
        // Get the quantity from the circle
        const quantityEl = orderRow.querySelector(this.orderSelectors.itemQuantityCircle);
        const totalQuantity = quantityEl ? parseInt(quantityEl.textContent) || 1 : 1;
        
        // Get the item list text
        const itemListEl = orderRow.querySelector(this.orderSelectors.itemListText);
        const itemListText = itemListEl ? itemListEl.textContent.trim() : '';
        
        // Split items by bullet point (•)
        const itemNames = itemListText.split('•').map(name => name.trim()).filter(name => name);
        
        // Create item objects - detect size from name when possible
        // Since we can't determine individual quantities from preview, we'll assign 1 to each
        // The batch system will accumulate these properly
        itemNames.forEach(name => {
          // Detect size from item name
          let size = 'no-size';
          const lowerName = name.toLowerCase();
          
          // Check for Urban Bowl
          if (lowerName.includes('urban bowl')) {
            size = 'urban';
            console.log(`[OrderExtractor] Detected Urban Bowl in preview: ${name} - set size to 'urban'`);
          }
          // Could add more size detection from names here if needed
          // e.g., if name includes size keywords
          
          // Pass size to categorizeItem for proper categorization
          const categoryInfo = this.categoryManager.categorizeItem(name, size);
          
          items.push({
            name: name,
            baseName: name,
            size: size,
            quantity: 1, // Each item instance has quantity 1
            price: 0,
            category: categoryInfo.topCategory,
            subcategory: categoryInfo.subCategory,
            categoryInfo: categoryInfo // Store full category info for display
          });
        });
      } catch (error) {
        console.error('Error extracting preview items:', error);
      }
      
      return items;
    }
    
    async extractDetailedItems() {
      const items = [];
      const detailRows = document.querySelectorAll(this.orderSelectors.detailItemRow);
      
      for (const row of detailRows) {
        const extractedItems = this.extractDetailedItemData(row);
        if (Array.isArray(extractedItems)) {
          // Multiple items returned (main item + side additions)
          extractedItems.forEach(item => {
            if (item && item.name) {
              items.push(item);
            }
          });
        } else if (extractedItems && extractedItems.name) {
          // Single item returned (backward compatibility)
          items.push(extractedItems);
        }
      }
      
      return items;
    }
    
    extractDetailedItemData(itemRow) {
      try {
        const name = this.extractText(itemRow, this.orderSelectors.detailItemName);
        if (!name) {
          console.warn('No item name found in row');
          return null;
        }
        
        const quantityText = this.extractText(itemRow, this.orderSelectors.detailItemQuantity);
        const quantity = parseInt(quantityText) || 1;
        const priceText = this.extractText(itemRow, this.orderSelectors.detailItemPrice);
        const price = this.parsePrice(priceText);
        
        // Look for all modifiers (size, add-ons, etc.)
        const modifiers = [];
        const sideAdditions = []; // Collect side additions separately
        let size = null;
        let isUrbanBowl = name.toLowerCase().includes('urban bowl');
        if (isUrbanBowl) {
          console.log(`[OrderExtractor] Detected Urban Bowl: ${name}`);
        }
        let riceSubstitution = null;
      
      // Get the parent container for this item
      const parentContainer = itemRow.parentElement;
      
      // First check if the modifier containers are direct children of the parent
      if (!size && parentContainer) {
        const modifierContainers = parentContainer.querySelectorAll('.sc-ixKSzz.cMJRAn');
        modifierContainers.forEach(container => {
          // Find the label within this container
          const labelEl = container.querySelector('.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ');
          if (labelEl) {
            const labelText = labelEl.textContent.trim();
            
            // Check if this is a size choice
            if (labelText === 'Size Choice' || labelText.includes('Size Choice')) {
              console.log('Found Size Choice label in container');
              
              // Find the size value - it's in the nested structure
              // Structure: .sc-ixKSzz.irfKLT > .sc-bvrlno.iRptWl > .sc-ixKSzz.dpIGfp > .sc-jsFtja.epewNT
              const valueContainer = container.querySelector('.sc-ixKSzz.irfKLT');
              if (valueContainer) {
                // Look for the size text in the specific nested structure
                const sizeEl = valueContainer.querySelector('.sc-ixKSzz.dpIGfp .sc-jsFtja.epewNT') || 
                             valueContainer.querySelector('.sc-jsFtja.epewNT');
                
                if (sizeEl && sizeEl.textContent) {
                  // The size text has a leading space in the HTML
                  const sizeText = sizeEl.textContent.trim();
                  console.log('Found size text:', sizeText);
                  
                  if (sizeText && !size) {
                    size = sizeText;
                    
                    // Also try to get the price
                    const priceEl = valueContainer.querySelector('.sc-ixKSzz.fXtJCI .sc-jsFtja.epewNT');
                    if (priceEl) {
                      console.log('Size price:', priceEl.textContent.trim());
                    }
                  }
                } else {
                  console.log('No size element found in value container');
                }
              } else {
                console.log('No value container (.sc-ixKSzz.irfKLT) found');
              }
            }
          }
        });
      }
      
      // Look for modifier sections after this item row
      let nextSibling = itemRow.nextElementSibling;
      while (nextSibling && !nextSibling.matches(this.orderSelectors.detailItemRow)) {
        // Check if this element contains size information
        // Look for the specific container structure: sc-ixKSzz cMJRAn
        const modifierContainers = nextSibling.querySelectorAll('.sc-ixKSzz.cMJRAn');
        
        modifierContainers.forEach(container => {
          // Find the label within this container
          const labelEl = container.querySelector('.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ');
          if (labelEl) {
            const labelText = labelEl.textContent.trim();
            
            // Check if this is a size choice
            if (labelText.includes('Size Choice')) {
              // Find the size value - it's in a nested structure
              const valueContainer = container.querySelector('.sc-ixKSzz.irfKLT');
              if (valueContainer) {
                const sizeEl = valueContainer.querySelector('.sc-jsFtja.epewNT, p.sc-jsFtja.epewNT');
                if (sizeEl && sizeEl.textContent) {
                  // Trim the leading space that's in the HTML
                  const sizeText = sizeEl.textContent.trim();
                  if (sizeText) {
                    size = sizeText;
                    // Keep the full size text including substitutions
                    // Examples: "Small", "Large", "Small - Garlic Butter Fried Rice Substitute"
                    // Don't extract the base size - keep the full description
                  }
                }
              }
            }
          }
        });
        
        // If no size found yet, try the legacy approach for backward compatibility
        if (!size) {
          const allTexts = nextSibling.querySelectorAll('*');
          allTexts.forEach(el => {
            if (el.textContent && el.textContent.trim().includes('Size Choice') && !size) {
              // Look for size value in various possible locations
              let parent = el.parentElement;
              while (parent && !size) {
                const possibleValueEls = parent.querySelectorAll('.sc-jsFtja.epewNT');
                possibleValueEls.forEach(valEl => {
                  const text = valEl.textContent.trim();
                  if (text && !text.includes('Size Choice') && !size) {
                    size = text;
                  }
                });
                parent = parent.parentElement;
                if (parent === nextSibling.parentElement) break; // Don't go too far up
              }
            }
          });
        }
        
        // Also check for other modifiers using the existing logic
        if (nextSibling.matches && nextSibling.matches(this.orderSelectors.modifierSection)) {
          // Look for modifier label and values
          const labelEl = nextSibling.querySelector(this.orderSelectors.modifierLabel);
          if (labelEl) {
            const labelText = labelEl.textContent.trim();
            
            // Extract all values for this modifier
            const valueElements = nextSibling.querySelectorAll(this.orderSelectors.modifierValue);
            const values = Array.from(valueElements)
              .map(el => el.textContent.trim())
              .filter(v => v && !v.includes(labelText)); // Filter out the label text itself
            
            if (labelText.includes('Size Choice')) {
              // Handle regular size and special size cases (e.g., "Size Choice - Salmon")
              if (values.length > 0) {
                size = values[0];
                // Check if it's a complex size with substitution
                if (size.includes('Garlic Butter Fried Rice')) {
                  riceSubstitution = 'Garlic Butter Fried Rice';
                  // Extract the actual size from complex string
                  const sizeMatch = size.match(/^(Small|Medium|Large|Regular)/);
                  if (sizeMatch) {
                    size = sizeMatch[1];
                  }
                }
              }
            } else if (labelText === 'Substitute Rice') {
              // Rice substitution gets appended to size
              if (values.length > 0) {
                riceSubstitution = values[0];
                // Append rice substitution to the current size
                if (size && size !== 'no-size') {
                  size = `${size} - ${riceSubstitution}`;
                } else {
                  // If no size yet, just use the rice substitution
                  size = riceSubstitution;
                }
              }
            } else if (labelText.includes('Choice of') && labelText.includes('Dumplings') && isUrbanBowl) {
              // This is part of Urban Bowl, not a separate item
              if (values.length > 0) {
                modifiers.push(`${labelText}: ${values[0]}`);
              }
            } else if (labelText.includes('Top') && labelText.includes('Sauces')) {
              // Sauce modifiers for Steak/Salmon
              if (values.length > 0) {
                modifiers.push(`Sauce: ${values[0]}`);
              }
            } else if (labelText === 'Side Addition' || 
                       labelText === 'Add a Dessert' || 
                       labelText.includes('Add ') ||
                       labelText.includes('Addition')) {
              console.log(`Found additional item section in modifiers: ${labelText}`);
              // Extract additional items as separate items
              const valueElements = nextSibling.querySelectorAll(this.orderSelectors.modifierValue);
              if (valueElements.length >= 2) {
                const itemName = valueElements[0].textContent.trim();
                const itemPrice = this.parsePrice(valueElements[1].textContent);
                
                console.log(`${labelText} item found: ${itemName} - ${itemPrice}`);
                
                const isDesert = labelText.toLowerCase().includes('dessert');
                
                const sideCategory = this.categoryManager.categorizeItem(itemName, 'no-size');
                sideAdditions.push({
                  name: itemName,
                  baseName: itemName,
                  size: 'no-size',
                  quantity: 1,
                  price: itemPrice,
                  category: sideCategory.category,
                  categoryInfo: sideCategory,
                  isSideAddition: !isDesert,
                  isDessert: isDesert,
                  additionType: labelText
                });
              }
            } else {
              // Other modifiers
              if (values.length > 0 && values[0] !== 'None') {
                modifiers.push(`${labelText}: ${values.join(', ')}`);
              }
            }
          }
        }
        
        // Also check for standalone modifier values (e.g., substitutions)
        const standaloneValues = nextSibling.querySelectorAll('.sc-jsFtja.epewNT');
        const substitutionText = nextSibling.querySelector('.sc-jsFtja.izpgPC');
        if (substitutionText && standaloneValues.length > 0) {
          const subText = substitutionText.textContent.trim();
          if (subText.includes('instead of')) {
            const value = standaloneValues[0].textContent.trim();
            modifiers.push(`Substitution: ${value} ${subText}`);
          }
        }
        
        nextSibling = nextSibling.nextElementSibling;
      }
      
      // Don't include size in modifiers if it's already tracked separately
      const filteredModifiers = modifiers.filter(m => !m.startsWith('Size:'));
      
      // Create full name with relevant modifiers (but not size)
      let fullName = name;
      if (filteredModifiers.length > 0) {
        fullName = `${name} (${filteredModifiers.join(', ')})`;
      }
      
        // Check for additional items (Side Addition, Add a Dessert, etc.) using the same structure as Size Choice
        // Re-query modifier containers if they exist
        if (parentContainer) {
          const additionalModifierContainers = parentContainer.querySelectorAll('.sc-ixKSzz.cMJRAn');
          additionalModifierContainers.forEach(container => {
          const labelEl = container.querySelector('.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA, p.sc-euWMRQ');
          if (labelEl) {
            const labelText = labelEl.textContent.trim();
            
            // Check for various types of additions
            if (labelText === 'Side Addition' || 
                labelText === 'Add a Dessert' || 
                labelText.includes('Add ') ||
                labelText.includes('Addition')) {
              
              console.log(`Found additional item section: ${labelText}`);
              
              const valueContainer = container.querySelector('.sc-ixKSzz.irfKLT');
              if (valueContainer) {
                // Look for the item name
                const nameEl = valueContainer.querySelector('.sc-ixKSzz.dpIGfp .sc-jsFtja.epewNT') || 
                             valueContainer.querySelector('.sc-jsFtja.epewNT');
                // Look for the price
                const priceEl = valueContainer.querySelector('.sc-ixKSzz.fXtJCI .sc-jsFtja.epewNT');
                
                if (nameEl && nameEl.textContent) {
                  const itemName = nameEl.textContent.trim();
                  const itemPrice = priceEl ? this.parsePrice(priceEl.textContent) : 0;
                  
                  console.log(`${labelText} item found: ${itemName} - ${itemPrice}`);
                  
                  // Determine if it's a dessert based on the label
                  const isDesert = labelText.toLowerCase().includes('dessert');
                  
                  const sideAdditionCategory = this.categoryManager.categorizeItem(itemName, 'no-size');
                  sideAdditions.push({
                    name: itemName,
                    baseName: itemName,
                    size: 'no-size',
                    quantity: 1,
                    price: itemPrice,
                    category: sideAdditionCategory.category,
                    categoryInfo: sideAdditionCategory,
                    isSideAddition: !isDesert,
                    isDessert: isDesert,
                    additionType: labelText
                  });
                }
              }
            }
          }
        });
      }
        
        // Determine final size
        let finalSize = 'no-size';
        if (size) {
          // Keep the full size description including substitutions
          finalSize = size;
        } else if (isUrbanBowl) {
          // Only use 'urban' if no other size was found
          finalSize = 'urban';
          console.log(`[OrderExtractor] Set Urban Bowl size to 'urban' for: ${name}`);
        }
        
        // Create the main item
        const mainCategoryInfo = this.categoryManager.categorizeItem(name, finalSize);
        const mainItem = {
          name: fullName,
          baseName: name,
          size: finalSize,
          modifiers: filteredModifiers,
          quantity: quantity,
          price: price,
          category: mainCategoryInfo.category,
          categoryInfo: mainCategoryInfo,
          isUrbanBowl: isUrbanBowl,
          riceSubstitution: riceSubstitution
        };
        
        // Return array if there are side additions, otherwise return single item
        if (sideAdditions.length > 0) {
          return [mainItem, ...sideAdditions];
        } else {
          return mainItem;
        }
      } catch (error) {
        console.error('Error extracting item data:', error);
        return null;
      }
    }
    
    parsePrice(priceText) {
      if (!priceText) return 0;
      const match = priceText.match(/\$?([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    extractElapsedTime(orderRow) {
      try {
        // Look for the time element within order-type-time
        const timeContainer = orderRow.querySelector('[data-testid="order-type-time"]');
        if (!timeContainer) {
          console.debug('No time container found for order');
          return 0;
        }
        
        // Find the span with bullet and time - try multiple selectors
        let timeText = '';
        
        // Try the specific class first (with both classes)
        let timeSpan = timeContainer.querySelector('.sc-glPjVa.jpEQhm');
        if (!timeSpan) {
          // Try just the first class
          timeSpan = timeContainer.querySelector('.sc-glPjVa');
        }
        
        if (timeSpan) {
          timeText = timeSpan.textContent.trim();
        } else {
          // Try finding any span with bullet character
          const spans = timeContainer.querySelectorAll('span');
          for (const span of spans) {
            if (span.textContent.includes('•') && span.textContent.match(/\d+[mh]/)) {
              timeText = span.textContent.trim();
              break;
            }
          }
        }
        
        if (!timeText) {
          // Last resort - get all text from container
          timeText = timeContainer.textContent.trim();
        }
        
        console.log('Extracting elapsed time from text:', timeText);
        
        // Check for status text that doesn't contain actual time
        const statusOnlyText = ['pending', 'arrived', 'arriving soon', 'out for delivery', 'picked up', 'completed', 'ready'];
        const cleanTimeText = timeText.replace('•', '').trim().toLowerCase();
        
        // If it's just a status, return 0
        if (statusOnlyText.some(status => cleanTimeText === status)) {
          console.log('Status text detected, no elapsed time available:', cleanTimeText);
          return 0;
        }
        
        // Extract number from formats like "• 19m", "• 1h 5m", "19m", etc.
        const hourMinMatch = cleanTimeText.match(/(\d+)\s*h\s*(\d+)\s*m/);
        const hourMatch = cleanTimeText.match(/(\d+)\s*h/);
        const minMatch = cleanTimeText.match(/(\d+)\s*m/);
        
        let minutes = 0;
        
        if (hourMinMatch) {
          // Format: "1h 5m"
          minutes = parseInt(hourMinMatch[1]) * 60 + parseInt(hourMinMatch[2]);
        } else if (hourMatch) {
          // Format: "1h"
          minutes = parseInt(hourMatch[1]) * 60;
        } else if (minMatch) {
          // Format: "19m"
          minutes = parseInt(minMatch[1]);
        } else {
          console.debug('No time match found in:', timeText);
          return 0;
        }
        
        console.log('Extracted elapsed time:', minutes, 'minutes');
        return minutes;
      } catch (error) {
        console.error('Error extracting elapsed time:', error);
        return 0;
      }
    }
    
    async waitForElement(selector, timeout = 5000) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      throw new Error(`Element ${selector} not found within ${timeout}ms`);
    }
    
    async closeOrderDetails() {
      // DISABLED: Modal closing was causing page navigation loops
      console.log('Modal closing disabled to prevent page refresh loops');
      return;
      
      /* Original code disabled:
      try {
        // Quick check if modal is already closed
        const modalCheck = document.querySelector(this.orderSelectors.detailModal);
        if (!modalCheck || !modalCheck.offsetParent) {
          return; // Modal already closed
        }
        
        // Wait a bit for modal content to fully load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Strategy 1: Try escape key first (least disruptive)
        const escEvent = new KeyboardEvent('keydown', { 
          key: 'Escape', 
          keyCode: 27, 
          which: 27,
          bubbles: true,
          cancelable: true 
        });
        document.dispatchEvent(escEvent);
        document.body.dispatchEvent(escEvent);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if closed
        const modalAfterEsc = document.querySelector(this.orderSelectors.detailModal);
        if (!modalAfterEsc || !modalAfterEsc.offsetParent) {
          return; // Success
        }
        
        // Strategy 2: Try multiple close button selectors
        const closeSelectors = [
          'button[aria-label="Close"]',
          'button[aria-label="close"]',
          'button svg[aria-label="Close"]',
          'button:has(svg path[d*="M"])',
          '[data-testid="close-button"]',
          '.close-button',
          'button[class*="close"]'
        ];
        
        for (const selector of closeSelectors) {
          const closeButton = document.querySelector(selector);
          if (closeButton) {
            closeButton.click();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Check if closed
            const modalCheck = document.querySelector(this.orderSelectors.detailModal);
            if (!modalCheck || !modalCheck.offsetParent) {
              return; // Success
            }
          }
        }
        
        // Strategy 3: Click backdrop/overlay
        const backdrop = document.querySelector('[class*="backdrop"], [class*="overlay"], [class*="modal-bg"]');
        if (backdrop) {
          backdrop.click();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const modalCheck3 = document.querySelector(this.orderSelectors.detailModal);
          if (!modalCheck3 || !modalCheck3.offsetParent) {
            return; // Success
          }
        }
        
        // REMOVED: Navigation logic that was causing page refresh loops
        // Never navigate away from the page
        
      } catch (error) {
        console.error('Error closing order details:', error);
        // REMOVED: Navigation fallback
      }
      */
    }
  
    findOrderElements() {
      const selectors = this.orderSelectors.orderContainer.split(', ');
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found orders using selector: ${selector}`);
          return elements;
        }
      }
      
      const possibleContainers = document.querySelectorAll('[class*="order"], [id*="order"]');
      if (possibleContainers.length > 0) {
        console.log('Found orders using fallback selector');
        return possibleContainers;
      }
      
      return [];
    }
  
    extractOrderData(orderElement, index) {
      const order = {
        id: `order_${Date.now()}_${index}`,
        number: this.extractText(orderElement, this.orderSelectors.orderNumber) || `#${index + 1}`,
        timestamp: this.extractTimestamp(orderElement),
        items: []
      };
      
      const itemElements = this.findItemElements(orderElement);
      
      itemElements.forEach((itemEl) => {
        const item = this.extractItemData(itemEl);
        if (item && item.name) {
          order.items.push(item);
        }
      });
      
      return order;
    }
  
    findItemElements(orderElement) {
      const selectors = this.orderSelectors.itemContainer.split(', ');
      
      for (const selector of selectors) {
        const elements = orderElement.querySelectorAll(selector);
        if (elements.length > 0) {
          return elements;
        }
      }
      
      const textNodes = this.getTextNodes(orderElement);
      const itemTexts = textNodes.filter(text => 
        text.length > 3 && 
        !text.match(/^[\d\s\-\:]+$/) &&
        !text.toLowerCase().includes('order')
      );
      
      return itemTexts.map(text => ({ textContent: text, isTextNode: true }));
    }
  
    extractItemData(itemElement) {
      let name, quantity, price, modifiers;
      
      if (itemElement.isTextNode) {
        const parsed = this.parseItemText(itemElement.textContent);
        name = parsed.name;
        quantity = parsed.quantity;
        price = parsed.price;
        modifiers = parsed.modifiers;
      } else {
        name = this.extractText(itemElement, this.orderSelectors.itemName);
        quantity = this.extractQuantity(itemElement);
        price = this.extractPrice(itemElement);
        modifiers = this.extractModifiers(itemElement);
      }
      
      if (!name) {
        name = itemElement.textContent?.trim();
      }
      
      const fullName = modifiers && modifiers.length > 0 
        ? `${name} (${modifiers.join(', ')})` 
        : name;
      
      return {
        name: fullName,
        quantity: quantity || 1,
        price: price || 0,
        category: this.categoryManager.categorizeItem(name),
        modifiers
      };
    }
  
    parseItemText(text) {
      const quantityMatch = text.match(/^(\d+)\s*x?\s*/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      let remaining = quantityMatch ? text.slice(quantityMatch[0].length) : text;
      
      const priceMatch = remaining.match(/\$?([\d.]+)$/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
      
      if (priceMatch) {
        remaining = remaining.slice(0, -priceMatch[0].length).trim();
      }
      
      const modifierMatch = remaining.match(/\(([^)]+)\)/);
      const modifiers = modifierMatch 
        ? modifierMatch[1].split(',').map(m => m.trim())
        : [];
      
      const name = remaining.replace(/\([^)]+\)/, '').trim();
      
      return { name, quantity, price, modifiers };
    }
  
    extractText(element, selectors) {
      const selectorList = selectors.split(', ');
      
      for (const selector of selectorList) {
        const el = element.querySelector(selector);
        if (el && el.textContent) {
          return el.textContent.trim();
        }
      }
      
      return null;
    }
  
    extractQuantity(element) {
      const qtyText = this.extractText(element, this.orderSelectors.itemQuantity);
      if (qtyText) {
        const match = qtyText.match(/\d+/);
        return match ? parseInt(match[0]) : 1;
      }
      
      const fullText = element.textContent || '';
      const qtyMatch = fullText.match(/^(\d+)\s*x/i);
      return qtyMatch ? parseInt(qtyMatch[1]) : 1;
    }
  
    extractPrice(element) {
      const priceText = this.extractText(element, this.orderSelectors.itemPrice);
      if (priceText) {
        const match = priceText.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
      }
      
      const fullText = element.textContent || '';
      const priceMatch = fullText.match(/\$?([\d.]+)/);
      return priceMatch ? parseFloat(priceMatch[1]) : 0;
    }
  
    extractModifiers(element) {
      const modText = this.extractText(element, this.orderSelectors.itemModifiers);
      if (modText) {
        return modText.split(',').map(m => m.trim()).filter(m => m);
      }
      
      return [];
    }
  
    extractTimestamp(element) {
      const timeText = this.extractText(element, this.orderSelectors.orderTime);
      if (timeText) {
        const date = new Date(timeText);
        return isNaN(date.getTime()) ? Date.now() : date.getTime();
      }
      
      return Date.now();
    }
  
    getTextNodes(element) {
      const texts = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const text = node.textContent.trim();
            return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        texts.push(node.textContent.trim());
      }
      
      return texts;
    }
  }
  
  // Make available globally
  window.OrderExtractor = OrderExtractor;

  // ----- content/overlay.js -----
  console.log('[OverlayUI.js] Script loaded at:', new Date().toISOString());
  
  class OverlayUI {
    constructor(orderBatcher, categoryManager, batchManager, orderExtractor) {
      this.orderBatcher = orderBatcher;
      this.categoryManager = categoryManager;
      this.batchManager = batchManager;
      this.orderExtractor = orderExtractor;
      this.isCollapsed = false;
      this.overlayElement = null;
      this.orderChangeObserver = null;
      this.lastOrderCount = 0;
      this.lastOrderIds = new Set();
      this.isMonitoringChanges = false;
      this.packedItems = new Map(); // Track packed items by unique ID
    }
  
    init() {
      try {
        this.processedOrderIds = new Set();
        this.isExtracting = false;
        this.extractionQueue = [];
        this.isScrapingMode = false;
        
        // Load packed items from storage
        this.loadPackedState();
        this.tabId = Date.now(); // Unique ID for this tab
        
        this.createToggleButton();
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
        body:has(#otter-consolidator-overlay:not([style*="display: none"])) > div:first-of-type:not(#otter-consolidator-overlay):not(.otter-floating-toggle) {
          margin-right: 40vw !important;
          width: 60vw !important;
          transition: all 0.3s ease;
        }
        
        /* Alternative selector for different page structures */
        body:has(#otter-consolidator-overlay:not([style*="display: none"])) #root {
          margin-right: 40vw !important;
          width: 60vw !important;
          transition: all 0.3s ease;
        }
        
        /* Ensure floating buttons stay on top */
        .otter-floating-toggle {
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

    closeOverlay() {
      if (this.overlayElement) {
        this.overlayElement.style.display = 'none';
        // Save state
        chrome.storage.local.set({ consolidatorVisible: false });
        // Restore page layout
        const mainContent = document.querySelector('[data-adjusted="true"]');
        if (mainContent) {
          mainContent.style.marginRight = '0';
        }
        this.showNotification('Consolidator closed', 'info');
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
          <div class="otter-prep-stats">
            <span class="prep-time-label">Avg Prep:</span>
            <span class="prep-time-hour" title="Last hour average">--m</span>
            <span class="prep-time-today" title="Today's average">--m</span>
          </div>
          <div class="otter-api-status" id="api-status-container">
            <!-- API status will be inserted here -->
          </div>
          <button class="otter-clear-btn" title="Clear completed orders">🗑️ Clear Orders</button>
          <button class="otter-close-btn" title="Close consolidator">✕</button>
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

      // Add clear button listener
      const clearBtn = this.overlayElement.querySelector('.otter-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearCompletedOrders();
          this.showNotification('Orders cleared', 'success');
        });
      }

      // Add close button listener
      const closeBtn = this.overlayElement.querySelector('.otter-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeOverlay();
        });
      }

      // Add keyboard shortcut listener
      document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+O to toggle visibility
        if (e.ctrlKey && e.shiftKey && e.key === 'O') {
          e.preventDefault();
          this.toggleVisibility();
        }
        // Escape key to close overlay
        if (e.key === 'Escape' && this.overlayElement && this.overlayElement.style.display !== 'none') {
          e.preventDefault();
          this.closeOverlay();
        }
      });
      
      this.startBatchTimer();
      this.startPrepTimeUpdates();
      
      // Initial API status update with delay to ensure API client is loaded
      setTimeout(() => {
        this.updateAPIStatus();
      }, 1000);
      
      // Update API status periodically
      setInterval(() => {
        this.updateAPIStatus();
      }, 5000);
      
      // Listen for auth status changes
      window.addEventListener('message', (event) => {
        if (event.data.type === 'OTTER_AUTH_SUCCESS' || 
            event.data.type === 'OTTER_AUTH_LOGOUT' ||
            event.data.type === 'OTTER_API_CONNECTION_STATUS') {
          this.updateAPIStatus();
        }
      });
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
                   value="${this.batchManager.maxBatchCapacity}" min="1" max="20"
                   autocomplete="off" inputmode="numeric">
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
        // Remove any readonly or disabled attributes that might have been set
        capacityInput.removeAttribute('readonly');
        capacityInput.removeAttribute('disabled');

        // Handle both input and change events for better responsiveness
        const handleCapacityChange = async (e) => {
          const newCapacity = parseInt(e.target.value);
          if (newCapacity > 0 && newCapacity <= 20) {
            await this.batchManager.updateMaxCapacity(newCapacity);
            this.showNotification(`Batch size set to ${newCapacity} orders`, 'success');

            // Show save indicator
            const existingIndicator = capacityInput.parentElement.querySelector('.save-indicator');
            if (existingIndicator) {
              existingIndicator.remove();
            }

            const saveIndicator = document.createElement('span');
            saveIndicator.className = 'save-indicator';
            saveIndicator.textContent = '✓ Saved';
            saveIndicator.style.cssText = 'color: #5cb85c; margin-left: 10px; animation: fadeIn 0.3s;';
            capacityInput.parentElement.appendChild(saveIndicator);

            // Remove indicator after 2 seconds
            setTimeout(() => saveIndicator.remove(), 2000);
          } else if (e.target.value !== '') {
            // Reset to valid value if out of range
            capacityInput.value = this.batchManager.maxBatchCapacity;
            this.showNotification('Batch size must be between 1 and 20', 'error');
          }
        };

        capacityInput.addEventListener('change', handleCapacityChange);
        capacityInput.addEventListener('blur', handleCapacityChange);

        // Also allow Enter key to save
        capacityInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            handleCapacityChange(e);
          }
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
      
      // Clear button listener moved to header
      
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
                ${this.getEstimatedCompletionHtml(oldestWaitTime)}
              </div>
            </div>
            
            <div class="batch-content">
        `;
        
        // Add customer names section at the top if there are orders
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
            
            // Check if order is running late based on prep time
            let isLate = false;
            let lateIndicator = '';
            if (window.otterPrepTimeTracker && elapsedTime > 0 && !order.completed) {
              const stats = window.otterPrepTimeTracker.getLastHourAverage();
              const avgPrepTime = stats.orderCount > 0 ? stats.averageMinutes : 
                                 window.otterPrepTimeTracker.getTodayAverage().averageMinutes;
              
              if (avgPrepTime > 0 && elapsedTime > avgPrepTime) {
                isLate = true;
                const overBy = elapsedTime - avgPrepTime;
                lateIndicator = ` ⚠️ +${overBy}m`;
              }
            }
            
            const elapsedClass = elapsedTime >= 15 ? 'elapsed-overdue' : 
                               isLate ? 'prep-time-late' : '';
            
            html += `
              <div class="batch-customer-badge ${orderClass} ${elapsedClass}" data-order-color="${order.colorIndex}">
                <span class="customer-name">${window.escapeHtml(order.customerName)}</span>
                <span class="customer-order">${window.escapeHtml(order.number || order.orderNumber)}</span>
                <span class="customer-wait-time">${window.escapeHtml(this.formatElapsedTime(elapsedTime))}${lateIndicator}</span>
              </div>
            `;
          });
          
          html += `
              </div>
            </div>
          `;
        }
        
        // Start three-column wrapper for items with horizontal scroll
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
              
              // PROTEIN-FIRST CATEGORIZATION - Group by protein type regardless of dish type
              const itemNameLower = (item.name || '').toLowerCase();

              // Extract protein type from item name or categoryInfo
              // Note: Orange is a sauce, not a protein - check if it's grilled or crispy
              if (itemNameLower.includes('grilled') && itemNameLower.includes('orange')) {
                proteinGroup = 'Grilled Chicken';
              } else if (itemNameLower.includes('orange') && itemNameLower.includes('chicken')) {
                // Orange chicken is typically crispy
                proteinGroup = 'Crispy Chicken';
              } else if (itemNameLower.includes('crispy chicken') || itemNameLower.includes('crispy chick')) {
                proteinGroup = 'Crispy Chicken';
              } else if (itemNameLower.includes('grilled chicken') || itemNameLower.includes('grilled chick')) {
                proteinGroup = 'Grilled Chicken';
              } else if (itemNameLower.includes('bulgogi') || itemNameLower.includes('steak')) {
                proteinGroup = 'Steak/Bulgogi';
              } else if (itemNameLower.includes('salmon')) {
                proteinGroup = 'Salmon';
              } else if (itemNameLower.includes('shrimp')) {
                proteinGroup = 'Shrimp';
              } else if (itemNameLower.includes('pork')) {
                proteinGroup = 'Pork';
              } else if (itemNameLower.includes('fish')) {
                proteinGroup = 'Fish';
              } else if (itemNameLower.includes('tofu')) {
                proteinGroup = 'Tofu';
              } else if (itemNameLower.includes('cauliflower')) {
                proteinGroup = 'Cauliflower';
              } else if (itemNameLower.includes('dumpling')) {
                // Dumplings stay as their own category
                proteinGroup = 'Dumplings';
              } else if (itemNameLower.includes('crab rangoon') || itemNameLower.includes('rangoon')) {
                proteinGroup = 'Appetizers';
              } else if (itemNameLower.includes('drink') || itemNameLower.includes('tea') ||
                         itemNameLower.includes('soda') || itemNameLower.includes('lemonade')) {
                proteinGroup = 'Drinks';
              } else if (item.categoryInfo && item.categoryInfo.subCategoryName &&
                         item.categoryInfo.subCategoryName !== 'Other' &&
                         item.categoryInfo.subCategoryName !== 'General') {
                // Use subcategory from categoryInfo if available
                proteinGroup = item.categoryInfo.subCategoryName;
              } else if (item.categoryInfo && item.categoryInfo.topCategoryName) {
                // Fall back to top category
                proteinGroup = item.categoryInfo.topCategoryName;
              } else {
                proteinGroup = 'Other';
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
              
              // Determine category type for color coding based on protein group
              let categoryType = 'other';
              const groupLower = proteinGroup.toLowerCase();

              // Map protein groups to color categories
              if (groupLower === 'crispy chicken') categoryType = 'crispy-rice-bowls';
              else if (groupLower === 'grilled chicken') categoryType = 'grilled-rice-bowls';
              else if (groupLower === 'steak/bulgogi' || groupLower.includes('steak')) categoryType = 'steak';
              else if (groupLower === 'salmon') categoryType = 'salmon';
              else if (groupLower === 'shrimp') categoryType = 'shrimp';
              else if (groupLower === 'pork') categoryType = 'pork';
              else if (groupLower === 'fish') categoryType = 'salmon';
              else if (groupLower === 'tofu') categoryType = 'tofu';
              else if (groupLower === 'cauliflower') categoryType = 'cauliflower';
              else if (groupLower === 'dumplings') categoryType = 'dumplings';
              else if (groupLower === 'drinks') categoryType = 'drinks';
              else if (groupLower === 'appetizers') categoryType = 'appetizers';
              else if (groupLower.includes('noodle')) categoryType = 'noodles';
              else if (groupLower.includes('rice') && !groupLower.includes('chicken')) categoryType = 'fried-rice';
              else if (groupLower.includes('side')) categoryType = 'sides';
              else if (groupLower.includes('dessert')) categoryType = 'desserts';
              else if (groupLower === 'other') categoryType = 'other';
              else categoryType = 'uncategorized';

              html += `
                <div class="wave-category-group">
                  <h5 class="wave-category-header" data-category="${categoryType}">${window.escapeHtml(proteinGroup)}</h5>
                  <ul class="wave-item-list">
              `;
              
              items.forEach(item => {
                // Debug check at the very start of rendering
                if (item.isRiceBowl || item.isUrbanBowl || (item.name && (item.name.toLowerCase().includes('rice bowl') || item.name.toLowerCase().includes('urban bowl')))) {
                  console.log(`[Batch View Render] About to render item:`, {
                    name: item.name,
                    modifierDetails: item.modifierDetails,
                    modifiers: item.modifiers,
                    isRiceBowl: item.isRiceBowl,
                    isUrbanBowl: item.isUrbanBowl,
                    hasModifierDetails: !!item.modifierDetails,
                    sauceInModifierDetails: item.modifierDetails?.sauce
                  });
                }
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
                
                // Generate unique ID for this wave item
                const waveItemId = `${item.name || item.baseName}-${item.size}-${JSON.stringify(item.modifierDetails || {})}`.replace(/[^a-zA-Z0-9]/g, '-');
                const isWaveItemPacked = this.packedItems.has(waveItemId);
                
                html += `
                  <li class="${itemClass} ${isWaveItemPacked ? 'packed' : ''}" data-item-id="${waveItemId}"${customerNames}>
                    ${colorDotsHtml}
                    <span class="wave-item-name">${this.formatItemNameWithSauce(item.baseName || item.name, item)}</span>
                    <div class="wave-item-details">
                      <span class="wave-item-quantity">${window.escapeHtml(item.batchQuantity || item.totalQuantity || 0)}x</span>
                    ${item.size && item.size !== 'no-size' && item.size !== 'urban' ? (() => {
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
                          riceTypeDisplay = 'Fried Rice';
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
                    ${(() => {
                      // Add additional badges for modifiers (sauce, rice type, dumplings)
                      let badges = '';
                      
                      // Debug logging
                      if (item.isRiceBowl || item.isUrbanBowl || (item.name && (item.name.toLowerCase().includes('rice bowl') || item.name.toLowerCase().includes('urban bowl')))) {
                        console.log(`[Batch View] Rendering badges for item:`, {
                          name: item.name,
                          modifierDetails: item.modifierDetails,
                          modifiers: item.modifiers,
                          isRiceBowl: item.isRiceBowl,
                          isUrbanBowl: item.isUrbanBowl,
                          dumplingType: item.dumplingType,
                          sauceType: item.sauceType
                        });
                      }
                      
                      // Check for sauce badges (Rice Bowls)
                      if ((item.modifierDetails && item.modifierDetails.sauce) || item.sauceType) {
                        const sauceMod = (item.modifierDetails?.sauce || item.sauceType || '').toLowerCase();
                        let sauceName = '';
                        let sauceClass = '';
                        
                        if (sauceMod.includes('orange')) {
                          sauceName = 'Orange';
                          sauceClass = 'orange';
                        } else if (sauceMod.includes('chipotle aioli')) {
                          sauceName = 'Chipotle Aioli';
                          sauceClass = 'chipotle';
                        } else if (sauceMod.includes('jalapeño herb') || sauceMod.includes('jalapeno herb')) {
                          sauceName = 'Jalapeño Herb';
                          sauceClass = 'jalapeno';
                        } else if (sauceMod.includes('sesame aioli')) {
                          sauceName = 'Sesame Aioli';
                          sauceClass = 'sesame';
                        } else if (sauceMod.includes('garlic aioli')) {
                          sauceName = 'Garlic Aioli';
                          sauceClass = 'garlic';
                        } else if (sauceMod.includes('sweet sriracha')) {
                          sauceName = 'Sweet Sriracha';
                          sauceClass = 'sriracha';
                        } else if (sauceMod.includes('garlic sesame fusion')) {
                          sauceName = 'Garlic Sesame';
                          sauceClass = 'garlic-sesame';
                        } else if (sauceMod.includes('sweet shoyu')) {
                          sauceName = 'Sweet Shoyu';
                          sauceClass = 'shoyu';
                        } else if (sauceMod.includes('soy ginger')) {
                          sauceName = 'Soy Ginger';
                          sauceClass = 'soy-ginger';
                        } else if (sauceMod.includes('spicy yuzu')) {
                          sauceName = 'Spicy Yuzu';
                          sauceClass = 'yuzu';
                        } else if (sauceMod.includes('teriyaki')) {
                          sauceName = 'Teriyaki';
                          sauceClass = 'teriyaki';
                        } else {
                          // Try to extract sauce name
                          const originalSauce = item.modifierDetails?.sauce || item.sauceType || '';
                          const withIndex = sauceMod.indexOf('with');
                          if (withIndex !== -1) {
                            sauceName = originalSauce.substring(withIndex + 5).trim();
                            sauceClass = 'default';
                          } else {
                            sauceName = 'Sauce';
                            sauceClass = 'default';
                          }
                        }
                        
                        if (sauceName) {
                          // Clean up sauce name - remove "Gluten Free" text
                          sauceName = sauceName.replace(/\s*Gluten\s*Free\s*/gi, '').trim();
                          badges += `<span class="sauce-badge ${sauceClass}">${sauceName}</span>`;
                        }
                      }
                      
                      // Check for Rice Bowl rice substitution
                      if ((item.isRiceBowl || (item.name && item.name.toLowerCase().includes('rice bowl'))) && 
                          item.modifierDetails?.riceSubstitution && 
                          item.modifierDetails.riceSubstitution !== 'White Rice') {
                        const riceSub = item.modifierDetails.riceSubstitution.toLowerCase();
                        let riceType = '';
                        let riceClass = '';
                        
                        if (riceSub.includes('garlic butter')) {
                          riceType = 'Garlic Butter Rice';
                          riceClass = 'garlic-butter';
                        } else if (riceSub.includes('fried rice')) {
                          riceType = 'Fried Rice';
                          riceClass = 'fried-rice';
                        } else if (riceSub.includes('noodle')) {
                          riceType = 'Noodles';
                          riceClass = 'noodles';
                        }
                        
                        if (riceType) {
                          badges += `<span class="rice-type-badge ${riceClass}">${riceType}</span>`;
                        }
                      }
                      
                      // Check for Urban Bowl rice substitution
                      if ((item.isUrbanBowl || (item.name && item.name.toLowerCase().includes('urban bowl'))) && 
                          ((item.modifierDetails && item.modifierDetails.riceSubstitution && 
                            item.modifierDetails.riceSubstitution !== 'White Rice') ||
                           (item.riceSubType && item.riceSubType !== 'White Rice'))) {
                        const riceSub = (item.riceSubType || (item.modifierDetails && item.modifierDetails.riceSubstitution) || '').toLowerCase();
                        let riceType = '';
                        let riceClass = '';
                        
                        if (riceSub.includes('garlic butter')) {
                          riceType = 'Garlic Butter Rice';
                          riceClass = 'garlic-butter';
                        } else if (riceSub.includes('fried rice')) {
                          riceType = 'Fried Rice';
                          riceClass = 'fried-rice';
                        } else if (riceSub.includes('noodle')) {
                          riceType = 'Noodles';
                          riceClass = 'noodles';
                        }
                        
                        if (riceType) {
                          badges += `<span class="rice-type-badge ${riceClass}">${riceType}</span>`;
                        }
                      }
                      
                      // Check for Urban Bowl dumplings
                      if ((item.isUrbanBowl || (item.name && item.name.toLowerCase().includes('urban bowl')))) {
                        console.log(`[Urban Bowl Tag Debug] Checking item:`, {
                          name: item.name,
                          isUrbanBowl: item.isUrbanBowl,
                          dumplingType: item.dumplingType,
                          riceSubType: item.riceSubType,
                          hasModifierDetails: !!item.modifierDetails,
                          modifierDetails: item.modifierDetails,
                          allItemProperties: Object.keys(item)
                        });
                      }
                      if ((item.isUrbanBowl || (item.name && item.name.toLowerCase().includes('urban bowl'))) && 
                          (item.dumplingType || item.modifierDetails?.dumplingChoice)) {
                        const dumplingChoice = (item.dumplingType || item.modifierDetails?.dumplingChoice || '').toLowerCase();
                        let dumplingProtein = '';
                        let dumplingClass = '';
                        
                        // Handle colon format
                        let dumplingType = dumplingChoice;
                        if (dumplingChoice.includes(':')) {
                          const parts = dumplingChoice.split(':');
                          dumplingType = parts[1].trim();
                        }
                        
                        if (dumplingType.includes('pork')) {
                          dumplingProtein = '3pc Pork';
                          dumplingClass = 'pork';
                        } else if (dumplingType.includes('chicken')) {
                          dumplingProtein = '3pc Chicken';
                          dumplingClass = 'chicken';
                        } else if (dumplingType.includes('vegetable') || dumplingType.includes('veggie')) {
                          dumplingProtein = '3pc Vegetable';
                          dumplingClass = 'vegetable';
                        } else {
                          dumplingProtein = '3pc Dumplings';
                          dumplingClass = 'default';
                        }
                        
                        if (dumplingProtein) {
                          badges += `<span class="dumpling-protein-badge ${dumplingClass}">${dumplingProtein}</span>`;
                        }
                      }
                      
                      // Fallback: check modifiers array if modifierDetails is empty
                      if (!badges && item.modifiers && Array.isArray(item.modifiers)) {
                        item.modifiers.forEach(mod => {
                          const modName = (typeof mod === 'object' && mod.name ? mod.name : mod).toLowerCase();
                          
                          // Check for sauce modifiers
                          if ((modName.includes('top steak with') || modName.includes('top salmon with')) && 
                              modName.includes('sauce') && !badges.includes('sauce-badge')) {
                            // Extract sauce name
                            let sauceName = '';
                            let sauceClass = '';
                            
                            if (modName.includes('orange')) {
                              sauceName = 'Orange';
                              sauceClass = 'orange';
                            } else if (modName.includes('chipotle aioli')) {
                              sauceName = 'Chipotle Aioli';
                              sauceClass = 'chipotle';
                            } else if (modName.includes('jalapeño herb') || modName.includes('jalapeno herb')) {
                              sauceName = 'Jalapeño Herb';
                              sauceClass = 'jalapeno';
                            } else if (modName.includes('sesame aioli')) {
                              sauceName = 'Sesame Aioli';
                              sauceClass = 'sesame';
                            } else if (modName.includes('garlic aioli')) {
                              sauceName = 'Garlic Aioli';
                              sauceClass = 'garlic';
                            }
                            
                            if (sauceName) {
                              badges += `<span class="sauce-badge ${sauceClass}">${sauceName}</span>`;
                            }
                          }
                        });
                      }
                      
                      return badges;
                    })()}
                      ${maxElapsedTime > 0 ? `<span class="item-wait-time ${isOverdue ? 'overdue' : ''}">${window.escapeHtml(this.formatElapsedTime(maxElapsedTime))}</span>` : ''}
                    </div>
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
      
      // Individual orders section removed for cleaner UI
      
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
      
      
      // Add order note click listeners
      container.querySelectorAll('.order-notes.clickable').forEach(noteSpan => {
        noteSpan.addEventListener('click', (e) => {
          const orderNumber = e.target.dataset.orderNumber;
          const customerName = e.target.dataset.customer;
          const notes = e.target.dataset.notes;
          this.showOrderNoteModal(orderNumber, notes, customerName);
        });
      });
      
      // Add click handlers for wave items to toggle packed state
      container.querySelectorAll('.wave-item').forEach(item => {
        item.addEventListener('click', (e) => {
          // Don't toggle if clicking on other interactive elements
          if (e.target.classList.contains('order-notes') || 
              e.target.classList.contains('complete-wave-btn')) {
            return;
          }
          
          const itemId = item.dataset.itemId;
          if (!itemId) return;
          
          // Toggle packed state
          if (this.packedItems.has(itemId)) {
            this.packedItems.delete(itemId);
            item.classList.remove('packed');
          } else {
            this.packedItems.set(itemId, true);
            item.classList.add('packed');
          }
          
          // Save state
          this.savePackedState();
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
    
    // renderIndividualOrders method removed - no longer needed
    
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
  
      
    savePackedState() {
      try {
        const packedArray = Array.from(this.packedItems.keys());
        GM_setValue('packedItems', packedArray);
      } catch (error) {
        console.error('Error saving packed state:', error);
      }
    }
    
    loadPackedState() {
      try {
        const packedArray = GM_getValue('packedItems', []);
        this.packedItems = new Map(packedArray.map(id => [id, true]));
      } catch (error) {
        console.error('Error loading packed state:', error);
        this.packedItems = new Map();
      }
    }
  
    
    // Helper function to underline and highlight sauce names in item names
    formatItemNameWithSauce(itemName, item = null) {
      // Known sauce keywords and patterns
      const saucePatterns = [
        // Specific multi-word sauces
        'Garlic Sesame Fusion',
        'Sweet Shoyu',
        'Soy Ginger',
        'Sweet & Sour',
        'Honey Mustard',
        'Spicy Yuzu',
        
        // Compound sauces (word + Aioli/Sauce/etc)
        '\\w+\\s+Aioli',           // Matches: Garlic Aioli, Chipotle Aioli, Sesame Aioli, etc.
        '\\w+\\s+Sauce',           // Matches: Orange Sauce, Buffalo Sauce, etc.
        '\\w+\\s+Glaze',           // Matches: Teriyaki Glaze, etc.
        '\\w+\\s+Dressing',        // Matches: Ranch Dressing, etc.
        
        // Single word sauces
        'Orange',
        'Bulgogi',
        'Sesame',
        'Teriyaki',
        'Buffalo',
        'BBQ',
        'Ranch',
        'Ponzu',
        'Yuzu',
        'Miso',
        'Gochujang',
        'Sriracha',
        'Wasabi',
        'Chimichurri',
        'Pesto',
        'Alfredo',
        'Marinara'
      ];
      
      let formattedName = itemName;
      
      // For Urban Bowls, add rice type to the name if it's not white rice
      if (item && (item.isUrbanBowl || (item.name && item.name.toLowerCase().includes('urban bowl')))) {
        let riceType = 'White Rice'; // Default
        
        // Check for rice substitution in various places
        if (item.categoryInfo && item.categoryInfo.modifiers && item.categoryInfo.modifiers.riceSubstitution) {
          riceType = item.categoryInfo.modifiers.riceSubstitution;
        } else if (item.modifiers) {
          // Check in modifiers array
          if (Array.isArray(item.modifiers)) {
            item.modifiers.forEach(mod => {
              const modName = (mod.name || mod).toLowerCase();
              if (modName.includes('garlic butter') && modName.includes('rice')) {
                riceType = 'Garlic Butter Fried Rice';
              } else if (modName.includes('fried rice') && !modName.includes('garlic')) {
                riceType = 'Fried Rice';
              } else if (modName.includes('noodle')) {
                riceType = 'Noodles';
              }
            });
          }
          // Check in modifiers object
          else if (item.modifiers.riceSubstitution) {
            riceType = item.modifiers.riceSubstitution;
          }
        }
        
        // Modify the display name based on rice type
        if (riceType !== 'White Rice') {
          // Replace "Urban Bowl" with "Urban Bowl - [Rice Type]"
          formattedName = formattedName.replace(/Urban Bowl/i, `Urban Bowl - ${riceType.replace(' Substitute', '').replace(' for Rice', '')}`);
        }
      }
      
      // First, check for known multi-word and compound patterns
      saucePatterns.forEach(pattern => {
        const regex = new RegExp(`(${pattern})`, 'gi');
        const matches = formattedName.match(regex);
        if (matches) {
          matches.forEach(match => {
            // Only replace if not already formatted
            if (!formattedName.includes(`<span class="sauce-highlight">${match}</span>`)) {
              formattedName = formattedName.replace(new RegExp(match, 'gi'), `<span class="sauce-highlight">$&</span>`);
            }
          });
        }
      });
      
      // Additional smart detection for patterns like "X-Style" or "X-Flavored"
      const stylePatterns = [
        '(\\w+)[-\\s]Style',       // Korean-Style, Thai Style
        '(\\w+)[-\\s]Flavored',    // Lemon-Flavored
        '(\\w+)[-\\s]Infused',     // Herb-Infused
        '(\\w+)[-\\s]Seasoned'     // Cajun-Seasoned
      ];
      
      stylePatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        formattedName = formattedName.replace(regex, '<span class="sauce-highlight">$&</span>');
      });
      
      // Detect sauce indicators in context (e.g., "with X Sauce" or "in X")
      const contextPatterns = [
        'with\\s+(\\w+(?:\\s+\\w+)?)',     // "with Teriyaki"
        'in\\s+(\\w+(?:\\s+\\w+)?\\s+Sauce)', // "in Orange Sauce"
        '\\((\\w+(?:\\s+\\w+)?(?:\\s+Sauce)?)\\)' // "(Spicy Mayo)"
      ];
      
      contextPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const matches = formattedName.match(regex);
        if (matches) {
          matches.forEach(match => {
            // Extract just the sauce name part
            const sauceMatch = match.replace(/^(with|in)\s+/i, '').replace(/[()]/g, '');
            if (!formattedName.includes(`<span class="sauce-highlight">${sauceMatch}</span>`)) {
              formattedName = formattedName.replace(sauceMatch, `<span class="sauce-highlight">${sauceMatch}</span>`);
            }
          });
        }
      });
      
      return formattedName;
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
                <span class="wave-item-name">${this.formatItemNameWithSauce(item.name)}</span>
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
      
      // Remove only completed orders without rebuilding everything
      let removedCount = 0;
      
      // Remove completed orders from batchManager
      this.batchManager.batches.forEach(batch => {
        const ordersToRemove = [];
        
        batch.orders.forEach((order, orderId) => {
          if (order.completed) {
            ordersToRemove.push(orderId);
          }
        });
        
        // Remove the orders
        ordersToRemove.forEach(orderId => {
          batch.orders.delete(orderId);
          removedCount++;
          console.log(`[Overlay] Removed completed order ${orderId} from batch ${batch.number}`);
        });
      });
      
      // Remove completed orders from orderBatcher
      if (removedCount > 0) {
        const remainingOrders = this.orderBatcher.getAllOrders().filter(order => {
          // Check if order is marked as completed in any batch
          for (const batch of this.batchManager.batches) {
            const batchOrder = batch.orders.get(order.id);
            if (batchOrder && batchOrder.completed) {
              return false; // Filter out completed orders
            }
          }
          return true; // Keep non-completed orders
        });
        
        // Only update the orderBatcher with remaining orders
        this.orderBatcher.clearBatches();
        remainingOrders.forEach(order => this.orderBatcher.addOrder(order));
        
        this.showNotification(`Cleared ${removedCount} completed order${removedCount > 1 ? 's' : ''}`, 'success');
        
        // Just re-render, no need to refresh batch assignments
        this.render();
      } else {
        this.showNotification('No completed orders to clear', 'info');
      }
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
      
      // Update prep time statistics
      this.updatePrepTimeStats();
    }
    
    updatePrepTimeStats() {
      if (!window.otterPrepTimeTracker) {
        return;
      }
      
      try {
        const lastHour = window.otterPrepTimeTracker.getLastHourAverage();
        const today = window.otterPrepTimeTracker.getTodayAverage();
        
        const hourElement = this.overlayElement.querySelector('.prep-time-hour');
        const todayElement = this.overlayElement.querySelector('.prep-time-today');
        
        if (hourElement) {
          if (lastHour.orderCount > 0) {
            hourElement.textContent = `${lastHour.averageMinutes}m`;
            hourElement.title = `Last hour average (${lastHour.orderCount} orders)`;
          } else {
            hourElement.textContent = '--m';
            hourElement.title = 'No completed orders in last hour';
          }
        }
        
        if (todayElement) {
          if (today.orderCount > 0) {
            todayElement.textContent = `${today.averageMinutes}m`;
            todayElement.title = `Today's average (${today.orderCount} orders)`;
          } else {
            todayElement.textContent = '--m';
            todayElement.title = 'No completed orders today';
          }
        }
      } catch (error) {
        console.error('[OverlayUI] Error updating prep time stats:', error);
      }
    }
    
    updateAPIStatus() {
      const container = this.overlayElement?.querySelector('#api-status-container');
      if (!container) {
        console.log('[OverlayUI] API status container not found');
        return;
      }
      
      const apiClient = window.otterAPIClient;
      if (!apiClient) {
        console.log('[OverlayUI] API client not initialized');
        container.innerHTML = '';
        return;
      }
      
      const isAuth = apiClient.isAuthenticated();
      console.log('[OverlayUI] API Status Update:', {
        authenticated: isAuth,
        hasToken: !!apiClient.token,
        restaurantId: apiClient.restaurantId,
        restaurantName: apiClient.restaurantName
      });
      
      if (isAuth) {
        // Only show connected if we actually have valid credentials
        const statusColor = '#28a745';
        const statusText = 'Connected to Mock API';
        
        container.innerHTML = `
          <div class="api-status connected" style="
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            padding: 4px 8px;
            background: ${statusColor}20;
            border-radius: 4px;
            cursor: pointer;
          " title="${apiClient.restaurantName || 'Test Restaurant'}">
            <span style="width: 8px; height: 8px; background: ${statusColor}; border-radius: 50%;"></span>
            <span style="color: ${statusColor};">${statusText}</span>
          </div>
        `;
        
        // Removed API authentication click handler
      } else {
        container.innerHTML = `
          <button class="clear-all-btn" id="clear-completed" style="
            padding: 4px 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
          " title="Clear all cached data and orders">
            🗑️ Clear All
          </button>
        `;
        
        container.querySelector('.clear-all-btn').addEventListener('click', () => {
          this.clearCompletedOrders();
        });
      }
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
    
    startPrepTimeUpdates() {
      // Update prep time stats every 30 seconds
      setInterval(() => {
        this.updatePrepTimeStats();
      }, 30000);
      
      // Also update immediately
      this.updatePrepTimeStats();
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
    
    getEstimatedCompletionHtml(elapsedTime) {
      if (!window.otterPrepTimeTracker) {
        return '';
      }
      
      try {
        const lastHour = window.otterPrepTimeTracker.getLastHourAverage();
        const today = window.otterPrepTimeTracker.getTodayAverage();
        
        // Use last hour average if available, otherwise use today's average
        const avgPrepTime = lastHour.orderCount > 0 ? lastHour.averageMinutes : 
                           today.orderCount > 0 ? today.averageMinutes : 0;
        
        if (avgPrepTime === 0) {
          return '<span class="est-completion" title="No prep time data available">Est: --</span>';
        }
        
        // Calculate remaining prep time
        const remainingTime = Math.max(0, avgPrepTime - elapsedTime);
        
        // Format the display
        let displayText;
        let className = 'est-completion';
        
        if (remainingTime === 0) {
          displayText = 'Ready!';
          className += ' ready';
        } else if (remainingTime < 5) {
          displayText = `Est: ${remainingTime}m`;
          className += ' soon';
        } else {
          displayText = `Est: ${remainingTime}m`;
        }
        
        const dataSource = lastHour.orderCount > 0 ? 
          `Based on last hour (${lastHour.orderCount} orders)` :
          `Based on today (${today.orderCount} orders)`;
        
        return `<span class="${className}" title="${dataSource}">${displayText}</span>`;
      } catch (error) {
        console.error('[OverlayUI] Error calculating estimated completion:', error);
        return '';
      }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
      // All notifications disabled - too annoying
      return null;
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

    showOrderNoteModal(orderNumber, orderNotes, customerName) {
      // Create modal backdrop
      const modalBackdrop = document.createElement('div');
      modalBackdrop.className = 'otter-modal-backdrop';
      
      // Create modal content
      const modal = document.createElement('div');
      modal.className = 'otter-note-modal';
      modal.innerHTML = `
        <div class="modal-header">
          <h3>📝 Order Note - #${orderNumber}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-customer"><strong>Customer:</strong> ${customerName}</p>
          <div class="modal-note-content">${orderNotes}</div>
        </div>
        <div class="modal-footer">
          <button class="modal-acknowledge">Acknowledge</button>
        </div>
      `;
      
      modalBackdrop.appendChild(modal);
      this.overlayElement.appendChild(modalBackdrop);
      
      // Add event handlers
      const closeModal = () => {
        modalBackdrop.classList.add('fade-out');
        setTimeout(() => modalBackdrop.remove(), 300);
      };
      
      modal.querySelector('.modal-close').addEventListener('click', closeModal);
      modal.querySelector('.modal-acknowledge').addEventListener('click', closeModal);
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
      
      // Show modal with animation
      setTimeout(() => modalBackdrop.classList.add('show'), 10);
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
        console.log(`[OrderMonitoring] Found ${completedOrders.length} completed orders`);
        
        // Always use manual mode: mark as completed with strikethrough
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
            'body > div:not(#otter-consolidator-overlay):not(.otter-floating-toggle)'
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
            mainContent.style.marginRight = '40vw';
            mainContent.style.width = '60vw';
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
            
            // Check for new orders with notes
            const ordersWithNotes = reactOrders.filter(order => {
              return order.orderNotes && !previousOrderIds.has(order.id);
            });
            
            // Show notification for each new order with notes
            if (ordersWithNotes.length > 0) {
              ordersWithNotes.forEach(order => {
                const customerName = order.recipientName || order.customerName || 'Customer';
                this.showNotification(
                  `⚠️ Order #${order.orderNumber} has notes - ${customerName}`,
                  'warning',
                  5000
                );
              });
              
              // If there's only one order with notes, automatically show the modal
              if (ordersWithNotes.length === 1) {
                const order = ordersWithNotes[0];
                const customerName = order.recipientName || order.customerName || 'Customer';
                setTimeout(() => {
                  this.showOrderNoteModal(order.orderNumber, order.orderNotes, customerName);
                }, 500);
              }
            }
            
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
      
      // Mode toggle button removed
      
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
      // Mode toggle button removed
      
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
      // Mode toggle button removed - no update needed
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
          background: #5cb85c;
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
      
      // Clear packed items
      this.packedItems.clear();
      this.savePackedState();
      console.log('[OverlayUI] Cleared packed items');
      
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
    
    
  }
  
  // Make available globally
  window.OverlayUI = OverlayUI;


  // ----- content/debugHelper.js -----
  console.log('[DebugHelper.js] Script loaded at:', new Date().toISOString());
  
  // Debug helper functions for Otter Order Consolidator
  // These functions can be called from the Chrome console
  
  window.otterDebug = {
    // Check extension status
    status() {
      console.log('=== OTTER EXTENSION STATUS ===');
      console.log('Extension Loaded:', !!window.otterOverlayUI);
      console.log('Network Monitor:', !!window.otterNetworkMonitor);
      console.log('Order Cache:', !!window.otterOrderCache);
      console.log('Tab ID:', window.otterOverlayUI?.tabId);
      console.log('Is Leader:', window.otterOverlayUI?.isScrapingMode);
      console.log('Order Batcher:', !!window.otterOverlayUI?.orderBatcher);
      console.log('Batch Manager:', !!window.otterOverlayUI?.batchManager);
      console.log('Current Batch:', window.otterOverlayUI?.batchManager?.currentBatchIndex);
      console.log('Total Batches:', window.otterOverlayUI?.batchManager?.batches?.length);
      console.log('Processed Orders:', window.otterOverlayUI?.processedOrderIds?.size);
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
      if (window.otterOverlayUI) {
        // Clear order batcher
        window.otterOverlayUI.orderBatcher?.clearBatches();
        
        // Reset batch manager
        if (window.otterOverlayUI.batchManager) {
          window.otterOverlayUI.batchManager.batches = [];
          window.otterOverlayUI.batchManager.currentBatchIndex = 0;
          window.otterOverlayUI.batchManager.nextBatchNumber = 1;
        }
        
        // Clear processed orders
        window.otterOverlayUI.processedOrderIds = new Set();
        
        // Clear caches
        window.otterOrderCache?.clear();
        
        // Re-render
        window.otterOverlayUI.render();
        
        console.log('✅ Extension reset complete');
        return 'Reset complete - ready for fresh extraction';
      } else {
        return '❌ Extension not loaded';
      }
    },
  
    // Extract orders manually
    async extractOrders() {
      console.log('📋 Starting manual order extraction...');
      if (!window.otterOverlayUI || !window.otterOverlayUI.isScrapingMode) {
        console.warn('⚠️ Not in leader mode. Use otterDebug.forceLeader() first');
        return 'Must be in leader mode to extract';
      }
      
      // Call the extraction function
      if (window.extractAndBatchOrders) {
        await window.extractAndBatchOrders(false);
        return 'Extraction started - check sidebar for results';
      } else {
        return 'Extraction function not available';
      }
    },
  
    // Show current orders
    showOrders() {
      console.log('=== CURRENT ORDERS ===');
      const orders = window.otterOverlayUI?.orderBatcher?.getAllOrders() || [];
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
      const batches = window.otterOverlayUI?.orderBatcher?.getBatchedItems() || [];
      if (batches.length === 0) {
        console.log('No batched items yet');
        return 'No batches';
      }
      
      const bySize = window.otterOverlayUI?.orderBatcher?.getBatchesBySize() || {};
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
  
    // Show batches
    showBatchDetails() {
      console.log('=== CURRENT BATCHES ===');
      const batches = window.otterOverlayUI?.batchManager?.batches || [];
      if (batches.length === 0) {
        console.log('No batches created yet');
        return 'No batches';
      }
      
      batches.forEach((batch, index) => {
        const urgency = window.otterOverlayUI?.batchManager?.getBatchUrgency(batch) || 'normal';
        console.log(`\nBatch ${batch.number} (${urgency}):`);
        console.log(`  Orders: ${batch.orders?.size || 0}`);
        console.log(`  Items: ${batch.items?.size || 0}`);
        console.log(`  Locked: ${batch.isLocked || false}`);
        console.log(`  Created: ${new Date(batch.createdAt).toLocaleTimeString()}`);
      });
      
      return `${batches.length} batches displayed`;
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
        if (!window.otterOverlayUI) {
          console.error('❌ OverlayUI not initialized');
          return 'Extension not loaded properly';
        }
        
        // Try to create it
        console.log('🔧 Attempting to create sidebar...');
        try {
          window.otterOverlayUI.createOverlay();
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
        if (window.otterOverlayUI) {
          try {
            window.otterOverlayUI.createOverlay();
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
  
    // Search DOM for hidden data
    findHiddenData() {
      console.log('=== SEARCHING FOR HIDDEN ORDER DATA ===');
      
      // 1. Check for script tags with JSON
      const scriptTags = document.querySelectorAll('script[type="application/json"], script[type="text/json"]');
      console.log(`Found ${scriptTags.length} JSON script tags`);
      scriptTags.forEach((script, i) => {
        try {
          const data = JSON.parse(script.textContent);
          console.log(`Script ${i}:`, data);
          
          // Check if it contains order-like data
          const str = JSON.stringify(data).toLowerCase();
          if (str.includes('order') || str.includes('item') || str.includes('size')) {
            console.log('🎯 This script might contain order data!');
          }
        } catch (e) {
          console.log(`Script ${i}: Failed to parse`);
        }
      });
      
      // 2. Check data attributes on order elements
      console.log('\n=== Checking data attributes ===');
      const orderRows = document.querySelectorAll('[data-testid="order-row"]');
      orderRows.forEach((row, i) => {
        const attrs = row.attributes;
        console.log(`Order ${i} attributes:`);
        for (let attr of attrs) {
          if (attr.name.startsWith('data-') && attr.value) {
            console.log(`  ${attr.name}: ${attr.value.substring(0, 100)}...`);
          }
        }
        
        // Check all child elements for data attributes
        const elements = row.querySelectorAll('*');
        elements.forEach(el => {
          for (let attr of el.attributes) {
            if (attr.name.startsWith('data-') && attr.value && attr.value.length > 20) {
              console.log(`  Found data attr: ${attr.name} = ${attr.value.substring(0, 50)}...`);
            }
          }
        });
      });
      
      // 3. Check window object for exposed data
      console.log('\n=== Checking window object ===');
      const suspectKeys = Object.keys(window).filter(key => {
        const lower = key.toLowerCase();
        return lower.includes('order') || lower.includes('otter') || 
               lower.includes('menu') || lower.includes('item') ||
               lower.includes('__') || lower.includes('initial');
      });
      console.log('Suspicious window keys:', suspectKeys);
      suspectKeys.forEach(key => {
        try {
          const value = window[key];
          if (value && typeof value === 'object') {
            console.log(`window.${key}:`, value);
          }
        } catch (e) {
          // Some properties throw errors when accessed
        }
      });
      
      // 4. Check localStorage and sessionStorage
      console.log('\n=== Checking storage ===');
      console.log('LocalStorage keys:', Object.keys(localStorage));
      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key);
        if (value && value.includes('order') || value.includes('item')) {
          console.log(`localStorage['${key}']:`, value.substring(0, 200) + '...');
        }
      });
      
      console.log('\nSessionStorage keys:', Object.keys(sessionStorage));
      Object.keys(sessionStorage).forEach(key => {
        const value = sessionStorage.getItem(key);
        if (value && (value.includes('order') || value.includes('item'))) {
          console.log(`sessionStorage['${key}']:`, value.substring(0, 200) + '...');
        }
      });
      
      // 5. Check React/Vue components
      console.log('\n=== Checking for React/Vue data ===');
      const reactKeys = Object.keys(orderRows[0] || {}).filter(key => key.startsWith('__react'));
      if (reactKeys.length > 0) {
        console.log('Found React internal keys:', reactKeys);
        // Try to access React fiber/props
        try {
          const firstOrder = orderRows[0];
          const reactKey = reactKeys[0];
          const fiber = firstOrder[reactKey];
          if (fiber) {
            console.log('React fiber found:', fiber);
            if (fiber.memoizedProps) {
              console.log('React props:', fiber.memoizedProps);
            }
          }
        } catch (e) {
          console.log('Could not access React internals');
        }
      }
      
      return 'Search complete - check console for findings';
    },
    
    // Inspect a specific order for hidden data
    inspectOrder(orderIndex = 0) {
      console.log('=== INSPECTING ORDER ELEMENT ===');
      
      const orderRows = document.querySelectorAll('[data-testid="order-row"]');
      if (!orderRows[orderIndex]) {
        console.log(`No order found at index ${orderIndex}`);
        return;
      }
      
      const orderRow = orderRows[orderIndex];
      console.log('Order element:', orderRow);
      
      // 1. Check all attributes
      console.log('\nAll attributes:');
      Array.from(orderRow.attributes).forEach(attr => {
        console.log(`  ${attr.name}: ${attr.value}`);
      });
      
      // 2. Check computed styles for hidden content
      console.log('\nChecking for hidden elements:');
      const allElements = orderRow.querySelectorAll('*');
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || 
            style.opacity === '0' || el.hidden) {
          console.log('Hidden element found:', el);
          console.log('  Text content:', el.textContent);
          console.log('  Inner HTML:', el.innerHTML.substring(0, 200));
        }
        
        // Check for size-related text
        const text = el.textContent || '';
        if (text.match(/small|medium|large|sm|md|lg|size/i)) {
          console.log('Size-related text found:', text);
          console.log('  Element:', el);
        }
      });
      
      // 3. Check for React props
      console.log('\nChecking React internals:');
      const reactKeys = Object.keys(orderRow).filter(key => key.startsWith('__react'));
      reactKeys.forEach(key => {
        try {
          const fiber = orderRow[key];
          console.log(`React fiber (${key}):`, fiber);
          
          // Navigate the fiber tree
          let current = fiber;
          let depth = 0;
          while (current && depth < 5) {
            if (current.memoizedProps) {
              console.log(`  Props at depth ${depth}:`, current.memoizedProps);
              
              // Check if props contain size data
              const propsStr = JSON.stringify(current.memoizedProps);
              if (propsStr.includes('size') || propsStr.includes('Size')) {
                console.log('  🎯 Found size in props!');
              }
            }
            if (current.memoizedState) {
              console.log(`  State at depth ${depth}:`, current.memoizedState);
            }
            current = current.return; // Go up the tree
            depth++;
          }
        } catch (e) {
          console.log('Error accessing React fiber:', e);
        }
      });
      
      // 4. Check for Vue instance
      if (orderRow.__vue__) {
        console.log('\nVue instance found:', orderRow.__vue__);
        console.log('Vue data:', orderRow.__vue__.$data);
        console.log('Vue props:', orderRow.__vue__.$props);
      }
      
      // 5. Look for JSON in text nodes
      console.log('\nChecking for JSON in text nodes:');
      const walker = document.createTreeWalker(
        orderRow,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.startsWith('{') || text.startsWith('[')) {
          try {
            const data = JSON.parse(text);
            console.log('Found JSON in text node:', data);
          } catch (e) {
            // Not valid JSON
          }
        }
      }
      
      return 'Inspection complete';
    },
    
    // Extract data from page state
    extractPageState() {
      console.log('=== EXTRACTING PAGE STATE ===');
      
      // Common state container patterns
      const stateContainers = [
        '__INITIAL_STATE__',
        '__PRELOADED_STATE__',
        '__APP_STATE__',
        '__NEXT_DATA__',
        '__NUXT__',
        'initialState',
        'preloadedState'
      ];
      
      stateContainers.forEach(key => {
        if (window[key]) {
          console.log(`Found window.${key}:`);
          console.log(window[key]);
          
          // Search for order data
          const str = JSON.stringify(window[key]);
          if (str.includes('order') || str.includes('item') || str.includes('size')) {
            console.log('🎯 This state contains order-related data!');
            
            // Try to find specific paths
            try {
              const findOrders = (obj, path = '') => {
                if (!obj || typeof obj !== 'object') return;
                
                Object.keys(obj).forEach(k => {
                  const newPath = path ? `${path}.${k}` : k;
                  if (k.toLowerCase().includes('order') || k.toLowerCase().includes('item')) {
                    console.log(`Found at ${newPath}:`, obj[k]);
                  }
                  if (typeof obj[k] === 'object') {
                    findOrders(obj[k], newPath);
                  }
                });
              };
              
              findOrders(window[key]);
            } catch (e) {
              console.log('Error traversing state:', e);
            }
          }
        }
      });
      
      return 'State extraction complete';
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
      console.log('otterDebug.showBatchDetails() - Display current batches');
      console.log('otterDebug.toggleSidebar() - Show/hide sidebar');
      console.log('otterDebug.checkSidebar() - Diagnose sidebar visibility issues');
      console.log('otterDebug.forceShowSidebar() - Force sidebar to be visible');
      console.log('otterDebug.findHiddenData() - Search DOM for hidden order/size data');
      console.log('otterDebug.extractPageState() - Extract React/Vue state data');
      console.log('otterDebug.inspectOrder(0) - Deep inspect a specific order element');
      console.log('\nKEYBOARD SHORTCUTS:');
      console.log('Ctrl+Shift+O - Toggle sidebar visibility');
      console.log('Ctrl+Shift+L - Force leader mode');
      console.log('Ctrl+Shift+F - Export network findings');
      console.log('Ctrl+Shift+D - Show order cache discovery report');
      console.log('Ctrl+Shift+V - Toggle verbose network logging');
      console.log('Ctrl+Shift+I - Show diagnostics');
      console.log('\nREACT DEBUGGING:');
      console.log('otterDebug.inspectReact() - Inspect React fibers for order data');
      console.log('otterDebug.extractReact() - Force React data extraction');
      return 'Help displayed';
    },
    
    // Inspect React fibers to find order data
    inspectReact() {
      if (window.otterReactDataExtractor) {
        return window.otterReactDataExtractor.inspectReactFibers();
      } else {
        console.error('React data extractor not available');
        return null;
      }
    },
    
    // Force React extraction with debug
    extractReact() {
      if (window.otterReactDataExtractor) {
        window.otterReactDataExtractor.enableDebug();
        const orders = window.otterReactDataExtractor.extractOrders();
        console.log(`Extracted ${orders.length} orders from React:`, orders);
        return orders;
      } else {
        console.error('React data extractor not available');
        return [];
      }
    },
    
    // Check if React is present on the page
    checkReact() {
      console.log('=== REACT PRESENCE CHECK ===');
      
      // Check for React DevTools
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✓ React DevTools hook found');
      } else {
        console.log('✗ No React DevTools hook');
      }
      
      // Check for React on window
      if (window.React) {
        console.log('✓ React found on window:', window.React.version);
      } else {
        console.log('✗ React not found on window');
      }
      
      // Check first order row for React properties
      const row = document.querySelector('[data-testid="order-row"]');
      if (row) {
        const keys = Object.keys(row);
        const reactKeys = keys.filter(k => k.includes('react') || k.includes('React'));
        console.log('Order row keys:', keys);
        console.log('React-related keys:', reactKeys);
        
        // Check all properties
        keys.forEach(key => {
          if (key.startsWith('__')) {
            console.log(`Property ${key}:`, typeof row[key]);
          }
        });
      } else {
        console.log('No order rows found');
      }
      
      return 'Check complete';
    }
  };
  
  // Make debug functions globally available
  if (window.otterDebug && window.otterDebug.help) {
    window.otterDebug.help();
  }
  console.log('✅ Otter debug helpers loaded. Type otterDebug.help() for commands.');

  // ----- content/content.js -----
  (async function() {
    console.log('🔴 OTTER EXTENSION LOADED AT:', new Date().toISOString());
    console.log('🔴 Page URL:', window.location.href);
    console.log('🔴 Document ready state:', document.readyState);
    
    // Log available components
    console.log('🔴 Available components:', {
      Storage: typeof Storage,
      ItemMatcher: typeof ItemMatcher,
      OrderBatcher: typeof OrderBatcher,
      CategoryManager: typeof CategoryManager,
      BatchManager: typeof BatchManager,
      OrderExtractor: typeof OrderExtractor,
      OverlayUI: typeof OverlayUI,
      NetworkMonitor: typeof NetworkMonitor,
      OrderCache: typeof OrderCache
    });
    
    // Visual confirmation - red flash
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'red';
    setTimeout(() => {
      document.body.style.backgroundColor = originalBg;
    }, 500);
    
    // Add floating badge
    const loadBadge = document.createElement('div');
    loadBadge.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: #ff0000;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 9999999;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    loadBadge.textContent = 'OTTER EXT LOADED';
    document.body.appendChild(loadBadge);
    
    // Remove badge after 3 seconds
    setTimeout(() => loadBadge.remove(), 3000);
    
    // Log basic page info
    console.log('Page URL:', window.location.href);
    console.log('Page Title:', document.title);
    console.log('Body classes:', document.body.className);
    
    // Toggle debug panel with Ctrl+Shift+D - REMOVED
    // Export network findings with Ctrl+Shift+N
    // Force leader mode with Ctrl+Shift+L
    document.addEventListener('keydown', async (e) => {
      // Export network findings with Ctrl+Shift+F (F for Findings)
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        if (window.otterNetworkMonitor) {
          const findings = window.otterNetworkMonitor.exportFindings();
          console.log('=== NETWORK API FINDINGS ===');
          console.log(findings);
          
          // Create a temporary notification
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 2147483647; /* Maximum z-index value */
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          `;
          notification.textContent = `Network findings exported to console (${findings.discoveredEndpoints.length} endpoints found)`;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 5000);
        }
      }
      
      // Show order cache discovery report with Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (window.otterOrderCache) {
          const report = window.otterOrderCache.getDiscoveryReport();
          console.log('=== ORDER CACHE DISCOVERY REPORT ===');
          console.log('Known API Endpoints:', report.knownEndpoints);
          console.log('Total API Responses:', report.totalResponses);
          console.log('Orders with Details:', report.ordersWithDetails);
          console.log('Order Summaries:', report.orderSummaries);
          if (report.sampleOrder) {
            console.log('Sample Order Structure:', report.sampleOrder);
          }
          
          // Show notification
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #17a2b8;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 2147483647; /* Maximum z-index value */
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          `;
          notification.textContent = `Discovery Report: ${report.knownEndpoints.length} endpoints, ${report.ordersWithDetails} detailed orders`;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 5000);
        }
      }
      
      // Toggle verbose network logging with Ctrl+Shift+V
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        if (window.otterNetworkMonitor) {
          const isVerbose = window.otterNetworkMonitor.toggleVerboseMode();
          
          // Show notification
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isVerbose ? '#ff6b6b' : '#6c757d'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 2147483647; /* Maximum z-index value */
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          `;
          notification.textContent = `Network Verbose Mode: ${isVerbose ? 'ON - Check console for all requests' : 'OFF'}`;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      }
      
      // Hide/Show UI elements with Ctrl+Shift+H
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        
        // Toggle UI visibility
        const uiElements = [
          document.querySelector('.otter-floating-toggle'),
          document.getElementById('otter-consolidator-overlay')
        ];
        
        const anyVisible = uiElements.some(el => el && !el.classList.contains('otter-ui-hidden'));
        
        uiElements.forEach(el => {
          if (el) {
            if (anyVisible) {
              el.classList.add('otter-ui-hidden');
            } else {
              el.classList.remove('otter-ui-hidden');
            }
          }
        });
        
        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: ${anyVisible ? '#dc3545' : '#28a745'};
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          z-index: 2147483647; /* Maximum z-index value */
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = anyVisible ? 'UI Hidden - Press Ctrl+Shift+H to show' : 'UI Shown';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      }
      
      // Show diagnostics with Ctrl+Shift+I (not regular I to avoid conflicts)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.log('=== OTTER EXTENSION DIAGNOSTICS ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('URL:', window.location.href);
        console.log('\nComponents Status:');
        console.log('- NetworkMonitor:', !!window.otterNetworkMonitor, window.otterNetworkMonitor?.isMonitoring ? '(monitoring)' : '(not monitoring)');
        console.log('- OrderCache:', !!window.otterOrderCache, window.otterOrderCache?.apiResponses?.size ? `(${window.otterOrderCache.apiResponses.size} responses)` : '(empty)');
        console.log('- OverlayUI:', !!window.otterOverlayUI, window.otterOverlayUI?.isScrapingMode ? '(leader)' : '(follower)');
        console.log('- Debug Helper:', !!window.otterDebug);
        console.log('\nDOM Elements:');
        console.log('- Overlay:', !!document.getElementById('otter-consolidator-overlay'));
        console.log('- Toggle Button:', !!document.querySelector('.otter-floating-toggle'));
        console.log('- Mode Button: Removed');
        console.log('- Order Rows:', document.querySelectorAll('[data-testid="order-row"]').length);
        console.log('\nInitialization State:');
        console.log('- isInitialized:', isInitialized);
        console.log('- overlayUI created:', !!overlayUI);
        console.log('\nRun otterDebug.help() for available commands');
        
        // Show visual notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #17a2b8;
          color: white;
          padding: 15px 20px;
          border-radius: 5px;
          z-index: 2147483647; /* Maximum z-index value */
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = 'Diagnostics printed to console (F12)';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
      
      // Force leader mode with Ctrl+Shift+L
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        console.log('🔧 Forcing leader mode...');
        
        // Force this tab to become leader
        overlayUI.isScrapingMode = true;
        overlayUI.updateModeIndicator();
        
        // Notify background script
        await chrome.runtime.sendMessage({
          action: 'forceLeader',
          tabId: overlayUI.tabId
        });
        
        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #5cb85c;
          color: white;
          padding: 15px 20px;
          border-radius: 5px;
          z-index: 2147483647; /* Maximum z-index value */
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.textContent = '🔍 This tab is now the LEADER - extracting orders';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
        
        // Start extraction
        extractAndBatchOrders(false); // Always use preview mode
        setupOrderMonitoring();
        overlayUI.startLiveMonitoring();
      }
    });
    
    // Initialize components with error checking
    let itemMatcher, orderBatcher, categoryManager, batchManager, orderExtractor, overlayUI, prepTimeTracker;
    
    // Create components immediately
    async function createComponents() {
      try {
        console.log('[createComponents] Starting component creation...');
        console.log('[createComponents] Current globals:', {
          ItemMatcher: typeof window.ItemMatcher,
          OrderBatcher: typeof window.OrderBatcher,
          CategoryManager: typeof window.CategoryManager,
          BatchManager: typeof window.BatchManager,
          OrderExtractor: typeof window.OrderExtractor,
          OverlayUI: typeof window.OverlayUI
        });
        
        console.log('Creating ItemMatcher...');
        if (typeof ItemMatcher === 'undefined' && typeof window.ItemMatcher === 'undefined') {
          throw new Error('ItemMatcher not loaded');
        }
        itemMatcher = new (window.ItemMatcher || ItemMatcher)();
        
        console.log('Creating OrderBatcher...');
        if (typeof OrderBatcher === 'undefined' && typeof window.OrderBatcher === 'undefined') {
          throw new Error('OrderBatcher not loaded');
        }
        orderBatcher = new (window.OrderBatcher || OrderBatcher)(itemMatcher);
        
        console.log('Creating CategoryManager...');
        if (typeof CategoryManager === 'undefined' && typeof window.CategoryManager === 'undefined') {
          throw new Error('CategoryManager not loaded');
        }
        categoryManager = new (window.CategoryManager || CategoryManager)();
        
        console.log('Creating BatchManager...');
        if (typeof BatchManager === 'undefined' && typeof window.BatchManager === 'undefined') {
          throw new Error('BatchManager not loaded');
        }
        batchManager = new (window.BatchManager || BatchManager)();
        
        // Set up batch event callbacks
        batchManager.onNewBatchCreated = (batch) => {
          overlayUI?.showNotification(`Batch ${batch.number - 1} is full! Created Batch ${batch.number}`, 'info');
        };
        
        batchManager.onBatchCapacityReached = () => {
          overlayUI?.showNotification('Current batch is at capacity!', 'warning');
        };
        
        // Categories are loaded directly in categoryManager constructor
        console.log('Categories loaded');
        
        console.log('Creating OrderExtractor...');
        if (typeof OrderExtractor === 'undefined' && typeof window.OrderExtractor === 'undefined') {
          throw new Error('OrderExtractor not loaded');
        }
        orderExtractor = new (window.OrderExtractor || OrderExtractor)(categoryManager);
        
        console.log('Creating PrepTimeTracker...');
        if (typeof PrepTimeTracker === 'undefined' && typeof window.PrepTimeTracker === 'undefined') {
          throw new Error('PrepTimeTracker not loaded');
        }
        prepTimeTracker = new (window.PrepTimeTracker || PrepTimeTracker)();
        window.otterPrepTimeTracker = prepTimeTracker; // Make globally accessible
        
        console.log('Creating OverlayUI...');
        if (typeof OverlayUI === 'undefined' && typeof window.OverlayUI === 'undefined') {
          throw new Error('OverlayUI not loaded');
        }
        overlayUI = new (window.OverlayUI || OverlayUI)(orderBatcher, categoryManager, batchManager, orderExtractor);
        
        // Make overlayUI globally accessible for debugging
        window.otterOverlayUI = overlayUI;
        
        return true;
      } catch (error) {
        console.error('Error creating components:', error);
        console.error('Available globals:', {
          ItemMatcher: typeof ItemMatcher,
          OrderBatcher: typeof OrderBatcher,
          CategoryManager: typeof CategoryManager,
          BatchManager: typeof BatchManager,
          OrderExtractor: typeof OrderExtractor,
          OverlayUI: typeof OverlayUI
        });
        throw error;
      }
    }
    
    // Track component readiness globally
    window.otterComponentsReady = false;
    
    // Create components early
    createComponents().then(() => {
      console.log('[Components] All components created successfully!');
      window.otterComponentsReady = true;
      
      // Initialize authentication UI after components are created
      console.log('Initializing authentication UI...');
      // Auth UI removed - no initialization needed
    }).catch(error => {
      console.error('[CRITICAL] Failed to create components:', error);
      console.error('Stack trace:', error.stack);
      // Store error globally for debugging
      window.componentsError = error;
      window.otterComponentsReady = false;
    });
    
    let isInitialized = false;
    let orderObserver = null;
    let reactExtractionSuccessful = false;
    
    function showNavigationHelper() {
      // Create navigation helper UI
      const helper = document.createElement('div');
      helper.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 9999999;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 350px;
      `;
      helper.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">📋 Otter Order Consolidator</div>
        <div style="margin-bottom: 15px;">You're on an order detail page. The extension works on the orders list page.</div>
        <div id="auto-open-countdown" style="margin-bottom: 15px; font-size: 14px; opacity: 0.9;">
          Opening orders list in new tab in <span id="countdown">3</span> seconds...
        </div>
        <button id="cancel-auto-open" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid white;
          padding: 8px 16px;
          border-radius: 5px;
          font-size: 13px;
          cursor: pointer;
          width: 100%;
          margin-bottom: 10px;
        ">Cancel Auto-Open</button>
        <button id="go-to-orders" style="
          background: white;
          color: #007bff;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
        ">Go to Orders List in This Tab</button>
      `;
      document.body.appendChild(helper);
      
      // Auto-open countdown
      let countdown = 3;
      let autoOpenCancelled = false;
      const countdownEl = document.getElementById('countdown');
      const autoOpenCountdownEl = document.getElementById('auto-open-countdown');
      
      const countdownInterval = setInterval(() => {
        if (autoOpenCancelled) {
          clearInterval(countdownInterval);
          return;
        }
        
        countdown--;
        if (countdownEl) {
          countdownEl.textContent = countdown;
        }
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          // Auto-open in new tab
          window.open('https://app.tryotter.com/orders', '_blank');
          
          // Update the helper message
          if (autoOpenCountdownEl) {
            autoOpenCountdownEl.innerHTML = '<div style="color: #90EE90;">✓ Orders list opened in new tab!</div>';
          }
          
          // Remove the cancel button
          const cancelBtn = document.getElementById('cancel-auto-open');
          if (cancelBtn) {
            cancelBtn.remove();
          }
          
          // Remove helper after a short delay
          setTimeout(() => helper.remove(), 5000);
        }
      }, 1000);
      
      // Cancel auto-open handler
      document.getElementById('cancel-auto-open').addEventListener('click', () => {
        autoOpenCancelled = true;
        clearInterval(countdownInterval);
        
        // Remove countdown and cancel button
        if (autoOpenCountdownEl) {
          autoOpenCountdownEl.remove();
        }
        const cancelBtn = document.getElementById('cancel-auto-open');
        if (cancelBtn) {
          cancelBtn.remove();
        }
      });
      
      // Manual navigation handler
      document.getElementById('go-to-orders').addEventListener('click', () => {
        autoOpenCancelled = true;
        clearInterval(countdownInterval);
        window.location.href = 'https://app.tryotter.com/orders';
      });
      
      // Auto-remove after 60 seconds (extended time)
      setTimeout(() => {
        if (helper.parentNode) {
          helper.remove();
        }
      }, 60000);
    }
    
    window.init = async function init() {
      if (isInitialized) {
        console.log('[init] Already initialized, skipping');
        return;
      }
      
      console.log('[init] Starting initialization...');
      
      // Wait for components to be ready
      if (!window.otterComponentsReady) {
        console.log('[init] Components not ready yet, waiting...');
        
        // Wait up to 10 seconds for components
        let waited = 0;
        while (!window.otterComponentsReady && waited < 10000) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waited += 100;
        }
        
        if (!window.otterComponentsReady) {
          console.error('[init] Components failed to initialize after 10 seconds');
          if (window.componentsError) {
            throw window.componentsError;
          }
          throw new Error('Components initialization timeout');
        }
      }
      
      console.log('[init] Components ready, proceeding...');
      console.log('[init] Available components at start:', {
        networkMonitor: !!window.otterNetworkMonitor,
        orderCache: !!window.otterOrderCache,
        overlayUI: !!overlayUI
      });
      
      try {
        // Check what page we're on
        const currentUrl = window.location.href;
        const isMainOrdersPage = currentUrl === 'https://app.tryotter.com/orders' || 
                                currentUrl === 'https://app.tryotter.com/orders/';
        
        // Check if we're on an order detail page (has UUID in URL)
        const isOrderDetailPage = /\/orders\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(currentUrl);
        
        if (isOrderDetailPage) {
          console.log('On order detail page - offering navigation to orders list');
          showNavigationHelper();
          return;
        }
        
        if (!isMainOrdersPage) {
          console.log('Not on orders page, skipping initialization. Current URL:', currentUrl);
          return;
        }
        
        console.log('Initializing Otter Order Consolidator...');
        
        // Check network monitoring status
        if (window.otterNetworkMonitor) {
          console.log('[Content] Network monitor status:', {
            available: true,
            isMonitoring: window.otterNetworkMonitor.isMonitoring,
            error: window.otterNetworkMonitor.error || null
          });
          
          // Enable verbose mode for debugging
          if (window.otterNetworkMonitor.toggleVerboseMode) {
            window.otterNetworkMonitor.toggleVerboseMode();
            console.log('[Content] Verbose mode enabled');
          }
          
          // Test the interception is working
          console.log('[Content] Testing network interception...');
          fetch('https://app.tryotter.com/test-interception').catch(() => {});
          
          // Log current page requests after a delay
          setTimeout(() => {
            if (window.otterNetworkMonitor.getAllRequests) {
              const requests = window.otterNetworkMonitor.getAllRequests();
              console.log(`[Content] Total requests captured so far: ${requests.length}`);
              if (requests.length > 0) {
                console.log('[Content] Sample requests:', requests.slice(0, 5));
              }
            }
          }, 3000);
        } else {
          console.error('[Content] Network monitor not available!');
        }
        
        // Check order cache status
        if (window.otterOrderCache) {
          console.log('[Content] Order cache available:', {
            available: true,
            error: window.otterOrderCache.error || null
          });
        } else {
          console.error('[Content] Order cache not available!');
        }
        
        // Set up listener for API data from network monitor
        window.addEventListener('otter-api-order-data', (event) => {
          console.log('[Content] Received API order data event:', event.detail);
          
          // Store in order cache
          if (window.otterOrderCache) {
            window.otterOrderCache.storeApiResponse(
              event.detail.url,
              event.detail.data,
              event.detail.timestamp
            );
            
            // Show discovery report
            if (window.otterOrderCache.discoveryMode) {
              const report = window.otterOrderCache.getDiscoveryReport();
              console.log('[Content] Order Cache Discovery Report:', report);
            }
          }
        });
        
        // Show initialization progress
        const initProgress = document.createElement('div');
        initProgress.id = 'otter-init-progress';
        initProgress.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #007bff;
          color: white;
          padding: 15px 25px;
          border-radius: 5px;
          z-index: 2147483647; /* Maximum z-index value */
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        `;
        initProgress.textContent = 'Otter Extension: Initializing...';
        document.body.appendChild(initProgress);
        
        await waitForPageLoad();
        console.log('Page loaded, initializing UI...');
        initProgress.textContent = 'Otter Extension: Creating UI...';
        
        // Initialize UI first with error handling
        try {
          if (!overlayUI) {
            throw new Error('OverlayUI not created');
          }
          overlayUI.init();
          console.log('UI initialized');
          initProgress.textContent = 'Otter Extension: UI Ready';
        } catch (error) {
          console.error('Error initializing UI:', error);
          initProgress.textContent = 'Otter Extension: Error - ' + error.message;
          initProgress.style.background = '#dc3545';
          
          // Try to recover by recreating components
          try {
            await createComponents();
            overlayUI.init();
            console.log('UI initialized after recovery');
            initProgress.textContent = 'Otter Extension: Recovered';
            initProgress.style.background = '#28a745';
          } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
            throw recoveryError;
          }
        }
        
        // Register with background script
        console.log('Registering tab with background script...');
        
        let registration;
        
        // Initialize registration with default values first
        registration = {
          isLeader: true,
          tabId: Date.now(),
          existingData: null,
          totalTabs: 1
        };
        
        try {
          // Try to use chrome runtime if available
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            const response = await chrome.runtime.sendMessage({ action: 'registerTab' });
            if (response) {
              registration = response;
              console.log('Tab registration result:', registration);
            }
          } else {
            console.log('Chrome runtime not available - using Tampermonkey single-tab mode');
          }
        } catch (error) {
          console.error('Failed to register with background script:', error);
          console.log('Using default registration for Tampermonkey');
        }
        
        // Set mode based on leadership
        // OVERRIDE: Force leader if URL param or no other tabs
        if (window.FORCE_LEADER) {
          overlayUI.isScrapingMode = true;
          console.log('Force leader mode via URL parameter');
        } else if (registration.totalTabs <= 1 || !registration.existingData || Object.keys(registration.existingData).length === 0) {
          overlayUI.isScrapingMode = true;
          console.log('No other active tabs or data - forcing leader mode');
        } else {
          overlayUI.isScrapingMode = registration.isLeader;
        }
        overlayUI.tabId = registration.tabId;
        overlayUI.updateModeIndicator();
        
        // IMPORTANT: Prevent automatic mode switching
        overlayUI._lockMode = overlayUI.isScrapingMode;
        
        // If we have existing data and we're not the leader, load it
        if (!registration.isLeader && registration.existingData && registration.existingData.orders) {
          console.log('Loading existing order data...');
          overlayUI.updateFromSharedData(registration.existingData);
        }
        
        // Set up message listeners for leadership changes and data updates
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log('Received message:', message.action);
          
          switch (message.action) {
            case 'leadershipChanged':
              // Only accept leadership changes if not locked
              if (!overlayUI._lockMode) {
                // We've been promoted to leader
                console.log('LEADER - Taking over extraction');
                overlayUI.isScrapingMode = true;
                overlayUI.updateModeIndicator();
                
                // Start extraction
                if (isInitialized) {
                  extractAndBatchOrders(false); // Always use preview mode
                  setupOrderMonitoring();
                  overlayUI.startLiveMonitoring();
                }
              } else {
                console.log('Leadership change ignored - mode is locked');
              }
              break;
              
            case 'ordersUpdated':
              // New order data from leader
              if (!overlayUI.isScrapingMode) {
                overlayUI.updateFromSharedData(message.data);
                console.log('Orders Updated:', new Date().toLocaleTimeString());
              }
              break;
              
            case 'tabRegistered':
              // Another tab joined
              console.log('Total Tabs:', message.totalTabs);
              break;
              
            case 'tabClosed':
              // Another tab left
              console.log('Remaining Tabs:', message.remainingTabs.length);
              break;
          }
        });
        
        // Start extraction if we're the leader
        if (overlayUI.isScrapingMode) {
          console.log('Leader mode - starting order extraction...');
          
          try {
            await extractAndBatchOrders(false); // Always use preview mode
            setupOrderMonitoring();
            // Start live monitoring after initial extraction
            overlayUI.startLiveMonitoring();
          } catch (error) {
            console.error('Error during extraction:', error);
          }
        } else {
          console.log('Follower mode - waiting for order updates...');
        }
        
        isInitialized = true;
        console.log('Otter Order Consolidator initialized successfully');
        
        // Update the main loading indicator
        const mainLoadingIndicator = document.getElementById('otter-loading-indicator');
        if (mainLoadingIndicator) {
          mainLoadingIndicator.innerHTML = '✅ Otter Consolidator Ready';
          mainLoadingIndicator.style.background = '#4CAF50';
          setTimeout(() => {
            mainLoadingIndicator.style.opacity = '0.7';
          }, 2000);
        }
        
        // Update progress indicator
        initProgress.textContent = 'Otter Extension: Ready!';
        initProgress.style.background = '#28a745';
        
        // Remove progress indicator
        setTimeout(() => initProgress.remove(), 2000);
        
      } catch (error) {
        console.error('Critical error during initialization:', error);
        isInitialized = false;
        
        // Update loading indicator to show error
        const mainLoadingIndicator = document.getElementById('otter-loading-indicator');
        if (mainLoadingIndicator) {
          mainLoadingIndicator.innerHTML = '❌ Error: ' + error.message;
          mainLoadingIndicator.style.background = '#dc3545';
        }
        
        // Update progress indicator
        if (initProgress) {
          initProgress.textContent = 'Otter Extension: Error - ' + error.message;
          initProgress.style.background = '#dc3545';
        }
        
        // Update or create error notification
        let errorNotif = document.getElementById('otter-init-progress');
        if (!errorNotif) {
          errorNotif = document.createElement('div');
          errorNotif.id = 'otter-init-progress';
          document.body.appendChild(errorNotif);
        }
        
        errorNotif.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #dc3545;
          color: white;
          padding: 20px;
          border-radius: 8px;
          z-index: 2147483647; /* Maximum z-index value */
          font-size: 14px;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorNotif.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 10px;">Otter Extension Failed to Load</div>
          <div style="margin-bottom: 10px;">${error.message}</div>
          <div style="font-size: 12px; opacity: 0.8;">Try refreshing the page (F5) or check console (F12) for details.</div>
          <button onclick="location.reload()" style="
            background: white;
            color: #dc3545;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 10px;
          ">Refresh Page</button>
        `;
        
        // Don't re-throw to prevent breaking other scripts
      }
    }
    
    async function waitForPageLoad() {
      // Wait for critical selectors to appear
      const criticalSelectors = [
        '[data-testid="order-row"]',
        '.sc-dCesDq',
        '.sc-gpaZuh'
      ];
      
      for (let i = 0; i < 30; i++) { // 3 seconds max
        const found = criticalSelectors.some(selector => 
          document.querySelector(selector) !== null
        );
        
        if (found) {
          console.log('Critical elements found, page ready');
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.warn('Page load timeout - proceeding anyway');
    }
    
    async function broadcastOrderData(orders) {
      try {
        // Send to background script for other tabs
        await chrome.runtime.sendMessage({
          action: 'ordersUpdated',
          data: {
            orders: orders,
            batches: batchManager.getBatches(),
            timestamp: Date.now()
          }
        });
        
        // Send to API if authenticated
        if (window.otterAPIClient && window.otterAPIClient.isAuthenticated()) {
          console.log('[Content] Sending orders to API...');
          
          // Submit orders to API
          for (const order of orders) {
            try {
              // Transform order data for API
              const apiOrder = {
                orderNumber: order.orderNumber || order.number,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                orderType: order.orderType || 'dine-in',
                items: order.items,
                notes: order.notes,
                totalAmount: order.totalAmount,
                orderedAt: order.orderedAt,
                elapsedTime: order.elapsedTime,
                waitTime: order.waitTime
              };
              
              const result = await window.otterAPIClient.submitOrder(apiOrder);
              if (!result.success) {
                console.error(`[Content] Failed to submit order ${order.orderNumber}:`, result.error);
              }
            } catch (error) {
              console.error(`[Content] Error submitting order ${order.orderNumber}:`, error);
            }
          }
          
          console.log('[Content] Orders sent to API');
        } else {
          console.log('[Content] Not authenticated - orders not sent to API');
        }
      } catch (error) {
        console.error('[Content] Error broadcasting order data:', error);
      }
    }
  
    async function extractFromReact(progress) {
      console.log('[Content] Extracting orders from React props');
      
      try {
        // Use the React data extractor (async function)
        const reactOrders = await window.otterReactDataExtractor.extractOrders();
        
        if (!reactOrders || reactOrders.length === 0) {
          console.log('[Content] No orders found in React props');
          return null;
        }
        
        console.log(`[Content] Found ${reactOrders.length} orders in React props`);
        progress.update(`Processing ${reactOrders.length} orders...`);
        
        // Clear existing batches
        orderBatcher.clearBatches();
        
        // Process each React order
        reactOrders.forEach((reactOrder, index) => {
          progress.update(`Processing order ${index + 1} of ${reactOrders.length}...`);
          
          // Convert React order to our format
          const order = {
            id: reactOrder.id,
            number: reactOrder.orderNumber,
            customerName: reactOrder.customerName,
            timestamp: reactOrder.timestamp || Date.now(),
            orderedAt: reactOrder.orderedAt, // Include orderedAt timestamp from React
            elapsedTime: reactOrder.elapsedTime || 0, // Include elapsed time from React
            waitTime: reactOrder.waitTime || 0,
            items: reactOrder.items.map(item => {
              let categoryInfo;
              try {
                // Debug log for Urban Bowls
                if (item.isUrbanBowl || item.name.toLowerCase().includes('urban bowl')) {
                  console.log(`[Overlay] Categorizing Urban Bowl: ${item.name}`);
                  console.log(`[Overlay] Item modifiers:`, JSON.stringify(item.modifiers));
                  console.log(`[Overlay] Item modifierDetails:`, JSON.stringify(item.modifierDetails));
                }
                
                // Pass the complete item object to categoryManager
                // Create a modifiers object that includes both array modifiers and modifierDetails
                const modifiersData = {
                  // Include properties from modifierDetails (like dumplingChoice)
                  dumplingChoice: item.modifierDetails?.dumplingChoice || null,
                  riceSubstitution: item.modifierDetails?.riceSubstitution || null,
                  // Standard properties
                  proteinType: item.proteinType || item.modifierDetails?.proteinType,
                  sauce: item.sauce || item.modifierDetails?.sauce,
                  modifiers: item.modifiers, // Keep the array of modifiers
                  isRiceBowl: item.isRiceBowl,
                  isUrbanBowl: item.isUrbanBowl
                };
                
                // Debug logging for Urban Bowls
                if (item.isUrbanBowl || item.name.toLowerCase().includes('urban bowl')) {
                  console.log(`[Overlay] ModifiersData being passed to categorizeItem:`, modifiersData);
                }
                
                categoryInfo = categoryManager.categorizeItem(item.name, item.size || 'no-size', modifiersData);
              } catch (error) {
                console.error(`Error categorizing item ${item.name}:`, error);
                categoryInfo = {
                  topCategory: 'other',
                  subCategory: 'other',
                  topCategoryName: 'Other',
                  subCategoryName: 'Other',
                  displayCategory: 'Other',
                  proteinType: item.proteinType || '',
                  sauceType: item.sauce || ''
                };
              }
              return {
                name: item.name,
                baseName: item.name,
                size: item.size || 'no-size',
                quantity: item.quantity || 1,
                price: item.price || 0,
                category: categoryInfo.topCategory,
                categoryInfo: categoryInfo,
                modifiers: item.modifiers || [],
                modifierList: item.modifierList || [],
                modifierDetails: item.modifierDetails || {},
                proteinType: item.proteinType || categoryInfo.proteinType || '',
                sauce: item.sauce || categoryInfo.sauceType || '',
                isRiceBowl: item.isRiceBowl || false,
                isUrbanBowl: item.isUrbanBowl || false,
                fromReact: true,
                source: 'react'
              };
            })
          };
          
          // Add to batcher
          orderBatcher.addOrder(order);
        });
        
        // Update batch assignments
        batchManager.refreshBatchAssignments(reactOrders);
        
        // Update UI
        overlayUI.render();
        
        progress.remove();
        
        // Show success notification with size info
        const ordersWithSizes = reactOrders.filter(o => 
          o.items.some(i => i.size && i.size !== 'no-size' && i.size !== 'urban')
        ).length;
        
        overlayUI.showNotification(
          `Loaded ${reactOrders.length} orders from React (${ordersWithSizes} with sizes)`, 
          'success'
        );
        
        // Broadcast data to other tabs and send to API
        await broadcastOrderData(reactOrders);
        
        return reactOrders;
        
      } catch (error) {
        console.error('[Content] Error extracting from React:', error);
        return null;
      }
    }
  
    async function extractFromAPICache(progress) {
      console.log('[Content] Extracting orders from API cache');
      
      try {
        const cachedOrders = window.otterOrderCache.getAllOrders();
        console.log(`[Content] Found ${cachedOrders.length} orders in API cache`);
        
        progress.update(`Processing ${cachedOrders.length} API orders...`);
        
        // Clear existing batches
        orderBatcher.clearBatches();
        
        // Process each cached order
        cachedOrders.forEach((cachedOrder, index) => {
          progress.update(`Processing order ${index + 1} of ${cachedOrders.length}...`);
          
          // Convert cached order to our format
          const order = {
            id: cachedOrder.id,
            number: cachedOrder.orderNumber || cachedOrder.id,
            customerName: cachedOrder.customerName || 'Unknown Customer',
            timestamp: cachedOrder.timestamp || Date.now(),
            waitTime: 0, // Will need to get from DOM if available
            items: cachedOrder.items.map(item => {
              const categoryInfo = categoryManager.categorizeItem(item.name, item.size || 'no-size');
              return {
                name: item.name,
                baseName: item.name,
                size: item.size || 'no-size',
                quantity: item.quantity || 1,
                price: item.price || 0,
                category: categoryInfo.topCategory,
                categoryInfo: categoryInfo,
                modifiers: item.modifiers || [],
                fromApi: true
              };
            })
          };
          
          // Add to batcher
          orderBatcher.addOrder(order);
        });
        
        // Update batch assignments
        batchManager.refreshBatchAssignments(cachedOrders);
        
        // Update UI
        overlayUI.render();
        
        progress.remove();
        
        // Show success notification
        overlayUI.showNotification(
          `Loaded ${cachedOrders.length} orders from API (${cachedOrders.filter(o => o.items.some(i => i.size !== 'no-size')).length} with sizes)`, 
          'success'
        );
        
        // Broadcast data to other tabs and send to API
        await broadcastOrderData(cachedOrders);
        
      } catch (error) {
        console.error('[Content] Error extracting from API cache:', error);
        progress.remove();
        overlayUI.showNotification('API extraction failed', 'error');
      }
    }
  
    function detectOrderRowSelector() {
      // Try different selectors that might contain order rows
      const possibleSelectors = [
        '[data-testid="order-row"]',
        '[data-test="order-row"]',
        '.order-row',
        '[class*="order"][class*="row"]',
        'div[class*="orderRow"]',
        'div[class*="order-row"]',
        // More generic selectors
        'div[class*="sc-"][class*="order"]',
        // Based on the HTML you showed earlier
        '.sc-dhHMav.fdVdID',
        'div.sc-dhHMav',
        // Try any div that contains order number pattern
        'div:has([data-testid="order-info-subtext"])'
      ];
      
      for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        
        // Check if these look like order rows
        if (elements.length > 0) {
          const firstElement = elements[0];
          const text = firstElement.textContent || '';
          
          // Order rows typically contain order numbers and customer names
          // More flexible matching for order numbers (can start with # or be alphanumeric)
          if (text.match(/#[A-Z0-9]+/i) || text.includes('Order') || text.includes('Customer') || 
              firstElement.querySelector('[data-testid="order-info-subtext"]')) {
            console.log(`Found order rows using selector: ${selector} (${elements.length} found)`);
            return { selector, elements: Array.from(elements) };
          }
        }
      }
      
      console.warn('No order rows found with known selectors');
      return { selector: null, elements: [] };
    }
    
    async function extractAndBatchOrders(useDetailed = false) {
      console.log('Starting order extraction...');
      
      if (!overlayUI.isScrapingMode) {
        console.log('Not in scraping mode, skipping extraction');
        return;
      }
      
      const progress = overlayUI.showProgress('Extracting orders from React data...');
      
      try {
        // Try React data extraction first - this is the most reliable method
        if (window.otterReactDataExtractor) {
          console.log('[Content] Using React data extractor');
          // Enable debug mode to see what's happening
          window.otterReactDataExtractor.enableDebug();
          const reactOrders = await extractFromReact(progress);
          if (reactOrders && reactOrders.length > 0) {
            console.log(`[Content] Successfully extracted ${reactOrders.length} orders from React`);
            reactExtractionSuccessful = true;
            return; // Success, no need for fallback
          }
          console.log('[Content] React extraction failed or returned 0 orders');
        }
        
        // Fallback to API cache if React extraction failed
        if (window.otterOrderCache && window.otterOrderCache.hasOrders()) {
          console.log('[Content] React extraction failed, trying API cache');
          progress.update('Checking API cache...');
          return extractFromAPICache(progress);
        }
        
        // No DOM extraction fallback - it overwrites good React data
        console.log('[Content] No React or API data available');
        progress.remove();
        
        overlayUI.showNotification('No orders found. Try refreshing the page.', 'warning');
        
        // Show retry button
        const retryNotification = overlayUI.showNotification(
          'Click here to retry order detection', 
          'info',
          0 // Don't auto-hide
        );
        retryNotification.style.cursor = 'pointer';
        retryNotification.addEventListener('click', async () => {
          retryNotification.remove();
          await extractAndBatchOrders(useDetailed);
        });
        
      } catch (error) {
        console.error('Error in order extraction:', error);
        progress.remove();
        overlayUI.showNotification('Error extracting orders', 'error');
      }
    }
    
    function setupOrderMonitoring() {
      if (orderObserver) {
        orderObserver.disconnect();
      }
      
      const targetNode = document.querySelector('main') || document.body;
      
      orderObserver = new MutationObserver(async (mutations) => {
        // Only process if we're in scraping mode
        if (!overlayUI.isScrapingMode) return;
        
        // Check if new order rows were added
        const hasNewOrders = mutations.some(mutation => {
          return Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === 1) { // Element node
              return node.matches && (
                node.matches('[data-testid="order-row"]') ||
                node.querySelector('[data-testid="order-row"]')
              );
            }
            return false;
          });
        });
        
        if (hasNewOrders) {
          console.log('New orders detected');
          
          // Skip if React extraction was successful
          if (reactExtractionSuccessful) {
            console.log('React extraction was successful, skipping DOM extraction');
            return;
          }
          
          // Check if we already have orders from React extraction
          const currentBatches = window.batchManager?.getBatches() || [];
          const hasExistingOrders = currentBatches.some(batch => batch.orders && batch.orders.length > 0);
          
          if (hasExistingOrders) {
            console.log('Orders already extracted, skipping re-extraction');
            return;
          }
          
          // Small delay to let DOM settle
          setTimeout(() => {
            extractAndBatchOrders(false); // Use preview mode for live updates
          }, 500);
        }
      });
      
      const config = {
        childList: true,
        subtree: true
      };
      
      orderObserver.observe(targetNode, config);
      console.log('Order monitoring started');
    }
    
    // Check for force leader mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    window.FORCE_LEADER = urlParams.get('leader') === 'true';
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // Small delay to ensure all scripts are loaded
      setTimeout(init, 100);
    }
    
    // Also listen for navigation changes (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('URL changed to:', url);
        
        // Reset and reinitialize if navigating to orders page
        if (url.includes('/orders') && !url.match(/\/orders\/[a-f0-9-]+$/)) {
          isInitialized = false;
          setTimeout(init, 500);
        }
      }
    }).observe(document, { subtree: true, childList: true });
  })();

  
})();