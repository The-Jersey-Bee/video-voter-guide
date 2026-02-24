import { useState } from 'react';
import { AppData } from '../types';
import guideData from '../data/guide-data.json';

export function useAppData(): { data: AppData; loading: boolean; error: string | null } {
  const [data] = useState<AppData>(guideData as AppData);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  return { data, loading, error };
}
