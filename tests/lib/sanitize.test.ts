import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../lib/sanitize';

describe('sanitizeHtml', () => {
  it('preserves safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
  });

  it('strips onerror attributes', () => {
    const input = '<img onerror="alert(1)" src="x">';
    expect(sanitizeHtml(input)).toBe('');
  });

  it('strips javascript: hrefs', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    expect(sanitizeHtml(input)).not.toContain('javascript:');
  });

  it('allows href attributes on links', () => {
    const input = '<a href="https://example.com">link</a>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips data attributes', () => {
    const input = '<p data-custom="value">text</p>';
    expect(sanitizeHtml(input)).toBe('<p>text</p>');
  });
});
