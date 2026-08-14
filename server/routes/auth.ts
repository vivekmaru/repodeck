import { Router } from 'express';
import crypto from 'crypto';
import { 
  getAppUrl, 
  getAuthCookieOptions, 
  getGitHubToken, 
  callGitHubApi 
} from '../utils/githubApi.js';
import { demoState, resetDemoState } from '../data/demoState.js';

export const authRouter = Router();

// 1. Get OAuth authorization URL
authRouter.get('/api/auth/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      error: 'GITHUB_CLIENT_ID is not configured in server environment.',
      needs_credentials: true,
    });
  }

  const appUrl = getAppUrl(req);
  const redirectUri = `${appUrl}/auth/callback`;

  // CSRF state token
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
authRouter.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
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

    const tokenData = (await tokenResponse.json()) as any;

    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange code');
    }

    const cookieOpts = getAuthCookieOptions(req, 30 * 24 * 60 * 60 * 1000);
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
authRouter.post('/api/auth/pat', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required.' });
  }

  const cleanToken = token.trim();
  try {
    const { data: user, status, scopes } = await callGitHubApi('/user', cleanToken);
    if (status !== 200 || !user || !user.login) {
      return res.status(401).json({ error: 'Invalid Personal Access Token or unauthorized.' });
    }

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
authRouter.post('/api/auth/demo', (req, res) => {
  const state = resetDemoState();

  const cookieOpts = getAuthCookieOptions(req, 7 * 24 * 60 * 60 * 1000);
  res.cookie('gh_token', 'demo_token', cookieOpts);
  res.cookie('gh_auth_method', 'demo', cookieOpts);

  res.json({
    success: true,
    user: state.user,
    scopes: ['repo', 'delete_repo', 'read:user'],
  });
});

// 5. Logout
authRouter.post('/api/auth/logout', (req, res) => {
  const clearOpts = getAuthCookieOptions(req, 0);
  res.clearCookie('gh_token', clearOpts);
  res.clearCookie('gh_auth_method', clearOpts);
  res.clearCookie('oauth_state', clearOpts);
  res.json({ success: true });
});

// 6. Get Current Auth Session & Rate Limit Status
authRouter.get('/api/auth/session', async (req, res) => {
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
    const { data: user, status, scopes, rateLimit } = await callGitHubApi('/user', token);
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
