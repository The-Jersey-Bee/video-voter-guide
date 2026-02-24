import { useState, useEffect } from 'react';
import { AppData } from '../types';
import { mockData } from '../mockData';
import productionData from '../data/production-data.json';

interface UseAppDataResult {
  data: AppData;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get app data.
 * Uses static production data bundled at build time for fast loading.
 */
export function useAppData(): UseAppDataResult {
  const [data] = useState<AppData>(productionData as AppData);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  return { data, loading, error };
}
