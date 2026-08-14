import type { Request, CookieOptions } from 'express';

export interface GitHubApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
  scopes: string[];
}

export function isSecureConnection(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

export function getAuthCookieOptions(req: Request, maxAgeMs = 30 * 24 * 60 * 60 * 1000): CookieOptions {
  const isHttps = isSecureConnection(req);
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function getAppUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL.trim() !== '') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const isHttps = isSecureConnection(req);
  const protocol = isHttps ? 'https' : (req.protocol || 'http');
  const port = process.env.PORT || '3000';
  const host = req.get('host') || `localhost:${port}`;
  return `${protocol}://${host}`;
}

export function getGitHubToken(req: Request): { token: string | null; method: 'oauth' | 'pat' | 'demo' | null } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'demo_token') {
      return { token: 'demo_token', method: 'demo' };
    }
    return { token, method: 'pat' };
  }

  const cookieToken = req.cookies?.gh_token;
  const cookieMethod = (req.cookies?.gh_auth_method as 'oauth' | 'pat' | 'demo') || 'oauth';
  if (cookieToken) {
    return { token: cookieToken, method: cookieMethod };
  }

  return { token: null, method: null };
}

export async function callGitHubApi<T = any>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<GitHubApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RepoDeck-GitHub-Manager',
  };

  if (token && token !== 'demo_token') {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  const headers = response.headers;
  let data: any = null;
  const contentType = headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (response.status !== 204) {
    data = await response.text();
  }

  const rawScopes = headers.get('x-oauth-scopes') || '';
  const scopes = rawScopes ? rawScopes.split(',').map((s) => s.trim()) : [];

  const rateLimit = {
    limit: parseInt(headers.get('x-ratelimit-limit') || '5000', 10),
    remaining: parseInt(headers.get('x-ratelimit-remaining') || '5000', 10),
    reset: parseInt(headers.get('x-ratelimit-reset') || '0', 10),
    used: parseInt(headers.get('x-ratelimit-used') || '0', 10),
  };

  return { data, status: response.status, headers, rateLimit, scopes };
}

// Multi-page automatic fetcher for GitHub collection APIs
export async function fetchAllPages<T = any>(
  endpoint: string,
  token: string,
  maxPages = 5
): Promise<{ items: T[]; rateLimit: any; scopes: string[] }> {
  let items: T[] = [];
  let page = 1;
  let hasNext = true;
  let lastResponse: GitHubApiResponse | null = null;

  while (hasNext && page <= maxPages) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const pageUrl = `${endpoint}${separator}page=${page}&per_page=100`;
    const res = await callGitHubApi<T[]>(pageUrl, token);
    lastResponse = res;

    if (res.status !== 200 || !Array.isArray(res.data)) {
      break;
    }

    items = items.concat(res.data);

    const linkHeader = res.headers.get('link') || '';
    if (!linkHeader.includes('rel="next"') || res.data.length < 100) {
      hasNext = false;
    } else {
      page++;
    }
  }

  return {
    items,
    rateLimit: lastResponse?.rateLimit || { limit: 5000, remaining: 5000, reset: 0, used: 0 },
    scopes: lastResponse?.scopes || [],
  };
}
