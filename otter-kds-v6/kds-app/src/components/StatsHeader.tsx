'use client';

import { Order } from '@/types/orders';

interface StatsHeaderProps {
  orders: Order[];
  restaurantName?: string;
  isOnline?: boolean;
}

export function StatsHeader({ orders, restaurantName = 'Test Restaurant', isOnline = true }: StatsHeaderProps) {
  // Calculate average prep time
  const completedOrders = orders.filter(o => o.prep_time_minutes);
  const avgPrepTime = completedOrders.length > 0
    ? Math.round(completedOrders.reduce((sum, o) => sum + (o.prep_time_minutes || 0), 0) / completedOrders.length)
    : 0;

  // Calculate current active orders prep time
  const activeOrders = orders.filter(o => o.status === 'in_progress');
  const avgActiveTime = activeOrders.length > 0
    ? Math.round(activeOrders.map(o => {
        const start = new Date(o.started_at || o.ordered_at).getTime();
        const now = new Date().getTime();
        return (now - start) / 1000 / 60; // minutes
      }).reduce((sum, time) => sum + time, 0) / activeOrders.length)
    : 0;

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-full px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">HHG KDS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">{restaurantName}</span>
              <span className={`text-sm ${isOnline ? 'bg-green-600' : 'bg-red-600'} px-2 py-1 rounded`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="text-gray-400">Active Orders:</span>
              <span className="ml-2 font-bold">{orders.filter(o => o.status !== 'completed').length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Avg Prep:</span>
              <span className="ml-2 bg-gray-700 px-2 py-1 rounded">{avgPrepTime}m</span>
              {avgActiveTime > 0 && (
                <span className="ml-1 bg-yellow-700 px-2 py-1 rounded">{avgActiveTime}m</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}