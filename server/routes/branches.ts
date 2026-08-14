import { Router } from 'express';
import { getGitHubToken, callGitHubApi } from '../utils/githubApi.js';
import { getDemoBranches } from '../data/demoState.js';

export const branchesRouter = Router();

// 1. Get all branches with Stale & Merged status analysis
branchesRouter.get('/api/github/repos/:owner/:repo/branches', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json(getDemoBranches(owner, repo));
  }

  try {
    // 1. Get repo default branch
    const { data: repoData, status: repoStatus } = await callGitHubApi(`/repos/${owner}/${repo}`, token);
    if (repoStatus !== 200) {
      return res.status(repoStatus).json({ error: 'Failed to fetch repository info', details: repoData });
    }

    const defaultBranch = repoData.default_branch || 'main';

    // 2. Fetch list of branches
    const { data: rawBranches, status: branchStatus } = await callGitHubApi(
      `/repos/${owner}/${repo}/branches?per_page=100`,
      token
    );

    if (branchStatus !== 200 || !Array.isArray(rawBranches)) {
      return res.status(branchStatus).json({ error: 'Failed to fetch branches', details: rawBranches });
    }

    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    // 3. Enrich branches with commit date, ahead/behind telemetry & merged status
    const branches = await Promise.all(
      rawBranches.map(async (b: any) => {
        const isDefault = b.name === defaultBranch;
        let aheadBy = 0;
        let behindBy = 0;
        let isMerged = false;
        let commitDate = '';
        let commitMsg = '';
        let authorName = '';

        try {
          if (isDefault) {
            isMerged = true;
            aheadBy = 0;
            behindBy = 0;
            // Fetch default commit details
            const { data: commitData } = await callGitHubApi(`/repos/${owner}/${repo}/commits/${b.commit.sha}`, token);
            if (commitData && commitData.commit) {
              commitDate = commitData.commit.author?.date || commitData.commit.committer?.date || '';
              commitMsg = commitData.commit.message || '';
              authorName = commitData.commit.author?.name || commitData.author?.login || 'Unknown';
            }
          } else {
            // Compare with default branch: GET /repos/{owner}/{repo}/compare/{defaultBranch}...{branchName}
            const { data: compareData } = await callGitHubApi(
              `/repos/${owner}/${repo}/compare/${encodeURIComponent(defaultBranch)}...${encodeURIComponent(b.name)}`,
              token
            );

            if (compareData) {
              aheadBy = compareData.ahead_by || 0;
              behindBy = compareData.behind_by || 0;
              // If ahead_by is 0, all commits on this branch already exist on the default branch => Fully Merged!
              isMerged = aheadBy === 0;

              if (compareData.commits && compareData.commits.length > 0) {
                const lastCommit = compareData.commits[compareData.commits.length - 1];
                commitDate = lastCommit.commit?.author?.date || '';
                commitMsg = lastCommit.commit?.message || '';
                authorName = lastCommit.commit?.author?.name || lastCommit.author?.login || 'Unknown';
              }
            }

            // Fallback commit fetch if compare had 0 commits
            if (!commitDate) {
              const { data: commitData } = await callGitHubApi(`/repos/${owner}/${repo}/commits/${b.commit.sha}`, token);
              if (commitData && commitData.commit) {
                commitDate = commitData.commit.author?.date || commitData.commit.committer?.date || '';
                commitMsg = commitData.commit.message || '';
                authorName = commitData.commit.author?.name || commitData.author?.login || 'Unknown';
              }
            }
          }
        } catch (e) {
          // fallback gracefully
        }

        const commitTimestamp = commitDate ? new Date(commitDate).getTime() : Date.now();
        const isStale = !isDefault && commitTimestamp < ninetyDaysAgo;

        return {
          name: b.name,
          commit: {
            sha: b.commit.sha,
            commit: {
              message: commitMsg || 'Commit on ' + b.name,
              author: {
                name: authorName || 'Developer',
                date: commitDate || new Date().toISOString(),
              },
            },
          },
          protected: Boolean(b.protected),
          is_default: isDefault,
          is_merged: isMerged,
          is_stale: isStale,
          ahead_by: aheadBy,
          behind_by: behindBy,
        };
      })
    );

    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Delete a single branch
branchesRouter.delete('/api/github/repos/:owner/:repo/branches/:branch', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo, branch } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });

  if (token === 'demo_token') {
    return res.json({ success: true, message: `Branch '${branch}' deleted from demo repository.` });
  }

  try {
    // GitHub API: DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}
    const { status, data } = await callGitHubApi(
      `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
      token,
      { method: 'DELETE' }
    );

    if (status === 204 || status === 200) {
      return res.json({ success: true, message: `Branch '${branch}' successfully deleted.` });
    }

    return res.status(status).json({
      error: data?.message || `Failed to delete branch '${branch}'`,
      details: data,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Batch Prune All Merged Branches
branchesRouter.post('/api/github/repos/:owner/:repo/branches/prune-merged', async (req, res) => {
  const { token } = getGitHubToken(req);
  const { owner, repo } = req.params;
  const { branchNames } = req.body; // Array of branch names to prune

  if (!token) return res.status(401).json({ error: 'Unauthorized.' });
  if (!Array.isArray(branchNames) || branchNames.length === 0) {
    return res.status(400).json({ error: 'Array of branch names is required.' });
  }

  if (token === 'demo_token') {
    return res.json({
      success: true,
      total: branchNames.length,
      deleted: branchNames.length,
      results: branchNames.map((name) => ({ name, success: true })),
    });
  }

  const results = [];
  for (const name of branchNames) {
    try {
      const { status, data } = await callGitHubApi(
        `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(name)}`,
        token,
        { method: 'DELETE' }
      );
      if (status === 204 || status === 200) {
        results.push({ name, success: true });
      } else {
        results.push({ name, success: false, error: data?.message || `Status ${status}` });
      }
    } catch (e: any) {
      results.push({ name, success: false, error: e.message });
    }
  }

  res.json({
    success: true,
    total: branchNames.length,
    deleted: results.filter((r) => r.success).length,
    results,
  });
});
