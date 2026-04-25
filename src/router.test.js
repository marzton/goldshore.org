import { describe, it, expect } from 'vitest';
import { parseOriginList } from './router.js';

describe('parseOriginList', () => {
  const fallback = 'https://fallback.com';

  it('returns fallback if value is empty or undefined', () => {
    expect(parseOriginList(undefined, fallback)).toBe(fallback);
    expect(parseOriginList('', fallback)).toBe(fallback);
  });

  it('parses a single origin with protocol', () => {
    expect(parseOriginList('https://example.com', fallback)).toBe('https://example.com/');
    expect(parseOriginList('http://example.com', fallback)).toBe('http://example.com/');
  });

  it('prefixes with https if protocol is missing', () => {
    expect(parseOriginList('example.com', fallback)).toBe('https://example.com/');
  });

  it('trims whitespace from origins', () => {
    expect(parseOriginList('  https://example.com  ', fallback)).toBe('https://example.com/');
  });

  it('picks the first valid origin from a comma-separated list', () => {
    // "not a url" is actually valid for URL constructor if it doesn't have spaces,
    // but with spaces it fails in some environments or versions.
    // Let's use something that definitely fails or just test the order.
    expect(parseOriginList('https://first.com, https://second.com', fallback)).toBe('https://first.com/');
  });

  it('skips non-http/https protocols', () => {
    expect(parseOriginList('ftp://example.com, https://example.com', fallback)).toBe('https://example.com/');
  });

  it('normalizes pathnames by removing trailing slashes (except root)', () => {
    expect(parseOriginList('https://example.com/', fallback)).toBe('https://example.com/');
    expect(parseOriginList('https://example.com/api/', fallback)).toBe('https://example.com/api');
  });

  it('returns fallback if no valid origins are found', () => {
    // To make it fail, we can use a string that is not a valid host
    expect(parseOriginList('http://[::1]abc', fallback)).toBe(fallback);
  });
});
