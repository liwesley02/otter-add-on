'use client';

import { useState } from 'react';
import { Order, OrderStatus, OrderType } from '@/types/orders';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>;
  onItemToggle: (itemId: string, completed: boolean) => Promise<void>;
}

export function OrderCard({ order, onStatusUpdate, onItemToggle }: OrderCardProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async () => {
    setUpdating(true);
    try {
      let newStatus: OrderStatus;
      switch (order.status) {
        case OrderStatus.PENDING:
          newStatus = OrderStatus.IN_PROGRESS;
          break;
        case OrderStatus.IN_PROGRESS:
          newStatus = OrderStatus.READY;
          break;
        case OrderStatus.READY:
          newStatus = OrderStatus.COMPLETED;
          break;
        default:
          return;
      }
      await onStatusUpdate(order.id, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return 'bg-blue-600';
      case OrderStatus.IN_PROGRESS:
        return 'bg-yellow-600';
      case OrderStatus.READY:
        return 'bg-green-600';
      case OrderStatus.COMPLETED:
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getBorderColor = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return 'border-gray-700';
      case OrderStatus.IN_PROGRESS:
        return 'border-yellow-600';
      case OrderStatus.READY:
        return 'border-green-600';
      case OrderStatus.COMPLETED:
        return 'border-gray-700';
      default:
        return 'border-gray-700';
    }
  };

  const getButtonText = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return 'Start';
      case OrderStatus.IN_PROGRESS:
        return 'Ready';
      case OrderStatus.READY:
        return 'Complete';
      case OrderStatus.COMPLETED:
        return 'Archive';
      default:
        return 'Update';
    }
  };

  const getOrderTypeIcon = () => {
    switch (order.order_type) {
      case OrderType.DINE_IN:
        return '🍽️';
      case OrderType.TAKEOUT:
        return '🥡';
      case OrderType.DELIVERY:
        return '🚚';
      default:
        return '📦';
    }
  };

  // Calculate elapsed time
  const getElapsedTime = () => {
    const start = new Date(order.ordered_at).getTime();
    const now = new Date().getTime();
    const diffMinutes = Math.floor((now - start) / 1000 / 60);
    const diffSeconds = Math.floor((now - start) / 1000 % 60);
    
    if (diffMinutes < 1) {
      return `${diffSeconds}s`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ${diffSeconds}s`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };
  
  const elapsedTime = getElapsedTime();

  const isCompleted = order.status === OrderStatus.COMPLETED;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border ${getBorderColor()} ${isCompleted ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">#{order.order_number}</h3>
          <span className="text-sm">{getOrderTypeIcon()}</span>
        </div>
        <span className={`text-sm ${getStatusColor()} px-2 py-1 rounded capitalize`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="text-sm text-gray-400 mb-2">
        {order.customer_name || 'Guest'} • {order.order_type.replace('_', ' ')}
      </p>
      
      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.status === 'completed'}
              onChange={(e) => onItemToggle(item.id, e.target.checked)}
              disabled={isCompleted}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className={`text-sm ${item.status === 'completed' ? 'line-through opacity-50' : ''}`}>
              {item.quantity > 1 && `${item.quantity}x `}
              {item.size && (
                <span className={`inline-block px-1.5 py-0.5 text-xs rounded mr-1 ${
                  item.size === 'Large' ? 'bg-purple-600' : 'bg-blue-600'
                }`}>
                  {item.size === 'Large' ? 'L' : 'S'}
                  {(item.protein_type === 'Crispy Chicken' || item.protein_type === 'Grilled Chicken') && (
                    <span className="ml-0.5">({item.size === 'Large' ? '3' : '2'})</span>
                  )}
                </span>
              )}
              {item.item_name}
              {item.protein_type && (
                <span className="text-xs text-gray-400 ml-1">({item.protein_type})</span>
              )}
            </span>
          </div>
        ))}
        {order.notes && (
          <p className="text-xs text-yellow-400 mt-2">Note: {order.notes}</p>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">
          {order.status === OrderStatus.COMPLETED ? '✓' : '⏱️'} {elapsedTime}
        </span>
        <button 
          onClick={handleStatusChange}
          disabled={updating || isCompleted}
          className={`${
            isCompleted 
              ? 'bg-gray-600' 
              : 'bg-green-600 hover:bg-green-700'
          } px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {updating ? 'Updating...' : getButtonText()}
        </button>
      </div>
    </div>
  );
}