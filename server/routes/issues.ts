import { Router } from 'express';
import { getGitHubToken, callGitHubApi } from '../utils/githubApi.js';
import { getDemoIssuesAndPrs } from '../data/demoState.js';

export const issuesRouter = Router();

// 1. Get Open Issues and Pull Requests for triage
issuesRouter.get('/api/github/repos/:owner/:repo/issues-and-prs', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json(getDemoIssuesAndPrs(owner, repo));
  }

  try {
    const { data, status } = await callGitHubApi(
      `/repos/${owner}/${repo}/issues?state=open&sort=updated&per_page=40`,
      token
    );

    if (status !== 200 || !Array.isArray(data)) {
      return res.status(status).json({ error: 'Failed to fetch issues and PRs', details: data });
    }

    const items = data.map((item: any) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      state: item.state,
      is_pr: Boolean(item.pull_request),
      draft: Boolean(item.draft),
      html_url: item.html_url,
      created_at: item.created_at,
      updated_at: item.updated_at,
      comments: item.comments || 0,
      user: {
        login: item.user?.login || 'Unknown',
        avatar_url: item.user?.avatar_url || '',
      },
      labels: Array.isArray(item.labels)
        ? item.labels.map((l: any) => ({
            id: l.id,
            name: l.name,
            color: l.color,
            description: l.description,
          }))
        : [],
    }));

    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
