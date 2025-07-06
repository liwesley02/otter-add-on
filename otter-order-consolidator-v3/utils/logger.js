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