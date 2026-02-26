import { describe, it, expect } from 'vitest';
import { isAllowedOrigin } from '../../lib/postMessage';

describe('isAllowedOrigin', () => {
  it('allows any origin when configured with wildcard', () => {
    // Default config uses ['*']
    const event = { origin: 'https://random-site.com' } as MessageEvent;
    expect(isAllowedOrigin(event)).toBe(true);
  });
});
