import { useState } from 'react';
import { AppData } from '../types';
import { validateAppData } from '../lib/validation';
import guideData from '../data/guide-data.json';

export function useAppData(): { data: AppData; loading: boolean; error: string | null } {
  const [result] = useState(() => {
    const parsed = validateAppData(guideData);
    if (!parsed.success) {
      console.error('guide-data.json validation failed:', parsed.error.issues);
    }
    return guideData as AppData;
  });
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  return { data: result, loading, error };
}
