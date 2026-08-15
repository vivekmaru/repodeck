import { Router } from 'express';
import { getGitHubToken, callGitHubApi, fetchAllPages } from '../utils/githubApi.js';
import { demoState } from '../data/demoState.js';
import { db, stmts } from '../db/database.js';

export const starredRouter = Router();

// 1. Get Starred Repositories (SQLite Cached + ETag)
starredRouter.get('/api/github/starred', async (req, res) => {
  const { token } = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json(demoState.starred);
  }

  const userId = token.slice(-8);
  const forceRefresh = req.query.refresh === 'true';

  // Fast path: Check SQLite cache first
  const cachedRows = stmts.getUserStarred.all(userId) as any[];
  if (cachedRows.length > 0 && !forceRefresh) {
    const cachedStarred = cachedRows.map((r) => JSON.parse(r.data_json));
    return res.json(cachedStarred);
  }

  try {
    const { items: starred } = await fetchAllPages('/user/starred', token, 3); // Fetch up to 300 starred

    // Persist to SQLite
    if (starred.length > 0) {
      db.exec('BEGIN TRANSACTION;');
      try {
        stmts.clearUserStarred.run(userId);
        for (const repo of starred) {
          stmts.upsertStarred.run(
            repo.id,
            userId,
            repo.id,
            repo.full_name,
            JSON.stringify(repo),
            Date.now()
          );
        }
        db.exec('COMMIT;');
      } catch {
        db.exec('ROLLBACK;');
      }
    }

    res.json(starred);
  } catch (err: any) {
    if (cachedRows.length > 0) {
      return res.json(cachedRows.map((r) => JSON.parse(r.data_json)));
    }
    res.status(500).json({ error: err.message });
  }
});

// 2. Unstar Repository
starredRouter.delete('/api/github/starred/:owner/:repo', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);

  if (token === 'demo_token') {
    demoState.starred = demoState.starred.filter((r) => !(r.owner.login === owner && r.name === repo));
    return res.json({ success: true, message: `Unstarred ${owner}/${repo}` });
  }

  try {
    const { data, status } = await callGitHubApi(`/user/starred/${owner}/${repo}`, token, {
      method: 'DELETE',
    });

    if (status === 204 || status === 200) {
      stmts.deleteStarred.run(userId, `${owner}/${repo}`);
      return res.json({ success: true, message: `Unstarred ${owner}/${repo}` });
    }

    return res.status(status).json({ error: 'Failed to unstar repository', details: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
