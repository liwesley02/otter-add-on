'use client';

import { useState, useCallback, useEffect } from 'react';
import { Order, OrderStatus, OrderType } from '@/types/orders';

// Generate mock orders for demo purposes
const generateMockOrders = (): Order[] => {
  const now = Date.now();
  
  return [
    {
      id: '1',
      restaurant_id: 'demo-restaurant',
      order_number: '1234',
      customer_name: 'John Doe',
      customer_phone: '555-0123',
      order_type: OrderType.TAKEOUT,
      platform: 'otter',
      status: OrderStatus.PENDING,
      priority: 0,
      ordered_at: new Date(now - 5 * 60 * 1000).toISOString(),
      total_amount: 45.99,
      notes: 'Extra spicy sauce',
      items: [
        {
          id: '1-1',
          order_id: '1',
          item_name: 'Crispy Chicken Rice Bowl',
          category: 'Rice Bowls',
          protein_type: 'Crispy Chicken',
          size: 'Large',
          quantity: 2,
          status: 'pending',
          modifiers: { spice_level: 'extra_hot', rice: 'Fried Rice' }
        },
        {
          id: '1-2',
          order_id: '1',
          item_name: 'Urban Bowl',
          category: 'Urban Bowls',
          protein_type: 'Mixed',
          quantity: 1,
          status: 'pending',
          modifiers: {}
        },
        {
          id: '1-3',
          order_id: '1',
          item_name: 'Pork Dumplings',
          category: 'Appetizers',
          quantity: 2,
          status: 'pending',
          modifiers: {}
        }
      ],
      created_at: new Date(now - 5 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 5 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      restaurant_id: 'demo-restaurant',
      order_number: '1235',
      customer_name: 'Jane Smith',
      customer_phone: '555-0124',
      order_type: OrderType.DELIVERY,
      platform: 'otter',
      status: OrderStatus.IN_PROGRESS,
      priority: 1,
      ordered_at: new Date(now - 12 * 60 * 1000).toISOString(),
      started_at: new Date(now - 8 * 60 * 1000).toISOString(),
      total_amount: 32.50,
      items: [
        {
          id: '2-1',
          order_id: '2',
          item_name: 'Grilled Salmon Bowl',
          category: 'Rice Bowls',
          protein_type: 'Salmon',
          size: 'Small',
          quantity: 1,
          status: 'completed',
          completed_at: new Date(now - 5 * 60 * 1000).toISOString(),
          modifiers: { rice: 'White Rice' }
        },
        {
          id: '2-2',
          order_id: '2',
          item_name: 'Crispy Garlic Aioli Wings',
          category: 'Appetizers',
          protein_type: 'Crispy Chicken',
          quantity: 2,
          status: 'pending',
          modifiers: { sauce: 'garlic_aioli' }
        }
      ],
      created_at: new Date(now - 12 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 8 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      restaurant_id: 'demo-restaurant',
      order_number: '1236',
      customer_name: 'Mike Johnson',
      customer_phone: '555-0125',
      order_type: OrderType.DINE_IN,
      platform: 'direct',
      status: OrderStatus.READY,
      priority: 0,
      ordered_at: new Date(now - 20 * 60 * 1000).toISOString(),
      started_at: new Date(now - 15 * 60 * 1000).toISOString(),
      total_amount: 28.75,
      notes: 'Table 5',
      items: [
        {
          id: '3-1',
          order_id: '3',
          item_name: 'Urban Bowl',
          category: 'Rice Bowls',
          protein_type: 'Mixed',
          quantity: 1,
          status: 'completed',
          completed_at: new Date(now - 10 * 60 * 1000).toISOString(),
          modifiers: {}
        },
        {
          id: '3-2',
          order_id: '3',
          item_name: 'Spring Rolls',
          category: 'Appetizers',
          quantity: 1,
          status: 'completed',
          completed_at: new Date(now - 10 * 60 * 1000).toISOString(),
          modifiers: {}
        }
      ],
      created_at: new Date(now - 20 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 10 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      restaurant_id: 'demo-restaurant',
      order_number: '1237',
      customer_name: 'Sarah Williams',
      customer_phone: '555-0126',
      order_type: OrderType.TAKEOUT,
      platform: 'uber',
      status: OrderStatus.PENDING,
      priority: 0,
      ordered_at: new Date(now - 2 * 60 * 1000).toISOString(),
      total_amount: 55.00,
      notes: 'Call when ready',
      items: [
        {
          id: '4-1',
          order_id: '4',
          item_name: 'Teriyaki Steak Bowl',
          category: 'Rice Bowls',
          protein_type: 'Steak',
          size: 'Large',
          quantity: 2,
          status: 'pending',
          modifiers: { doneness: 'medium', rice: 'Garlic Butter Fried Rice' }
        },
        {
          id: '4-2',
          order_id: '4',
          item_name: 'Shrimp Tempura',
          category: 'Appetizers',
          protein_type: 'Seafood',
          quantity: 1,
          status: 'pending',
          modifiers: {}
        },
        {
          id: '4-3',
          order_id: '4',
          item_name: 'Miso Soup',
          category: 'Sides',
          quantity: 2,
          status: 'pending',
          modifiers: {}
        },
        {
          id: '4-4',
          order_id: '4',
          item_name: 'Grilled Chicken Rice Bowl',
          category: 'Rice Bowls',
          protein_type: 'Grilled Chicken',
          size: 'Small',
          quantity: 1,
          status: 'pending',
          modifiers: { rice: 'White Rice' }
        }
      ],
      created_at: new Date(now - 2 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 2 * 60 * 1000).toISOString()
    }
  ];
};

export function useMockOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setOrders(generateMockOrders());
      setLoading(false);
    }, 500);
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const now = new Date().toISOString();
        const updates: Partial<Order> = { status, updated_at: now };
        
        if (status === OrderStatus.IN_PROGRESS && !order.started_at) {
          updates.started_at = now;
        } else if (status === OrderStatus.COMPLETED && !order.completed_at) {
          updates.completed_at = now;
          const start = new Date(order.ordered_at).getTime();
          const end = new Date(now).getTime();
          updates.prep_time_minutes = Math.round((end - start) / 1000 / 60);
        }
        
        return { ...order, ...updates };
      }
      return order;
    }));
  }, []);

  const updateItemStatus = useCallback(async (itemId: string, completed: boolean) => {
    setOrders(prev => prev.map(order => ({
      ...order,
      items: order.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: completed ? 'completed' : 'pending',
            completed_at: completed ? new Date().toISOString() : undefined
          };
        }
        return item;
      })
    })));
  }, []);

  const refresh = useCallback(() => {
    setOrders(generateMockOrders());
  }, []);

  return {
    orders,
    loading,
    error: null,
    updateOrderStatus,
    updateItemStatus,
    refresh
  };
}