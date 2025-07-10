'use client';

import { useMockOrders } from '@/hooks/useMockOrders';
import { usePredictions } from '@/hooks/usePredictions';
import { OrderCard } from '@/components/OrderCard';
import { PredictionsSidebar } from '@/components/PredictionsSidebar';
import { StatsHeader } from '@/components/StatsHeader';
import { ProteinSummary } from '@/components/ProteinSummary';
import { OrderStatus } from '@/types/orders';

export default function DemoDashboardPage() {
  const { orders, loading: ordersLoading, updateOrderStatus, updateItemStatus } = useMockOrders();
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
      <StatsHeader orders={orders} restaurantName="Demo Restaurant" />

      <div className="flex h-[calc(100vh-4rem)]">
        <PredictionsSidebar 
          predictions={predictions} 
          alerts={alerts} 
          loading={predictionsLoading} 
        />

        {/* Main Order Display */}
        <main className="flex-1 p-4 overflow-auto">
          <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded p-3 mb-4">
            <p className="text-sm">
              <strong>Demo Mode:</strong> This is a demonstration with mock data. 
              Go to <a href="/dashboard" className="underline">the main dashboard</a> to see real orders.
            </p>
          </div>

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