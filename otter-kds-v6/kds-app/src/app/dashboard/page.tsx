'use client';

import { useOrders } from '@/hooks/useOrders';
import { usePredictions } from '@/hooks/usePredictions';
import { OrderCard } from '@/components/OrderCard';
import { PredictionsSidebar } from '@/components/PredictionsSidebar';
import { StatsHeader } from '@/components/StatsHeader';
import { ProteinSummary } from '@/components/ProteinSummary';
import { OrderStatus } from '@/types/orders';

export default function DashboardPage() {
  const { orders, loading: ordersLoading, error, updateOrderStatus, updateItemStatus } = useOrders();
  const { predictions, alerts, loading: predictionsLoading } = usePredictions();

  // Sort orders by status and time
  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = {
      [OrderStatus.IN_PROGRESS]: 0,
      [OrderStatus.PENDING]: 1,
      [OrderStatus.READY]: 2,
      [OrderStatus.COMPLETED]: 3,
      [OrderStatus.CANCELLED]: 4,
    };
    
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    return new Date(a.ordered_at).getTime() - new Date(b.ordered_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <StatsHeader orders={orders} />

      <div className="flex h-[calc(100vh-4rem)]">
        <PredictionsSidebar 
          predictions={predictions} 
          alerts={alerts} 
          loading={predictionsLoading} 
        />

        {/* Main Order Display */}
        <main className="flex-1 p-4 overflow-auto">
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded p-4 mb-4">
              <p className="text-sm">Error loading orders: {error}</p>
            </div>
          )}

          {!ordersLoading && sortedOrders.length > 0 && (
            <ProteinSummary orders={sortedOrders} />
          )}

          {ordersLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded w-20 mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="space-y-2 mb-3">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  </div>
                  <div className="h-10 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-2xl text-gray-500 mb-2">No active orders</p>
                <p className="text-gray-600">Orders will appear here when they come in</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  onItemToggle={updateItemStatus}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}