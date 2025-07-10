import { OrderItem } from '@/types/orders';

export interface ProteinPortion {
  proteinType: string;
  totalPortions: number;
  breakdown: {
    small: number;
    large: number;
  };
}

/**
 * Calculate protein portions based on size and quantity
 * For Crispy Chicken and Grilled Chicken:
 * - Small = 2 portions
 * - Large = 3 portions
 * Other proteins use standard 1:1 portion ratio
 */
export function calculateProteinPortions(items: OrderItem[]): ProteinPortion[] {
  const portionMap = new Map<string, { small: number; large: number; total: number }>();

  items.forEach(item => {
    if (!item.protein_type || item.status === 'completed') return;

    const key = item.protein_type;
    const current = portionMap.get(key) || { small: 0, large: 0, total: 0 };

    // Calculate portions based on protein type and size
    let portions = item.quantity;
    
    if (item.protein_type === 'Crispy Chicken' || item.protein_type === 'Grilled Chicken') {
      if (item.size === 'Small') {
        portions = item.quantity * 2; // 2 portions per small
        current.small += item.quantity;
      } else if (item.size === 'Large') {
        portions = item.quantity * 3; // 3 portions per large
        current.large += item.quantity;
      }
    } else {
      // Other proteins use 1:1 ratio
      if (item.size === 'Small') {
        current.small += item.quantity;
      } else if (item.size === 'Large') {
        current.large += item.quantity;
      }
    }

    current.total += portions;
    portionMap.set(key, current);
  });

  // Convert map to array
  return Array.from(portionMap.entries()).map(([proteinType, data]) => ({
    proteinType,
    totalPortions: data.total,
    breakdown: {
      small: data.small,
      large: data.large
    }
  }));
}

/**
 * Get a summary of protein portions needed for active orders
 */
export function getProteinSummary(items: OrderItem[]): string[] {
  const portions = calculateProteinPortions(items);
  
  return portions.map(p => {
    const parts = [`${p.totalPortions} ${p.proteinType}`];
    
    if (p.proteinType === 'Crispy Chicken' || p.proteinType === 'Grilled Chicken') {
      if (p.breakdown.small > 0 || p.breakdown.large > 0) {
        const details = [];
        if (p.breakdown.small > 0) details.push(`${p.breakdown.small}S`);
        if (p.breakdown.large > 0) details.push(`${p.breakdown.large}L`);
        parts.push(`(${details.join(' + ')})`);
      }
    }
    
    return parts.join(' ');
  });
}