# Otter KDS v6 - Project Plan

## Executive Summary

Version 6 transforms the Otter Order Consolidator from a Chrome extension into a comprehensive Kitchen Display System (KDS) with predictive analytics. Built on Next.js 14 and Supabase, it provides real-time order management, historical analytics, and ML-powered predictions to optimize kitchen operations.

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Authentication**: NextAuth.js with Supabase adapter
- **Deployment**: Vercel (web app) + Chrome Web Store (extension)
- **Analytics**: Built-in dashboard + export capabilities
- **ML/Predictions**: TensorFlow.js (future) / Statistical models (MVP)

### System Components

```
┌─────────────────────┐     ┌─────────────────────┐
│   Chrome Extension  │────▶│    Next.js API      │
│  (Order Capture)    │     │   (Secure Gateway)  │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │     Supabase        │
                            │  - Database (RLS)   │
                            │  - Auth             │
                            │  - Realtime         │
                            └──────────┬──────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                              │
     ┌──────────▼──────────┐              ┌──────────────────▼─────┐
     │   KDS Dashboard     │              │  Prediction Engine     │
     │  (Live Orders)      │              │  (Analytics + ML)      │
     └─────────────────────┘              └────────────────────────┘
```

## Core Features

### 1. Real-time KDS Dashboard
- **Live Order Display**: Orders appear instantly across all devices
- **Smart Batching**: Automatic grouping by preparation requirements
- **Station Views**: Customizable views for different prep stations
- **Completion Tracking**: Mark items/orders complete with timing data

### 2. Predictive Analytics
- **Demand Forecasting**: Predict item quantities for next 30/60/90 minutes
- **Rush Detection**: Alert staff before peak periods
- **Prep Suggestions**: "Start cooking 5 Crispy Chicken now"
- **Waste Reduction**: Cook only what's needed based on patterns

### 3. Historical Analytics
- **Performance Metrics**: Prep times, completion rates, bottlenecks
- **Trend Analysis**: Daily/weekly/monthly patterns
- **Staff Performance**: Individual and team metrics
- **Custom Reports**: Export data for deeper analysis

### 4. Multi-Restaurant Support
- **Restaurant Chains**: Manage multiple locations
- **Comparison Tools**: Cross-location performance
- **Centralized Settings**: Chain-wide configuration
- **Individual Customization**: Location-specific adjustments

### 5. Security & Compliance
- **Row Level Security**: Complete data isolation
- **Audit Trails**: Track all actions and changes
- **GDPR Compliance**: Data privacy controls
- **SOC 2 Ready**: Security best practices

## Database Schema

### Core Tables

```sql
-- Restaurant and user management
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

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('owner', 'manager', 'chef', 'staff')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurant_users (
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  PRIMARY KEY (restaurant_id, user_id)
);

-- Order management
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

-- Analytics and predictions
CREATE TABLE item_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  item_name TEXT NOT NULL,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  quantity_ordered INTEGER DEFAULT 0,
  quantity_wasted INTEGER DEFAULT 0,
  avg_prep_time_minutes FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, item_name, date, hour)
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  prediction_time TIMESTAMPTZ NOT NULL,
  time_window_minutes INTEGER NOT NULL,
  predictions JSONB NOT NULL, -- {item: quantity, confidence}
  model_version TEXT,
  accuracy_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch/wave management
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  batch_number INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}'
);

-- Station assignments
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  type TEXT, -- grill, fryer, cold, assembly
  active_items JSONB DEFAULT '[]',
  assigned_staff UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_ordered_at ON orders(restaurant_id, ordered_at DESC);
CREATE INDEX idx_order_items_status ON order_items(order_id, status);
CREATE INDEX idx_analytics_lookup ON item_analytics(restaurant_id, item_name, date);
CREATE INDEX idx_predictions_time ON predictions(restaurant_id, prediction_time DESC);
```

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Restaurant isolation policy
CREATE POLICY "Users can only see their restaurant's data" ON orders
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM restaurant_users 
      WHERE user_id = auth.uid() 
      AND active = true
    )
  );

-- Similar policies for other tables...
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Create project structure
- [ ] Initialize Next.js with TypeScript
- [ ] Set up Supabase project and schema
- [ ] Implement authentication flow
- [ ] Create basic KDS dashboard
- [ ] Build minimal Chrome extension

### Phase 2: Core Features (Week 3-4)
- [ ] Real-time order display
- [ ] Order completion workflow
- [ ] Basic batching logic
- [ ] Prep time tracking
- [ ] Station view implementation

### Phase 3: Analytics (Week 5-6)
- [ ] Historical data aggregation
- [ ] Basic reporting dashboard
- [ ] Prep time analytics
- [ ] Peak hour detection
- [ ] Export functionality

### Phase 4: Predictions (Week 7-8)
- [ ] Statistical prediction model
- [ ] Demand forecasting UI
- [ ] Prep recommendations
- [ ] Accuracy tracking
- [ ] A/B testing framework

### Phase 5: Polish & Launch (Week 9-10)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Migration tools
- [ ] Beta testing

## Security Architecture

### 1. Authentication Flow
```typescript
// Using NextAuth.js with Supabase adapter
export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    session: async ({ session, user }) => {
      // Add restaurant info to session
      const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('restaurant_id, role')
        .eq('user_id', user.id)
        .single();
      
      session.user.restaurantId = restaurantUser?.restaurant_id;
      session.user.role = restaurantUser?.role;
      
      return session;
    },
  },
};
```

### 2. API Security
```typescript
// Middleware for API routes
export async function validateRestaurantAccess(
  req: NextRequest,
  restaurantId: string
): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return false;
  
  // Check if user has access to this restaurant
  return session.user.restaurantId === restaurantId;
}

// Rate limiting
const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});
```

### 3. Extension Security
```javascript
// Chrome extension only captures and forwards data
// No direct database access
const captureOrder = async (orderData) => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_URL}/api/orders/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...orderData,
      capturedAt: new Date().toISOString(),
      extensionVersion: chrome.runtime.getManifest().version,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to capture order');
  }
};
```

## Chrome Extension (Minimal)

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "Otter KDS Connector",
  "version": "6.0.0",
  "description": "Connects Otter orders to your KDS dashboard",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://app.tryotter.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://app.tryotter.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### Key Differences from v4/v5
- No UI overlay (all UI in web app)
- No local data storage (except auth token)
- Minimal permissions
- Simple order extraction and forwarding
- OAuth-based authentication

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - New restaurant signup
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/session` - Current user info

### Orders
- `POST /api/orders/capture` - Receive orders from extension
- `GET /api/orders` - List active orders (real-time)
- `PATCH /api/orders/:id` - Update order status
- `POST /api/orders/:id/complete` - Mark order complete

### Items
- `PATCH /api/items/:id` - Update item status
- `POST /api/items/:id/complete` - Mark item complete
- `GET /api/items/active` - Get active items by station

### Analytics
- `GET /api/analytics/summary` - Dashboard summary
- `GET /api/analytics/prep-times` - Prep time analysis
- `GET /api/analytics/items` - Item popularity
- `POST /api/analytics/export` - Export data

### Predictions
- `GET /api/predictions/current` - Current predictions
- `GET /api/predictions/history` - Past prediction accuracy
- `POST /api/predictions/generate` - Force regeneration

## UI/UX Design

### KDS Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Otter KDS  │  Predictions  │  Orders  │  Analytics│
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Predictions     │  │  Active Orders              │  │
│  │  Next 30 min:    │  │  ┌─────────────────────┐   │  │
│  │  🍗 Chicken: 12  │  │  │ Order #1234         │   │  │
│  │  🥩 Steak: 8     │  │  │ 2 Rice Bowls        │   │  │
│  │  🍤 Shrimp: 5    │  │  │ 1 Urban Bowl        │   │  │
│  │  Confidence: 85% │  │  │ ⏱️ 5:23             │   │  │
│  └─────────────────┘  │  └─────────────────────┘   │  │
│                       │  ┌─────────────────────┐   │  │
│  ┌─────────────────┐  │  │ Order #1235         │   │  │
│  │  Alerts         │  │  │ 1 Crispy Chicken    │   │  │
│  │  ⚠️ Rush in 15m │  │  │ 2 Dumplings         │   │  │
│  │  📈 87% busier  │  │  │ ⏱️ 2:45             │   │  │
│  └─────────────────┘  │  └─────────────────────┘   │  │
└─────────────────────────────────────────────────────────┘
```

### Mobile Responsive Design
- Tablet-optimized for kitchen use
- Touch-friendly buttons
- High contrast for kitchen lighting
- Sound alerts for new orders

## Monitoring & Observability

### Application Monitoring
```typescript
// Using Vercel Analytics + Custom Metrics
export async function trackMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
) {
  // Vercel Analytics
  track(name, { value, ...tags });
  
  // Custom metrics to Supabase
  await supabase.from('metrics').insert({
    metric_name: name,
    value,
    tags,
    timestamp: new Date().toISOString(),
  });
}
```

### Key Metrics
- Order completion time
- Prediction accuracy
- API response times
- Error rates
- User engagement

## Deployment Strategy

### Web Application (Vercel)
```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.com
```

### Chrome Extension
1. Build extension with API URL
2. Submit to Chrome Web Store
3. Auto-update configuration

### Database Migrations
```bash
# Using Supabase CLI
supabase migration new initial_schema
supabase migration up
```

## Cost Analysis

### Estimated Monthly Costs (Per Restaurant)
- **Supabase Free Tier**: $0 (up to 500MB)
- **Vercel Pro**: $20 (for custom domain)
- **Total**: $20/month for small restaurants

### Scaling Costs
- 10 restaurants: ~$50/month
- 50 restaurants: ~$200/month  
- 100+ restaurants: Custom enterprise pricing

## Success Metrics

### Technical KPIs
- 99.9% uptime
- <200ms API response time
- <3s page load time
- 0 data breaches

### Business KPIs
- 20% reduction in food waste
- 15% faster order completion
- 90% user satisfaction
- 50% reduction in order errors

## Migration Guide

### From v4/v5 to v6
1. Export Chrome storage data
2. Create restaurant account
3. Run migration script
4. Install new extension
5. Verify data integrity

### Migration Script
```typescript
async function migrateFromChromeStorage() {
  // Get data from Chrome storage
  const data = await chrome.storage.local.get(null);
  
  // Transform to new schema
  const orders = transformOrders(data.orders);
  const items = transformItems(data.items);
  
  // Upload to Supabase
  await supabase.from('orders').insert(orders);
  await supabase.from('order_items').insert(items);
}
```

## Support & Documentation

### User Documentation
- Getting started guide
- Video tutorials
- API documentation
- Troubleshooting guide

### Developer Documentation
- Architecture overview
- API reference
- Contributing guide
- Security guidelines

## Future Roadmap

### Version 6.1 (Q2 2024)
- Mobile app (React Native)
- Voice commands
- Kitchen printer integration

### Version 6.2 (Q3 2024)
- AI-powered predictions
- Inventory management
- Multi-language support

### Version 7.0 (Q4 2024)
- Full POS integration
- Customer analytics
- Franchise management

## Conclusion

Version 6 represents a complete reimagining of the Otter Order Consolidator as an enterprise-grade KDS platform. By leveraging modern web technologies and cloud infrastructure, it provides restaurants with the tools they need to optimize operations, reduce waste, and improve customer satisfaction.

The modular architecture ensures the system can grow with restaurant needs, from single locations to large chains, while maintaining security, performance, and ease of use.