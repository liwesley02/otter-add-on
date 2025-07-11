// ==UserScript==
// @name         Otter Order Consolidator - Minimal Test
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Minimal test script for Firefox mobile compatibility
// @author       Your Name
// @match        https://app.tryotter.com/orders*
// @match        https://app.tryotter.com/orders/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // Immediate console log to verify script loads
    console.log('🚀 Otter Consolidator Minimal - Script loaded!');
    console.log('Current URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // Function to create our test UI
    function createTestUI() {
        console.log('📦 Creating test UI...');
        
        // Create a simple floating button
        const testButton = document.createElement('button');
        testButton.textContent = '🦦 Otter Test';
        testButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 15px 20px;
            font-size: 16px;
            border-radius: 50px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
        
        // Add click handler
        testButton.addEventListener('click', function() {
            alert('✅ Tampermonkey script is working!\n\nURL: ' + window.location.href);
            console.log('Button clicked!');
        });
        
        // Add hover effect
        testButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#45a049';
        });
        testButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#4CAF50';
        });
        
        // Append to body
        document.body.appendChild(testButton);
        console.log('✅ Test button added to page');
        
        // Also add a visual indicator at the top
        const indicator = document.createElement('div');
        indicator.textContent = '🦦 Otter Script Active';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            background-color: #2196F3;
            color: white;
            padding: 5px 15px;
            font-size: 14px;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
            font-family: Arial, sans-serif;
        `;
        
        document.body.appendChild(indicator);
        console.log('✅ Top indicator added');
        
        // Auto-hide the top indicator after 5 seconds
        setTimeout(() => {
            indicator.style.transition = 'opacity 1s';
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 1000);
        }, 5000);
    }
    
    // Try to create UI immediately
    if (document.body) {
        createTestUI();
    } else {
        // If body doesn't exist yet, wait for it
        console.log('⏳ Waiting for document.body...');
        const observer = new MutationObserver(function(mutations, obs) {
            if (document.body) {
                console.log('✅ document.body found!');
                createTestUI();
                obs.disconnect();
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
    
    // Also try on various load events as backup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 DOMContentLoaded fired');
            if (!document.querySelector('button[style*="Otter Test"]')) {
                createTestUI();
            }
        });
    }
    
    window.addEventListener('load', function() {
        console.log('🌐 Window load event fired');
        if (!document.querySelector('button[style*="Otter Test"]')) {
            createTestUI();
        }
    });
    
    // Log every 2 seconds to show script is still running
    let logCount = 0;
    setInterval(() => {
        logCount++;
        console.log(`⏰ Script still active - ${logCount * 2} seconds elapsed`);
    }, 2000);
    
})();