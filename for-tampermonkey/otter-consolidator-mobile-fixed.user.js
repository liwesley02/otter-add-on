// ==UserScript==
// @name         Otter Order Consolidator v4 - Mobile/Tablet Edition
// @namespace    http://tampermonkey.net/
// @version      4.4.0
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
// @run-at       document-end
// @connect      localhost
// @connect      tryotter.com
// @connect      *.tryotter.com
// ==/UserScript==

(function() {
    'use strict';
    
    // Immediate feedback that script is loaded
    console.log('🦦 Otter Order Consolidator v4 (Mobile/Tablet) - Script injected!', {
        url: window.location.href,
        time: new Date().toISOString(),
        readyState: document.readyState,
        userAgent: navigator.userAgent
    });
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
    const screenWidth = window.innerWidth;
    
    console.log('🦦 Device Detection:', {
        isMobile,
        isTablet,
        screenWidth,
        devicePixelRatio: window.devicePixelRatio
    });
    
    // Add visible indicator that script is running
    function addDebugIndicator(text = '🦦 Loading...', color = 'orange') {
        const existing = document.getElementById('otter-debug-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'otter-debug-indicator';
        indicator.textContent = text;
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 999999;
            background: ${color};
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        indicator.onclick = () => {
            console.log('🦦 Manual trigger clicked');
            if (window.init) {
                window.init();
            } else {
                console.error('Init function not found');
            }
        };
        
        if (document.body) {
            document.body.appendChild(indicator);
        } else {
            // If body doesn't exist yet, wait for it
            const observer = new MutationObserver(() => {
                if (document.body) {
                    document.body.appendChild(indicator);
                    observer.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
        return indicator;
    }
    
    // Show initial loading indicator
    addDebugIndicator('🦦 Script loaded...');
    
    // ===== INJECT STYLES EARLY FOR MOBILE =====
    const mobileOptimizedStyles = `
/* Mobile-optimized overlay styles */
#otter-consolidator-overlay {
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    max-width: 600px !important;
    height: 100vh !important;
    background: #1a1a1a !important;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.5) !important;
    z-index: 999999 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px !important;
    transition: transform 0.3s ease !important;
    display: flex !important;
    flex-direction: column !important;
    color: #ffffff !important;
    overflow: hidden !important;
    visibility: visible !important;
    opacity: 1 !important;
}

/* Mobile specific styles */
@media (max-width: 768px) {
    #otter-consolidator-overlay {
        width: 100vw !important;
        max-width: 100vw !important;
        left: 0 !important;
        right: 0 !important;
        font-size: 16px !important;
    }
    
    #otter-consolidator-overlay.collapsed {
        transform: translateX(100%) !important;
    }
    
    .otter-header {
        font-size: 16px !important;
        padding: 12px !important;
        height: auto !important;
        min-height: 50px !important;
    }
    
    .otter-title {
        font-size: 18px !important;
    }
    
    .batch-section {
        margin-bottom: 12px !important;
        border-radius: 8px !important;
    }
    
    .wave-items-wrapper {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
    }
    
    .batch-controls {
        padding: 12px !important;
        font-size: 14px !important;
    }
    
    .batch-capacity-control {
        flex-wrap: wrap !important;
        gap: 8px !important;
    }
    
    .batch-capacity-input {
        width: 60px !important;
        height: 36px !important;
        font-size: 16px !important;
        padding: 8px !important;
    }
    
    .print-labels-btn {
        padding: 8px 16px !important;
        font-size: 14px !important;
    }
    
    /* Touch-friendly buttons */
    button, .otter-btn {
        min-height: 44px !important;
        padding: 12px 16px !important;
        font-size: 16px !important;
    }
    
    /* Better scrolling on mobile */
    .otter-content {
        -webkit-overflow-scrolling: touch !important;
        overflow-y: auto !important;
    }
    
    /* Hide main content when overlay is open on mobile */
    body:has(#otter-consolidator-overlay:not(.collapsed)) {
        overflow: hidden !important;
    }
}

/* Tablet specific styles */
@media (min-width: 769px) and (max-width: 1024px) {
    #otter-consolidator-overlay {
        width: 70% !important;
        max-width: 600px !important;
    }
    
    .otter-header {
        font-size: 15px !important;
    }
    
    button, .otter-btn {
        min-height: 40px !important;
        font-size: 15px !important;
    }
}

/* Desktop styles */
@media (min-width: 1025px) {
    #otter-consolidator-overlay {
        width: 40vw !important;
        min-width: 500px !important;
        max-width: 600px !important;
    }
}

/* Floating toggle button - mobile optimized */
.otter-floating-toggle {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    width: 60px !important;
    height: 60px !important;
    background: #007bff !important;
    color: white !important;
    border: none !important;
    border-radius: 50% !important;
    font-size: 28px !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    z-index: 1000000 !important;
    transition: all 0.2s ease !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    -webkit-tap-highlight-color: transparent !important;
}

@media (max-width: 768px) {
    .otter-floating-toggle {
        width: 56px !important;
        height: 56px !important;
        bottom: 16px !important;
        right: 16px !important;
    }
}

/* Mode toggle button - mobile optimized */
.otter-mode-toggle {
    position: fixed !important;
    bottom: 90px !important;
    right: 20px !important;
    background: #333 !important;
    color: white !important;
    border: 1px solid #555 !important;
    border-radius: 25px !important;
    padding: 8px 16px !important;
    font-size: 14px !important;
    cursor: pointer !important;
    z-index: 1000000 !important;
    transition: all 0.2s ease !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    opacity: 0.9 !important;
    -webkit-tap-highlight-color: transparent !important;
}

@media (max-width: 768px) {
    .otter-mode-toggle {
        bottom: 80px !important;
        right: 16px !important;
        font-size: 13px !important;
    }
}

/* Force visibility */
#otter-consolidator-overlay,
.otter-floating-toggle,
.otter-mode-toggle {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
}

/* Ensure proper stacking */
#otter-consolidator-overlay * {
    position: relative;
    z-index: 999999;
}

/* Additional mobile optimizations */
@media (max-width: 768px) {
    /* Larger touch targets */
    .batch-customer-badge {
        padding: 6px 12px !important;
        font-size: 13px !important;
    }
    
    .wave-item {
        padding: 12px !important;
        font-size: 14px !important;
    }
    
    .wave-item-quantity {
        font-size: 16px !important;
        font-weight: bold !important;
    }
    
    /* Better spacing */
    .batch-header {
        padding: 12px !important;
    }
    
    .batch-content {
        padding: 12px !important;
    }
    
    /* Responsive text */
    .batch-header h3 {
        font-size: 16px !important;
    }
    
    .wave-size-header {
        font-size: 15px !important;
    }
    
    .wave-category-header {
        font-size: 14px !important;
    }
}

/* Debug indicator mobile styling */
#otter-debug-indicator {
    font-size: 14px !important;
    padding: 10px 14px !important;
}

@media (max-width: 768px) {
    #otter-debug-indicator {
        top: auto !important;
        bottom: 160px !important;
        font-size: 12px !important;
        padding: 8px 12px !important;
    }
}
`;

    // Inject styles immediately
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(mobileOptimizedStyles);
        console.log('🦦 Mobile-optimized styles injected via GM_addStyle');
        addDebugIndicator('🦦 Styles loaded...', 'green');
    } else {
        // Fallback method
        const styleEl = document.createElement('style');
        styleEl.textContent = mobileOptimizedStyles;
        (document.head || document.documentElement).appendChild(styleEl);
        console.log('🦦 Mobile-optimized styles injected via createElement');
        addDebugIndicator('🦦 Styles loaded (fallback)...', 'green');
    }

    // Continue with the rest of the script...
    // [Include the rest of the original script here, but I'll add a simple test UI first]
    
    // Simple test to verify UI shows up
    window.addEventListener('load', function() {
        console.log('🦦 Window loaded, creating test UI...');
        addDebugIndicator('🦦 Creating UI...', 'blue');
        
        // Create a simple test overlay
        const testOverlay = document.createElement('div');
        testOverlay.id = 'otter-consolidator-overlay';
        testOverlay.innerHTML = `
            <div class="otter-header" style="background: #0d0d0d; padding: 12px; border-bottom: 1px solid #333;">
                <h3 class="otter-title" style="margin: 0; color: white;">Order Consolidator</h3>
            </div>
            <div class="otter-content" style="flex: 1; padding: 16px; overflow-y: auto;">
                <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: white;">Mobile/Tablet Test</h4>
                    <p style="margin: 0; color: #ccc;">If you can see this, the UI is working!</p>
                    <p style="margin: 8px 0 0 0; color: #888; font-size: 12px;">
                        Device: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}<br>
                        Screen: ${screenWidth}px
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(testOverlay);
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'otter-floating-toggle';
        toggleBtn.innerHTML = '📋';
        toggleBtn.onclick = function() {
            const overlay = document.getElementById('otter-consolidator-overlay');
            if (overlay.classList.contains('collapsed')) {
                overlay.classList.remove('collapsed');
            } else {
                overlay.classList.add('collapsed');
            }
        };
        document.body.appendChild(toggleBtn);
        
        // Create mode button
        const modeBtn = document.createElement('button');
        modeBtn.className = 'otter-mode-toggle';
        modeBtn.innerHTML = '👁️ Test Mode';
        document.body.appendChild(modeBtn);
        
        addDebugIndicator('🦦 UI Ready!', 'green');
        console.log('🦦 Test UI created successfully!');
    });
    
})();