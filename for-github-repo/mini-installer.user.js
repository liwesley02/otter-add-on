// ==UserScript==
// @name         Otter Order Consolidator v4 - Installer
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Installer for Otter Order Consolidator (downloads full script)
// @author       Your Name
// @match        https://app.tryotter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_notification
// @run-at       document-idle
// @connect      raw.githubusercontent.com
// @connect      gist.githubusercontent.com
// @connect      pastebin.com
// ==/UserScript==

(function() {
    'use strict';

    // GitHub raw URL for the main script
    const SCRIPT_URL = 'https://raw.githubusercontent.com/liwesley02/otter-add-on/main/otter-order-consolidator.user.js';

    console.log('Otter Order Consolidator Installer - Checking for main script...');

    // Check if main script is already installed
    if (window.otterOrderConsolidatorInstalled) {
        console.log('Main script already installed!');
        return;
    }

    // Show installation notification
    const notice = document.createElement('div');
    notice.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    notice.textContent = 'Installing Otter Order Consolidator...';
    document.body.appendChild(notice);

    // Download and execute the main script
    GM_xmlhttpRequest({
        method: 'GET',
        url: SCRIPT_URL,
        onload: function(response) {
            if (response.status === 200) {
                try {
                    // Create script element
                    const script = document.createElement('script');
                    script.textContent = response.responseText;
                    document.head.appendChild(script);
                    
                    notice.textContent = '✓ Otter Order Consolidator installed successfully!';
                    notice.style.background = '#4CAF50';
                    
                    // Remove notice after 3 seconds
                    setTimeout(() => notice.remove(), 3000);
                    
                    // Mark as installed
                    GM_setValue('mainScriptInstalled', true);
                    
                    // Refresh page to activate
                    setTimeout(() => location.reload(), 3500);
                    
                } catch (error) {
                    notice.textContent = '✗ Installation failed: ' + error.message;
                    notice.style.background = '#f44336';
                }
            } else {
                notice.textContent = '✗ Failed to download script (Status: ' + response.status + ')';
                notice.style.background = '#f44336';
            }
        },
        onerror: function() {
            notice.textContent = '✗ Network error - could not download script';
            notice.style.background = '#f44336';
        }
    });

})();