import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());
app.use(cookieParser());

// Determine if the incoming request is HTTPS
function isSecureConnection(req: express.Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

// Generate environment-aware cookie options
function getAuthCookieOptions(req: express.Request, maxAgeMs = 30 * 24 * 60 * 60 * 1000): express.CookieOptions {
  const isHttps = isSecureConnection(req);
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

// Helper to determine the application base URL
function getAppUrl(req: express.Request): string {
  if (process.env.APP_URL && process.env.APP_URL.trim() !== '') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const isHttps = isSecureConnection(req);
  const protocol = isHttps ? 'https' : (req.protocol || 'http');
  const host = req.get('host') || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

// Helper to get GitHub token from Cookie or Authorization header
function getGitHubToken(req: express.Request): { token: string | null; method: 'oauth' | 'pat' | 'demo' | null } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'demo_token') {
      return { token: 'demo_token', method: 'demo' };
    }
    return { token, method: 'pat' };
  }

  const cookieToken = req.cookies?.gh_token;
  const cookieMethod = req.cookies?.gh_auth_method as ('oauth' | 'pat' | 'demo') || 'oauth';
  if (cookieToken) {
    return { token: cookieToken, method: cookieMethod };
  }

  return { token: null, method: null };
}

// GitHub API Proxy helper
async function callGitHubApi(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data: any; status: number; headers: Headers }> {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'OctoPulse-GitHub-Manager',
  };

  if (token && token !== 'demo_token') {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const headers = response.headers;
  let data = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (response.status !== 204) {
    data = await response.text();
  }

  return { data, status: response.status, headers };
}

// Mock Data generator for Demo Mode
function getDemoSession() {
  const user = {
    login: 'octo-developer',
    id: 12345678,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    html_url: 'https://github.com/octo-developer',
    name: 'Alex Rivera',
    company: 'CloudScale Labs',
    blog: 'https://alexrivera.dev',
    location: 'San Francisco, CA',
    email: 'alex.rivera@example.com',
    bio: 'Distributed systems engineer, open-source enthusiast, and Kubernetes explorer.',
    public_repos: 14,
    total_private_repos: 3,
    followers: 142,
    following: 68,
    created_at: '2021-03-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  };

  const repos = [
    {
      id: 101,
      node_id: 'R_101',
      name: 'kubernetes-cron-controller',
      full_name: 'octo-developer/kubernetes-cron-controller',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/kubernetes-cron-controller',
      description: 'High performance Kubernetes custom controller for advanced schedule-based workload orchestration.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/kubernetes-cron-controller',
      created_at: '2023-01-10T12:00:00Z',
      updated_at: '2026-08-10T09:20:00Z',
      pushed_at: '2026-08-12T14:30:00Z',
      homepage: 'https://k8s-cron.dev',
      size: 4520,
      stargazers_count: 320,
      watchers_count: 320,
      language: 'Go',
      forks_count: 42,
      open_issues_count: 5,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['kubernetes', 'controller', 'go', 'cloud-native', 'devops'],
    },
    {
      id: 102,
      node_id: 'R_102',
      name: 'harness-cd-pipeline-templates',
      full_name: 'octo-developer/harness-cd-pipeline-templates',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/harness-cd-pipeline-templates',
      description: 'Reusable CI/CD pipeline step templates and custom plugins for modern GitOps deployments.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/harness-cd-pipeline-templates',
      created_at: '2023-08-20T10:00:00Z',
      updated_at: '2026-07-28T16:45:00Z',
      pushed_at: '2026-07-28T16:45:00Z',
      homepage: null,
      size: 1820,
      stargazers_count: 85,
      watchers_count: 85,
      language: 'TypeScript',
      forks_count: 12,
      open_issues_count: 2,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['harness', 'cicd', 'gitops', 'devops', 'pipelines'],
    },
    {
      id: 103,
      node_id: 'R_103',
      name: 'fastapi',
      full_name: 'octo-developer/fastapi',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/fastapi',
      description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production (Fork for async testing).',
      fork: true,
      url: 'https://api.github.com/repos/octo-developer/fastapi',
      created_at: '2022-04-12T15:00:00Z',
      updated_at: '2026-01-15T11:00:00Z',
      pushed_at: '2026-01-15T11:00:00Z',
      homepage: 'https://fastapi.tiangolo.com',
      size: 28400,
      stargazers_count: 14,
      watchers_count: 14,
      language: 'Python',
      forks_count: 1,
      open_issues_count: 0,
      default_branch: 'master',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['fastapi', 'python', 'async'],
      parent: {
        name: 'fastapi',
        full_name: 'fastapi/fastapi',
        html_url: 'https://github.com/fastapi/fastapi',
        default_branch: 'master',
        owner: {
          login: 'fastapi',
          avatar_url: 'https://avatars.githubusercontent.com/u/102988188?v=4',
          html_url: 'https://github.com/fastapi',
        },
      },
    },
    {
      id: 104,
      node_id: 'R_104',
      name: 'prometheus-client-rust',
      full_name: 'octo-developer/prometheus-client-rust',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/prometheus-client-rust',
      description: 'Prometheus instrumentation client library for Rust services (Fork with custom histogram bucket PR).',
      fork: true,
      url: 'https://api.github.com/repos/octo-developer/prometheus-client-rust',
      created_at: '2023-02-18T10:00:00Z',
      updated_at: '2026-08-01T12:00:00Z',
      pushed_at: '2026-08-01T12:00:00Z',
      homepage: null,
      size: 5300,
      stargazers_count: 3,
      watchers_count: 3,
      language: 'Rust',
      forks_count: 0,
      open_issues_count: 0,
      default_branch: 'master',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['rust', 'prometheus', 'metrics'],
      parent: {
        name: 'prometheus-client-rust',
        full_name: 'prometheus/client_rust',
        html_url: 'https://github.com/prometheus/client_rust',
        default_branch: 'master',
        owner: {
          login: 'prometheus',
          avatar_url: 'https://avatars.githubusercontent.com/u/3380462?v=4',
          html_url: 'https://github.com/prometheus',
        },
      },
    },
    {
      id: 105,
      node_id: 'R_105',
      name: 'deprecated-node-crawler-v1',
      full_name: 'octo-developer/deprecated-node-crawler-v1',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/deprecated-node-crawler-v1',
      description: 'Old experiment in headless scraping using puppeteer and node 12. Candidate for cleanup.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/deprecated-node-crawler-v1',
      created_at: '2021-05-14T08:00:00Z',
      updated_at: '2022-03-10T14:00:00Z',
      pushed_at: '2022-03-10T14:00:00Z',
      homepage: null,
      size: 14200,
      stargazers_count: 2,
      watchers_count: 2,
      language: 'JavaScript',
      forks_count: 0,
      open_issues_count: 1,
      default_branch: 'master',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['scraping', 'crawler'],
    },
    {
      id: 106,
      node_id: 'R_106',
      name: 'internal-billing-service',
      full_name: 'octo-developer/internal-billing-service',
      private: true,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/internal-billing-service',
      description: 'Private billing automation webhook receiver and Stripe subscription listener.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/internal-billing-service',
      created_at: '2024-02-11T16:00:00Z',
      updated_at: '2026-06-15T10:00:00Z',
      pushed_at: '2026-06-15T10:00:00Z',
      homepage: null,
      size: 3400,
      stargazers_count: 0,
      watchers_count: 0,
      language: 'TypeScript',
      forks_count: 0,
      open_issues_count: 0,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'private',
      topics: ['stripe', 'billing', 'private'],
    },
    {
      id: 107,
      node_id: 'R_107',
      name: 'legacy-angular-admin',
      full_name: 'octo-developer/legacy-angular-admin',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/legacy-angular-admin',
      description: 'Archived legacy dashboard UI for customer support ticketing.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/legacy-angular-admin',
      created_at: '2021-08-01T12:00:00Z',
      updated_at: '2023-04-12T09:00:00Z',
      pushed_at: '2023-04-12T09:00:00Z',
      homepage: null,
      size: 9800,
      stargazers_count: 5,
      watchers_count: 5,
      language: 'TypeScript',
      forks_count: 1,
      open_issues_count: 0,
      default_branch: 'main',
      archived: true,
      disabled: false,
      visibility: 'public',
      topics: ['angular', 'legacy'],
    }
  ];

  const starred = [
    {
      id: 201,
      node_id: 'R_201',
      name: 'tailwind-harness',
      full_name: 'harness/harness-skills',
      private: false,
      owner: { login: 'harness', id: 998877, avatar_url: 'https://avatars.githubusercontent.com/u/23565780?v=4', html_url: 'https://github.com/harness' },
      html_url: 'https://github.com/harness/harness-skills',
      description: 'Skills and components for building next-generation DevOps engineering platforms with Harness.',
      fork: false,
      url: 'https://api.github.com/repos/harness/harness-skills',
      created_at: '2023-05-10T12:00:00Z',
      updated_at: '2026-08-11T18:00:00Z',
      pushed_at: '2026-08-11T18:00:00Z',
      homepage: 'https://harness.io',
      size: 15400,
      stargazers_count: 1420,
      watchers_count: 1420,
      language: 'TypeScript',
      forks_count: 180,
      open_issues_count: 8,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['devops', 'skills', 'ai', 'automation'],
    },
    {
      id: 202,
      node_id: 'R_202',
      name: 'lucide',
      full_name: 'lucide-icons/lucide',
      private: false,
      owner: { login: 'lucide-icons', id: 554433, avatar_url: 'https://avatars.githubusercontent.com/u/66879934?v=4', html_url: 'https://github.com/lucide-icons' },
      html_url: 'https://github.com/lucide-icons/lucide',
      description: 'Beautiful & consistent icon toolkit made by the community. An open-source fork of Feather Icons.',
      fork: false,
      url: 'https://api.github.com/repos/lucide-icons/lucide',
      created_at: '2020-05-20T10:00:00Z',
      updated_at: '2026-08-13T02:00:00Z',
      pushed_at: '2026-08-13T02:00:00Z',
      homepage: 'https://lucide.dev',
      size: 42000,
      stargazers_count: 16800,
      watchers_count: 16800,
      language: 'TypeScript',
      forks_count: 650,
      open_issues_count: 45,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['icons', 'vector', 'svg', 'ui', 'react'],
    },
    {
      id: 203,
      node_id: 'R_203',
      name: 'temporal',
      full_name: 'temporalio/temporal',
      private: false,
      owner: { login: 'temporalio', id: 112233, avatar_url: 'https://avatars.githubusercontent.com/u/56417781?v=4', html_url: 'https://github.com/temporalio' },
      html_url: 'https://github.com/temporalio/temporal',
      description: 'Temporal service is a distributed, scalable, durable, and highly available orchestration engine.',
      fork: false,
      url: 'https://api.github.com/repos/temporalio/temporal',
      created_at: '2020-02-12T10:00:00Z',
      updated_at: '2026-08-12T20:00:00Z',
      pushed_at: '2026-08-12T20:00:00Z',
      homepage: 'https://temporal.io',
      size: 58000,
      stargazers_count: 12500,
      watchers_count: 12500,
      language: 'Go',
      forks_count: 980,
      open_issues_count: 120,
      default_branch: 'master',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['workflow', 'orchestration', 'microservices', 'go'],
    },
  ];

  return { user, repos, starred };
}

// In-memory store for Demo changes (so demo mode users can test delete, sync, star operations)
let demoState = getDemoSession();

// --- Auth Endpoints ---

// 1. Get OAuth authorization URL
app.get('/api/auth/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      error: 'GITHUB_CLIENT_ID is not configured in server environment.',
      needs_credentials: true,
    });
  }

  const appUrl = getAppUrl(req);
  const redirectUri = `${appUrl}/auth/callback`;

  // Cryptographic state token for CSRF protection
  const state = crypto.randomBytes(24).toString('hex');
  res.cookie('oauth_state', state, getAuthCookieOptions(req, 10 * 60 * 1000)); // 10 minutes

  // Required scopes: repo (access private/public repo management), delete_repo (allows deleting repositories), read:user
  const scopes = ['read:user', 'repo', 'delete_repo'].join(' ');
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;

  res.json({ url: authUrl });
});

// 2. OAuth Callback
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const savedState = req.cookies?.oauth_state;
  res.clearCookie('oauth_state', getAuthCookieOptions(req, 0));

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Authentication failed';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>GitHub Authentication Error</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px; text-align: center;">
          <h2 style="color: #ef4444;">GitHub Authentication Error</h2>
          <p>${errorMsg}</p>
          <script>
            if (window.opener) {
              try {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, window.location.origin);
              } catch (e) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              }
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Configuration Missing</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px; text-align: center;">
          <h2 style="color: #ef4444;">OAuth Configuration Missing</h2>
          <p>GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing from server environment.</p>
        </body>
      </html>
    `);
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange code');
    }

    const cookieOpts = getAuthCookieOptions(req, 30 * 24 * 60 * 60 * 1000); // 30 days
    res.cookie('gh_token', tokenData.access_token, cookieOpts);
    res.cookie('gh_auth_method', 'oauth', cookieOpts);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticated</title>
        </head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
          <div style="max-width: 400px; margin: 0 auto; background: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #334155;">
            <svg style="width: 48px; height: 48px; color: #10b981; margin: 0 auto 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <h2 style="margin-bottom: 8px;">Connected to GitHub</h2>
            <p style="color: #94a3b8; font-size: 14px;">Closing popup and refreshing RepoDeck workspace...</p>
          </div>
          <script>
            if (window.opener) {
              try {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, window.location.origin);
              } catch (e) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              }
              setTimeout(() => {
                window.close();
              }, 400);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth token exchange error:', err);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Exchange Failed</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px; text-align: center;">
          <h2 style="color: #ef4444;">OAuth Exchange Failed</h2>
          <p>${err.message}</p>
        </body>
      </html>
    `);
  }
});

// 3. Connect with Personal Access Token (PAT)
app.post('/api/auth/pat', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required.' });
  }

  const cleanToken = token.trim();
  try {
    const { data: user, status, headers } = await callGitHubApi('/user', cleanToken);
    if (status !== 200 || !user || !user.login) {
      return res.status(401).json({ error: 'Invalid Personal Access Token or unauthorized.' });
    }

    const rawScopes = headers.get('x-oauth-scopes') || '';
    const scopes = rawScopes ? rawScopes.split(',').map((s) => s.trim()) : [];

    const cookieOpts = getAuthCookieOptions(req, 30 * 24 * 60 * 60 * 1000);
    res.cookie('gh_token', cleanToken, cookieOpts);
    res.cookie('gh_auth_method', 'pat', cookieOpts);

    res.json({
      success: true,
      user,
      scopes,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to authenticate PAT' });
  }
});

// 4. Activate Demo Mode
app.post('/api/auth/demo', (req, res) => {
  demoState = getDemoSession(); // reset to fresh demo data

  const cookieOpts = getAuthCookieOptions(req, 7 * 24 * 60 * 60 * 1000);
  res.cookie('gh_token', 'demo_token', cookieOpts);
  res.cookie('gh_auth_method', 'demo', cookieOpts);

  res.json({
    success: true,
    user: demoState.user,
    scopes: ['repo', 'delete_repo', 'read:user'],
  });
});

// 5. Logout
app.post('/api/auth/logout', (req, res) => {
  const clearOpts = getAuthCookieOptions(req, 0);
  res.clearCookie('gh_token', clearOpts);
  res.clearCookie('gh_auth_method', clearOpts);
  res.clearCookie('oauth_state', clearOpts);
  res.json({ success: true });
});

// 6. Get Current Auth Session & Rate Limit Status
app.get('/api/auth/session', async (req, res) => {
  const { token, method } = getGitHubToken(req);
  const clientIdConfigured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  if (!token) {
    return res.json({
      authenticated: false,
      user: null,
      scopes: [],
      rateLimit: null,
      authMethod: null,
      clientIdConfigured,
    });
  }

  if (token === 'demo_token') {
    return res.json({
      authenticated: true,
      user: demoState.user,
      scopes: ['repo', 'delete_repo', 'read:user'],
      rateLimit: {
        limit: 5000,
        remaining: 4890,
        reset: Math.floor(Date.now() / 1000) + 3600,
        used: 110,
      },
      authMethod: 'demo',
      clientIdConfigured,
    });
  }

  try {
    const { data: user, status, headers } = await callGitHubApi('/user', token);
    if (status !== 200 || !user || !user.login) {
      return res.json({
        authenticated: false,
        user: null,
        scopes: [],
        rateLimit: null,
        authMethod: null,
        clientIdConfigured,
      });
    }

    const rawScopes = headers.get('x-oauth-scopes') || '';
    const scopes = rawScopes ? rawScopes.split(',').map((s) => s.trim()) : [];

    const rateLimit = {
      limit: parseInt(headers.get('x-ratelimit-limit') || '5000', 10),
      remaining: parseInt(headers.get('x-ratelimit-remaining') || '5000', 10),
      reset: parseInt(headers.get('x-ratelimit-reset') || '0', 10),
      used: parseInt(headers.get('x-ratelimit-used') || '0', 10),
    };

    res.json({
      authenticated: true,
      user,
      scopes,
      rateLimit,
      authMethod: method,
      clientIdConfigured,
    });
  } catch (err) {
    res.json({
      authenticated: false,
      user: null,
      scopes: [],
      rateLimit: null,
      authMethod: null,
      clientIdConfigured,
    });
  }
});

// --- GitHub API Proxy Endpoints ---

// Get all repositories for user
app.get('/api/github/repos', async (req, res) => {
  const { token } = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized. Please connect your GitHub account.' });

  if (token === 'demo_token') {
    return res.json(demoState.repos);
  }

  try {
    // Fetch up to 100 repositories sorted by updated
    const { data: repos, status } = await callGitHubApi('/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator', token);
    if (status !== 200) {
      return res.status(status).json({ error: 'Failed to fetch repositories', details: repos });
    }

    // Enhance forked repos with parent info if available
    const enrichedRepos = await Promise.all(
      repos.map(async (repo: any) => {
        if (repo.fork && !repo.parent) {
          try {
            const { data: repoDetails } = await callGitHubApi(`/repos/${repo.owner.login}/${repo.name}`, token);
            if (repoDetails && repoDetails.parent) {
              return {
                ...repo,
                parent: {
                  name: repoDetails.parent.name,
                  full_name: repoDetails.parent.full_name,
                  html_url: repoDetails.parent.html_url,
                  default_branch: repoDetails.parent.default_branch,
                  owner: {
                    login: repoDetails.parent.owner?.login || '',
                    avatar_url: repoDetails.parent.owner?.avatar_url || '',
                    html_url: repoDetails.parent.owner?.html_url || '',
                  },
                },
              };
            }
          } catch (e) {
            // ignore individual repo detail error
          }
        }
        return repo;
      })
    );

    res.json(enrichedRepos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Compare fork with upstream parent
app.get('/api/github/forks/:owner/:repo/compare', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    if (repo === 'fastapi') {
      return res.json({
        status: 'behind',
        behind_by: 14,
        ahead_by: 2,
        parent_full_name: 'fastapi/fastapi',
        parent_branch: 'master',
        fork_branch: 'master',
      });
    }
    return res.json({
      status: 'up_to_date',
      behind_by: 0,
      ahead_by: 0,
      parent_full_name: 'prometheus/client_rust',
      parent_branch: 'master',
      fork_branch: 'master',
    });
  }

  try {
    // 1. Fetch the repo detail to get parent
    const { data: repoDetail, status: repoStatus } = await callGitHubApi(`/repos/${owner}/${repo}`, token);
    if (repoStatus !== 200 || !repoDetail.parent) {
      return res.status(404).json({ error: 'Repository is not a fork or upstream parent not found.' });
    }

    const parent = repoDetail.parent;
    const forkBranch = repoDetail.default_branch || 'main';
    const parentBranch = parent.default_branch || 'main';

    // 2. Call compare API: compare parent branch with fork default branch
    // Compare endpoint: GET /repos/{parent_owner}/{parent_repo}/compare/{parent_branch}...{fork_owner}:{fork_branch}
    const compareUrl = `/repos/${parent.owner.login}/${parent.name}/compare/${parentBranch}...${owner}:${forkBranch}`;
    const { data: compareData, status: compareStatus } = await callGitHubApi(compareUrl, token);

    if (compareStatus !== 200) {
      return res.status(compareStatus).json({
        error: 'Failed to compare with upstream',
        details: compareData,
      });
    }

    let syncStatus: 'up_to_date' | 'behind' | 'ahead' | 'diverged' = 'up_to_date';
    if (compareData.behind_by > 0 && compareData.ahead_by > 0) {
      syncStatus = 'diverged';
    } else if (compareData.behind_by > 0) {
      syncStatus = 'behind';
    } else if (compareData.ahead_by > 0) {
      syncStatus = 'ahead';
    }

    res.json({
      status: syncStatus,
      behind_by: compareData.behind_by || 0,
      ahead_by: compareData.ahead_by || 0,
      parent_full_name: parent.full_name,
      parent_branch: parentBranch,
      fork_branch: forkBranch,
      html_url: compareData.html_url,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single-Click Sync Fork with Upstream
app.post('/api/github/forks/:owner/:repo/sync', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;
  const { branch } = req.body;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    // Simulate successful sync in demo mode
    return res.json({
      message: `Successfully fast-forwarded branch '${branch || 'master'}' with upstream.`,
      merge_type: 'fast-forward',
      base_branch: branch || 'master',
    });
  }

  try {
    const targetBranch = branch || 'main';
    // GitHub API: POST /repos/{owner}/{repo}/merge-upstream
    const { data, status } = await callGitHubApi(`/repos/${owner}/${repo}/merge-upstream`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch: targetBranch }),
    });

    if (status === 200 || status === 201) {
      return res.json({
        message: data.message || `Successfully synced ${targetBranch} with upstream!`,
        merge_type: data.merge_type,
        base_branch: data.base_branch,
      });
    }

    if (status === 409) {
      return res.status(409).json({
        error: 'Merge conflict detected. You must resolve conflicts manually in Git.',
        message: data.message,
      });
    }

    return res.status(status).json({
      error: data.message || 'Failed to sync upstream.',
      details: data,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Repository (Destructive!)
app.delete('/api/github/repos/:owner/:repo', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Please connect your GitHub account.' });
  }

  if (token === 'demo_token') {
    demoState.repos = demoState.repos.filter((r) => !(r.owner.login === owner && r.name === repo));
    return res.json({ success: true, message: `Repository ${owner}/${repo} was deleted from demo workspace.` });
  }

  try {
    const { data, status, headers } = await callGitHubApi(`/repos/${owner}/${repo}`, token, {
      method: 'DELETE',
    });

    if (status === 204 || status === 200) {
      return res.json({ success: true, message: `Repository ${owner}/${repo} successfully deleted.` });
    }

    const rawScopes = headers.get('x-oauth-scopes') || '';
    const activeScopes = rawScopes ? rawScopes.split(',').map((s) => s.trim()) : [];
    const hasDeleteScope = activeScopes.includes('delete_repo');

    if (status === 403) {
      let errorMsg = 'GitHub rejected the deletion (403 Forbidden).';
      if (!hasDeleteScope) {
        errorMsg = 'Your Personal Access Token lacks the required "delete_repo" scope. Classic PAT with "delete_repo" scope is required.';
      } else if (typeof data === 'object' && data?.message) {
        errorMsg = `${data.message}. Ensure your token has admin permissions or the organization permits repository deletion.`;
      }
      return res.status(403).json({
        error: errorMsg,
        details: data,
        hasDeleteScope,
        activeScopes,
        needsReauth: true,
      });
    }

    if (status === 404) {
      return res.status(404).json({
        error: 'Repository not found or your token lacks permissions to see/delete it (GitHub returns 404 if "delete_repo" scope is missing).',
        details: data,
        hasDeleteScope,
        activeScopes,
      });
    }

    const message =
      typeof data === 'object' && data?.message
        ? data.message
        : typeof data === 'string' && data.length > 0
        ? data
        : `GitHub API returned status ${status}`;

    return res.status(status).json({ error: message, details: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error during repository deletion.' });
  }
});

// Update / Toggle Archive Repository
app.patch('/api/github/repos/:owner/:repo', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;
  const { archived, description } = req.body;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    const found = demoState.repos.find((r) => r.owner.login === owner && r.name === repo);
    if (found) {
      if (typeof archived === 'boolean') found.archived = archived;
      if (typeof description === 'string') found.description = description;
      return res.json(found);
    }
    return res.status(404).json({ error: 'Repo not found' });
  }

  try {
    const payload: any = {};
    if (typeof archived === 'boolean') payload.archived = archived;
    if (typeof description === 'string') payload.description = description;

    const { data, status } = await callGitHubApi(`/repos/${owner}/${repo}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (status === 200) {
      return res.json(data);
    }

    return res.status(status).json({ error: 'Failed to update repository', details: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper for demo repository details
function getDemoRepoDetails(owner: string, repo: string) {
  const found = demoState.repos.find((r) => r.owner.login === owner && r.name === repo);
  const lang = found?.language || 'TypeScript';

  const languageMap: Record<string, Record<string, number>> = {
    TypeScript: { TypeScript: 684200, JavaScript: 142100, HTML: 24500, CSS: 48900 },
    JavaScript: { JavaScript: 520400, HTML: 85200, CSS: 64100 },
    Python: { Python: 820300, Dockerfile: 24400, Shell: 14900, HTML: 14000 },
    Go: { Go: 780000, Shell: 24000, Makefile: 12000 },
    Rust: { Rust: 910400, C: 45000, Shell: 12000 },
    PHP: { PHP: 712000, JavaScript: 98000, CSS: 52000, SQL: 34000 },
  };

  const languages = languageMap[lang] || { [lang]: 450000, Shell: 25000, Markdown: 12000 };
  const totalBytes = Object.values(languages).reduce((acc, v) => acc + v, 0);

  const contributors = [
    {
      id: 1,
      login: owner,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      html_url: `https://github.com/${owner}`,
      contributions: 64,
      type: 'User',
    },
    {
      id: 2,
      login: 'alex-engineer',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      html_url: 'https://github.com/alex-engineer',
      contributions: 28,
      type: 'User',
    },
    {
      id: 3,
      login: 'sarah-dev',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      html_url: 'https://github.com/sarah-dev',
      contributions: 14,
      type: 'User',
    },
    {
      id: 4,
      login: 'renovate[bot]',
      avatar_url: 'https://avatars.githubusercontent.com/in/2740?v=4',
      html_url: 'https://github.com/apps/renovate',
      contributions: 9,
      type: 'Bot',
    },
  ];

  const recentCommits = [
    {
      sha: 'a7b3c9f2e1d08c5a4b6e7f8d9c0a1b2c3d4e5f6a',
      commit: {
        message: found?.archived ? 'Final archiving metadata update' : 'feat: optimize memory allocations and telemetry latency',
        author: {
          name: owner,
          email: `${owner}@example.com`,
          date: found?.pushed_at || new Date().toISOString(),
        },
      },
      author: {
        login: owner,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        html_url: `https://github.com/${owner}`,
      },
      html_url: `https://github.com/${owner}/${repo}/commit/a7b3c9f`,
    },
    {
      sha: 'f1e2d3c4b5a69876543210fedcba9876543210fe',
      commit: {
        message: 'fix: resolve race condition in worker event queue',
        author: {
          name: 'alex-engineer',
          email: 'alex@example.com',
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      },
      author: {
        login: 'alex-engineer',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        html_url: 'https://github.com/alex-engineer',
      },
      html_url: `https://github.com/${owner}/${repo}/commit/f1e2d3c`,
    },
    {
      sha: '9876543210abcdef0123456789abcdef01234567',
      commit: {
        message: 'chore(deps): update runtime dependencies',
        author: {
          name: 'renovate[bot]',
          email: 'bot@renovateapp.com',
          date: new Date(Date.now() - 86400000 * 14).toISOString(),
        },
      },
      author: {
        login: 'renovate[bot]',
        avatar_url: 'https://avatars.githubusercontent.com/in/2740?v=4',
        html_url: 'https://github.com/apps/renovate',
      },
      html_url: `https://github.com/${owner}/${repo}/commit/9876543`,
    },
  ];

  return { languages, totalBytes, contributors, recentCommits };
}

// Get Repository Details (Languages breakdown, Contributors, Recent Commits)
app.get('/api/github/repos/:owner/:repo/details', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json(getDemoRepoDetails(owner, repo));
  }

  try {
    const [langRes, contribRes, commitRes] = await Promise.all([
      callGitHubApi(`/repos/${owner}/${repo}/languages`, token),
      callGitHubApi(`/repos/${owner}/${repo}/contributors?per_page=8`, token),
      callGitHubApi(`/repos/${owner}/${repo}/commits?per_page=5`, token),
    ]);

    const languages: Record<string, number> = langRes.status === 200 && typeof langRes.data === 'object' && !Array.isArray(langRes.data)
      ? langRes.data
      : {};

    const totalBytes = Object.values(languages).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);

    const contributors = contribRes.status === 200 && Array.isArray(contribRes.data)
      ? contribRes.data.map((c: any) => ({
          id: c.id,
          login: c.login,
          avatar_url: c.avatar_url,
          html_url: c.html_url,
          contributions: c.contributions,
          type: c.type,
        }))
      : [];

    const recentCommits = commitRes.status === 200 && Array.isArray(commitRes.data)
      ? commitRes.data.map((cm: any) => ({
          sha: cm.sha,
          commit: {
            message: cm.commit?.message || 'No commit message',
            author: {
              name: cm.commit?.author?.name || 'Unknown',
              email: cm.commit?.author?.email || '',
              date: cm.commit?.author?.date || '',
            },
          },
          author: cm.author
            ? {
                login: cm.author.login,
                avatar_url: cm.author.avatar_url,
                html_url: cm.author.html_url,
              }
            : null,
          html_url: cm.html_url,
        }))
      : [];

    return res.json({
      languages,
      totalBytes,
      contributors,
      recentCommits,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch repository details' });
  }
});

// Get Starred Repositories
app.get('/api/github/starred', async (req, res) => {
  const { token } = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json(demoState.starred);
  }

  try {
    const { data, status } = await callGitHubApi('/user/starred?per_page=100', token);
    if (status !== 200) {
      return res.status(status).json({ error: 'Failed to fetch starred repos', details: data });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unstar Repository
app.delete('/api/github/starred/:owner/:repo', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    demoState.starred = demoState.starred.filter((r) => !(r.owner.login === owner && r.name === repo));
    return res.json({ success: true, message: `Unstarred ${owner}/${repo}` });
  }

  try {
    const { data, status } = await callGitHubApi(`/user/starred/${owner}/${repo}`, token, {
      method: 'DELETE',
    });

    if (status === 204 || status === 200) {
      return res.json({ success: true, message: `Unstarred ${owner}/${repo}` });
    }

    return res.status(status).json({ error: 'Failed to unstar repository', details: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Server Lifecycle & Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OctoPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
