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