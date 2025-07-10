-- Initial schema for Otter KDS v6 (Safe version for existing projects)
-- This migration creates the core tables for the Kitchen Display System

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if users table exists and create our own profile table
-- Since existing users table might have integer IDs, we'll use user_profiles
DO $$ 
DECLARE
  users_exists BOOLEAN;
  users_id_type TEXT;
BEGIN
  -- Check if users table exists
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'users'
  ) INTO users_exists;
  
  IF users_exists THEN
    -- Check the data type of users.id
    SELECT data_type INTO users_id_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'id';
    
    IF users_id_type != 'uuid' THEN
      RAISE NOTICE 'Existing users table has % ID type, creating user_profiles table instead', users_id_type;
      users_exists := FALSE; -- Force creation of user_profiles
    END IF;
  END IF;
  
  -- Create appropriate table
  IF NOT users_exists THEN
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT CHECK (role IN ('owner', 'manager', 'chef', 'staff')),
      permissions JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created user_profiles table for KDS user management';
  ELSE
    -- Try to add our columns to existing users table
    BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner', 'manager', 'chef', 'staff'));
      ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
      RAISE NOTICE 'Extended existing users table with KDS columns';
    EXCEPTION
      WHEN OTHERS THEN
        -- If anything fails, create user_profiles table
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          role TEXT CHECK (role IN ('owner', 'manager', 'chef', 'staff')),
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_profiles table due to: %', SQLERRM;
    END;
  END IF;
END $$;

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create restaurant_users junction table
-- This will reference either users or user_profiles depending on what exists
CREATE TABLE IF NOT EXISTS restaurant_users (
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- No FK constraint to avoid permission issues
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  PRIMARY KEY (restaurant_id, user_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  order_type TEXT DEFAULT 'dine-in', -- dine-in, takeout, delivery
  platform TEXT DEFAULT 'otter', -- otter, direct, uber, etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  ordered_at TIMESTAMPTZ NOT NULL,
  target_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  prep_time_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL AND started_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
      ELSE NULL
    END
  ) STORED,
  total_amount DECIMAL(10,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2),
  modifiers JSONB DEFAULT '[]',
  special_instructions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed')),
  station TEXT, -- grill, fryer, salad, etc.
  prep_time_estimate INTEGER, -- estimated minutes
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create item analytics table for ML predictions
CREATE TABLE IF NOT EXISTS item_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  item_name TEXT NOT NULL,
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour < 24),
  quantity_sold INTEGER DEFAULT 0,
  avg_prep_time_minutes FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, item_name, date, hour)
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  prediction_time TIMESTAMPTZ NOT NULL,
  item_name TEXT NOT NULL,
  predicted_quantity INTEGER,
  confidence_score FLOAT,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create batches table for order grouping
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  batch_number TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  type TEXT, -- grill, fryer, salad, etc.
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  UNIQUE(restaurant_id, name)
);

-- Create menu sync status table
CREATE TABLE IF NOT EXISTS menu_sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  last_sync_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  items_synced INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(restaurant_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(order_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_station ON order_items(station) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_analytics_lookup ON item_analytics(restaurant_id, item_name, date);
CREATE INDEX IF NOT EXISTS idx_predictions_time ON predictions(restaurant_id, prediction_time DESC);
CREATE INDEX IF NOT EXISTS idx_batches_active ON batches(restaurant_id, status) WHERE status = 'active';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_restaurants_updated_at') THEN
    CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to handle user profile creation (works with either users or user_profiles table)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  email TEXT,
  user_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Try to insert into users table first
  BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (user_id, email, user_name)
    ON CONFLICT (id) 
    DO UPDATE SET 
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name);
  EXCEPTION
    WHEN insufficient_privilege THEN
      -- If we can't access users table, try user_profiles
      INSERT INTO public.user_profiles (id, email, name)
      VALUES (user_id, email, user_name)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, user_profiles.name);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- Comments
COMMENT ON TABLE restaurants IS 'Restaurant accounts in the system';
COMMENT ON TABLE orders IS 'Customer orders from all platforms';
COMMENT ON TABLE order_items IS 'Individual items within orders';
COMMENT ON TABLE item_analytics IS 'Historical data for analytics and predictions';
COMMENT ON TABLE predictions IS 'ML predictions for demand forecasting';
COMMENT ON TABLE batches IS 'Order batching for kitchen efficiency';
COMMENT ON TABLE stations IS 'Kitchen stations and their assignments';
COMMENT ON FUNCTION create_user_profile IS 'Creates or updates a user profile, handling permission issues gracefully';