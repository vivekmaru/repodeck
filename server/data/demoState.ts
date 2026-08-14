export interface DemoBranch {
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

export interface DemoRelease {
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
  assets: Array<{
    id: number;
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
    content_type: string;
  }>;
}

export interface DemoIssueOrPr {
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

export function getDemoSession() {
  const user = {
    login: 'octo-developer',
    id: 12345678,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    html_url: 'https://github.com/octo-developer',
    name: 'Alex Rivera',
    company: 'CloudScale Labs',
    blog: 'https://alexrivera.dev',
    location: 'San Francisco, CA',
    email: 'alex.rivera@example.com',
    bio: 'Distributed systems engineer, open-source enthusiast, and Kubernetes explorer.',
    public_repos: 14,
    total_private_repos: 3,
    followers: 142,
    following: 68,
    created_at: '2021-03-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  };

  const repos = [
    {
      id: 101,
      node_id: 'R_101',
      name: 'kubernetes-cron-controller',
      full_name: 'octo-developer/kubernetes-cron-controller',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/kubernetes-cron-controller',
      description: 'High performance Kubernetes custom controller for advanced schedule-based workload orchestration.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/kubernetes-cron-controller',
      created_at: '2023-01-10T12:00:00Z',
      updated_at: '2026-08-10T09:20:00Z',
      pushed_at: '2026-08-12T14:30:00Z',
      homepage: 'https://k8s-cron.dev',
      size: 4520,
      stargazers_count: 320,
      watchers_count: 320,
      language: 'Go',
      forks_count: 42,
      open_issues_count: 5,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['kubernetes', 'controller', 'go', 'cloud-native', 'devops'],
    },
    {
      id: 102,
      node_id: 'R_102',
      name: 'harness-cd-pipeline-templates',
      full_name: 'octo-developer/harness-cd-pipeline-templates',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/harness-cd-pipeline-templates',
      description: 'Reusable CI/CD pipeline step templates and custom plugins for modern GitOps deployments.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/harness-cd-pipeline-templates',
      created_at: '2023-08-20T10:00:00Z',
      updated_at: '2026-07-28T16:45:00Z',
      pushed_at: '2026-07-28T16:45:00Z',
      homepage: null,
      size: 1820,
      stargazers_count: 85,
      watchers_count: 85,
      language: 'TypeScript',
      forks_count: 12,
      open_issues_count: 2,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['harness', 'cicd', 'gitops', 'devops', 'pipelines'],
    },
    {
      id: 103,
      node_id: 'R_103',
      name: 'fastapi',
      full_name: 'octo-developer/fastapi',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/fastapi',
      description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production',
      fork: true,
      parent: {
        name: 'fastapi',
        full_name: 'fastapi/fastapi',
        html_url: 'https://github.com/fastapi/fastapi',
        default_branch: 'master',
        owner: {
          login: 'fastapi',
          avatar_url: 'https://avatars.githubusercontent.com/u/102987781?v=4',
          html_url: 'https://github.com/fastapi',
        },
      },
      url: 'https://api.github.com/repos/octo-developer/fastapi',
      created_at: '2024-02-14T08:00:00Z',
      updated_at: '2026-06-15T11:20:00Z',
      pushed_at: '2026-06-15T11:20:00Z',
      homepage: 'https://fastapi.tiangolo.com/',
      size: 14200,
      stargazers_count: 3,
      watchers_count: 3,
      language: 'Python',
      forks_count: 0,
      open_issues_count: 0,
      default_branch: 'master',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['python', 'api', 'async', 'pydantic'],
    },
    {
      id: 104,
      node_id: 'R_104',
      name: 'infra-tf-aws-platform',
      full_name: 'octo-developer/infra-tf-aws-platform',
      private: true,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/infra-tf-aws-platform',
      description: 'Production multi-region AWS Terraform infrastructure as code with automated zero-trust VPC peering.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/infra-tf-aws-platform',
      created_at: '2023-04-12T14:10:00Z',
      updated_at: '2026-08-01T18:30:00Z',
      pushed_at: '2026-08-01T18:30:00Z',
      homepage: null,
      size: 6100,
      stargazers_count: 0,
      watchers_count: 0,
      language: 'HCL',
      forks_count: 0,
      open_issues_count: 1,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'private',
      topics: ['terraform', 'aws', 'infrastructure', 'security'],
    },
    {
      id: 105,
      node_id: 'R_105',
      name: 'legacy-php-billing-engine',
      full_name: 'octo-developer/legacy-php-billing-engine',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/legacy-php-billing-engine',
      description: 'Deprecated monolithic billing microservice with Stripe v2 integration. Retained for historical audit.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/legacy-php-billing-engine',
      created_at: '2021-06-01T09:00:00Z',
      updated_at: '2024-03-10T12:00:00Z',
      pushed_at: '2024-03-10T12:00:00Z',
      homepage: null,
      size: 28400,
      stargazers_count: 14,
      watchers_count: 14,
      language: 'PHP',
      forks_count: 2,
      open_issues_count: 0,
      default_branch: 'master',
      archived: true,
      disabled: false,
      visibility: 'public',
      topics: ['php', 'billing', 'deprecated', 'legacy'],
    },
    {
      id: 106,
      node_id: 'R_106',
      name: 'abandoned-crypto-trader-bot',
      full_name: 'octo-developer/abandoned-crypto-trader-bot',
      private: false,
      owner: { login: 'octo-developer', id: 12345678, avatar_url: user.avatar_url, html_url: user.html_url },
      html_url: 'https://github.com/octo-developer/abandoned-crypto-trader-bot',
      description: 'Experimental automated order book market maker bot for Uniswap v2 pools. Idle since early 2023.',
      fork: false,
      url: 'https://api.github.com/repos/octo-developer/abandoned-crypto-trader-bot',
      created_at: '2022-11-04T16:00:00Z',
      updated_at: '2023-05-18T10:30:00Z',
      pushed_at: '2023-05-18T10:30:00Z',
      homepage: null,
      size: 18900,
      stargazers_count: 7,
      watchers_count: 7,
      language: 'Rust',
      forks_count: 1,
      open_issues_count: 3,
      default_branch: 'main',
      archived: false,
      disabled: false,
      visibility: 'public',
      topics: ['rust', 'crypto', 'uniswap', 'trading'],
    },
  ];

  const starred = [
    {
      id: 901,
      name: 'shadcn-ui',
      full_name: 'shadcn-ui/ui',
      owner: { login: 'shadcn-ui', avatar_url: 'https://avatars.githubusercontent.com/u/139895814?v=4', html_url: 'https://github.com/shadcn-ui' },
      html_url: 'https://github.com/shadcn-ui/ui',
      description: 'Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open Source.',
      stargazers_count: 64200,
      forks_count: 5800,
      language: 'TypeScript',
      topics: ['components', 'react', 'tailwind', 'radix-ui'],
      updated_at: '2026-08-14T02:00:00Z',
    },
    {
      id: 902,
      name: 'tokio',
      full_name: 'tokio-rs/tokio',
      owner: { login: 'tokio-rs', avatar_url: 'https://avatars.githubusercontent.com/u/315810?v=4', html_url: 'https://github.com/tokio-rs' },
      html_url: 'https://github.com/tokio-rs/tokio',
      description: 'A runtime for writing reliable, asynchronous, and slim applications with the Rust programming language.',
      stargazers_count: 27100,
      forks_count: 2400,
      language: 'Rust',
      topics: ['async', 'rust', 'network', 'tokio'],
      updated_at: '2026-08-13T19:45:00Z',
    },
  ];

  return { user, repos, starred };
}

// In-memory demo state instance
export let demoState = getDemoSession();

export function resetDemoState() {
  demoState = getDemoSession();
  return demoState;
}

// Generate demo branches with merged, stale, active flags
export function getDemoBranches(owner: string, repo: string): DemoBranch[] {
  const isK8s = repo === 'kubernetes-cron-controller';
  const defaultBranch = repo === 'legacy-php-billing-engine' || repo === 'fastapi' ? 'master' : 'main';

  return [
    {
      name: defaultBranch,
      commit: {
        sha: 'a7b3c9f2e1d08c5a4b6e7f8d9c0a1b2c3d4e5f6a',
        commit: {
          message: 'feat: optimize controller queue synchronization',
          author: { name: owner, date: new Date().toISOString() },
        },
      },
      protected: true,
      is_default: true,
      is_merged: true,
      is_stale: false,
      ahead_by: 0,
      behind_by: 0,
    },
    {
      name: 'feat/v2-dynamic-scheduler',
      commit: {
        sha: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
        commit: {
          message: 'feat: add CRD webhook admission validation',
          author: { name: owner, date: new Date(Date.now() - 86400000 * 3).toISOString() },
        },
      },
      protected: false,
      is_default: false,
      is_merged: false,
      is_stale: false,
      ahead_by: 4,
      behind_by: 1,
    },
    {
      name: 'fix/leader-election-timeout',
      commit: {
        sha: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
        commit: {
          message: 'fix: increase lease renewal grace period to 15s',
          author: { name: 'alex-engineer', date: new Date(Date.now() - 86400000 * 18).toISOString() },
        },
      },
      protected: false,
      is_default: false,
      is_merged: true, // Fully merged into default
      is_stale: false,
      ahead_by: 0,
      behind_by: 6,
    },
    {
      name: 'chore/update-k8s-client-1.30',
      commit: {
        sha: 'd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
        commit: {
          message: 'chore: bump k8s.io/client-go to v0.30.2',
          author: { name: 'renovate[bot]', date: new Date(Date.now() - 86400000 * 25).toISOString() },
        },
      },
      protected: false,
      is_default: false,
      is_merged: true, // Fully merged into default
      is_stale: false,
      ahead_by: 0,
      behind_by: 12,
    },
    {
      name: 'wip/legacy-grpc-telemetry',
      commit: {
        sha: 'e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
        commit: {
          message: 'wip: experimental otel proto collector pipeline',
          author: { name: 'sarah-dev', date: new Date(Date.now() - 86400000 * 140).toISOString() },
        },
      },
      protected: false,
      is_default: false,
      is_merged: false,
      is_stale: true, // Stale > 3 months (140 days)
      ahead_by: 2,
      behind_by: 48,
    },
  ];
}

// Generate demo releases with assets & download telemetry
export function getDemoReleases(owner: string, repo: string): DemoRelease[] {
  return [
    {
      id: 301,
      tag_name: 'v2.4.0',
      name: 'v2.4.0 - High Throughput Scheduler & CRD Webhooks',
      body: `### ✨ Features\n- Parallel queue dispatching with sub-millisecond jitter reduction\n- Zero-downtime leader transition failover\n\n### 🐛 Bug Fixes\n- Resolved race condition in concurrent worker termination\n- Corrected Prometheus gauge memory leak`,
      draft: false,
      prerelease: false,
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      published_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      author: {
        login: owner,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      html_url: `https://github.com/${owner}/${repo}/releases/tag/v2.4.0`,
      assets: [
        {
          id: 401,
          name: `${repo}_2.4.0_linux_amd64.tar.gz`,
          size: 18450000,
          download_count: 1420,
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v2.4.0/${repo}_2.4.0_linux_amd64.tar.gz`,
          content_type: 'application/gzip',
        },
        {
          id: 402,
          name: `${repo}_2.4.0_darwin_arm64.tar.gz`,
          size: 19120000,
          download_count: 890,
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v2.4.0/${repo}_2.4.0_darwin_arm64.tar.gz`,
          content_type: 'application/gzip',
        },
        {
          id: 403,
          name: 'checksums.txt',
          size: 1420,
          download_count: 430,
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v2.4.0/checksums.txt`,
          content_type: 'text/plain',
        },
      ],
    },
    {
      id: 302,
      tag_name: 'v2.3.1',
      name: 'v2.3.1 - Patch Release',
      body: `### 🛡️ Security & Performance\n- Updated client dependencies to patch CVE-2026-3810\n- Reduced CPU profile overhead during reconciliation spikes`,
      draft: false,
      prerelease: false,
      created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      published_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      author: {
        login: owner,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      html_url: `https://github.com/${owner}/${repo}/releases/tag/v2.3.1`,
      assets: [
        {
          id: 404,
          name: `${repo}_2.3.1_linux_amd64.tar.gz`,
          size: 18100000,
          download_count: 2840,
          browser_download_url: `https://github.com/${owner}/${repo}/releases/download/v2.3.1/${repo}_2.3.1_linux_amd64.tar.gz`,
          content_type: 'application/gzip',
        },
      ],
    },
  ];
}

// Generate demo issues and pull requests
export function getDemoIssuesAndPrs(owner: string, repo: string): DemoIssueOrPr[] {
  return [
    {
      id: 501,
      number: 48,
      title: 'feat(webhook): add admission validation for custom cron specs',
      state: 'open',
      is_pr: true,
      draft: false,
      html_url: `https://github.com/${owner}/${repo}/pull/48`,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      comments: 6,
      user: {
        login: 'alex-engineer',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      labels: [
        { id: 1, name: 'enhancement', color: 'a2eeef', description: 'New feature or request' },
        { id: 2, name: 'needs-review', color: 'fbca04', description: 'Ready for team review' },
      ],
    },
    {
      id: 502,
      number: 45,
      title: 'fix(reconciler): prevent panic when pod template spec is nil',
      state: 'open',
      is_pr: true,
      draft: true,
      html_url: `https://github.com/${owner}/${repo}/pull/45`,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      comments: 3,
      user: {
        login: 'sarah-dev',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
      labels: [
        { id: 3, name: 'bug', color: 'd73a4a', description: "Something isn't working" },
        { id: 4, name: 'work-in-progress', color: 'e4e669', description: 'Draft implementation' },
      ],
    },
    {
      id: 503,
      number: 42,
      title: 'Support Prometheus metric relabeling for namespace isolation',
      state: 'open',
      is_pr: false,
      html_url: `https://github.com/${owner}/${repo}/issues/42`,
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      comments: 8,
      user: {
        login: 'k8s-enthusiast',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      },
      labels: [
        { id: 5, name: 'observability', color: '5319e7', description: 'Metrics and telemetry' },
        { id: 6, name: 'help-wanted', color: '008672', description: 'Extra attention is needed' },
      ],
    },
    {
      id: 504,
      number: 39,
      title: 'High memory consumption under heavy batch scheduling spikes',
      state: 'open',
      is_pr: false,
      html_url: `https://github.com/${owner}/${repo}/issues/39`,
      created_at: new Date(Date.now() - 86400000 * 16).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      comments: 14,
      user: {
        login: 'devops-lead',
        avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
      },
      labels: [
        { id: 7, name: 'performance', color: 'ff7675', description: 'Performance optimization' },
        { id: 8, name: 'priority/high', color: 'b60205', description: 'Critical impact' },
      ],
    },
  ];
}
