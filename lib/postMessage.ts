import siteConfig from '../site.config';

/**
 * Send a postMessage to the parent window with origin checking.
 * Uses embedParentOrigins from site.config.ts.
 * If ['*'] is configured, sends to '*' (backward compatible).
 */
export function sendToParent(data: unknown): void {
  if (typeof window === 'undefined' || window.parent === window) return;

  const origins = siteConfig.embedParentOrigins;

  if (origins.includes('*')) {
    window.parent.postMessage(data, '*');
  } else {
    for (const origin of origins) {
      window.parent.postMessage(data, origin);
    }
  }
}

/**
 * Check whether an incoming message event is from an allowed origin.
 */
export function isAllowedOrigin(event: MessageEvent): boolean {
  const origins = siteConfig.embedParentOrigins;
  if (origins.includes('*')) return true;
  return origins.includes(event.origin);
}
