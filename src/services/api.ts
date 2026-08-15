import { 
  AuthSession, 
  GitHubRepo, 
  RepoDetailsData, 
  ForkSyncStatus, 
  BranchInfo, 
  RepoReleasesData, 
  IssueOrPrInfo 
} from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  auth: {
    async getSession(): Promise<AuthSession> {
      const res = await fetch('/api/auth/session');
      return handleResponse<AuthSession>(res);
    },
    async getOAuthUrl(): Promise<{ url: string; needs_credentials?: boolean }> {
      const res = await fetch('/api/auth/url');
      return handleResponse<{ url: string; needs_credentials?: boolean }>(res);
    },
    async loginPat(token: string): Promise<{ success: boolean; user: any; scopes: string[] }> {
      const res = await fetch('/api/auth/pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return handleResponse(res);
    },
    async loginDemo(): Promise<{ success: boolean; user: any; scopes: string[] }> {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      return handleResponse(res);
    },
    async logout(): Promise<{ success: boolean }> {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      return handleResponse(res);
    },
  },

  repos: {
    async getRepos(): Promise<GitHubRepo[]> {
      const res = await fetch('/api/github/repos');
      return handleResponse<GitHubRepo[]>(res);
    },
    async getDetails(owner: string, repo: string): Promise<RepoDetailsData> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}/details`);
      return handleResponse<RepoDetailsData>(res);
    },
    async toggleArchive(owner: string, repo: string, archived: boolean): Promise<GitHubRepo> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      return handleResponse<GitHubRepo>(res);
    },
    async deleteRepo(owner: string, repo: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}`, {
        method: 'DELETE',
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },
    async batchDelete(repos: Array<{ owner: string; repo: string }>): Promise<{
      success: boolean;
      total: number;
      deleted: number;
      results: Array<{ owner: string; repo: string; success: boolean; error?: string }>;
    }> {
      const res = await fetch('/api/github/repos/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repos }),
      });
      return handleResponse(res);
    },
    async batchArchive(repos: Array<{ owner: string; repo: string }>, archived = true): Promise<{
      success: boolean;
      total: number;
      updated: number;
      results: Array<{ owner: string; repo: string; success: boolean; error?: string }>;
    }> {
      const res = await fetch('/api/github/repos/batch-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repos, archived }),
      });
      return handleResponse(res);
    },
  },

  forks: {
    async compare(owner: string, repo: string): Promise<ForkSyncStatus> {
      const res = await fetch(`/api/github/forks/${owner}/${repo}/compare`);
      return handleResponse<ForkSyncStatus>(res);
    },
    async sync(owner: string, repo: string, branch?: string): Promise<{
      message: string;
      merge_type?: string;
      base_branch?: string;
    }> {
      const res = await fetch(`/api/github/forks/${owner}/${repo}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      });
      return handleResponse(res);
    },
  },

  branches: {
    async getBranches(owner: string, repo: string): Promise<BranchInfo[]> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}/branches`);
      return handleResponse<BranchInfo[]>(res);
    },
    async deleteBranch(owner: string, repo: string, branch: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`, {
        method: 'DELETE',
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },
    async pruneMerged(owner: string, repo: string, branchNames: string[]): Promise<{
      success: boolean;
      total: number;
      deleted: number;
      results: Array<{ name: string; success: boolean; error?: string }>;
    }> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}/branches/prune-merged`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchNames }),
      });
      return handleResponse(res);
    },
  },

  releases: {
    async getReleases(owner: string, repo: string): Promise<RepoReleasesData> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}/releases`);
      return handleResponse<RepoReleasesData>(res);
    },
  },

  issues: {
    async getIssuesAndPrs(owner: string, repo: string): Promise<IssueOrPrInfo[]> {
      const res = await fetch(`/api/github/repos/${owner}/${repo}/issues-and-prs`);
      return handleResponse<IssueOrPrInfo[]>(res);
    },
  },

  starred: {
    async getStarred(): Promise<GitHubRepo[]> {
      const res = await fetch('/api/github/starred');
      return handleResponse<GitHubRepo[]>(res);
    },
    async unstar(owner: string, repo: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/github/starred/${owner}/${repo}`, {
        method: 'DELETE',
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },
  },

  search: {
    async query(q: string, mode: 'hybrid' | 'fts' | 'semantic' = 'hybrid', limit = 50): Promise<{
      query: string;
      mode: 'hybrid' | 'fts' | 'semantic';
      latencyMs: number;
      total: number;
      results: GitHubRepo[];
    }> {
      const params = new URLSearchParams({
        q,
        mode,
        limit: limit.toString(),
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      return handleResponse(res);
    },
    async reindex(): Promise<{ success: boolean; message: string; count: number }> {
      const res = await fetch('/api/search/reindex', { method: 'POST' });
      return handleResponse(res);
    },
  },
};
