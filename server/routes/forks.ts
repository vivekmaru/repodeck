import { Router } from 'express';
import { getGitHubToken, callGitHubApi } from '../utils/githubApi.js';

export const forksRouter = Router();

// 1. Compare fork with upstream parent
forksRouter.get('/api/github/forks/:owner/:repo/compare', async (req, res) => {
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

  try {
    // 1. Get repository metadata to discover parent
    const { data: repoData, status: repoStatus } = await callGitHubApi(`/repos/${owner}/${repo}`, token);
    if (repoStatus !== 200 || !repoData) {
      return res.status(repoStatus).json({ error: 'Repository not found or inaccessible.' });
    }

    if (!repoData.fork || !repoData.parent) {
      return res.status(400).json({ error: 'This repository is not a fork or parent info is unavailable.' });
    }

    const parent = repoData.parent;
    const parentOwner = parent.owner.login;
    const parentRepo = parent.name;
    const parentBranch = parent.default_branch || 'main';
    const forkBranch = repoData.default_branch || 'main';

    // 2. GitHub compare API: GET /repos/{parent_owner}/{parent_repo}/compare/{parent_branch}...{fork_owner}:{fork_branch}
    const compareEndpoint = `/repos/${parentOwner}/${parentRepo}/compare/${parentBranch}...${owner}:${forkBranch}`;
    const { data: compareData, status: compareStatus } = await callGitHubApi(compareEndpoint, token);

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
