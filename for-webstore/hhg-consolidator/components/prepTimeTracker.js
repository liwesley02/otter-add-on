/**
 * Prep Time Tracker
 * Tracks order completion times and calculates average preparation times
 */

class PrepTimeTracker {
  constructor() {
    this.completedOrders = new Map(); // orderId -> completion data
    this.storageKey = 'prepTimeData';
    this.loadFromStorage();
  }

  /**
   * Track when an order transitions from cooking to completed
   * @param {string} orderId - The order ID
   * @param {Date} orderedAt - When the order was placed
   * @param {Date} completedAt - When the order was completed
   */
  trackOrderCompletion(orderId, orderedAt, completedAt = new Date()) {
    if (this.completedOrders.has(orderId)) {
      console.log(`[PrepTimeTracker] Order ${orderId} already tracked`);
      return;
    }

    const prepTimeMinutes = Math.floor((completedAt - orderedAt) / 60000);
    
    const completionData = {
      orderId,
      orderedAt: orderedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      prepTimeMinutes,
      dayOfWeek: completedAt.getDay(),
      hourOfDay: completedAt.getHours()
    };

    this.completedOrders.set(orderId, completionData);
    console.log(`[PrepTimeTracker] Tracked order ${orderId}: ${prepTimeMinutes} minutes prep time`);
    
    // Clean up old data (keep last 7 days)
    this.cleanupOldData();
    
    // Save to storage
    this.saveToStorage();
  }

  /**
   * Get average prep time for the last hour
   * @returns {Object} { averageMinutes, orderCount }
   */
  getLastHourAverage() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const relevantOrders = [];

    this.completedOrders.forEach(order => {
      const completedAt = new Date(order.completedAt);
      if (completedAt >= oneHourAgo) {
        relevantOrders.push(order);
      }
    });

    if (relevantOrders.length === 0) {
      return { averageMinutes: 0, orderCount: 0 };
    }

    const totalMinutes = relevantOrders.reduce((sum, order) => sum + order.prepTimeMinutes, 0);
    return {
      averageMinutes: Math.round(totalMinutes / relevantOrders.length),
      orderCount: relevantOrders.length
    };
  }

  /**
   * Get average prep time for today
   * @returns {Object} { averageMinutes, orderCount }
   */
  getTodayAverage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const relevantOrders = [];

    this.completedOrders.forEach(order => {
      const completedAt = new Date(order.completedAt);
      if (completedAt >= today) {
        relevantOrders.push(order);
      }
    });

    if (relevantOrders.length === 0) {
      return { averageMinutes: 0, orderCount: 0 };
    }

    const totalMinutes = relevantOrders.reduce((sum, order) => sum + order.prepTimeMinutes, 0);
    return {
      averageMinutes: Math.round(totalMinutes / relevantOrders.length),
      orderCount: relevantOrders.length
    };
  }

  /**
   * Get hourly breakdown for today
   * @returns {Array} Array of { hour, averageMinutes, orderCount }
   */
  getTodayHourlyBreakdown() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hourlyData = {};

    this.completedOrders.forEach(order => {
      const completedAt = new Date(order.completedAt);
      if (completedAt >= today) {
        const hour = order.hourOfDay;
        if (!hourlyData[hour]) {
          hourlyData[hour] = { totalMinutes: 0, count: 0 };
        }
        hourlyData[hour].totalMinutes += order.prepTimeMinutes;
        hourlyData[hour].count++;
      }
    });

    const breakdown = [];
    for (let hour = 0; hour < 24; hour++) {
      if (hourlyData[hour]) {
        breakdown.push({
          hour,
          averageMinutes: Math.round(hourlyData[hour].totalMinutes / hourlyData[hour].count),
          orderCount: hourlyData[hour].count
        });
      }
    }

    return breakdown;
  }

  /**
   * Get statistics for display
   */
  getStatistics() {
    const lastHour = this.getLastHourAverage();
    const today = this.getTodayAverage();
    const hourlyBreakdown = this.getTodayHourlyBreakdown();

    // Calculate peak hours
    const peakHours = hourlyBreakdown
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 3)
      .map(h => h.hour);

    return {
      lastHour,
      today,
      hourlyBreakdown,
      peakHours,
      totalOrdersTracked: this.completedOrders.size
    };
  }

  /**
   * Clean up data older than 7 days
   */
  cleanupOldData() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDelete = [];

    this.completedOrders.forEach((order, orderId) => {
      const completedAt = new Date(order.completedAt);
      if (completedAt < sevenDaysAgo) {
        toDelete.push(orderId);
      }
    });

    toDelete.forEach(orderId => this.completedOrders.delete(orderId));
    
    if (toDelete.length > 0) {
      console.log(`[PrepTimeTracker] Cleaned up ${toDelete.length} old orders`);
    }
  }

  /**
   * Save data to Chrome storage
   */
  async saveToStorage() {
    const data = Array.from(this.completedOrders.entries());
    chrome.storage.local.set({ 
      [this.storageKey]: {
        orders: data,
        lastUpdated: new Date().toISOString()
      }
    });
  }

  /**
   * Load data from Chrome storage
   */
  async loadFromStorage() {
    chrome.storage.local.get(this.storageKey, (result) => {
      if (result[this.storageKey]) {
        const { orders, lastUpdated } = result[this.storageKey];
        this.completedOrders = new Map(orders);
        console.log(`[PrepTimeTracker] Loaded ${this.completedOrders.size} orders from storage`);
        console.log(`[PrepTimeTracker] Last updated: ${lastUpdated}`);
        
        // Clean up old data on load
        this.cleanupOldData();
      }
    });
  }

  /**
   * Check if an order is already completed
   */
  isOrderCompleted(orderId) {
    return this.completedOrders.has(orderId);
  }

  /**
   * Get completion data for a specific order
   */
  getOrderCompletionData(orderId) {
    return this.completedOrders.get(orderId);
  }

  /**
   * Export data for analysis
   */
  exportData() {
    const data = Array.from(this.completedOrders.values());
    return {
      orders: data,
      summary: this.getStatistics(),
      exportedAt: new Date().toISOString()
    };
  }
}

// Make available globally
window.PrepTimeTracker = PrepTimeTracker;