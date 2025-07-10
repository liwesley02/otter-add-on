'use client';

import { useEffect, useState } from 'react';
import { Prediction, Alert } from '@/types/orders';

// Mock predictions for now - will be replaced with API calls
export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching predictions
    const mockPredictions: Prediction[] = [
      { item_name: 'Crispy Chicken (Large)', quantity: 8, confidence: 0.85 },
      { item_name: 'Crispy Chicken (Small)', quantity: 4, confidence: 0.82 },
      { item_name: 'Grilled Steak (Large)', quantity: 6, confidence: 0.80 },
      { item_name: 'Shrimp Rice Bowl (Small)', quantity: 5, confidence: 0.78 },
      { item_name: 'Urban Bowl', quantity: 3, confidence: 0.75 },
    ];

    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'rush',
        message: 'Rush hour in 15 minutes',
        severity: 'medium',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'high_volume',
        message: '87% busier than usual',
        severity: 'high',
        timestamp: new Date().toISOString()
      }
    ];

    setTimeout(() => {
      setPredictions(mockPredictions);
      setAlerts(mockAlerts);
      setLoading(false);
    }, 1000);

    // In production, this would connect to the Python API
    // const fetchPredictions = async () => {
    //   const response = await fetch('/api/predictions/current');
    //   const data = await response.json();
    //   setPredictions(data.predictions);
    //   setAlerts(data.alerts);
    // };
  }, []);

  return {
    predictions,
    alerts,
    loading
  };
}