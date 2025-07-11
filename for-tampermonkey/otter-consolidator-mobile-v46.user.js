// ==UserScript==
// @name         Otter Order Consolidator v4 - Tampermonkey Edition
// @namespace    http://tampermonkey.net/
// @version      4.6.0
// @description  Consolidate orders and print batch labels for Otter - Optimized for Firefox Mobile & Tablets
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
    
    // Show immediate visual feedback (matching working version)
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
        z-index: 999999;
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
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            triggerBtn.onclick = () => {
                loadingIndicator.innerHTML = '⚡ Initializing...';
                loadingIndicator.style.background = '#ff9800';
                
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
                                z-index: 999998;
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
                            window.init().catch(err => {
                                console.error('Init failed:', err);
                                loadingIndicator.innerHTML = '⚠️ Using Manual Mode';
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
            
            setTimeout(() => {
                loadingIndicator.style.background = '#4CAF50';
                loadingIndicator.innerHTML = '✅ Otter Consolidator Ready';
                setTimeout(() => {
                    loadingIndicator.style.opacity = '0.7';
                }, 2000);
            }, 1000);
        } else {
            setTimeout(addIndicator, 100);
        }
    }
    addIndicator();