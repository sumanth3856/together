/**
 * URL Security & Auth Token Sanitization Utility
 * 
 * Protects users by immediately purging sensitive OAuth access tokens, refresh tokens,
 * authentication codes, and security fragments from the browser's address bar and history.
 * Prevents token leakage via shoulder surfing, browser history, referer headers, and copied links.
 */

const SENSITIVE_HASH_PATTERNS = [
  'access_token=',
  'refresh_token=',
  'provider_token=',
  'provider_refresh_token=',
  'token_type=',
  'expires_in=',
  'expires_at=',
  'type=recovery',
  'type=signup',
  'type=invite',
  'type=magiclink',
  'error=',
  'error_description=',
  'error_code='
];

const SENSITIVE_QUERY_PARAMS = [
  'code',
  'access_token',
  'refresh_token',
  'token',
  'provider_token',
  'provider_refresh_token',
  'error',
  'error_description',
  'error_code',
  'state'
];

/**
 * Checks if the current window URL contains sensitive authentication artifacts.
 * @param {string} urlString - Optional URL string (defaults to window.location.href)
 * @returns {boolean}
 */
export function containsSensitiveAuthData(urlString) {
  if (typeof window === 'undefined' && !urlString) return false;
  try {
    const url = new URL(urlString || window.location.href);
    
    // Check hash fragments
    if (url.hash && SENSITIVE_HASH_PATTERNS.some(pattern => url.hash.includes(pattern))) {
      return true;
    }

    // Check query parameters
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Sanitizes the browser address bar and history by removing sensitive tokens while
 * preserving valid application parameters like `room=<roomId>`.
 * 
 * @param {string} [urlString] - Optional custom URL to sanitize (defaults to window.location.href)
 * @returns {string} - The sanitized clean URL
 */
export function sanitizeAuthUrl(urlString) {
  if (typeof window === 'undefined' && !urlString) return '';

  try {
    const url = new URL(urlString || window.location.href);
    let changed = false;

    // 1. Sanitize sensitive hash fragments
    if (url.hash && SENSITIVE_HASH_PATTERNS.some(pattern => url.hash.includes(pattern))) {
      url.hash = '';
      changed = true;
    }

    // 2. Sanitize sensitive query parameters
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }

    const cleanUrl = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');

    // 3. Atomically replace history state in browser if changes occurred
    if (changed && typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(window.history.state, document.title, cleanUrl);
    }

    return cleanUrl;
  } catch {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }
}
