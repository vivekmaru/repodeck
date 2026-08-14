import { Router } from 'express';
import { getGitHubToken, callGitHubApi, fetchAllPages } from '../utils/githubApi.js';
import { demoState } from '../data/demoState.js';

export const starredRouter = Router();

// 1. Get Starred Repositories
starredRouter.get('/api/github/starred', async (req, res) => {
  const { token } = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json(demoState.starred);
  }

  try {
    const { items: starred } = await fetchAllPages('/user/starred', token, 3); // Fetch up to 300 starred
    res.json(starred);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Unstar Repository
starredRouter.delete('/api/github/starred/:owner/:repo', async (req, res) => {
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
