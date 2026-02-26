import { describe, it, expect } from 'vitest';
import { validateAppData } from '../../lib/validation';
import guideData from '../../data/guide-data.json';

describe('validateAppData', () => {
  it('accepts valid guide-data.json', () => {
    const result = validateAppData(guideData);
    expect(result.success).toBe(true);
  });

  it('rejects data missing election field', () => {
    const result = validateAppData({ sections: [], questions: [], candidates: [], clips: [] });
    expect(result.success).toBe(false);
  });

  it('rejects data with invalid section (missing id)', () => {
    const bad = {
      ...guideData,
      sections: [{ title: 'Test', order: 1 }],
    };
    const result = validateAppData(bad);
    expect(result.success).toBe(false);
  });

  it('rejects completely empty object', () => {
    const result = validateAppData({});
    expect(result.success).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = validateAppData('not an object');
    expect(result.success).toBe(false);
  });
});
