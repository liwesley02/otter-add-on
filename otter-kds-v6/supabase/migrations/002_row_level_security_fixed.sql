-- Row Level Security (RLS) policies for Otter KDS v6
-- This migration sets up security policies to ensure data isolation between restaurants

-- Enable RLS on all tables EXCEPT users (which might have permission issues)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_sync_status ENABLE ROW LEVEL SECURITY;

-- Try to enable RLS on users/user_profiles table (may fail due to permissions)
DO $$ 
BEGIN
  -- Try users table first
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not enable RLS on users table - trying user_profiles';
    -- Try user_profiles table
    BEGIN
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not enable RLS on user tables - continuing without it';
    END;
END $$;

-- Helper function to get user's restaurant IDs
CREATE OR REPLACE FUNCTION get_user_restaurant_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT restaurant_id 
    FROM restaurant_users 
    WHERE user_id = auth.uid() 
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restaurants policies
CREATE POLICY "Users can view their restaurants" ON restaurants
  FOR SELECT USING (
    id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "Restaurant owners can update their restaurant" ON restaurants
  FOR UPDATE USING (
    id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
      AND active = true
    )
  );

-- Users policies (only create if we have permission and correct data type)
DO $$ 
BEGIN
  -- Check if users table exists and what type the id column is
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'id'
  ) THEN
    -- Get the data type of the id column
    DECLARE
      id_data_type TEXT;
    BEGIN
      SELECT data_type INTO id_data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'id';
      
      -- Only create policies if id is UUID type
      IF id_data_type = 'uuid' THEN
        CREATE POLICY "Users can view their own profile" ON users
          FOR SELECT USING (id = auth.uid());
        
        CREATE POLICY "Users can update their own profile" ON users
          FOR UPDATE USING (id = auth.uid());
      ELSE
        RAISE NOTICE 'Users table has % id type, not UUID - skipping user policies', id_data_type;
      END IF;
    END;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create policies on users table - continuing without them (Error: %)', SQLERRM;
END $$;

-- User profiles policies (for our custom user_profiles table if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) THEN
    -- Create policies for user_profiles table
    CREATE POLICY "Users can view their own profile" ON user_profiles
      FOR SELECT USING (id = auth.uid());
    
    CREATE POLICY "Users can update their own profile" ON user_profiles
      FOR UPDATE USING (id = auth.uid());
      
    RAISE NOTICE 'Created RLS policies for user_profiles table';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create policies on user_profiles table - continuing (Error: %)', SQLERRM;
END $$;

-- Restaurant users policies
CREATE POLICY "Users can view restaurant members" ON restaurant_users
  FOR SELECT USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "Owners and managers can manage restaurant members" ON restaurant_users
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager')
      AND active = true
    )
  );

-- Orders policies
CREATE POLICY "Users can view their restaurant's orders" ON orders
  FOR SELECT USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "Users can create orders for their restaurant" ON orders
  FOR INSERT WITH CHECK (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "Users can update their restaurant's orders" ON orders
  FOR UPDATE USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

-- Order items policies (inherit from orders)
CREATE POLICY "Users can view order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.restaurant_id = ANY(get_user_restaurant_ids())
    )
  );

CREATE POLICY "Users can manage order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.restaurant_id = ANY(get_user_restaurant_ids())
    )
  );

-- Analytics policies
CREATE POLICY "Users can view their restaurant's analytics" ON item_analytics
  FOR SELECT USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "System can insert analytics" ON item_analytics
  FOR INSERT WITH CHECK (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

-- Predictions policies
CREATE POLICY "Users can view their restaurant's predictions" ON predictions
  FOR SELECT USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "System can manage predictions" ON predictions
  FOR ALL USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

-- Batches policies
CREATE POLICY "Users can view their restaurant's batches" ON batches
  FOR SELECT USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "Users can manage their restaurant's batches" ON batches
  FOR ALL USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

-- Stations policies
CREATE POLICY "Users can view their restaurant's stations" ON stations
  FOR SELECT USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "Managers can manage stations" ON stations
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager')
      AND active = true
    )
  );

-- Menu sync status policies
CREATE POLICY "Users can view their restaurant's sync status" ON menu_sync_status
  FOR SELECT USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

CREATE POLICY "Users can manage sync status" ON menu_sync_status
  FOR ALL USING (
    restaurant_id = ANY(get_user_restaurant_ids())
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_restaurant_ids() TO authenticated;

-- Comments
COMMENT ON POLICY "Users can view their restaurants" ON restaurants IS 
  'Users can only see restaurants they belong to';
COMMENT ON POLICY "Users can view their restaurant's orders" ON orders IS 
  'Complete restaurant isolation for order data';