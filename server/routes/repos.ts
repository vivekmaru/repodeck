import { Router } from 'express';
import { getGitHubToken, callGitHubApi, fetchAllPages, fetchReposGraphQL } from '../utils/githubApi.js';
import { demoState } from '../data/demoState.js';
import { stmts, bulkUpsertRepos, rowToRepo } from '../db/database.js';
import { indexReposEmbeddings } from '../services/embeddings.js';

export const reposRouter = Router();

// 1. Get all repositories for user (SQLite Cached + 1-Roundtrip GraphQL Batch Ingestion)
reposRouter.get('/api/github/repos', async (req, res) => {
  const { token } = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized. Please connect your GitHub account.' });

  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);

  if (token === 'demo_token') {
    // Seed demo repositories into SQLite if not present
    const existing = stmts.getUserRepos.all(userId) as any[];
    if (existing.length === 0) {
      bulkUpsertRepos(demoState.repos, userId);
      indexReposEmbeddings(demoState.repos, userId);
    }
    return res.json(demoState.repos);
  }

  // Fast Path: Check if we have recent SQLite cached repositories (< 5 minutes old)
  const cachedRows = stmts.getUserRepos.all(userId) as any[];
  const forceRefresh = req.query.refresh === 'true';

  if (cachedRows.length > 0 && !forceRefresh) {
    const cachedRepos = cachedRows.map(rowToRepo);
    // Return instant sub-millisecond cached result from SQLite
    res.json(cachedRepos);

    // Optional background synchronization if older than 5 mins
    const newestSync = cachedRows[0]?.synced_at || 0;
    if (Date.now() - newestSync > 5 * 60 * 1000) {
      setTimeout(async () => {
        try {
          const { repos } = await fetchReposGraphQL(token);
          if (repos.length > 0) {
            bulkUpsertRepos(repos, userId);
            indexReposEmbeddings(repos, userId);
          }
        } catch {
          // ignore background sync error
        }
      }, 50);
    }
    return;
  }

  try {
    let enrichedRepos: any[] = [];

    // Step 1: Attempt fast 1-roundtrip GraphQL query
    try {
      const graphqlResult = await fetchReposGraphQL(token, 5);
      if (graphqlResult.repos && graphqlResult.repos.length > 0) {
        enrichedRepos = graphqlResult.repos;
      }
    } catch (gqlErr) {
      console.warn('GraphQL fetch fallback to REST:', gqlErr);
    }

    // Step 2: Fallback to REST multi-page fetcher if GraphQL wasn't available
    if (enrichedRepos.length === 0) {
      const { items: repos } = await fetchAllPages(
        '/user/repos?sort=pushed&affiliation=owner,collaborator',
        token,
        5
      );

      enrichedRepos = await Promise.all(
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
    }

    // Step 3: Persist to SQLite & index embeddings in background
    if (enrichedRepos.length > 0) {
      bulkUpsertRepos(enrichedRepos, userId);
      indexReposEmbeddings(enrichedRepos, userId);
    }

    res.json(enrichedRepos);
  } catch (err: any) {
    // If GitHub fails but we have offline SQLite cache, serve it
    if (cachedRows.length > 0) {
      return res.json(cachedRows.map(rowToRepo));
    }
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
    HCL: { HCL: 412000, Shell: 18000, Makefile: 4000 },
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
  ];

  return { languages, totalBytes, contributors, recentCommits };
}

// 2. Get Repository Details (Languages breakdown, Contributors, Recent Commits) with ETag caching
reposRouter.get('/api/github/repos/:owner/:repo/details', async (req, res) => {
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

    const languages: Record<string, number> =
      langRes.status === 200 && typeof langRes.data === 'object' && !Array.isArray(langRes.data)
        ? langRes.data
        : {};

    const totalBytes = Object.values(languages).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);

    const contributors =
      contribRes.status === 200 && Array.isArray(contribRes.data)
        ? contribRes.data.map((c: any) => ({
            id: c.id,
            login: c.login,
            avatar_url: c.avatar_url,
            html_url: c.html_url,
            contributions: c.contributions,
            type: c.type,
          }))
        : [];

    const recentCommits =
      commitRes.status === 200 && Array.isArray(commitRes.data)
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
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete Repository (Destructive + SQLite Sync)
reposRouter.delete('/api/github/repos/:owner/:repo', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Please connect your GitHub account.' });
  }

  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);

  if (token === 'demo_token') {
    demoState.repos = demoState.repos.filter((r) => !(r.owner.login === owner && r.name === repo));
    stmts.deleteRepo.run(userId, owner, repo);
    return res.json({ success: true, message: `Repository ${owner}/${repo} was deleted from demo workspace.` });
  }

  try {
    const { data, status, scopes } = await callGitHubApi(`/repos/${owner}/${repo}`, token, {
      method: 'DELETE',
    });

    if (status === 204 || status === 200) {
      stmts.deleteRepo.run(userId, owner, repo);
      return res.json({ success: true, message: `Repository ${owner}/${repo} successfully deleted.` });
    }

    const hasDeleteScope = scopes.includes('delete_repo');

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
        activeScopes: scopes,
        needsReauth: true,
      });
    }

    if (status === 404) {
      return res.status(404).json({
        error: 'Repository not found or token lacks permissions (GitHub returns 404 if delete_repo scope is missing).',
        details: data,
        hasDeleteScope,
        activeScopes: scopes,
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

// 4. Update / Toggle Archive Repository + SQLite Sync
reposRouter.patch('/api/github/repos/:owner/:repo', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;
  const { archived, description } = req.body;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });
  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);

  if (token === 'demo_token') {
    const found = demoState.repos.find((r) => r.owner.login === owner && r.name === repo);
    if (found) {
      if (typeof archived === 'boolean') {
        found.archived = archived;
        stmts.updateRepoArchived.run(archived ? 1 : 0, new Date().toISOString(), userId, owner, repo);
      }
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
      if (typeof archived === 'boolean') {
        stmts.updateRepoArchived.run(archived ? 1 : 0, new Date().toISOString(), userId, owner, repo);
      }
      return res.json(data);
    }

    return res.status(status).json({ error: 'Failed to update repository', details: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Batch Delete Repositories + SQLite Sync
reposRouter.post('/api/github/repos/batch-delete', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { repos } = req.body; // Array of { owner: string, repo: string }

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });
  if (!Array.isArray(repos) || repos.length === 0) {
    return res.status(400).json({ error: 'Array of repositories is required.' });
  }

  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);

  if (token === 'demo_token') {
    const toDeleteSet = new Set(repos.map((r) => `${r.owner}/${r.repo}`));
    demoState.repos = demoState.repos.filter((r) => !toDeleteSet.has(`${r.owner.login}/${r.name}`));
    for (const r of repos) {
      stmts.deleteRepo.run(userId, r.owner, r.repo);
    }
    return res.json({
      success: true,
      deleted: repos.length,
      results: repos.map((r) => ({ ...r, success: true })),
    });
  }

  const results = [];
  for (const { owner, repo } of repos) {
    try {
      const { status, data } = await callGitHubApi(`/repos/${owner}/${repo}`, token, {
        method: 'DELETE',
      });
      if (status === 204 || status === 200) {
        stmts.deleteRepo.run(userId, owner, repo);
        results.push({ owner, repo, success: true });
      } else {
        results.push({ owner, repo, success: false, error: data?.message || `Status ${status}` });
      }
    } catch (e: any) {
      results.push({ owner, repo, success: false, error: e.message });
    }
  }

  res.json({
    success: true,
    total: repos.length,
    deleted: results.filter((r) => r.success).length,
    results,
  });
});

// 6. Batch Archive Repositories + SQLite Sync
reposRouter.post('/api/github/repos/batch-archive', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { repos, archived = true } = req.body; // Array of { owner: string, repo: string }

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });
  if (!Array.isArray(repos) || repos.length === 0) {
    return res.status(400).json({ error: 'Array of repositories is required.' });
  }

  const userId = token === 'demo_token' ? 'demo_user' : token.slice(-8);

  if (token === 'demo_token') {
    const toArchiveSet = new Set(repos.map((r) => `${r.owner}/${r.repo}`));
    demoState.repos.forEach((r) => {
      if (toArchiveSet.has(`${r.owner.login}/${r.name}`)) {
        r.archived = archived;
      }
    });
    for (const r of repos) {
      stmts.updateRepoArchived.run(archived ? 1 : 0, new Date().toISOString(), userId, r.owner, r.repo);
    }
    return res.json({
      success: true,
      updated: repos.length,
      results: repos.map((r) => ({ ...r, success: true })),
    });
  }

  const results = [];
  for (const { owner, repo } of repos) {
    try {
      const { status, data } = await callGitHubApi(`/repos/${owner}/${repo}`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      if (status === 200) {
        stmts.updateRepoArchived.run(archived ? 1 : 0, new Date().toISOString(), userId, owner, repo);
        results.push({ owner, repo, success: true });
      } else {
        results.push({ owner, repo, success: false, error: data?.message || `Status ${status}` });
      }
    } catch (e: any) {
      results.push({ owner, repo, success: false, error: e.message });
    }
  }

  res.json({
    success: true,
    total: repos.length,
    updated: results.filter((r) => r.success).length,
    results,
  });
});
