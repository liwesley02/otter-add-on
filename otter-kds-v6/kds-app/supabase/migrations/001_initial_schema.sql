-- Create restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'manager', 'chef', 'staff')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create restaurant_users junction table
CREATE TABLE restaurant_users (
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  PRIMARY KEY (restaurant_id, user_id)
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  order_type TEXT, -- dine-in, takeout, delivery
  platform TEXT DEFAULT 'otter', -- otter, direct, uber, etc.
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  ordered_at TIMESTAMPTZ NOT NULL,
  target_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  prep_time_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (completed_at - ordered_at))/60 
    END
  ) STORED,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, order_number)
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  protein_type TEXT,
  sauce TEXT,
  size TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  station TEXT, -- grill, fryer, cold-prep, etc.
  modifiers JSONB DEFAULT '{}',
  prep_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_ordered_at ON orders(restaurant_id, ordered_at DESC);
CREATE INDEX idx_order_items_status ON order_items(order_id, status);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for restaurants
CREATE POLICY "Users can view their own restaurant"
  ON restaurants FOR SELECT
  USING (
    id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND active = true
    )
  );

-- Create RLS policies for orders
CREATE POLICY "Users can view their restaurant's orders"
  ON orders FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND active = true
    )
  );

CREATE POLICY "Users can create orders for their restaurant"
  ON orders FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND active = true
    )
  );

CREATE POLICY "Users can update their restaurant's orders"
  ON orders FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND active = true
    )
  );