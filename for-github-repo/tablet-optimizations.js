// Tablet-specific optimizations to add to the userscript

// Add these styles for better tablet experience
const tabletStyles = `
/* Tablet Optimizations */
@media (max-width: 1024px) {
    /* Larger touch targets */
    .customer-badge {
        min-height: 44px;
        padding: 12px;
        font-size: 16px;
    }
    
    .batch-content button {
        min-height: 44px;
        min-width: 44px;
        font-size: 16px;
    }
    
    /* Better spacing for touch */
    .batch-orders {
        gap: 12px;
    }
    
    /* Responsive overlay */
    #otterOverlay {
        width: 100%;
        max-width: none;
        left: 0;
        right: auto;
        border-radius: 0;
    }
    
    /* Larger close button */
    .close-btn {
        width: 44px;
        height: 44px;
        font-size: 24px;
    }
    
    /* Optimize label preview modal */
    .label-preview-modal-content {
        width: 95%;
        max-width: none;
        margin: 2.5% auto;
    }
    
    /* Stack controls vertically on small screens */
    .overlay-controls {
        flex-direction: column;
        gap: 10px;
    }
    
    /* Full-width buttons on mobile */
    .overlay-controls button {
        width: 100%;
    }
}

/* Touch-friendly hover states */
@media (hover: none) {
    .customer-badge:active {
        transform: scale(0.98);
        opacity: 0.8;
    }
    
    button:active {
        transform: scale(0.98);
    }
}

/* Prevent zoom on input focus (iOS) */
input, select, textarea {
    font-size: 16px !important;
}

/* Better scrolling */
.batch-orders {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
}
`;

// Add touch event handlers for better interaction
function addTabletOptimizations() {
    // Prevent double-tap zoom on buttons
    document.addEventListener('touchend', (e) => {
        if (e.target.matches('button, .customer-badge')) {
            e.preventDefault();
            e.target.click();
        }
    });
    
    // Add swipe to close overlay
    let touchStartX = 0;
    const overlay = document.getElementById('otterOverlay');
    
    if (overlay) {
        overlay.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        overlay.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchEndX - touchStartX;
            
            // Swipe right to close
            if (swipeDistance > 100) {
                const closeBtn = overlay.querySelector('.close-btn');
                if (closeBtn) closeBtn.click();
            }
        });
    }
    
    // Add visual feedback for touches
    document.addEventListener('touchstart', (e) => {
        if (e.target.matches('.customer-badge, button')) {
            e.target.style.opacity = '0.7';
        }
    });
    
    document.addEventListener('touchend', (e) => {
        if (e.target.matches('.customer-badge, button')) {
            setTimeout(() => {
                e.target.style.opacity = '';
            }, 100);
        }
    });
    
    // Optimize print dialog for tablets
    window.addEventListener('beforeprint', () => {
        // Set print-friendly styles
        document.body.style.width = '100%';
        document.body.style.zoom = '100%';
    });
}

// Call this function after overlay is initialized
// addTabletOptimizations();