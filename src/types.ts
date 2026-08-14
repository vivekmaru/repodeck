export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepoSummary {
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private' | 'internal';
  topics: string[];
  parent?: GitHubRepoSummary;
  source?: GitHubRepoSummary;
}

export type ActivityLevel = 'active' | 'warm' | 'cool' | 'stale' | 'dormant';

export interface ForkSyncStatus {
  parent_full_name: string;
  parent_branch: string;
  fork_branch: string;
  status: 'checking' | 'up_to_date' | 'behind' | 'ahead' | 'diverged' | 'error';
  behind_by: number;
  ahead_by: number;
  html_url?: string;
  error_message?: string;
  sync_in_progress?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface RepoLanguageBreakdown {
  [language: string]: number; // byte count
}

export interface RepoContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface RepoCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

export interface RepoDetailsData {
  languages: RepoLanguageBreakdown;
  contributors: RepoContributor[];
  recentCommits: RepoCommit[];
  totalBytes: number;
}

export interface BranchInfo {
  name: string;
  commit: {
    sha: string;
    commit: {
      message: string;
      author: {
        name: string;
        date: string;
      };
    };
  };
  protected: boolean;
  is_default: boolean;
  is_merged: boolean;
  is_stale: boolean;
  ahead_by: number;
  behind_by: number;
}

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
}

export interface ReleaseInfo {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  assets: ReleaseAsset[];
}

export interface ReleaseTag {
  name: string;
  commit: {
    sha: string;
  };
}

export interface RepoReleasesData {
  releases: ReleaseInfo[];
  tags: ReleaseTag[];
}

export interface IssueOrPrInfo {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  is_pr: boolean;
  draft?: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  comments: number;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
}

export type ThemeMode = 'light' | 'dark';

export interface AuthSession {
  authenticated: boolean;
  user: GitHubUser | null;
  scopes: string[];
  rateLimit: RateLimitInfo | null;
  authMethod: 'oauth' | 'pat' | 'demo' | null;
  clientIdConfigured: boolean;
}

export interface FilterOptions {
  search: string;
  visibility: 'all' | 'public' | 'private';
  type: 'all' | 'owned' | 'forked' | 'archived';
  activity: 'all' | ActivityLevel;
  language: string;
  sort: 'pushed_desc' | 'pushed_asc' | 'created_desc' | 'created_asc' | 'stars_desc' | 'name_asc' | 'size_desc';
}
