class WaveManager {
  constructor() {
    this.waves = [];
    this.completedWaves = [];
    this.autoWaveTimer = null;
    this.maxWaveCapacity = 10; // Default, will be loaded from settings
    this.currentWaveIndex = 0;
    this.nextWaveNumber = 1;
    
    // FIFO batching - no time-based assignment
    // Orders stay in their original wave
    
    this.loadSettings();
    this.initializeWaves();
  }
  
  initializeWaves() {
    // Create first wave
    this.createNewWave();
  }
  
  get currentWave() {
    // Ensure we always have at least one wave
    if (this.waves.length === 0) {
      this.createNewWave();
    }
    return this.waves[this.currentWaveIndex] || this.waves[0];
  }
  
  getWaveForOrder(order) {
    // FIFO: Always assign to current wave unless it's full
    const currentWave = this.currentWave;
    
    // Check if current wave is full
    if (currentWave.orders.size >= this.maxWaveCapacity) {
      // Create new wave if current is full
      return this.createNewWave();
    }
    
    return currentWave;
  }
  
  assignOrderToWaves(orders) {
    // For FIFO: Only process new orders that aren't already assigned
    // Keep track of which orders are already in waves
    const existingOrderIds = new Set();
    this.waves.forEach(wave => {
      wave.orders.forEach((order, id) => {
        existingOrderIds.add(id);
      });
    });
    
    // Sort all orders by timestamp (oldest first) for true FIFO
    const sortedOrders = [...orders].sort((a, b) => {
      // First by timestamp if available
      if (a.timestamp && b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      // Then by wait time (higher wait time = older order)
      return (b.waitTime || 0) - (a.waitTime || 0);
    });
    
    // Clear items from all waves first
    this.waves.forEach(wave => {
      wave.items.clear();
    });
    
    // Rebuild all waves with their orders
    sortedOrders.forEach(order => {
      let wave;
      
      // Check if order is already assigned to a wave
      let orderWave = null;
      for (const w of this.waves) {
        if (w.orders.has(order.id)) {
          orderWave = w;
          break;
        }
      }
      
      if (orderWave) {
        // Order already assigned, keep it in same wave
        wave = orderWave;
      } else {
        // New order, assign to current wave
        wave = this.getWaveForOrder(order);
        wave.orders.set(order.id, order);
      }
      
      // Process items for the wave
      order.items.forEach(item => {
        const key = `${item.size}|${item.category}|${item.baseName || item.name}`;
        
        if (!wave.items.has(key)) {
          wave.items.set(key, {
            ...item,
            orderIds: [],
            totalQuantity: 0,
            waveQuantity: 0
          });
        }
        
        const waveItem = wave.items.get(key);
        if (!waveItem.orderIds.includes(order.id)) {
          waveItem.orderIds.push(order.id);
        }
        waveItem.totalQuantity += item.quantity || 1;
        waveItem.waveQuantity += item.quantity || 1;
      });
    });
  }
  
  async loadSettings() {
    const settings = await Storage.get('settings');
    if (settings && settings.maxWaveCapacity) {
      this.maxWaveCapacity = settings.maxWaveCapacity;
      // Update capacity for all waves
      this.waves.forEach(wave => {
        wave.capacity = this.maxWaveCapacity;
      });
    }
  }

  generateWaveId() {
    return `wave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Time-based system doesn't allow manual adding - orders are assigned automatically
  refreshWaveAssignments(orders) {
    this.assignOrderToWaves(orders);
  }
  
  getCurrentWaveItemCount() {
    let totalItems = 0;
    const wave = this.currentWave;
    if (wave && wave.items) {
      wave.items.forEach(item => {
        totalItems += item.waveQuantity || 0;
      });
    }
    return totalItems;
  }
  
  createNewWave() {
    const newWave = {
      id: this.generateWaveId(),
      number: this.nextWaveNumber++,
      name: `Wave ${this.nextWaveNumber - 1}`,
      items: new Map(),
      orders: new Map(),
      createdAt: Date.now(),
      status: 'pending',
      capacity: this.maxWaveCapacity,
      urgency: 'normal' // Will be updated based on oldest order
    };
    
    this.waves.push(newWave);
    this.currentWaveIndex = this.waves.length - 1;
    
    console.log(`Created new wave #${newWave.number}`);
    this.onNewWaveCreated?.(newWave);
    
    return newWave;
  }
  
  getCurrentWave() {
    // Return the last wave that's not full
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      if (wave.orders.size < this.maxWaveCapacity) {
        return wave;
      }
    }
    // All waves are full, create a new one
    return this.createNewWave();
  }
  
  getWaveUrgency(wave) {
    // Calculate urgency based on oldest order in the wave
    let oldestWaitTime = 0;
    
    wave.orders.forEach(order => {
      if (order.waitTime > oldestWaitTime) {
        oldestWaitTime = order.waitTime;
      }
    });
    
    // Determine urgency based on wait time
    if (oldestWaitTime >= 15) {
      return 'urgent'; // 15+ minutes
    } else if (oldestWaitTime >= 8) {
      return 'warning'; // 8-15 minutes
    } else {
      return 'normal'; // 0-8 minutes
    }
  }

  removeItemFromWave(itemKey, quantity = 1) {
    if (!this.currentWave.items.has(itemKey)) return;
    
    const waveItem = this.currentWave.items.get(itemKey);
    waveItem.waveQuantity -= quantity;
    
    if (waveItem.waveQuantity <= 0) {
      this.currentWave.items.delete(itemKey);
    }
  }

  getCurrentWaveItems() {
    return Array.from(this.currentWave.items.values());
  }
  
  getWaveItems(waveIndex) {
    if (waveIndex >= 0 && waveIndex < this.waves.length) {
      return Array.from(this.waves[waveIndex].items.values());
    }
    return [];
  }

  getWaveByCategory(waveIndex, categoryManager) {
    const wave = this.waves[waveIndex];
    if (!wave) return {};
    
    const categorized = {};
    
    wave.items.forEach((item, key) => {
      const category = item.category || 'uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push({
        ...item,
        key
      });
    });
    
    return categorized;
  }

  getCurrentWaveByCategory(categoryManager) {
    return this.getWaveByCategory(this.currentWaveIndex, categoryManager);
  }
  
  getWaveBySize(waveIndex) {
    const wave = this.waves[waveIndex];
    if (!wave) return {};
    
    const sizeGroups = {};
    
    wave.items.forEach((item, key) => {
      const size = item.size || 'no-size';
      const sizeKey = size.toLowerCase().replace(/[^a-z0-9]/g, '-'); // Sanitize for key
      
      if (!sizeGroups[sizeKey]) {
        // Create display name
        let displayName = size;
        if (size === 'no-size') {
          displayName = 'NO SIZE';
        } else if (size === 'urban') {
          displayName = 'URBAN';
        } else if (size.toLowerCase().includes('small')) {
          displayName = 'SMALL' + (size.includes('Substitute') ? ' - ' + size.split('-')[1].trim() : '');
        } else if (size.toLowerCase().includes('large')) {
          displayName = 'LARGE' + (size.includes('Substitute') ? ' - ' + size.split('-')[1].trim() : '');
        } else {
          displayName = size.toUpperCase();
        }
        
        sizeGroups[sizeKey] = { name: displayName, items: [] };
      }
      
      sizeGroups[sizeKey].items.push({
        ...item,
        key
      });
    });
    
    // Sort size groups in a logical order
    const orderedGroups = {};
    const sizeOrder = ['small', 'small-garlic', 'small-stir', 'large', 'large-garlic', 'large-stir', 'urban', 'no-size'];
    
    // Add groups in order if they exist
    sizeOrder.forEach(sizePrefix => {
      Object.keys(sizeGroups).forEach(key => {
        if (key.startsWith(sizePrefix) && !orderedGroups[key]) {
          orderedGroups[key] = sizeGroups[key];
        }
      });
    });
    
    // Add any remaining groups
    Object.keys(sizeGroups).forEach(key => {
      if (!orderedGroups[key]) {
        orderedGroups[key] = sizeGroups[key];
      }
    });
    
    return orderedGroups;
  }

  // Removed sendWaveToKitchen - waves are now just for visual organization
  
  getWaveItemCount(wave) {
    let count = 0;
    wave.items.forEach(item => {
      count += item.waveQuantity;
    });
    return count;
  }
  
  getAllWaves() {
    return this.waves.filter(wave => wave.status === 'pending');
  }
  
  switchToWave(waveIndex) {
    if (waveIndex >= 0 && waveIndex < this.waves.length) {
      this.currentWaveIndex = waveIndex;
      return true;
    }
    return false;
  }

  // Removed auto-wave functionality since we're not sending to kitchen

  getWaveStats() {
    return {
      currentWaveSize: this.currentWave ? this.currentWave.items.size : 0,
      currentWaveAge: this.currentWave ? Date.now() - this.currentWave.createdAt : 0,
      completedWavesCount: this.completedWaves.length,
      totalItemsSent: this.completedWaves.reduce((total, wave) => {
        if (!wave || !wave.items) return total;
        // wave.items is a Map, so we need to iterate over its values
        let waveTotal = 0;
        wave.items.forEach(item => {
          waveTotal += item.totalQuantity || item.quantity || 0;
        });
        return total + waveTotal;
      }, 0)
    };
  }
}