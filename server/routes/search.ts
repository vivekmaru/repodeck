import { Router } from 'express';
import { getGitHubToken } from '../utils/githubApi.js';
import { executeSearch } from '../services/hybridSearch.js';
import { indexReposEmbeddings } from '../services/embeddings.js';
import { stmts, rowToRepo, bulkUpsertRepos } from '../db/database.js';
import { demoState } from '../data/demoState.js';

export const searchRouter = Router();

// 1. Unified Instant Hybrid & FTS5 Search Endpoint
searchRouter.get('/api/search', async (req, res) => {
  const { token } = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized. Please connect your GitHub account.' });

  const query = (req.query.q as string) || '';
  const mode = (req.query.mode as 'hybrid' | 'fts' | 'semantic') || 'hybrid';
  const limit = parseInt((req.query.limit as string) || '50', 10);

  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);

  // If in demo mode and database is empty, seed demo repositories into SQLite for FTS & Embeddings
  if (token === 'demo_token') {
    const existing = stmts.getUserRepos.all(userId) as any[];
    if (existing.length === 0) {
      bulkUpsertRepos(demoState.repos, userId);
      indexReposEmbeddings(demoState.repos, userId);
    }
  }

  try {
    const searchResponse = await executeSearch(userId, query, mode, limit);
    return res.json(searchResponse);
  } catch (err: any) {
    console.error('Search execution failed:', err);
    res.status(500).json({ error: err.message || 'Search execution failed.' });
  }
});

// 2. Trigger Vector Embedding Reindex
searchRouter.post('/api/search/reindex', async (req, res) => {
  const { token } = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);
  const rows = stmts.getUserRepos.all(userId) as any[];
  const repos = rows.map(rowToRepo);

  indexReposEmbeddings(repos, userId);

  return res.json({
    success: true,
    message: `Triggered background embedding indexing for ${repos.length} repositories.`,
    count: repos.length,
  });
});
