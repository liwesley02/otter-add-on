document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await loadSettings();
  document.getElementById('enable-notifications').checked = settings.enableNotifications;
  document.getElementById('collapse-on-start').checked = settings.collapseOnStart;
  document.getElementById('wave-capacity').value = settings.maxWaveCapacity || 10;
  document.getElementById('auto-wave-interval').value = settings.autoWaveInterval / 60000;
  
  // Load stats
  loadStats();
  
  // Event listeners
  document.getElementById('enable-notifications').addEventListener('change', (e) => {
    saveSettings({ enableNotifications: e.target.checked });
  });
  
  document.getElementById('collapse-on-start').addEventListener('change', (e) => {
    saveSettings({ collapseOnStart: e.target.checked });
  });
  
  document.getElementById('wave-capacity').addEventListener('change', (e) => {
    const capacity = parseInt(e.target.value) || 10;
    saveSettings({ maxWaveCapacity: capacity });
  });
  
  document.getElementById('auto-wave-interval').addEventListener('change', (e) => {
    const minutes = parseInt(e.target.value) || 5;
    saveSettings({ autoWaveInterval: minutes * 60000 });
  });
  
  document.getElementById('open-otter').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://app.tryotter.com' });
  });
  
  document.getElementById('clear-data').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      await chrome.storage.local.clear();
      alert('All data has been cleared.');
      window.close();
    }
  });
  
  document.getElementById('help-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/yourusername/otter-order-consolidator#readme' });
  });
  
  document.getElementById('github-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/yourusername/otter-order-consolidator' });
  });
});

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (data) => {
      resolve(data.settings || {
        enableNotifications: true,
        collapseOnStart: false,
        autoWaveInterval: 300000,
        maxWaveCapacity: 10
      });
    });
  });
}

async function saveSettings(updates) {
  const current = await loadSettings();
  const newSettings = { ...current, ...updates };
  chrome.storage.local.set({ settings: newSettings });
}

async function loadStats() {
  chrome.storage.local.get(['waves', 'totalOrders', 'totalItems'], (data) => {
    const waves = data.waves || [];
    const today = new Date().toDateString();
    const wavesToday = waves.filter(w => 
      new Date(w.sentAt).toDateString() === today
    ).length;
    
    document.getElementById('total-orders').textContent = data.totalOrders || 0;
    document.getElementById('waves-today').textContent = wavesToday;
    document.getElementById('items-batched').textContent = data.totalItems || 0;
  });
}