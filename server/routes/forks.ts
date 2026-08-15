import { Router } from 'express';
import { getGitHubToken, callGitHubApi } from '../utils/githubApi.js';
import { db, stmts } from '../db/database.js';

export const forksRouter = Router();

// 1. Compare fork with upstream parent (SQLite Cached + ETag)
forksRouter.get('/api/github/forks/:owner/:repo/compare', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;
  const forceRefresh = req.query.force === 'true';

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
        html_url: 'https://github.com/fastapi/fastapi/compare/master...octo-developer:fastapi:master',
      });
    }
    return res.json({
      status: 'up_to_date',
      behind_by: 0,
      ahead_by: 0,
      parent_full_name: `${owner}/${repo}`,
      parent_branch: 'main',
      fork_branch: 'main',
      html_url: `https://github.com/${owner}/${repo}`,
    });
  }

  const userId = token.slice(-8);

  try {
    // 1. Fast Path: Check if repository info and parent info exist in SQLite
    const repoRow = db
      .prepare('SELECT * FROM repositories WHERE user_id = ? AND owner_login = ? AND name = ?')
      .get(userId, owner, repo) as any;

    let parentOwner = repoRow?.parent_owner_login;
    let parentRepo = repoRow?.parent_name;
    let parentFullName = repoRow?.parent_full_name;
    let parentBranch = repoRow?.parent_branch || 'main';
    let forkBranch = repoRow?.default_branch || 'main';

    // If drift status is already cached and recent (< 30 mins) and not force refresh, return it instantly with 0 API calls
    if (
      repoRow &&
      repoRow.drift_status &&
      repoRow.synced_at &&
      Date.now() - repoRow.synced_at < 30 * 60 * 1000 &&
      !forceRefresh
    ) {
      return res.json({
        status: repoRow.drift_status,
        behind_by: repoRow.behind_by || 0,
        ahead_by: repoRow.ahead_by || 0,
        parent_full_name: parentFullName,
        parent_branch: parentBranch,
        fork_branch: forkBranch,
        html_url: parentFullName ? `https://github.com/${parentFullName}/compare/${parentBranch}...${owner}:${forkBranch}` : undefined,
        cached: true,
      });
    }

    // 2. If parent info wasn't in SQLite, fetch repository metadata once with ETag caching
    if (!parentOwner || !parentRepo) {
      const { data: repoData, status: repoStatus } = await callGitHubApi(`/repos/${owner}/${repo}`, token);
      if (repoStatus !== 200 || !repoData) {
        return res.status(repoStatus).json({ error: 'Repository not found or inaccessible.' });
      }

      if (!repoData.fork || !repoData.parent) {
        return res.status(400).json({ error: 'This repository is not a fork or parent info is unavailable.' });
      }

      const parent = repoData.parent;
      parentOwner = parent.owner.login;
      parentRepo = parent.name;
      parentFullName = parent.full_name;
      parentBranch = parent.default_branch || 'main';
      forkBranch = repoData.default_branch || 'main';
    }

    // 3. GitHub compare API with ETag caching: GET /repos/{parent_owner}/{parent_repo}/compare/{parent_branch}...{fork_owner}:{fork_branch}
    const compareEndpoint = `/repos/${parentOwner}/${parentRepo}/compare/${parentBranch}...${owner}:${forkBranch}`;
    const { data: compareData, status: compareStatus } = await callGitHubApi(compareEndpoint, token, {}, 30 * 60 * 1000);

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

    // Update SQLite drift status
    if (repoRow?.id) {
      stmts.updateForkStatus.run({
        behind_by: compareData.behind_by || 0,
        ahead_by: compareData.ahead_by || 0,
        drift_status: syncStatus,
        synced_at: Date.now(),
        user_id: userId,
        id: repoRow.id,
      });
    }

    res.json({
      status: syncStatus,
      behind_by: compareData.behind_by || 0,
      ahead_by: compareData.ahead_by || 0,
      parent_full_name: parentFullName,
      parent_branch: parentBranch,
      fork_branch: forkBranch,
      html_url: compareData.html_url,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Single-Click Sync Fork with Upstream
forksRouter.post('/api/github/forks/:owner/:repo/sync', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;
  const { branch } = req.body;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json({
      message: `Successfully fast-forwarded branch '${branch || 'master'}' with upstream.`,
      merge_type: 'fast-forward',
      base_branch: branch || 'master',
    });
  }

  const userId = token.slice(-8);

  try {
    const targetBranch = branch || 'main';
    // GitHub API: POST /repos/{owner}/{repo}/merge-upstream
    const { data, status } = await callGitHubApi(`/repos/${owner}/${repo}/merge-upstream`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch: targetBranch }),
    });

    if (status === 200 || status === 201) {
      // Update SQLite fork status to in-sync
      db.prepare(`
        UPDATE repositories 
        SET behind_by = 0, drift_status = 'up_to_date', pushed_at = ?, synced_at = ?
        WHERE user_id = ? AND owner_login = ? AND name = ?
      `).run(new Date().toISOString(), Date.now(), userId, owner, repo);

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
