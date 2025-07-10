export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEOUT = 'takeout',
  DELIVERY = 'delivery'
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  category?: string;
  subcategory?: string;
  protein_type?: string;
  sauce?: string;
  size?: 'Small' | 'Large';  // Only Small and Large sizes
  quantity: number;
  modifiers?: Record<string, any>;
  special_instructions?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  prep_notes?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: OrderType;
  platform: string;
  status: OrderStatus;
  priority: number;
  ordered_at: string;
  started_at?: string;
  completed_at?: string;
  prep_time_minutes?: number;
  total_amount?: number;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  item_name: string;
  quantity: number;
  confidence: number;
}

export interface Alert {
  id: string;
  type: 'rush' | 'high_volume' | 'low_stock' | 'info';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}