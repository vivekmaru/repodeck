import { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  GitFork, 
  Star, 
  Lock, 
  GitCommit, 
  Users, 
  Code2, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Terminal,
  AlertCircle,
  FolderGit2,
  GitBranch,
  Tag,
  Download,
  FileCode2,
  CircleDot,
  GitPullRequest,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitHubRepo, 
  RepoDetailsData, 
  BranchInfo, 
  RepoReleasesData, 
  IssueOrPrInfo 
} from '../types';
import { 
  formatAge, 
  formatRelativeTime, 
  getActivityLevel, 
  formatRepoSize, 
  getLanguageColor 
} from '../utils/github';
import { api } from '../services/api';

interface RepoDetailDrawerProps {
  repo: GitHubRepo | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteClick?: (repo: GitHubRepo) => void;
  onArchiveToggle?: (repo: GitHubRepo, newArchivedState: boolean) => Promise<void>;
  onSyncClick?: (repo: GitHubRepo) => void;
}

export function RepoDetailDrawer({
  repo,
  isOpen,
  onClose,
  onDeleteClick,
  onArchiveToggle,
  onSyncClick,
}: RepoDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'releases' | 'triage' | 'languages' | 'contributors' | 'commits'>('overview');
  
  // Details data
  const [details, setDetails] = useState<RepoDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Branches data
  const [branches, setBranches] = useState<BranchInfo[] | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchActionLoading, setBranchActionLoading] = useState<string | null>(null);
  const [pruneMergedLoading, setPruneMergedLoading] = useState(false);

  // Releases data
  const [releasesData, setReleasesData] = useState<RepoReleasesData | null>(null);
  const [releasesLoading, setReleasesLoading] = useState(false);

  // Triage (Issues & PRs) data
  const [issuesData, setIssuesData] = useState<IssueOrPrInfo[] | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [triageFilter, setTriageFilter] = useState<'all' | 'prs' | 'issues'>('all');

  const [copiedClone, setCopiedClone] = useState(false);

  // Fetch initial details and tab data
  useEffect(() => {
    if (!isOpen || !repo) return;

    let isMounted = true;
    setDetailsLoading(true);
    setDetailsError(null);

    api.repos.getDetails(repo.owner.login, repo.name)
      .then((data) => {
        if (isMounted) setDetails(data);
      })
      .catch((err: any) => {
        if (isMounted) setDetailsError(err.message || 'Failed to load details');
      })
      .finally(() => {
        if (isMounted) setDetailsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, repo]);

  // Load Tab Specific Data on Demand
  useEffect(() => {
    if (!isOpen || !repo) return;

    let isMounted = true;

    if (activeTab === 'branches' && !branches) {
      setBranchesLoading(true);
      api.branches.getBranches(repo.owner.login, repo.name)
        .then((b) => {
          if (isMounted) setBranches(b);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setBranchesLoading(false);
        });
    }

    if (activeTab === 'releases' && !releasesData) {
      setReleasesLoading(true);
      api.releases.getReleases(repo.owner.login, repo.name)
        .then((r) => {
          if (isMounted) setReleasesData(r);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setReleasesLoading(false);
        });
    }

    if (activeTab === 'triage' && !issuesData) {
      setIssuesLoading(true);
      api.issues.getIssuesAndPrs(repo.owner.login, repo.name)
        .then((i) => {
          if (isMounted) setIssuesData(i);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIssuesLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, repo, activeTab, branches, releasesData, issuesData]);

  // Reset tab cache when repo changes
  useEffect(() => {
    setBranches(null);
    setReleasesData(null);
    setIssuesData(null);
    setActiveTab('overview');
  }, [repo?.full_name]);

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!repo) return null;

  const activity = getActivityLevel(repo.pushed_at, repo.created_at);
  const age = formatAge(repo.created_at);
  const cloneUrl = `https://github.com/${repo.full_name}.git`;

  const copyCloneCommand = () => {
    navigator.clipboard.writeText(`git clone ${cloneUrl}`);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  // Branch operations
  const handleDeleteBranch = async (branchName: string) => {
    if (!confirm(`Are you sure you want to permanently delete branch "${branchName}"?`)) return;
    setBranchActionLoading(branchName);
    try {
      await api.branches.deleteBranch(repo.owner.login, repo.name, branchName);
      setBranches((prev) => (prev ? prev.filter((b) => b.name !== branchName) : []));
    } catch (err: any) {
      alert(`Failed to delete branch: ${err.message}`);
    } finally {
      setBranchActionLoading(null);
    }
  };

  const handlePruneMergedBranches = async () => {
    if (!branches) return;
    const mergedNonDefault = branches
      .filter((b) => b.is_merged && !b.is_default && !b.protected)
      .map((b) => b.name);

    if (mergedNonDefault.length === 0) return;
    if (!confirm(`Delete all ${mergedNonDefault.length} fully merged branch(es)?\n\n- ${mergedNonDefault.join('\n- ')}`)) {
      return;
    }

    setPruneMergedLoading(true);
    try {
      const res = await api.branches.pruneMerged(repo.owner.login, repo.name, mergedNonDefault);
      const deletedSet = new Set(res.results.filter((r) => r.success).map((r) => r.name));
      setBranches((prev) => (prev ? prev.filter((b) => !deletedSet.has(b.name)) : []));
    } catch (err: any) {
      alert(`Prune failed: ${err.message}`);
    } finally {
      setPruneMergedLoading(false);
    }
  };

  // Language percentage calculations
  const totalBytes = details?.totalBytes || 1;
  const languageList = details?.languages
    ? Object.entries(details.languages)
        .map(([name, bytes]) => ({
          name,
          bytes,
          percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
          color: getLanguageColor(name),
        }))
        .sort((a, b) => b.bytes - a.bytes)
    : [];

  const mergedCount = branches ? branches.filter((b) => b.is_merged && !b.is_default).length : 0;
  const staleCount = branches ? branches.filter((b) => b.is_stale && !b.is_default).length : 0;

  const filteredIssues = issuesData
    ? issuesData.filter((item) => {
        if (triageFilter === 'prs') return item.is_pr;
        if (triageFilter === 'issues') return !item.is_pr;
        return true;
      })
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="repo-detail-drawer-container" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-3xl bg-white dark:bg-[#161b22] border-l-[3px] border-[#1a1a1a] dark:border-[#30363d] shadow-[-10px_0_0_rgba(26,26,26,0.15)] flex flex-col h-full z-10 text-[#1a1a1a] dark:text-[#f0f6fc]"
          >
            {/* Drawer Header */}
            <div className="px-6 py-4.5 border-b-[3px] border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#0d1117] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a] shrink-0">
                  {repo.fork ? (
                    <GitFork className="w-5 h-5 stroke-[2.5]" />
                  ) : repo.private ? (
                    <Lock className="w-5 h-5 text-[#854d0e] dark:text-[#f0883e] stroke-[2.5]" />
                  ) : (
                    <FolderGit2 className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading text-xl font-extrabold text-[#1a1a1a] dark:text-[#f0f6fc] truncate tracking-tight">
                      {repo.name}
                    </h2>
                    {repo.private ? (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#ffcc5c]/30 text-[#854d0e] dark:text-[#f0883e] uppercase">
                        Private
                      </span>
                    ) : (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] uppercase">
                        Public
                      </span>
                    )}
                    {repo.fork && (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#4ecdc4]/20 text-[#0f766e] dark:text-[#39d353] uppercase">
                        Fork
                      </span>
                    )}
                    {repo.archived && (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-neutral-200 dark:bg-neutral-800 text-[#555] dark:text-neutral-400 uppercase">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="font-space text-xs font-bold text-[#666] dark:text-[#8b949e] truncate mt-0.5">
                    {repo.full_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open on GitHub"
                  className="p-2 rounded-xl bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white dark:bg-[#21262d] hover:bg-[#ff6b6b] hover:text-white border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Header */}
            <div className="px-6 py-2.5 bg-[#f8fafc] dark:bg-[#161b22] border-b-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'branches', label: 'Branches', icon: GitBranch, count: branches?.length },
                { id: 'releases', label: 'Releases & Tags', icon: Tag, count: releasesData?.releases?.length },
                { id: 'triage', label: 'Triage', icon: CircleDot, count: issuesData?.length },
                { id: 'languages', label: 'Languages', icon: Code2 },
                { id: 'contributors', label: 'Contributors', icon: Users, count: details?.contributors?.length },
                { id: 'commits', label: 'Commits', icon: GitCommit, count: details?.recentCommits?.length },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer border-2 ${
                      active
                        ? 'bg-[#1a1a1a] dark:bg-[#f0f6fc] text-white dark:text-[#1a1a1a] border-[#1a1a1a] dark:border-[#f0f6fc] shadow-[2px_2px_0_rgba(0,0,0,0.2)]'
                        : 'bg-white dark:bg-[#21262d] text-[#555] dark:text-[#8b949e] border-[#e2e8f0] dark:border-[#30363d] hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.label}</span>
                    {typeof t.count === 'number' && (
                      <span className={`text-[10px] font-space px-1.5 py-0.2 rounded ${
                        active ? 'bg-white/20 text-white dark:text-[#1a1a1a] dark:bg-black/10' : 'bg-black/5 dark:bg-white/10'
                      }`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Clone Bar */}
                  <div className="p-3.5 rounded-2xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Terminal className="w-4 h-4 text-[#666] dark:text-[#8b949e] shrink-0" />
                      <span className="font-space text-xs text-[#1a1a1a] dark:text-[#f0f6fc] truncate font-medium">
                        git clone {cloneUrl}
                      </span>
                    </div>
                    <button
                      onClick={copyCloneCommand}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-[#21262d] hover:bg-[#4ecdc4] dark:hover:bg-[#39d353] dark:hover:text-black border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a] flex items-center gap-1.5 shrink-0 transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      {copiedClone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{copiedClone ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Description */}
                  {repo.description && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a]">
                      <h4 className="text-xs font-bold text-[#666] dark:text-[#8b949e] uppercase font-space mb-1">
                        Description
                      </h4>
                      <p className="text-sm font-medium leading-relaxed">{repo.description}</p>
                    </div>
                  )}

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a]">
                      <span className="text-[11px] font-space font-bold text-[#666] dark:text-[#8b949e] uppercase block">Disk Size</span>
                      <span className="text-base font-extrabold font-space mt-1 block">{formatRepoSize(repo.size)}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a]">
                      <span className="text-[11px] font-space font-bold text-[#666] dark:text-[#8b949e] uppercase block">Stars</span>
                      <span className="text-base font-extrabold font-space mt-1 flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#ffcc5c] fill-[#ffcc5c]" />
                        {repo.stargazers_count}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a]">
                      <span className="text-[11px] font-space font-bold text-[#666] dark:text-[#8b949e] uppercase block">Forks</span>
                      <span className="text-base font-extrabold font-space mt-1 flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        {repo.forks_count}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a]">
                      <span className="text-[11px] font-space font-bold text-[#666] dark:text-[#8b949e] uppercase block">Open Issues</span>
                      <span className="text-base font-extrabold font-space mt-1 flex items-center gap-1">
                        <CircleDot className="w-4 h-4 text-[#4ecdc4]" />
                        {repo.open_issues_count}
                      </span>
                    </div>
                  </div>

                  {/* Activity & Lifecycle Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] space-y-3">
                    <h4 className="text-xs font-bold text-[#666] dark:text-[#8b949e] uppercase font-space">
                      Lifecycle & Activity Telemetry
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-space font-bold">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#161b22] border border-[#e2e8f0] dark:border-[#30363d]">
                        <span className="text-[#666] dark:text-[#8b949e] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Created:
                        </span>
                        <span>{age.label}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#161b22] border border-[#e2e8f0] dark:border-[#30363d]">
                        <span className="text-[#666] dark:text-[#8b949e] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Last Push:
                        </span>
                        <span>{formatRelativeTime(repo.pushed_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BRANCHES AUDITOR & CLEANER */}
              {activeTab === 'branches' && (
                <div className="space-y-4">
                  {/* Summary Bar with 1-Click Prune All Merged */}
                  <div className="p-4 rounded-2xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-space font-bold">
                        <GitBranch className="w-4 h-4" />
                        <span>Total: {branches?.length || 0}</span>
                      </div>
                      {mergedCount > 0 && (
                        <span className="text-xs font-space font-bold px-2 py-0.5 rounded-lg border border-[#1a1a1a] dark:border-[#30363d] bg-[#4ecdc4]/20 text-[#0f766e] dark:text-[#39d353]">
                          {mergedCount} Merged
                        </span>
                      )}
                      {staleCount > 0 && (
                        <span className="text-xs font-space font-bold px-2 py-0.5 rounded-lg border border-[#1a1a1a] dark:border-[#30363d] bg-[#ff6b6b]/20 text-[#b91c1c] dark:text-[#ff7b72]">
                          {staleCount} Stale (&gt;3m)
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handlePruneMergedBranches}
                      disabled={mergedCount === 0 || pruneMergedLoading}
                      className={`px-3 py-1.5 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0_#1a1a1a] transition ${
                        mergedCount > 0 && !pruneMergedLoading
                          ? 'bg-[#ff6b6b] text-white hover:bg-[#e05656] cursor-pointer active:translate-x-0.5 active:translate-y-0.5'
                          : 'bg-neutral-200 dark:bg-[#21262d] text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{pruneMergedLoading ? 'Pruning...' : `Prune ${mergedCount} Merged Branches`}</span>
                    </button>
                  </div>

                  {branchesLoading && (
                    <div className="p-8 text-center text-xs font-space font-bold text-[#666] dark:text-[#8b949e]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#4ecdc4]" />
                      Auditing repository branches against default branch...
                    </div>
                  )}

                  {/* Branches List */}
                  <div className="space-y-2.5">
                    {branches?.map((b) => (
                      <div
                        key={b.name}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-space text-sm font-extrabold text-[#1a1a1a] dark:text-[#f0f6fc] truncate">
                              {b.name}
                            </span>
                            {b.is_default && (
                              <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#ffcc5c] text-[#1a1a1a]">
                                DEFAULT
                              </span>
                            )}
                            {b.protected && (
                              <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                                PROTECTED
                              </span>
                            )}
                            {b.is_merged && !b.is_default && (
                              <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#4ecdc4]/20 text-[#0f766e] dark:text-[#39d353] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> MERGED
                              </span>
                            )}
                            {b.is_stale && !b.is_default && (
                              <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#ff6b6b]/20 text-[#b91c1c] dark:text-[#ff7b72] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> STALE (&gt;3M)
                              </span>
                            )}
                            {!b.is_default && !b.is_merged && (
                              <span className="text-[10px] font-space font-bold text-[#666] dark:text-[#8b949e]">
                                +{b.ahead_by} / -{b.behind_by}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-space text-[#666] dark:text-[#8b949e] mt-1 truncate">
                            <span className="truncate">{b.commit?.commit?.message}</span>
                            <span>•</span>
                            <span className="shrink-0">{formatRelativeTime(b.commit?.commit?.author?.date)}</span>
                          </div>
                        </div>

                        {!b.is_default && !b.protected && (
                          <button
                            onClick={() => handleDeleteBranch(b.name)}
                            disabled={branchActionLoading === b.name}
                            title="Delete branch"
                            className="p-2 rounded-xl bg-white dark:bg-[#161b22] hover:bg-[#ff6b6b] hover:text-white border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a] shrink-0 transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: RELEASES, TAGS & ASSETS */}
              {activeTab === 'releases' && (
                <div className="space-y-6">
                  {releasesLoading && (
                    <div className="p-8 text-center text-xs font-space font-bold text-[#666] dark:text-[#8b949e]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#4ecdc4]" />
                      Loading release assets and tags...
                    </div>
                  )}

                  {/* Releases Roster */}
                  {releasesData?.releases && releasesData.releases.length > 0 ? (
                    <div className="space-y-4">
                      {releasesData.releases.map((rel) => (
                        <div
                          key={rel.id}
                          className="p-4 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-xl bg-[#ffcc5c] text-[#1a1a1a] font-space font-extrabold text-xs border border-[#1a1a1a]">
                                {rel.tag_name}
                              </span>
                              <h3 className="font-heading font-extrabold text-sm text-[#1a1a1a] dark:text-[#f0f6fc]">
                                {rel.name}
                              </h3>
                            </div>
                            <span className="text-xs font-space text-[#666] dark:text-[#8b949e] shrink-0">
                              {formatRelativeTime(rel.published_at)}
                            </span>
                          </div>

                          {rel.body && (
                            <p className="text-xs font-sans text-[#555] dark:text-[#8b949e] line-clamp-3 whitespace-pre-wrap bg-[#f8fafc] dark:bg-[#161b22] p-2.5 rounded-xl border border-[#e2e8f0] dark:border-[#30363d]">
                              {rel.body}
                            </p>
                          )}

                          {/* Downloadable Assets */}
                          {rel.assets && rel.assets.length > 0 && (
                            <div className="space-y-1.5 pt-2">
                              <span className="text-[11px] font-space font-bold text-[#666] dark:text-[#8b949e] uppercase block">
                                Downloadable Assets ({rel.assets.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {rel.assets.map((asset) => (
                                  <a
                                    key={asset.id}
                                    href={asset.browser_download_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#161b22] hover:bg-[#fffef2] dark:hover:bg-[#30363d] border border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-between gap-2 text-xs font-space transition"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileCode2 className="w-4 h-4 text-[#4ecdc4] shrink-0" />
                                      <span className="truncate font-bold">{asset.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#666] dark:text-[#8b949e] shrink-0">
                                      <span>{formatRepoSize(Math.round(asset.size / 1024))}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-0.5">
                                        <Download className="w-3 h-3" />
                                        {asset.download_count}
                                      </span>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    !releasesLoading && (
                      <div className="p-8 text-center text-xs font-space font-bold text-[#666] dark:text-[#8b949e] bg-white dark:bg-[#21262d] rounded-2xl border-2 border-[#1a1a1a] dark:border-[#30363d]">
                        No formal releases published for this repository yet.
                      </div>
                    )
                  )}

                  {/* Tags Roster */}
                  {releasesData?.tags && releasesData.tags.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] space-y-2">
                      <h4 className="text-xs font-bold text-[#666] dark:text-[#8b949e] uppercase font-space">
                        Git Tags ({releasesData.tags.length})
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {releasesData.tags.map((tag) => (
                          <span
                            key={tag.name}
                            className="px-2.5 py-1 rounded-xl bg-[#f8fafc] dark:bg-[#161b22] border border-[#1a1a1a] dark:border-[#30363d] text-xs font-space font-bold"
                          >
                            <Tag className="w-3 h-3 inline-block mr-1 text-[#ff6b6b]" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TRIAGE (ISSUES & PRS) */}
              {activeTab === 'triage' && (
                <div className="space-y-4">
                  {/* Filter Switcher */}
                  <div className="flex items-center gap-2 bg-[#f8fafc] dark:bg-[#0d1117] p-1.5 rounded-2xl border-2 border-[#1a1a1a] dark:border-[#30363d]">
                    {(['all', 'prs', 'issues'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTriageFilter(f)}
                        className={`flex-1 py-1.5 rounded-xl font-space font-bold text-xs capitalize transition cursor-pointer ${
                          triageFilter === f
                            ? 'bg-[#1a1a1a] dark:bg-[#f0f6fc] text-white dark:text-[#1a1a1a] shadow-[2px_2px_0_rgba(0,0,0,0.2)]'
                            : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a]'
                        }`}
                      >
                        {f === 'all' ? 'All Items' : f === 'prs' ? 'Pull Requests' : 'Issues'}
                      </button>
                    ))}
                  </div>

                  {issuesLoading && (
                    <div className="p-8 text-center text-xs font-space font-bold text-[#666] dark:text-[#8b949e]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#4ecdc4]" />
                      Fetching open issues and pull requests...
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2.5">
                    {filteredIssues.map((item) => (
                      <a
                        key={item.id}
                        href={item.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] flex items-start justify-between gap-3 block transition"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.is_pr ? (
                              <span className="text-xs font-space font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                <GitPullRequest className="w-3 h-3" /> PR #{item.number}
                              </span>
                            ) : (
                              <span className="text-xs font-space font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                <CircleDot className="w-3 h-3" /> #{item.number}
                              </span>
                            )}
                            <h4 className="font-heading font-extrabold text-sm truncate">{item.title}</h4>
                          </div>

                          {/* Labels */}
                          {item.labels && item.labels.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.labels.map((l) => (
                                <span
                                  key={l.id}
                                  className="text-[10px] font-space font-bold px-2 py-0.5 rounded border border-[#1a1a1a]/20"
                                  style={{ backgroundColor: `#${l.color}25`, color: `#${l.color}` }}
                                >
                                  {l.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="text-[11px] font-space text-[#666] dark:text-[#8b949e] flex items-center gap-2">
                            <span>@{item.user.login}</span>
                            <span>•</span>
                            <span>Updated {formatRelativeTime(item.updated_at)}</span>
                          </div>
                        </div>

                        {item.comments > 0 && (
                          <span className="text-xs font-space font-bold px-2 py-1 rounded-xl bg-[#f8fafc] dark:bg-[#161b22] border border-[#1a1a1a] dark:border-[#30363d] flex items-center gap-1 shrink-0">
                            <MessageSquare className="w-3 h-3" />
                            {item.comments}
                          </span>
                        )}
                      </a>
                    ))}

                    {filteredIssues.length === 0 && !issuesLoading && (
                      <div className="p-8 text-center text-xs font-space font-bold text-[#666] dark:text-[#8b949e] bg-white dark:bg-[#21262d] rounded-2xl border-2 border-[#1a1a1a] dark:border-[#30363d]">
                        No matching open issues or pull requests.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: LANGUAGES */}
              {activeTab === 'languages' && (
                <div className="space-y-4">
                  {/* Segmented Color Bar */}
                  {languageList.length > 0 && (
                    <div className="h-4 w-full rounded-xl overflow-hidden flex border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a]">
                      {languageList.map((lang) => (
                        <div
                          key={lang.name}
                          style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                          title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Language Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {languageList.map((lang) => (
                      <div
                        key={lang.name}
                        className="p-3 rounded-2xl bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.color }} />
                          <span className="font-heading font-extrabold text-sm">{lang.name}</span>
                        </div>
                        <div className="font-space text-xs font-bold text-[#666] dark:text-[#8b949e]">
                          {lang.percentage.toFixed(1)}% ({formatRepoSize(Math.round(lang.bytes / 1024))})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CONTRIBUTORS */}
              {activeTab === 'contributors' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {details?.contributors?.map((c) => (
                    <a
                      key={c.id}
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-2xl bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={c.avatar_url} alt={c.login} className="w-9 h-9 rounded-xl border border-[#1a1a1a] dark:border-[#30363d]" />
                        <div className="min-w-0">
                          <span className="font-heading font-extrabold text-sm truncate block">{c.login}</span>
                          <span className="text-[10px] font-space text-[#666] dark:text-[#8b949e] uppercase">{c.type}</span>
                        </div>
                      </div>
                      <span className="text-xs font-space font-extrabold px-2 py-1 rounded-lg bg-[#4ecdc4]/20 text-[#0f766e] dark:text-[#39d353]">
                        {c.contributions} commits
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* TAB 7: COMMITS STREAM */}
              {activeTab === 'commits' && (
                <div className="space-y-3">
                  {details?.recentCommits?.map((cm) => (
                    <a
                      key={cm.sha}
                      href={cm.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] flex items-start justify-between gap-3 block transition"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-heading font-bold text-sm leading-snug">{cm.commit.message}</p>
                        <div className="flex items-center gap-2 text-xs font-space text-[#666] dark:text-[#8b949e]">
                          <span>{cm.commit.author.name}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(cm.commit.author.date)}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-space font-bold px-2 py-1 rounded-lg bg-[#f8fafc] dark:bg-[#161b22] border border-[#1a1a1a] dark:border-[#30363d] shrink-0">
                        {cm.sha.substring(0, 7)}
                      </span>
                    </a>
                  ))}
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t-[3px] border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#0d1117] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {onArchiveToggle && (
                  <button
                    onClick={() => onArchiveToggle(repo, !repo.archived)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#21262d] hover:bg-[#ffcc5c] dark:hover:bg-[#f0883e] dark:hover:text-black border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a] flex items-center gap-1.5 transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    {repo.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    <span>{repo.archived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                )}

                {repo.fork && onSyncClick && (
                  <button
                    onClick={() => onSyncClick(repo)}
                    className="px-3.5 py-2 rounded-xl bg-[#4ecdc4] hover:bg-[#3dbdb4] border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-bold text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] flex items-center gap-1.5 transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Fork</span>
                  </button>
                )}
              </div>

              {onDeleteClick && (
                <button
                  onClick={() => onDeleteClick(repo)}
                  className="px-3.5 py-2 rounded-xl bg-[#ff6b6b] hover:bg-[#e05656] border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-bold text-white shadow-[2px_2px_0_#1a1a1a] flex items-center gap-1.5 transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Repo</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
