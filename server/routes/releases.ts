import { Router } from 'express';
import { getGitHubToken, callGitHubApi } from '../utils/githubApi.js';
import { getDemoReleases } from '../data/demoState.js';

export const releasesRouter = Router();

// 1. Get Releases, Assets & Tags for repository
releasesRouter.get('/api/github/repos/:owner/:repo/releases', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json({
      releases: getDemoReleases(owner, repo),
      tags: [
        { name: 'v2.4.0', commit: { sha: 'a7b3c9f2e1d0' } },
        { name: 'v2.3.1', commit: { sha: 'f1e2d3c4b5a6' } },
        { name: 'v2.2.0', commit: { sha: '8c9d0e1f2a3b' } },
        { name: 'v2.1.0', commit: { sha: '3b4c5d6e7f8a' } },
      ],
    });
  }

  try {
    const [releasesRes, tagsRes] = await Promise.all([
      callGitHubApi(`/repos/${owner}/${repo}/releases?per_page=20`, token),
      callGitHubApi(`/repos/${owner}/${repo}/tags?per_page=20`, token),
    ]);

    const releases =
      releasesRes.status === 200 && Array.isArray(releasesRes.data)
        ? releasesRes.data.map((r: any) => ({
            id: r.id,
            tag_name: r.tag_name,
            name: r.name || r.tag_name,
            body: r.body || '',
            draft: Boolean(r.draft),
            prerelease: Boolean(r.prerelease),
            created_at: r.created_at,
            published_at: r.published_at || r.created_at,
            author: r.author
              ? {
                  login: r.author.login,
                  avatar_url: r.author.avatar_url,
                }
              : { login: owner, avatar_url: '' },
            html_url: r.html_url,
            assets: Array.isArray(r.assets)
              ? r.assets.map((a: any) => ({
                  id: a.id,
                  name: a.name,
                  size: a.size,
                  download_count: a.download_count || 0,
                  browser_download_url: a.browser_download_url,
                  content_type: a.content_type,
                }))
              : [],
          }))
        : [];

    const tags =
      tagsRes.status === 200 && Array.isArray(tagsRes.data)
        ? tagsRes.data.map((t: any) => ({
            name: t.name,
            commit: {
              sha: t.commit?.sha || '',
            },
          }))
        : [];

    res.json({ releases, tags });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
