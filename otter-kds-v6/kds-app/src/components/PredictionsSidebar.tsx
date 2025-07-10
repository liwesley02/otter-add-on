'use client';

import { Prediction, Alert } from '@/types/orders';

interface PredictionsSidebarProps {
  predictions: Prediction[];
  alerts: Alert[];
  loading: boolean;
}

export function PredictionsSidebar({ predictions, alerts, loading }: PredictionsSidebarProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'rush':
        return '⚠️';
      case 'high_volume':
        return '📈';
      case 'low_stock':
        return '📉';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-900 bg-opacity-50 border-red-700';
      case 'medium':
        return 'bg-yellow-900 bg-opacity-50 border-yellow-700';
      case 'low':
        return 'bg-blue-900 bg-opacity-50 border-blue-700';
      default:
        return 'bg-gray-900 bg-opacity-50 border-gray-700';
    }
  };

  const getItemEmoji = (itemName: string) => {
    const lowerName = itemName.toLowerCase();
    if (lowerName.includes('chicken')) return '🍗';
    if (lowerName.includes('steak') || lowerName.includes('beef')) return '🥩';
    if (lowerName.includes('shrimp') || lowerName.includes('seafood')) return '🍤';
    if (lowerName.includes('vegetable') || lowerName.includes('veg')) return '🥗';
    if (lowerName.includes('rice')) return '🍚';
    if (lowerName.includes('noodle')) return '🍜';
    return '🍽️';
  };

  if (loading) {
    return (
      <aside className="w-80 bg-gray-800 border-r border-gray-700 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Predictions</h2>
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Next 30 minutes</h3>
          {predictions.length > 0 ? (
            <>
              <div className="space-y-2">
                {predictions.map((prediction, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      {getItemEmoji(prediction.item_name)} {prediction.item_name}
                    </span>
                    <span className="font-bold">{prediction.quantity}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Confidence: {Math.round(predictions[0]?.confidence * 100 || 0)}%
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No predictions available</p>
          )}
        </div>

        <div className="bg-gray-700 rounded-lg p-4 mt-4">
          <h3 className="text-sm font-medium mb-2">Prep Recommendations</h3>
          <div className="space-y-2 text-sm">
            {predictions.slice(0, 2).map((pred, index) => (
              <div key={index} className="text-gray-300">
                Start preparing {Math.ceil(pred.quantity * 0.3)} {pred.item_name} now
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Alerts</h3>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`${getAlertColor(alert.severity)} border rounded p-2 text-sm`}
              >
                {getAlertIcon(alert.type)} {alert.message}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No active alerts</p>
        )}
      </div>
    </aside>
  );
}