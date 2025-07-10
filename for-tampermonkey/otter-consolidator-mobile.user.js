// ==UserScript==
// @name         Otter Order Consolidator - Mobile Firefox
// @namespace    http://tampermonkey.net/
// @version      5.0.0
// @description  Consolidate orders from Otter Dashboard for batch processing - Mobile Firefox compatible
// @author       HHG Team
// @match        https://app.tryotter.com/*
// @match        https://tryotter.com/*
// @icon         data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzAwNTVBNCIgc3Ryb2tlPSIjMDAzMzcwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNOCAxNEgxMlYyNEg4VjE0WiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMTQgMTBIMThWMjRIMTRWMTBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMCA4SDI0VjI0SDIwVjhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        window.postMessage
// @grant        unsafeWindow
// @connect      localhost
// @connect      otter-api.hhg-ops.com
// @connect      *
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // ===== Configuration =====
    const CONFIG = {
        DEBUG_MODE: true,
        API_BASE_URL: 'http://localhost:8000',
        EXTRACTION_RETRY_DELAY: 1000,
        EXTRACTION_MAX_RETRIES: 10,
        BATCH_COMPLETE_DELAY: 2000,
        MOBILE_BREAKPOINT: 768,
        TABLET_BREAKPOINT: 1024
    };

    // ===== Chrome API Polyfills =====
    const chrome = {
        storage: {
            local: {
                get: async (keys) => {
                    if (typeof keys === 'string') keys = [keys];
                    const result = {};
                    for (const key of keys) {
                        const value = GM_getValue(key, null);
                        if (value !== null) {
                            result[key] = value;
                        }
                    }
                    return result;
                },
                set: async (items) => {
                    for (const [key, value] of Object.entries(items)) {
                        GM_setValue(key, value);
                    }
                },
                remove: async (keys) => {
                    if (typeof keys === 'string') keys = [keys];
                    for (const key of keys) {
                        GM_deleteValue(key);
                    }
                },
                clear: async () => {
                    const keys = GM_listValues();
                    for (const key of keys) {
                        GM_deleteValue(key);
                    }
                }
            },
            sync: {
                // Alias to local for Tampermonkey
                get: async (keys) => chrome.storage.local.get(keys),
                set: async (items) => chrome.storage.local.set(items),
                remove: async (keys) => chrome.storage.local.remove(keys),
                clear: async () => chrome.storage.local.clear()
            }
        },
        runtime: {
            // Mock runtime for message passing
            sendMessage: (message, callback) => {
                // Handle internally since no background script
                if (callback) {
                    const response = handleInternalMessage(message);
                    callback(response);
                }
                return true;
            },
            onMessage: {
                addListener: (listener) => {
                    // Store listener for internal use
                    messageListeners.push(listener);
                }
            },
            getURL: (path) => {
                // Return data URLs or hosted URLs
                if (path === 'label_printer.html') {
                    return 'data:text/html;base64,' + btoa(LABEL_PRINTER_HTML);
                }
                return path;
            }
        },
        tabs: {
            create: (options) => {
                GM_openInTab(options.url, {
                    active: options.active !== false,
                    insert: true
                });
            },
            query: async (queryInfo) => {
                // Return current tab info
                return [{
                    id: 1,
                    url: window.location.href,
                    active: true
                }];
            },
            sendMessage: (tabId, message, callback) => {
                // Handle internally
                if (callback) {
                    const response = handleInternalMessage(message);
                    callback(response);
                }
            }
        }
    };

    // Message listeners storage
    const messageListeners = [];

    // Handle internal messages (replacement for background script)
    function handleInternalMessage(message) {
        console.log('[TM] Handling internal message:', message);
        
        switch (message.action) {
            case 'checkApiKey':
                return { hasApiKey: !!GM_getValue('apiKey') };
                
            case 'saveApiKey':
                GM_setValue('apiKey', message.apiKey);
                return { success: true };
                
            case 'processBatch':
                // Process batch inline
                processBatchInline(message.orders);
                return { success: true };
                
            case 'getLeaderStatus':
                // Always leader in Tampermonkey (single tab)
                return { isLeader: true };
                
            default:
                return { error: 'Unknown action' };
        }
    }

    // ===== CORS-enabled fetch =====
    async function fetchWithCORS(url, options = {}) {
        return new Promise((resolve, reject) => {
            const gmOptions = {
                method: options.method || 'GET',
                url: url,
                headers: options.headers || {},
                data: options.body,
                onload: (response) => {
                    const mockResponse = {
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.responseHeaders,
                        text: () => Promise.resolve(response.responseText),
                        json: () => Promise.resolve(JSON.parse(response.responseText)),
                        blob: () => Promise.resolve(new Blob([response.response]))
                    };
                    resolve(mockResponse);
                },
                onerror: (error) => {
                    reject(new Error('Network request failed: ' + error));
                }
            };

            // Add timeout
            if (options.timeout) {
                gmOptions.timeout = options.timeout;
            }

            GM_xmlhttpRequest(gmOptions);
        });
    }

    // Override window.fetch for API calls
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
        // Only intercept API calls
        if (url.includes('localhost') || url.includes('otter-api')) {
            return fetchWithCORS(url, options);
        }
        return originalFetch(url, options);
    };

    // ===== Logger Utility =====
    const logger = {
        debug: (...args) => CONFIG.DEBUG_MODE && console.log('[Otter TM]', ...args),
        info: (...args) => console.info('[Otter TM]', ...args),
        warn: (...args) => console.warn('[Otter TM]', ...args),
        error: (...args) => console.error('[Otter TM]', ...args)
    };

    // ===== Storage Utility =====
    const storage = {
        async get(key, defaultValue = null) {
            return GM_getValue(key, defaultValue);
        },
        
        async set(key, value) {
            GM_setValue(key, value);
        },
        
        async remove(key) {
            GM_deleteValue(key);
        },
        
        async clear() {
            const keys = GM_listValues();
            for (const key of keys) {
                GM_deleteValue(key);
            }
        }
    };

    // ===== HTML Escape Utility =====
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ===== Category Cache =====
    const categoryCache = {
        _cache: new Map(),
        _timestamp: null,
        CACHE_DURATION: 3600000, // 1 hour

        async get(itemName) {
            if (!this._cache.size || !this._timestamp || 
                Date.now() - this._timestamp > this.CACHE_DURATION) {
                await this.refresh();
            }
            return this._cache.get(itemName);
        },

        async set(itemName, category) {
            this._cache.set(itemName, category);
            await this.save();
        },

        async refresh() {
            const saved = await storage.get('categoryMappings');
            if (saved) {
                this._cache = new Map(Object.entries(saved));
                this._timestamp = Date.now();
            }
        },

        async save() {
            const obj = Object.fromEntries(this._cache);
            await storage.set('categoryMappings', obj);
            this._timestamp = Date.now();
        }
    };

    // ===== API Client =====
    const apiClient = {
        async checkAuth() {
            const apiKey = await storage.get('apiKey');
            if (!apiKey) return { isAuthenticated: false };

            try {
                const response = await fetchWithCORS(`${CONFIG.API_BASE_URL}/api/auth/verify`, {
                    headers: {
                        'X-API-Key': apiKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                return {
                    isAuthenticated: response.ok,
                    user: response.ok ? await response.json() : null
                };
            } catch (error) {
                logger.error('Auth check failed:', error);
                return { isAuthenticated: false };
            }
        },

        async saveApiKey(apiKey) {
            await storage.set('apiKey', apiKey);
            return await this.checkAuth();
        },

        async submitPrepTimes(prepTimes) {
            const apiKey = await storage.get('apiKey');
            if (!apiKey) throw new Error('No API key found');

            const response = await fetchWithCORS(`${CONFIG.API_BASE_URL}/api/prep-times`, {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prepTimes })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        }
    };

    // ===== Prep Time Tracker =====
    class PrepTimeTracker {
        constructor() {
            this.startTimes = new Map();
            this.prepTimes = [];
        }

        startOrder(orderId) {
            if (!this.startTimes.has(orderId)) {
                this.startTimes.set(orderId, Date.now());
                logger.debug(`Started tracking prep time for order ${orderId}`);
            }
        }

        completeOrder(orderId, orderData = {}) {
            const startTime = this.startTimes.get(orderId);
            if (!startTime) {
                logger.warn(`No start time found for order ${orderId}`);
                return null;
            }

            const endTime = Date.now();
            const prepTimeMs = endTime - startTime;
            const prepTimeMinutes = Math.round(prepTimeMs / 1000 / 60);

            const prepTimeEntry = {
                orderId,
                orderNumber: orderData.orderNumber || 'Unknown',
                restaurantName: orderData.restaurantName || 'Unknown',
                items: orderData.items || [],
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                prepTimeMs,
                prepTimeMinutes,
                timestamp: new Date().toISOString()
            };

            this.prepTimes.push(prepTimeEntry);
            this.startTimes.delete(orderId);

            logger.info(`Order ${orderId} completed in ${prepTimeMinutes} minutes`);
            return prepTimeEntry;
        }

        async savePrepTimes() {
            if (this.prepTimes.length === 0) return;

            try {
                await apiClient.submitPrepTimes(this.prepTimes);
                logger.info(`Submitted ${this.prepTimes.length} prep times to API`);
                this.prepTimes = [];
            } catch (error) {
                logger.error('Failed to submit prep times:', error);
                // Keep prep times for retry
            }
        }
    }

    const prepTimeTracker = new PrepTimeTracker();

    // ===== Label Printer HTML (embedded) =====
    const LABEL_PRINTER_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Otter Order Labels</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .controls {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .controls h1 {
            margin-bottom: 20px;
            color: #333;
        }
        
        .controls button {
            background-color: #0055A4;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
        }
        
        .controls button:hover {
            background-color: #003370;
        }
        
        .labels-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, 4in);
            gap: 0;
            justify-content: center;
        }
        
        .label {
            width: 4in;
            height: 6in;
            background: white;
            border: 1px solid #ccc;
            padding: 0.25in;
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
        }
        
        .label-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        
        .order-info {
            flex: 1;
        }
        
        .order-number {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .customer-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .restaurant-name {
            font-size: 14px;
            color: #666;
        }
        
        .logo-container {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-container img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .items-section {
            flex: 1;
            overflow: hidden;
        }
        
        .items-title {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #333;
        }
        
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .item-name {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
        }
        
        .item-details {
            font-size: 12px;
            color: #666;
            margin-left: 20px;
        }
        
        .item-quantity {
            font-size: 16px;
            font-weight: bold;
            min-width: 30px;
            text-align: right;
        }
        
        .prep-time {
            font-size: 14px;
            color: #ff6b35;
            font-weight: bold;
            margin-top: 10px;
            padding: 5px;
            background: #fff3cd;
            border-radius: 4px;
            text-align: center;
        }
        
        .notes-section {
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .notes-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .notes-content {
            font-size: 12px;
            color: #333;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .controls {
                display: none;
            }
            
            .labels-container {
                gap: 0;
            }
            
            .label {
                border: none;
                margin: 0;
            }
        }
        
        @media (max-width: 768px) {
            .labels-container {
                grid-template-columns: 1fr;
            }
            
            .label {
                width: 100%;
                max-width: 4in;
                margin: 0 auto 20px;
            }
        }
    </style>
</head>
<body>
    <div class="controls">
        <h1>Order Labels</h1>
        <button onclick="window.print()">Print Labels</button>
        <button onclick="window.close()">Close</button>
    </div>
    
    <div class="labels-container" id="labelsContainer">
        <!-- Labels will be inserted here -->
    </div>
    
    <script>
        // Listen for label data
        window.addEventListener('message', function(event) {
            if (event.data.type === 'printLabels' && event.data.labels) {
                renderLabels(event.data.labels);
            }
        });
        
        function renderLabels(labels) {
            const container = document.getElementById('labelsContainer');
            container.innerHTML = '';
            
            labels.forEach(label => {
                const labelElement = createLabelElement(label);
                container.appendChild(labelElement);
            });
        }
        
        function createLabelElement(label) {
            const div = document.createElement('div');
            div.className = 'label';
            
            div.innerHTML = \`
                <div class="label-header">
                    <div class="order-info">
                        <div class="order-number">Order #\${escapeHtml(label.orderNumber)}</div>
                        <div class="customer-name">\${escapeHtml(label.customerName)}</div>
                        <div class="restaurant-name">\${escapeHtml(label.restaurantName)}</div>
                    </div>
                    <div class="logo-container">
                        \${label.logoUrl ? \`<img src="\${escapeHtml(label.logoUrl)}" alt="Logo">\` : ''}
                    </div>
                </div>
                
                <div class="items-section">
                    <div class="items-title">Items</div>
                    \${label.items.map(item => \`
                        <div class="item-row">
                            <div>
                                <div class="item-name">\${escapeHtml(item.name)}</div>
                                \${item.details ? \`<div class="item-details">\${escapeHtml(item.details)}</div>\` : ''}
                            </div>
                            <div class="item-quantity">\${item.quantity}</div>
                        </div>
                    \`).join('')}
                </div>
                
                \${label.prepTime ? \`
                    <div class="prep-time">Prep Time: \${label.prepTime} min</div>
                \` : ''}
                
                \${label.notes ? \`
                    <div class="notes-section">
                        <div class="notes-title">Notes</div>
                        <div class="notes-content">\${escapeHtml(label.notes)}</div>
                    </div>
                \` : ''}
            \`;
            
            return div;
        }
        
        function escapeHtml(unsafe) {
            if (typeof unsafe !== 'string') return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        // Check for label data in URL
        const urlParams = new URLSearchParams(window.location.search);
        const labelsData = urlParams.get('labels');
        if (labelsData) {
            try {
                const labels = JSON.parse(decodeURIComponent(labelsData));
                renderLabels(labels);
            } catch (e) {
                console.error('Failed to parse label data:', e);
            }
        }
    </script>
</body>
</html>
    `;

    // ===== React Data Extractor (Fixed) =====
    class ReactDataExtractor {
        constructor() {
            this.retryCount = 0;
            this.maxRetries = CONFIG.EXTRACTION_MAX_RETRIES;
            this.extractedOrders = [];
        }

        injectPageContextScript() {
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    console.log('[Otter TM] Page context script injected');
                    
                    function extractOrdersFromReact() {
                        const orderRows = document.querySelectorAll('[data-testid="order-row"]');
                        console.log('[Otter TM] Found ' + orderRows.length + ' order rows');
                        
                        if (orderRows.length === 0) return [];
                        
                        const orders = [];
                        
                        orderRows.forEach((row, index) => {
                            try {
                                // Find React fiber property
                                const keys = Object.keys(row);
                                const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
                                
                                if (!fiberKey) {
                                    console.log('[Otter TM] No fiber key found for row ' + index);
                                    return;
                                }
                                
                                let fiber = row[fiberKey];
                                let depth = 0;
                                let orderData = null;
                                
                                // Navigate UP the fiber tree (usually at depth 2)
                                while (fiber && depth < 10) {
                                    if (fiber.memoizedProps && fiber.memoizedProps.order) {
                                        orderData = fiber.memoizedProps.order;
                                        console.log('[Otter TM] Found order at depth ' + depth);
                                        break;
                                    }
                                    fiber = fiber.return;
                                    depth++;
                                }
                                
                                if (orderData) {
                                    // Extract order details
                                    const co = orderData.customerOrder || orderData;
                                    
                                    const order = {
                                        id: co.orderId?.id || co.id || 'unknown',
                                        orderNumber: co.orderIdentifier?.displayId || co.displayId || 'unknown',
                                        customerName: co.customer?.displayName || 'Unknown',
                                        restaurantName: co.store?.name || co.storeName || 'Unknown Restaurant',
                                        orderStatus: co.state || co.status || 'UNKNOWN',
                                        orderedAt: co.orderedAt || co.createdAt,
                                        waitTime: co.confirmationInfo?.estimatedPrepTimeMinutes || 0,
                                        items: []
                                    };
                                    
                                    // Extract items
                                    if (co.customerItemsContainer) {
                                        const itemsArray = co.customerItemsContainer.items || [];
                                        const modifiersMap = co.customerItemsContainer.modifiers || {};
                                        
                                        itemsArray.forEach(item => {
                                            if (item.orderItemDetail) {
                                                const itemDetail = item.orderItemDetail;
                                                let size = 'no-size';
                                                
                                                // Check for Urban Bowl
                                                if (itemDetail.name.toLowerCase().includes('urban bowl')) {
                                                    size = 'urban';
                                                }
                                                
                                                // Extract size from modifiers
                                                if (item.modifierCustomerItemIds && size !== 'urban') {
                                                    const sizeModifiers = [];
                                                    
                                                    item.modifierCustomerItemIds.forEach(modId => {
                                                        const modifier = modifiersMap[modId];
                                                        if (modifier && modifier.orderItemDetail) {
                                                            const modName = modifier.orderItemDetail.name;
                                                            const modNameLower = modName.toLowerCase();
                                                            
                                                            if (modNameLower.includes('small') || 
                                                                modNameLower.includes('large') || 
                                                                modNameLower.includes('rice') || 
                                                                modNameLower.includes('noodle')) {
                                                                sizeModifiers.push(modName);
                                                            }
                                                        }
                                                    });
                                                    
                                                    if (sizeModifiers.length > 0) {
                                                        const baseSize = sizeModifiers.find(m => 
                                                            m.toLowerCase() === 'small' || 
                                                            m.toLowerCase() === 'large'
                                                        );
                                                        
                                                        const substitution = sizeModifiers.find(m => 
                                                            m.toLowerCase().includes('rice') || 
                                                            m.toLowerCase().includes('noodle')
                                                        );
                                                        
                                                        if (baseSize && substitution) {
                                                            size = baseSize.toLowerCase() + ' - ' + substitution.toLowerCase();
                                                        } else if (baseSize) {
                                                            size = baseSize.toLowerCase();
                                                        } else if (sizeModifiers.length === 1) {
                                                            size = sizeModifiers[0].toLowerCase();
                                                        }
                                                    }
                                                }
                                                
                                                order.items.push({
                                                    name: itemDetail.name,
                                                    quantity: itemDetail.quantity || 1,
                                                    size: size,
                                                    note: itemDetail.note || ''
                                                });
                                            }
                                        });
                                    }
                                    
                                    orders.push(order);
                                    console.log('[Otter TM] Extracted order: ' + order.orderNumber);
                                }
                            } catch (error) {
                                console.error('[Otter TM] Error extracting row ' + index, error);
                            }
                        });
                        
                        return orders;
                    }
                    
                    // Listen for extraction requests
                    window.addEventListener('otter-tm-extract-request', function() {
                        console.log('[Otter TM] Extraction requested');
                        const orders = extractOrdersFromReact();
                        
                        window.postMessage({
                            type: 'otter-tm-extract-response',
                            orders: orders,
                            success: true
                        }, '*');
                    });
                    
                    // Notify content script that we're ready
                    window.postMessage({ type: 'otter-tm-ready' }, '*');
                })();
            `;
            
            document.head.appendChild(script);
            script.remove();
        }

        async waitForReactData() {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout waiting for React data'));
                }, 10000);

                const messageHandler = (event) => {
                    if (event.data.type === 'otter-tm-extract-response') {
                        clearTimeout(timeout);
                        window.removeEventListener('message', messageHandler);
                        
                        if (event.data.success) {
                            resolve(event.data.orders);
                        } else {
                            reject(new Error('Extraction failed'));
                        }
                    }
                };

                window.addEventListener('message', messageHandler);
                
                // Request extraction
                window.dispatchEvent(new Event('otter-tm-extract-request'));
            });
        }

        async extractOrders() {
            try {
                logger.info('Starting React data extraction...');
                
                // Wait for page to be ready
                await this.waitForPageReady();
                
                // Inject extraction script
                this.injectPageContextScript();
                
                // Wait for React data
                const orders = await this.waitForReactData();
                
                logger.info(`Extracted ${orders.length} orders from React`);
                return orders;
                
            } catch (error) {
                logger.error('React extraction failed:', error);
                
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    logger.info(`Retrying extraction (${this.retryCount}/${this.maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.EXTRACTION_RETRY_DELAY));
                    return this.extractOrders();
                }
                
                return [];
            }
        }

        async waitForPageReady() {
            return new Promise((resolve) => {
                if (document.readyState === 'complete') {
                    // Additional wait for React to initialize
                    setTimeout(resolve, 1000);
                } else {
                    window.addEventListener('load', () => {
                        setTimeout(resolve, 1000);
                    });
                }
            });
        }
    }

    // ===== Process Batch Inline (replacement for background script) =====
    async function processBatchInline(orders) {
        try {
            logger.info(`Processing batch of ${orders.length} orders...`);
            
            // Group orders by restaurant
            const ordersByRestaurant = {};
            orders.forEach(order => {
                const restaurant = order.restaurantName || 'Unknown';
                if (!ordersByRestaurant[restaurant]) {
                    ordersByRestaurant[restaurant] = [];
                }
                ordersByRestaurant[restaurant].push(order);
            });
            
            // Create labels
            const labels = [];
            
            for (const [restaurant, restaurantOrders] of Object.entries(ordersByRestaurant)) {
                restaurantOrders.forEach(order => {
                    const label = {
                        orderNumber: order.orderNumber,
                        customerName: order.customerName,
                        restaurantName: restaurant,
                        logoUrl: getRestaurantLogo(restaurant),
                        items: order.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            details: item.size !== 'no-size' ? item.size : ''
                        })),
                        prepTime: order.waitTime || null,
                        notes: order.orderNotes || ''
                    };
                    labels.push(label);
                });
            }
            
            // Open label printer
            openLabelPrinter(labels);
            
            // Track prep times
            orders.forEach(order => {
                prepTimeTracker.startOrder(order.id);
            });
            
            // Show success notification
            GM_notification({
                title: 'Batch Processed',
                text: `Successfully processed ${orders.length} orders`,
                timeout: 3000
            });
            
        } catch (error) {
            logger.error('Failed to process batch:', error);
            GM_notification({
                title: 'Batch Processing Failed',
                text: error.message,
                timeout: 5000
            });
        }
    }

    // ===== Open Label Printer =====
    function openLabelPrinter(labels) {
        // Option 1: Use data URL with embedded HTML
        const labelData = encodeURIComponent(JSON.stringify(labels));
        const dataUrl = `data:text/html;base64,${btoa(LABEL_PRINTER_HTML)}`;
        
        // Open in new tab
        const newTab = GM_openInTab(dataUrl, { active: false });
        
        // Send label data via postMessage after a delay
        setTimeout(() => {
            // Note: postMessage to GM_openInTab windows may not work in all browsers
            // Alternative: encode labels in URL hash
            const urlWithData = dataUrl + '#' + labelData;
            GM_openInTab(urlWithData, { active: false });
        }, 1000);
    }

    // ===== Get Restaurant Logo =====
    function getRestaurantLogo(restaurantName) {
        const name = restaurantName.toLowerCase();
        
        // Map restaurant names to logo URLs
        const logoMap = {
            'bao by kaya': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'hi street bowl + grill': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'bunch of lunch': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        };
        
        for (const [key, url] of Object.entries(logoMap)) {
            if (name.includes(key)) {
                return url;
            }
        }
        
        return null;
    }

    // ===== Overlay UI =====
    class OverlayUI {
        constructor() {
            this.isVisible = false;
            this.selectedOrders = new Set();
            this.allOrders = [];
            this.authChecked = false;
            this.isAuthenticated = false;
        }

        init() {
            this.injectStyles();
            this.createOverlay();
            this.attachEventListeners();
            this.checkMobileDevice();
        }

        checkMobileDevice() {
            const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
            const isTablet = window.innerWidth <= CONFIG.TABLET_BREAKPOINT;
            
            if (isMobile || isTablet) {
                document.body.classList.add('otter-mobile');
                if (isTablet && !isMobile) {
                    document.body.classList.add('otter-tablet');
                }
            }
        }

        injectStyles() {
            const styles = `
                .otter-overlay {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border: 2px solid #0055A4;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                    max-width: 400px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }
                
                .otter-overlay.otter-minimized {
                    max-height: 60px;
                }
                
                .otter-header {
                    background: #0055A4;
                    color: white;
                    padding: 15px;
                    border-radius: 6px 6px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                    user-select: none;
                }
                
                .otter-title {
                    font-size: 16px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                }
                
                .otter-title svg {
                    margin-right: 8px;
                }
                
                .otter-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .otter-control-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .otter-control-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .otter-content {
                    padding: 15px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                .otter-auth-section {
                    padding: 20px;
                    text-align: center;
                }
                
                .otter-auth-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                
                .otter-auth-btn {
                    width: 100%;
                    padding: 10px;
                    background: #0055A4;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .otter-auth-btn:hover {
                    background: #003370;
                }
                
                .otter-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .otter-stat {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 4px;
                    text-align: center;
                }
                
                .otter-stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #0055A4;
                }
                
                .otter-stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }
                
                .otter-action-buttons {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .otter-btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.2s;
                }
                
                .otter-btn-primary {
                    background: #0055A4;
                    color: white;
                }
                
                .otter-btn-primary:hover {
                    background: #003370;
                }
                
                .otter-btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .otter-btn-secondary:hover {
                    background: #5a6268;
                }
                
                .otter-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .otter-orders-list {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                .otter-order-item {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .otter-order-item:hover {
                    background: #f8f9fa;
                }
                
                .otter-order-item.otter-selected {
                    background: #e3f2fd;
                }
                
                .otter-order-checkbox {
                    margin-right: 10px;
                }
                
                .otter-order-info {
                    flex: 1;
                }
                
                .otter-order-number {
                    font-weight: bold;
                    color: #333;
                }
                
                .otter-order-details {
                    font-size: 12px;
                    color: #666;
                }
                
                .otter-order-status {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                
                .otter-status-new {
                    background: #28a745;
                    color: white;
                }
                
                .otter-status-confirmed {
                    background: #ffc107;
                    color: #333;
                }
                
                .otter-message {
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                
                .otter-message-success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .otter-message-error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                /* Mobile styles */
                @media (max-width: 768px) {
                    .otter-overlay {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                    
                    .otter-stats {
                        grid-template-columns: 1fr;
                    }
                    
                    .otter-action-buttons {
                        flex-direction: column;
                    }
                    
                    .otter-orders-list {
                        max-height: 200px;
                    }
                }
                
                /* Touch-friendly adjustments */
                .otter-mobile .otter-order-item {
                    padding: 15px;
                    min-height: 60px;
                }
                
                .otter-mobile .otter-btn {
                    padding: 15px;
                    font-size: 16px;
                }
                
                .otter-mobile .otter-order-checkbox {
                    width: 20px;
                    height: 20px;
                }
                
                /* Tablet specific */
                .otter-tablet .otter-overlay {
                    max-width: 500px;
                }
            `;
            
            GM_addStyle(styles);
        }

        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.className = 'otter-overlay';
            this.overlay.style.display = 'none';
            
            this.overlay.innerHTML = `
                <div class="otter-header">
                    <div class="otter-title">
                        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="14" fill="white" stroke="white" stroke-width="2"/>
                            <path d="M8 14H12V24H8V14Z" fill="#0055A4"/>
                            <path d="M14 10H18V24H14V10Z" fill="#0055A4"/>
                            <path d="M20 8H24V24H20V8Z" fill="#0055A4"/>
                        </svg>
                        Otter Consolidator
                    </div>
                    <div class="otter-controls">
                        <button class="otter-control-btn" id="otterMinimize" title="Minimize">−</button>
                        <button class="otter-control-btn" id="otterClose" title="Close">×</button>
                    </div>
                </div>
                <div class="otter-content" id="otterContent">
                    <!-- Content will be dynamically updated -->
                </div>
            `;
            
            document.body.appendChild(this.overlay);
        }

        attachEventListeners() {
            // Header drag functionality
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };
            
            const header = this.overlay.querySelector('.otter-header');
            
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.otter-control-btn')) return;
                isDragging = true;
                dragOffset.x = e.clientX - this.overlay.offsetLeft;
                dragOffset.y = e.clientY - this.overlay.offsetTop;
            });
            
            // Touch events for mobile
            header.addEventListener('touchstart', (e) => {
                if (e.target.closest('.otter-control-btn')) return;
                isDragging = true;
                const touch = e.touches[0];
                dragOffset.x = touch.clientX - this.overlay.offsetLeft;
                dragOffset.y = touch.clientY - this.overlay.offsetTop;
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                this.overlay.style.left = (e.clientX - dragOffset.x) + 'px';
                this.overlay.style.top = (e.clientY - dragOffset.y) + 'px';
                this.overlay.style.right = 'auto';
            });
            
            document.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                this.overlay.style.left = (touch.clientX - dragOffset.x) + 'px';
                this.overlay.style.top = (touch.clientY - dragOffset.y) + 'px';
                this.overlay.style.right = 'auto';
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            document.addEventListener('touchend', () => {
                isDragging = false;
            });
            
            // Control buttons
            document.getElementById('otterMinimize').addEventListener('click', () => {
                this.overlay.classList.toggle('otter-minimized');
            });
            
            document.getElementById('otterClose').addEventListener('click', () => {
                this.hide();
            });
            
            // Keyboard shortcut
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }

        async show() {
            this.overlay.style.display = 'block';
            this.isVisible = true;
            
            if (!this.authChecked) {
                await this.checkAuth();
            }
            
            if (this.isAuthenticated) {
                await this.refreshOrders();
            }
        }

        hide() {
            this.overlay.style.display = 'none';
            this.isVisible = false;
        }

        toggle() {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }

        async checkAuth() {
            const result = await apiClient.checkAuth();
            this.authChecked = true;
            this.isAuthenticated = result.isAuthenticated;
            
            if (!this.isAuthenticated) {
                this.showAuthUI();
            } else {
                this.showMainUI();
            }
        }

        showAuthUI() {
            const content = document.getElementById('otterContent');
            content.innerHTML = `
                <div class="otter-auth-section">
                    <h3>Authentication Required</h3>
                    <p>Please enter your API key to continue</p>
                    <input type="password" 
                           class="otter-auth-input" 
                           id="otterApiKey" 
                           placeholder="Enter API Key"
                           autocomplete="off">
                    <button class="otter-auth-btn" id="otterAuthSubmit">
                        Authenticate
                    </button>
                </div>
            `;
            
            document.getElementById('otterAuthSubmit').addEventListener('click', async () => {
                const apiKey = document.getElementById('otterApiKey').value.trim();
                if (!apiKey) return;
                
                const result = await apiClient.saveApiKey(apiKey);
                if (result.isAuthenticated) {
                    this.isAuthenticated = true;
                    this.showMainUI();
                    await this.refreshOrders();
                } else {
                    this.showMessage('Invalid API key', 'error');
                }
            });
            
            // Enter key support
            document.getElementById('otterApiKey').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('otterAuthSubmit').click();
                }
            });
        }

        showMainUI() {
            const content = document.getElementById('otterContent');
            content.innerHTML = `
                <div class="otter-stats">
                    <div class="otter-stat">
                        <div class="otter-stat-value" id="otterTotalOrders">0</div>
                        <div class="otter-stat-label">Total Orders</div>
                    </div>
                    <div class="otter-stat">
                        <div class="otter-stat-value" id="otterSelectedOrders">0</div>
                        <div class="otter-stat-label">Selected</div>
                    </div>
                </div>
                
                <div class="otter-action-buttons">
                    <button class="otter-btn otter-btn-primary" id="otterRefresh">
                        Refresh Orders
                    </button>
                    <button class="otter-btn otter-btn-secondary" id="otterSelectAll">
                        Select All
                    </button>
                </div>
                
                <div class="otter-orders-list" id="otterOrdersList">
                    <!-- Orders will be populated here -->
                </div>
                
                <div class="otter-action-buttons">
                    <button class="otter-btn otter-btn-primary" 
                            id="otterProcessBatch" 
                            disabled>
                        Process Batch (0)
                    </button>
                </div>
            `;
            
            // Attach event listeners
            document.getElementById('otterRefresh').addEventListener('click', () => {
                this.refreshOrders();
            });
            
            document.getElementById('otterSelectAll').addEventListener('click', () => {
                this.selectAllOrders();
            });
            
            document.getElementById('otterProcessBatch').addEventListener('click', () => {
                this.processBatch();
            });
        }

        async refreshOrders() {
            logger.info('Refreshing orders...');
            
            const extractor = new ReactDataExtractor();
            const orders = await extractor.extractOrders();
            
            this.allOrders = orders;
            this.selectedOrders.clear();
            this.updateOrdersList();
            this.updateStats();
        }

        updateOrdersList() {
            const listElement = document.getElementById('otterOrdersList');
            if (!listElement) return;
            
            listElement.innerHTML = '';
            
            this.allOrders.forEach((order, index) => {
                const orderElement = document.createElement('div');
                orderElement.className = 'otter-order-item';
                if (this.selectedOrders.has(index)) {
                    orderElement.classList.add('otter-selected');
                }
                
                orderElement.innerHTML = `
                    <input type="checkbox" 
                           class="otter-order-checkbox" 
                           data-index="${index}"
                           ${this.selectedOrders.has(index) ? 'checked' : ''}>
                    <div class="otter-order-info">
                        <div class="otter-order-number">Order #${escapeHtml(order.orderNumber)}</div>
                        <div class="otter-order-details">
                            ${escapeHtml(order.customerName)} • ${order.items.length} items
                        </div>
                    </div>
                    <span class="otter-order-status otter-status-${order.orderStatus.toLowerCase()}">
                        ${escapeHtml(order.orderStatus)}
                    </span>
                `;
                
                orderElement.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox') {
                        const checkbox = orderElement.querySelector('.otter-order-checkbox');
                        checkbox.checked = !checkbox.checked;
                    }
                    this.toggleOrderSelection(index);
                });
                
                listElement.appendChild(orderElement);
            });
        }

        toggleOrderSelection(index) {
            if (this.selectedOrders.has(index)) {
                this.selectedOrders.delete(index);
            } else {
                this.selectedOrders.add(index);
            }
            
            this.updateStats();
            this.updateOrdersList();
        }

        selectAllOrders() {
            if (this.selectedOrders.size === this.allOrders.length) {
                this.selectedOrders.clear();
            } else {
                this.allOrders.forEach((_, index) => {
                    this.selectedOrders.add(index);
                });
            }
            
            this.updateStats();
            this.updateOrdersList();
        }

        updateStats() {
            const totalElement = document.getElementById('otterTotalOrders');
            const selectedElement = document.getElementById('otterSelectedOrders');
            const processBtn = document.getElementById('otterProcessBatch');
            
            if (totalElement) {
                totalElement.textContent = this.allOrders.length;
            }
            
            if (selectedElement) {
                selectedElement.textContent = this.selectedOrders.size;
            }
            
            if (processBtn) {
                processBtn.disabled = this.selectedOrders.size === 0;
                processBtn.textContent = `Process Batch (${this.selectedOrders.size})`;
            }
        }

        async processBatch() {
            if (this.selectedOrders.size === 0) return;
            
            const selectedOrdersArray = Array.from(this.selectedOrders).map(index => this.allOrders[index]);
            
            // Process batch
            await processBatchInline(selectedOrdersArray);
            
            // Clear selection
            this.selectedOrders.clear();
            this.updateStats();
            this.updateOrdersList();
            
            // Show success message
            this.showMessage(`Successfully processed ${selectedOrdersArray.length} orders`, 'success');
            
            // Refresh after delay
            setTimeout(() => {
                this.refreshOrders();
            }, CONFIG.BATCH_COMPLETE_DELAY);
        }

        showMessage(message, type = 'success') {
            const messageElement = document.createElement('div');
            messageElement.className = `otter-message otter-message-${type}`;
            messageElement.textContent = message;
            
            const content = document.getElementById('otterContent');
            content.insertBefore(messageElement, content.firstChild);
            
            setTimeout(() => {
                messageElement.remove();
            }, 3000);
        }
    }

    // ===== Initialize =====
    logger.info('Otter Order Consolidator (Tampermonkey) initializing...');
    
    // Create and initialize overlay
    const overlay = new OverlayUI();
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            overlay.init();
        });
    } else {
        overlay.init();
    }
    
    // Expose for debugging
    unsafeWindow.otterDebug = {
        overlay: overlay,
        storage: storage,
        apiClient: apiClient,
        prepTimeTracker: prepTimeTracker,
        config: CONFIG,
        version: GM_info.script.version
    };
    
    logger.info('Otter Order Consolidator ready! Press Ctrl+Shift+O to open.');
})();