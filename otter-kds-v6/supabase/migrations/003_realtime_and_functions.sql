-- Real-time subscriptions and helper functions for Otter KDS v6

-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE batches;
ALTER PUBLICATION supabase_realtime ADD TABLE stations;

-- Function to calculate prep time statistics
CREATE OR REPLACE FUNCTION calculate_prep_time_stats(
  p_restaurant_id UUID,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS TABLE (
  avg_prep_time_minutes FLOAT,
  min_prep_time_minutes FLOAT,
  max_prep_time_minutes FLOAT,
  total_orders INTEGER,
  items_per_order FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(prep_time_minutes)::FLOAT as avg_prep_time_minutes,
    MIN(prep_time_minutes)::FLOAT as min_prep_time_minutes,
    MAX(prep_time_minutes)::FLOAT as max_prep_time_minutes,
    COUNT(DISTINCT o.id)::INTEGER as total_orders,
    AVG(item_count)::FLOAT as items_per_order
  FROM orders o
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as item_count
    FROM order_items
    WHERE order_id = o.id
  ) items ON true
  WHERE o.restaurant_id = p_restaurant_id
    AND o.completed_at IS NOT NULL
    AND o.completed_at >= NOW() - p_time_window;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current active orders with item counts
CREATE OR REPLACE FUNCTION get_active_orders(p_restaurant_id UUID)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  customer_name TEXT,
  status TEXT,
  ordered_at TIMESTAMPTZ,
  elapsed_minutes INTEGER,
  total_items INTEGER,
  completed_items INTEGER,
  urgency_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.order_number,
    o.customer_name,
    o.status,
    o.ordered_at,
    EXTRACT(EPOCH FROM (NOW() - o.ordered_at))/60::INTEGER as elapsed_minutes,
    COUNT(oi.id)::INTEGER as total_items,
    COUNT(oi.id) FILTER (WHERE oi.status = 'completed')::INTEGER as completed_items,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - o.ordered_at))/60 > 30 THEN 3
      WHEN EXTRACT(EPOCH FROM (NOW() - o.ordered_at))/60 > 20 THEN 2
      WHEN EXTRACT(EPOCH FROM (NOW() - o.ordered_at))/60 > 10 THEN 1
      ELSE 0
    END::INTEGER as urgency_score
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.restaurant_id = p_restaurant_id
    AND o.status IN ('pending', 'in_progress')
  GROUP BY o.id, o.order_number, o.customer_name, o.status, o.ordered_at
  ORDER BY urgency_score DESC, o.ordered_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-complete order when all items are completed
CREATE OR REPLACE FUNCTION check_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_items INTEGER;
  v_completed_items INTEGER;
BEGIN
  -- Count total and completed items for the order
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_items, v_completed_items
  FROM order_items
  WHERE order_id = NEW.order_id;
  
  -- If all items are completed, mark order as completed
  IF v_total_items > 0 AND v_total_items = v_completed_items THEN
    UPDATE orders
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE id = NEW.order_id
      AND status != 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete orders
CREATE TRIGGER auto_complete_order
  AFTER UPDATE OF status ON order_items
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION check_order_completion();

-- Function to get item popularity by time
CREATE OR REPLACE FUNCTION get_item_popularity(
  p_restaurant_id UUID,
  p_day_of_week INTEGER DEFAULT NULL,
  p_hour_of_day INTEGER DEFAULT NULL
)
RETURNS TABLE (
  item_name TEXT,
  total_quantity INTEGER,
  avg_daily_quantity FLOAT,
  peak_hour INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH item_stats AS (
    SELECT 
      ia.item_name,
      SUM(ia.quantity_ordered) as total_quantity,
      AVG(ia.quantity_ordered) as avg_quantity,
      MODE() WITHIN GROUP (ORDER BY ia.hour) as peak_hour
    FROM item_analytics ia
    WHERE ia.restaurant_id = p_restaurant_id
      AND (p_day_of_week IS NULL OR ia.day_of_week = p_day_of_week)
      AND (p_hour_of_day IS NULL OR ia.hour = p_hour_of_day)
      AND ia.date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY ia.item_name
  )
  SELECT 
    item_name,
    total_quantity::INTEGER,
    avg_quantity::FLOAT as avg_daily_quantity,
    peak_hour::INTEGER
  FROM item_stats
  ORDER BY total_quantity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate demand predictions
CREATE OR REPLACE FUNCTION generate_demand_prediction(
  p_restaurant_id UUID,
  p_time_window_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  item_name TEXT,
  predicted_quantity INTEGER,
  confidence_score FLOAT
) AS $$
DECLARE
  v_current_hour INTEGER;
  v_current_dow INTEGER;
BEGIN
  v_current_hour := EXTRACT(HOUR FROM NOW());
  v_current_dow := EXTRACT(DOW FROM NOW());
  
  RETURN QUERY
  WITH historical_data AS (
    -- Get historical averages for this time period
    SELECT 
      item_name,
      AVG(quantity_ordered) as avg_quantity,
      STDDEV(quantity_ordered) as stddev_quantity,
      COUNT(*) as sample_size
    FROM item_analytics
    WHERE restaurant_id = p_restaurant_id
      AND day_of_week = v_current_dow
      AND hour >= v_current_hour 
      AND hour < v_current_hour + (p_time_window_minutes / 60.0)
      AND date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY item_name
    HAVING COUNT(*) >= 7  -- Minimum sample size
  )
  SELECT 
    hd.item_name,
    ROUND(hd.avg_quantity)::INTEGER as predicted_quantity,
    CASE 
      WHEN hd.sample_size >= 30 AND hd.stddev_quantity < hd.avg_quantity * 0.3 THEN 0.9
      WHEN hd.sample_size >= 20 AND hd.stddev_quantity < hd.avg_quantity * 0.5 THEN 0.7
      WHEN hd.sample_size >= 10 THEN 0.5
      ELSE 0.3
    END::FLOAT as confidence_score
  FROM historical_data hd
  WHERE hd.avg_quantity > 0.5
  ORDER BY hd.avg_quantity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update analytics after order completion
CREATE OR REPLACE FUNCTION update_item_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when order is marked as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Insert or update analytics for each item in the order
    INSERT INTO item_analytics (
      restaurant_id,
      item_name,
      date,
      hour,
      day_of_week,
      quantity_ordered,
      avg_prep_time_minutes
    )
    SELECT 
      NEW.restaurant_id,
      oi.item_name,
      CURRENT_DATE,
      EXTRACT(HOUR FROM NOW())::INTEGER,
      EXTRACT(DOW FROM NOW())::INTEGER,
      SUM(oi.quantity),
      NEW.prep_time_minutes
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    GROUP BY oi.item_name
    ON CONFLICT (restaurant_id, item_name, date, hour) 
    DO UPDATE SET
      quantity_ordered = item_analytics.quantity_ordered + EXCLUDED.quantity_ordered,
      avg_prep_time_minutes = (
        (item_analytics.avg_prep_time_minutes * item_analytics.quantity_ordered + 
         EXCLUDED.avg_prep_time_minutes * EXCLUDED.quantity_ordered) / 
        (item_analytics.quantity_ordered + EXCLUDED.quantity_ordered)
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics
CREATE TRIGGER update_analytics_on_order_completion
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_item_analytics();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_prep_time_stats(UUID, INTERVAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_orders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_item_popularity(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_demand_prediction(UUID, INTEGER) TO authenticated;

-- Comments
COMMENT ON FUNCTION calculate_prep_time_stats IS 'Calculate preparation time statistics for a restaurant';
COMMENT ON FUNCTION get_active_orders IS 'Get all active orders with urgency scoring';
COMMENT ON FUNCTION get_item_popularity IS 'Analyze item popularity by time periods';
COMMENT ON FUNCTION generate_demand_prediction IS 'Generate demand predictions for the next time window';