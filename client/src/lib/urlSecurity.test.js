import { describe, it, expect, vi, beforeEach } from 'vitest';
import { containsSensitiveAuthData, sanitizeAuthUrl } from './urlSecurity';

describe('urlSecurity utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects sensitive access_token and refresh_token in hash fragments', () => {
    const rawUrl = 'https://example.com/#access_token=secret_jwt_token&refresh_token=secret_refresh&token_type=bearer';
    expect(containsSensitiveAuthData(rawUrl)).toBe(true);
  });

  it('detects sensitive code query parameter in PKCE OAuth redirects', () => {
    const rawUrl = 'https://example.com/?code=secret_auth_code&state=auth_state';
    expect(containsSensitiveAuthData(rawUrl)).toBe(true);
  });

  it('returns false for clean application URLs', () => {
    const cleanUrl = 'https://example.com/?room=123456';
    expect(containsSensitiveAuthData(cleanUrl)).toBe(false);
  });

  it('sanitizes hash fragments and purges access_token while preserving path', () => {
    const rawUrl = 'https://example.com/app#access_token=secret_jwt_token&token_type=bearer';
    const clean = sanitizeAuthUrl(rawUrl);
    expect(clean).toBe('/app');
    expect(clean).not.toContain('access_token');
  });

  it('sanitizes sensitive query params while preserving legitimate room param', () => {
    const rawUrl = 'https://example.com/?room=051614&code=secret_code&error_description=something';
    const clean = sanitizeAuthUrl(rawUrl);
    expect(clean).toBe('/?room=051614');
    expect(clean).not.toContain('code=');
    expect(clean).not.toContain('error_description');
  });
});
