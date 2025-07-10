/**
 * Authentication UI for Otter KDS API
 */

class AuthUI {
  constructor() {
    this.apiClient = window.otterAPIClient;
    this.isVisible = false;
    this.loginForm = null;
  }
  
  /**
   * Create and show login modal
   */
  showLoginModal() {
    if (this.isVisible) return;
    
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'otter-auth-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'otter-auth-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 30px;
      width: 400px;
      max-width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 99999;
    `;
    
    modal.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0; color: #333;">Otter KDS Login</h2>
        <p style="margin: 0; color: #666;">Connect to your Kitchen Display System</p>
      </div>
      
      <form id="otter-login-form">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
            Email
          </label>
          <input 
            type="email" 
            name="email" 
            required
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
            placeholder="your@email.com"
          />
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
            Password
          </label>
          <input 
            type="password" 
            name="password" 
            required
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
            placeholder="••••••••"
          />
        </div>
        
        <div id="otter-auth-error" style="display: none; color: #dc3545; margin-bottom: 15px; padding: 10px; background: #f8d7da; border-radius: 4px; font-size: 14px;"></div>
        
        <div style="display: flex; gap: 10px;">
          <button 
            type="submit" 
            id="otter-login-btn"
            style="flex: 1; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 500; cursor: pointer;"
          >
            Login
          </button>
          <button 
            type="button" 
            id="otter-cancel-btn"
            style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 500; cursor: pointer;"
          >
            Cancel
          </button>
        </div>
      </form>
      
      <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>Don't have an account? Sign up in the Otter KDS CLI first.</p>
      </div>
    `;
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // Add event listeners
    this.loginForm = document.getElementById('otter-login-form');
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    
    document.getElementById('otter-cancel-btn').addEventListener('click', () => this.hideLoginModal());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.hideLoginModal();
      }
    });
    
    this.isVisible = true;
    
    // Focus email input
    modal.querySelector('input[name="email"]').focus();
  }
  
  /**
   * Hide login modal
   */
  hideLoginModal() {
    const backdrop = document.getElementById('otter-auth-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    this.isVisible = false;
    this.loginForm = null;
  }
  
  /**
   * Handle login form submission
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const email = this.loginForm.email.value;
    const password = this.loginForm.password.value;
    const loginBtn = document.getElementById('otter-login-btn');
    const errorDiv = document.getElementById('otter-auth-error');
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    errorDiv.style.display = 'none';
    
    try {
      const result = await this.apiClient.login(email, password);
      
      if (result.success) {
        // Success! Update UI and close modal
        this.hideLoginModal();
        this.showSuccessNotification(`Logged in to ${result.restaurantName}`);
        
        // Notify overlay to update status
        window.postMessage({
          type: 'OTTER_AUTH_SUCCESS',
          restaurantName: result.restaurantName,
          userRole: result.userRole
        }, '*');
        
      } else {
        // Show error
        errorDiv.textContent = result.error || 'Login failed. Please check your credentials.';
        errorDiv.style.display = 'block';
      }
      
    } catch (error) {
      console.error('Login error:', error);
      errorDiv.textContent = 'An error occurred. Please try again.';
      errorDiv.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  }
  
  /**
   * Show connection status in UI
   */
  showConnectionStatus() {
    if (!this.apiClient.isAuthenticated()) {
      return this.createConnectionBadge('Not Connected', '#dc3545', () => this.showLoginModal());
    }
    
    const isConnected = this.apiClient.ws && this.apiClient.ws.readyState === WebSocket.OPEN;
    const status = isConnected ? 'Connected' : 'Connecting...';
    const color = isConnected ? '#28a745' : '#ffc107';
    const restaurant = this.apiClient.restaurantName || 'Unknown';
    
    return this.createConnectionBadge(`${status} - ${restaurant}`, color, () => this.showAccountMenu());
  }
  
  /**
   * Create connection status badge
   */
  createConnectionBadge(text, color, onClick) {
    const badge = document.createElement('div');
    badge.id = 'otter-connection-badge';
    badge.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${color};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      z-index: 99997;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    `;
    badge.textContent = text;
    badge.addEventListener('click', onClick);
    
    // Hover effect
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.05)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'scale(1)';
    });
    
    return badge;
  }
  
  /**
   * Show account menu
   */
  showAccountMenu() {
    // Simple dropdown for now
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 99998;
    `;
    
    menu.innerHTML = `
      <div style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${this.apiClient.restaurantName}</strong>
      </div>
      <button id="otter-logout-btn" style="
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">Logout</button>
    `;
    
    document.body.appendChild(menu);
    
    // Add logout handler
    document.getElementById('otter-logout-btn').addEventListener('click', async () => {
      await this.apiClient.logout();
      menu.remove();
      this.updateConnectionBadge();
      
      // Notify UI
      window.postMessage({
        type: 'OTTER_AUTH_LOGOUT'
      }, '*');
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 100);
  }
  
  /**
   * Update connection badge
   */
  updateConnectionBadge() {
    const existingBadge = document.getElementById('otter-connection-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    const newBadge = this.showConnectionStatus();
    if (newBadge) {
      document.body.appendChild(newBadge);
    }
  }
  
  /**
   * Show success notification
   */
  showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #28a745;
      color: white;
      padding: 15px 30px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 99999;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  /**
   * Initialize authentication UI
   */
  init() {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        to {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Show connection badge
    this.updateConnectionBadge();
    
    // Listen for connection status changes
    window.addEventListener('message', (event) => {
      if (event.data.type === 'OTTER_API_CONNECTION_STATUS') {
        this.updateConnectionBadge();
      }
    });
    
    // Check auth status periodically
    setInterval(() => {
      this.updateConnectionBadge();
    }, 30000); // Every 30 seconds
  }
}

// Create and initialize auth UI
window.otterAuthUI = new AuthUI();

console.log('[AuthUI] Initialized');