'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus } from '@/types/orders';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Create demo orders if none exist
  const createDemoOrders = useCallback(async () => {
    try {
      // First check if we have a restaurant
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1);

      let restaurantId;
      
      if (!restaurants || restaurants.length === 0) {
        // Create a demo restaurant
        const { data: newRestaurant } = await supabase
          .from('restaurants')
          .insert({
            name: 'Demo Restaurant',
            location: 'Downtown',
            timezone: 'America/New_York'
          })
          .select()
          .single();
        
        restaurantId = newRestaurant?.id;
      } else {
        restaurantId = restaurants[0].id;
      }

      if (!restaurantId) return;

      // Create demo orders
      const demoOrders = [
        {
          restaurant_id: restaurantId,
          order_number: `DEMO-${Date.now()}-1`,
          customer_name: 'John Doe',
          order_type: 'takeout',
          platform: 'demo',
          status: 'pending',
          ordered_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          total_amount: 45.99,
          notes: 'Demo order - Extra spicy'
        },
        {
          restaurant_id: restaurantId,
          order_number: `DEMO-${Date.now()}-2`,
          customer_name: 'Jane Smith',
          order_type: 'delivery',
          platform: 'demo',
          status: 'in_progress',
          ordered_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          total_amount: 32.50
        },
        {
          restaurant_id: restaurantId,
          order_number: `DEMO-${Date.now()}-3`,
          customer_name: 'Mike Johnson',
          order_type: 'dine_in',
          platform: 'demo',
          status: 'ready',
          ordered_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          total_amount: 28.75,
          notes: 'Table 5'
        }
      ];

      const { data: orders } = await supabase
        .from('orders')
        .insert(demoOrders)
        .select();

      if (orders) {
        // Create demo items for each order
        const items = [
          // Order 1 items
          { order_id: orders[0].id, item_name: 'Crispy Chicken Rice Bowl', category: 'Rice Bowls', protein_type: 'Chicken', size: 'Large', quantity: 2, status: 'pending' },
          { order_id: orders[0].id, item_name: 'Urban Bowl', category: 'Urban Bowls', quantity: 1, status: 'pending' },
          { order_id: orders[0].id, item_name: 'Pork Dumplings', category: 'Appetizers', quantity: 2, status: 'pending' },
          // Order 2 items
          { order_id: orders[1].id, item_name: 'Grilled Salmon Bowl', category: 'Rice Bowls', protein_type: 'Salmon', size: 'Small', quantity: 1, status: 'completed' },
          { order_id: orders[1].id, item_name: 'Crispy Garlic Aioli Wings', category: 'Appetizers', quantity: 2, status: 'pending' },
          // Order 3 items
          { order_id: orders[2].id, item_name: 'Urban Bowl', category: 'Urban Bowls', quantity: 1, status: 'completed' },
          { order_id: orders[2].id, item_name: 'Spring Rolls', category: 'Appetizers', quantity: 1, status: 'completed' }
        ];

        await supabase.from('order_items').insert(items);
      }
    } catch (err) {
      console.error('Error creating demo orders:', err);
    }
  }, [supabase]);

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .in('status', ['pending', 'in_progress', 'ready'])
        .order('ordered_at', { ascending: true });

      if (error) throw error;

      // If no orders exist and not in production, create demo orders
      if ((!data || data.length === 0) && window.location.hostname === 'localhost') {
        await createDemoOrders();
        // Refetch after creating demo orders
        const { data: newData } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .in('status', ['pending', 'in_progress', 'ready'])
          .order('ordered_at', { ascending: true });
        
        setOrders(newData || []);
      } else {
        setOrders(data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [supabase, createDemoOrders]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const updateData: any = { status };
      
      // Add timestamps based on status
      if (status === OrderStatus.IN_PROGRESS) {
        updateData.started_at = new Date().toISOString();
      } else if (status === OrderStatus.COMPLETED) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Optimistically update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, ...updateData, status }
          : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  }, [supabase]);

  // Update item status
  const updateItemStatus = useCallback(async (itemId: string, completed: boolean) => {
    try {
      const updateData: any = { 
        status: completed ? 'completed' : 'pending' 
      };
      
      if (completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items.map(item => 
          item.id === itemId 
            ? { ...item, ...updateData }
            : item
        )
      })));
    } catch (err) {
      console.error('Error updating item status:', err);
      throw err;
    }
  }, [supabase]);

  // Set up real-time subscription
  useEffect(() => {
    fetchOrders();

    // Subscribe to order changes
    const ordersSubscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          console.log('Order change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the complete order with items
            const { data } = await supabase
              .from('orders')
              .select(`
                *,
                items:order_items(*)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setOrders(prev => [...prev, data]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update the existing order
            setOrders(prev => prev.map(order => 
              order.id === payload.new.id 
                ? { ...order, ...payload.new }
                : order
            ));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to order item changes
    const itemsSubscription = supabase
      .channel('order-items-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('Order item change:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => ({
              ...order,
              items: order.items.map(item => 
                item.id === payload.new.id 
                  ? { ...item, ...payload.new }
                  : item
              )
            })));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      ordersSubscription.unsubscribe();
      itemsSubscription.unsubscribe();
    };
  }, [fetchOrders, supabase]);

  return {
    orders,
    loading,
    error,
    updateOrderStatus,
    updateItemStatus,
    refresh: fetchOrders
  };
}