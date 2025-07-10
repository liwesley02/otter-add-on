const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dpjdflwacbzmtwrsrgvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwamRmbHdhY2J6bXR3cnNyZ3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1NjMxMiwiZXhwIjoyMDY2MDMyMzEyfQ.g9BXMsyAl_38CXPlpjvKbTdTkfWji9FEHlMD8QaAGpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSampleOrders() {
  try {
    // First, get or create a restaurant
    let { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);

    let restaurantId;
    
    if (restaurantError || !restaurants || restaurants.length === 0) {
      // Create a sample restaurant
      const { data: newRestaurant, error: createError } = await supabase
        .from('restaurants')
        .insert({
          name: 'HHG Test Restaurant',
          location: 'Downtown',
          timezone: 'America/New_York',
          settings: {}
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating restaurant:', createError);
        return;
      }
      
      restaurantId = newRestaurant.id;
      console.log('Created new restaurant:', restaurantId);
    } else {
      restaurantId = restaurants[0].id;
      console.log('Using existing restaurant:', restaurantId);
    }

    // Sample orders data
    const sampleOrders = [
      {
        restaurant_id: restaurantId,
        order_number: '1234',
        customer_name: 'John Doe',
        customer_phone: '555-0123',
        order_type: 'takeout',
        platform: 'otter',
        status: 'pending',
        priority: 0,
        ordered_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        total_amount: 45.99,
        notes: 'Extra spicy sauce',
        metadata: {}
      },
      {
        restaurant_id: restaurantId,
        order_number: '1235',
        customer_name: 'Jane Smith',
        customer_phone: '555-0124',
        order_type: 'delivery',
        platform: 'otter',
        status: 'in_progress',
        priority: 1,
        ordered_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 minutes ago
        started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // Started 8 minutes ago
        total_amount: 32.50,
        notes: null,
        metadata: {}
      },
      {
        restaurant_id: restaurantId,
        order_number: '1236',
        customer_name: 'Mike Johnson',
        customer_phone: '555-0125',
        order_type: 'dine_in',
        platform: 'direct',
        status: 'ready',
        priority: 0,
        ordered_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
        started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        total_amount: 28.75,
        notes: 'Table 5',
        metadata: {}
      },
      {
        restaurant_id: restaurantId,
        order_number: '1237',
        customer_name: 'Sarah Williams',
        customer_phone: '555-0126',
        order_type: 'takeout',
        platform: 'uber',
        status: 'pending',
        priority: 0,
        ordered_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        total_amount: 55.00,
        notes: 'Call when ready',
        metadata: {}
      }
    ];

    // Insert orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .insert(sampleOrders)
      .select();

    if (ordersError) {
      console.error('Error inserting orders:', ordersError);
      return;
    }

    console.log(`Inserted ${orders.length} sample orders`);

    // Sample order items
    const orderItems = [
      // Order 1234 items
      {
        order_id: orders[0].id,
        item_name: 'Crispy Chicken Rice Bowl',
        category: 'Rice Bowls',
        protein_type: 'Chicken',
        quantity: 2,
        status: 'pending',
        modifiers: { spice_level: 'extra_hot' },
        prep_notes: 'Extra crispy'
      },
      {
        order_id: orders[0].id,
        item_name: 'Urban Bowl',
        category: 'Rice Bowls',
        protein_type: 'Mixed',
        quantity: 1,
        status: 'pending',
        modifiers: {},
        prep_notes: null
      },
      {
        order_id: orders[0].id,
        item_name: 'Pork Dumplings',
        category: 'Appetizers',
        quantity: 2,
        status: 'pending',
        modifiers: {},
        prep_notes: null
      },
      // Order 1235 items
      {
        order_id: orders[1].id,
        item_name: 'Grilled Salmon Bowl',
        category: 'Rice Bowls',
        protein_type: 'Seafood',
        quantity: 1,
        status: 'completed',
        modifiers: {},
        completed_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        order_id: orders[1].id,
        item_name: 'Crispy Garlic Aioli Wings',
        category: 'Appetizers',
        protein_type: 'Chicken',
        quantity: 2,
        status: 'pending',
        modifiers: { sauce: 'garlic_aioli' },
        prep_notes: null
      },
      // Order 1236 items
      {
        order_id: orders[2].id,
        item_name: 'Urban Bowl',
        category: 'Rice Bowls',
        protein_type: 'Mixed',
        quantity: 1,
        status: 'completed',
        modifiers: {},
        completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        order_id: orders[2].id,
        item_name: 'Spring Rolls',
        category: 'Appetizers',
        quantity: 1,
        status: 'completed',
        modifiers: {},
        completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      // Order 1237 items
      {
        order_id: orders[3].id,
        item_name: 'Teriyaki Steak Bowl',
        category: 'Rice Bowls',
        protein_type: 'Beef',
        quantity: 2,
        status: 'pending',
        modifiers: { doneness: 'medium' },
        prep_notes: null
      },
      {
        order_id: orders[3].id,
        item_name: 'Shrimp Tempura',
        category: 'Appetizers',
        protein_type: 'Seafood',
        quantity: 1,
        status: 'pending',
        modifiers: {},
        prep_notes: null
      },
      {
        order_id: orders[3].id,
        item_name: 'Miso Soup',
        category: 'Sides',
        quantity: 2,
        status: 'pending',
        modifiers: {},
        prep_notes: null
      }
    ];

    // Insert order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
      return;
    }

    console.log(`Inserted ${items.length} order items`);
    console.log('\nSample orders created successfully!');
    console.log('Orders created:');
    console.log('- Order #1234: Pending (New) - 3 items');
    console.log('- Order #1235: In Progress - 2 items (1 completed)');
    console.log('- Order #1236: Ready - 2 items (all completed)');
    console.log('- Order #1237: Pending (New) - 3 items');
    console.log('\nGo to http://localhost:3000/dashboard to see them!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
insertSampleOrders();