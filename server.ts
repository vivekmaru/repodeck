import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/auth.js';
import { reposRouter } from './server/routes/repos.js';
import { forksRouter } from './server/routes/forks.js';
import { branchesRouter } from './server/routes/branches.js';
import { releasesRouter } from './server/routes/releases.js';
import { issuesRouter } from './server/routes/issues.js';
import { starredRouter } from './server/routes/starred.js';
import { searchRouter } from './server/routes/search.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Enable trust proxy for HTTPS detection behind Cloud Run / Render / Cloudflare
app.set('trust proxy', 1);

// Production Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json());
app.use(cookieParser());

// Liveness & Healthcheck Endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Mount Modular API Routers
app.use(authRouter);
app.use(reposRouter);
app.use(forksRouter);
app.use(branchesRouter);
app.use(releasesRouter);
app.use(issuesRouter);
app.use(starredRouter);
app.use(searchRouter);

// Server Lifecycle & Vite Middleware
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RepoDeck server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
