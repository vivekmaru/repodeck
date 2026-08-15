import type { Request, CookieOptions } from 'express';
import { stmts } from '../db/database.js';

export interface GitHubApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers | Record<string, string>;
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
  scopes: string[];
  fromCache?: boolean;
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

// Generate deterministic cache key
function getCacheKey(endpoint: string, token: string, options: RequestInit = {}): string {
  const method = options.method || 'GET';
  const tokenHash = token === 'demo_token' ? 'demo' : token.slice(-8);
  return `${method}:${endpoint}:${tokenHash}`;
}

// ETag & Cache-aware GitHub API caller
export async function callGitHubApi<T = any>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
  ttlMs = 15 * 60 * 1000 // 15 mins default cache
): Promise<GitHubApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = getCacheKey(endpoint, token, options);

  let cachedEntry: any = null;
  if (method === 'GET') {
    try {
      cachedEntry = stmts.getHttpCache.get(cacheKey) as any;
    } catch {
      // ignore DB read error
    }
  }

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RepoDeck-GitHub-Manager',
  };

  if (token && token !== 'demo_token') {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Pass ETag if cached
  if (cachedEntry?.etag && method === 'GET') {
    defaultHeaders['If-None-Match'] = cachedEntry.etag;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  const headers = response.headers;
  const rawScopes = headers.get('x-oauth-scopes') || '';
  const scopes = rawScopes ? rawScopes.split(',').map((s) => s.trim()) : [];

  const rateLimit = {
    limit: parseInt(headers.get('x-ratelimit-limit') || '5000', 10),
    remaining: parseInt(headers.get('x-ratelimit-remaining') || '5000', 10),
    reset: parseInt(headers.get('x-ratelimit-reset') || '0', 10),
    used: parseInt(headers.get('x-ratelimit-used') || '0', 10),
  };

  // 1. Handle 304 Not Modified: Return from SQLite cache without consuming GitHub rate limits
  if (response.status === 304 && cachedEntry) {
    try {
      const parsedData = JSON.parse(cachedEntry.data);
      return {
        data: parsedData,
        status: 200,
        headers,
        rateLimit,
        scopes,
        fromCache: true,
      };
    } catch {
      // fallback to refetch if parse failed
    }
  }

  let data: any = null;
  const contentType = headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (response.status !== 204) {
    data = await response.text();
  }

  // 2. Save successful GET response and ETag into SQLite cache
  if (response.ok && method === 'GET') {
    try {
      const etag = headers.get('etag');
      stmts.setHttpCache.run(
        cacheKey,
        etag,
        JSON.stringify(data),
        response.status,
        JSON.stringify(Object.fromEntries(headers.entries())),
        Date.now(),
        ttlMs
      );
    } catch (e) {
      console.warn('Failed to cache HTTP response in SQLite:', e);
    }
  }

  return { data, status: response.status, headers, rateLimit, scopes, fromCache: false };
}

// Multi-page automatic fetcher for GitHub REST collection APIs
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

    const linkHeader = (res.headers instanceof Headers ? res.headers.get('link') : '') || '';
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

// GraphQL Query for 1-roundtrip batch fetching of repositories, languages, fork parents, and commits
const GET_USER_REPOS_GRAPHQL = `
  query GetViewerRepositories($cursor: String) {
    viewer {
      repositories(
        first: 100
        after: $cursor
        affiliations: [OWNER, COLLABORATOR]
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
        nodes {
          databaseId
          name
          nameWithOwner
          isPrivate
          isFork
          isArchived
          diskUsage
          pushedAt
          createdAt
          updatedAt
          description
          stargazerCount
          forkCount
          url
          primaryLanguage {
            name
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          parent {
            name
            nameWithOwner
            url
            defaultBranchRef {
              name
            }
            owner {
              login
              avatarUrl
              url
            }
          }
          languages(first: 6, orderBy: { field: SIZE, direction: DESC }) {
            totalSize
            edges {
              size
              node {
                name
                color
              }
            }
          }
          defaultBranchRef {
            name
          }
          owner {
            login
            avatarUrl
            url
          }
        }
      }
    }
    rateLimit {
      limit
      remaining
      resetAt
      used
    }
  }
`;

export async function fetchReposGraphQL(
  token: string,
  maxPages = 5
): Promise<{ repos: any[]; rateLimit: any; scopes: string[] }> {
  let allRepos: any[] = [];
  let cursor: string | null = null;
  let hasNext = true;
  let page = 0;
  let rateLimitInfo = { limit: 5000, remaining: 5000, reset: 0, used: 0 };
  let scopes: string[] = [];

  while (hasNext && page < maxPages) {
    page++;
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RepoDeck-GitHub-Manager',
      },
      body: JSON.stringify({
        query: GET_USER_REPOS_GRAPHQL,
        variables: { cursor },
      }),
    });

    const rawScopes = response.headers.get('x-oauth-scopes') || '';
    if (rawScopes) {
      scopes = rawScopes.split(',').map((s) => s.trim());
    }

    if (!response.ok) {
      throw new Error(`GitHub GraphQL HTTP error ${response.status}`);
    }

    const payload = await response.json();
    if (payload.errors && payload.errors.length > 0) {
      throw new Error(payload.errors[0]?.message || 'GraphQL Query Error');
    }

    const viewer = payload.data?.viewer;
    const rateLimit = payload.data?.rateLimit;

    if (rateLimit) {
      rateLimitInfo = {
        limit: rateLimit.limit || 5000,
        remaining: rateLimit.remaining || 5000,
        reset: rateLimit.resetAt ? Math.floor(new Date(rateLimit.resetAt).getTime() / 1000) : 0,
        used: rateLimit.used || 0,
      };
    }

    if (!viewer?.repositories?.nodes) {
      break;
    }

    const nodes = viewer.repositories.nodes;
    for (const node of nodes) {
      // Build languages map
      const languagesMap: Record<string, number> = {};
      if (node.languages?.edges) {
        for (const edge of node.languages.edges) {
          if (edge.node?.name && typeof edge.size === 'number') {
            languagesMap[edge.node.name] = edge.size;
          }
        }
      }

      // Build topics
      const topics: string[] = [];
      if (node.repositoryTopics?.nodes) {
        for (const t of node.repositoryTopics.nodes) {
          if (t.topic?.name) topics.push(t.topic.name);
        }
      }

      const transformedRepo = {
        id: node.databaseId,
        name: node.name,
        full_name: node.nameWithOwner,
        owner: {
          login: node.owner?.login || '',
          avatar_url: node.owner?.avatarUrl || '',
          html_url: node.owner?.url || '',
        },
        description: node.description || '',
        private: Boolean(node.isPrivate),
        fork: Boolean(node.isFork),
        parent: node.parent
          ? {
              name: node.parent.name,
              full_name: node.parent.nameWithOwner,
              html_url: node.parent.url,
              default_branch: node.parent.defaultBranchRef?.name || 'main',
              owner: {
                login: node.parent.owner?.login || '',
                avatar_url: node.parent.owner?.avatarUrl || '',
                html_url: node.parent.owner?.url || '',
              },
            }
          : undefined,
        default_branch: node.defaultBranchRef?.name || 'main',
        html_url: node.url,
        language: node.primaryLanguage?.name || null,
        languages: languagesMap,
        topics,
        stargazers_count: node.stargazerCount || 0,
        forks_count: node.forkCount || 0,
        open_issues_count: 0,
        archived: Boolean(node.isArchived),
        size: node.diskUsage || 0,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        pushed_at: node.pushedAt,
      };

      allRepos.push(transformedRepo);
    }

    const pageInfo = viewer.repositories.pageInfo;
    if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
      cursor = pageInfo.endCursor;
    } else {
      hasNext = false;
    }
  }

  return {
    repos: allRepos,
    rateLimit: rateLimitInfo,
    scopes,
  };
}
