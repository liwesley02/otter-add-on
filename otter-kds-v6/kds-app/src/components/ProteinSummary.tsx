'use client';

import { Order } from '@/types/orders';
import { calculateProteinPortions } from '@/utils/portionCalculator';

interface ProteinSummaryProps {
  orders: Order[];
}

export function ProteinSummary({ orders }: ProteinSummaryProps) {
  // Get all pending items from all orders
  const allItems = orders
    .filter(o => o.status !== 'completed')
    .flatMap(o => o.items)
    .filter(item => item.status !== 'completed');

  const proteinPortions = calculateProteinPortions(allItems);

  if (proteinPortions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium mb-2 text-gray-300">Protein Portions Needed</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {proteinPortions.map((portion) => (
          <div key={portion.proteinType} className="bg-gray-700 rounded p-2">
            <div className="text-lg font-bold">{portion.totalPortions}</div>
            <div className="text-sm text-gray-300">{portion.proteinType}</div>
            {(portion.proteinType === 'Crispy Chicken' || portion.proteinType === 'Grilled Chicken') && 
             (portion.breakdown.small > 0 || portion.breakdown.large > 0) && (
              <div className="text-xs text-gray-400 mt-1">
                {portion.breakdown.small > 0 && `${portion.breakdown.small}S (${portion.breakdown.small * 2} portions)`}
                {portion.breakdown.small > 0 && portion.breakdown.large > 0 && ' + '}
                {portion.breakdown.large > 0 && `${portion.breakdown.large}L (${portion.breakdown.large * 3} portions)`}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        * Crispy/Grilled Chicken: Small = 2 portions, Large = 3 portions
      </p>
    </div>
  );
}