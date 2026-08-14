import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FolderGit2, 
  GitFork, 
  Star, 
  Trash2, 
  KeyRound, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  Layers,
  ArrowUpDown,
  Filter,
  Terminal,
  Clock,
  Key,
  HelpCircle,
  Download
} from 'lucide-react';
import { 
  GitHubRepo, 
  AuthSession, 
  FilterOptions,
  ForkSyncStatus
} from './types';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { RepoCard } from './components/RepoCard';
import { RepoTableView } from './components/RepoTableView';
import { BatchActionBar } from './components/BatchActionBar';
import { ForkManager } from './components/ForkManager';
import { StarredRepos } from './components/StarredRepos';
import { AuditView } from './components/AuditView';
import { DeleteRepoModal } from './components/DeleteRepoModal';
import { BatchDeleteModal } from './components/BatchDeleteModal';
import { RepoDetailDrawer } from './components/RepoDetailDrawer';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { getActivityLevel } from './utils/github';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [starred, setStarred] = useState<GitHubRepo[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'repos' | 'forks' | 'starred' | 'audit'>('repos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Selection state for batch operations
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set());

  // Fork sync state mapping & active operations
  const [forkSyncStatuses, setForkSyncStatuses] = useState<Record<number, ForkSyncStatus>>({});
  const [syncingForkIds, setSyncingForkIds] = useState<Set<number>>(new Set());

  // Inline PAT quick connect input for banner
  const [inlinePat, setInlinePat] = useState('');
  const [inlinePatLoading, setInlinePatLoading] = useState(false);

  // Modals & Drawers
  const [repoToDelete, setRepoToDelete] = useState<GitHubRepo | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [drawerRepo, setDrawerRepo] = useState<GitHubRepo | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filtering & Sorting
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    visibility: 'all',
    type: 'all',
    activity: 'all',
    language: 'all',
    sort: 'pushed_desc',
  });

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch session
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data: AuthSession = await res.json();
        setSession(data);
        return data;
      }
    } catch (e) {
      console.error('Session fetch failed', e);
    } finally {
      setSessionLoading(false);
    }
    return null;
  }, []);

  // Fetch Repositories and Starred
  const loadGitHubData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [reposRes, starredRes] = await Promise.all([
        fetch('/api/github/repos'),
        fetch('/api/github/starred'),
      ]);

      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setRepos(Array.isArray(reposData) ? reposData : []);
      }

      if (starredRes.ok) {
        const starredData = await starredRes.json();
        setStarred(Array.isArray(starredData) ? starredData : []);
      }
    } catch (err: any) {
      addToast('error', 'Failed to fetch repositories', err.message);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Initial mount
  useEffect(() => {
    fetchSession().then((sess) => {
      if (sess && sess.authenticated) {
        loadGitHubData();
      } else {
        // Auto-seed demo mode so the user immediately experiences the rich UI without a dead blank wall
        handleDemoLogin();
      }
    });
  }, [fetchSession, loadGitHubData]);

  // Prefetch upstream fork comparison status for all forks
  useEffect(() => {
    const forks = repos.filter((r) => r.fork);
    if (forks.length === 0) return;

    let isMounted = true;
    const prefetchForkStatuses = async () => {
      for (const fork of forks) {
        try {
          const res = await fetch(`/api/github/forks/${fork.owner.login}/${fork.name}/compare`);
          if (res.ok && isMounted) {
            const data: ForkSyncStatus = await res.json();
            setForkSyncStatuses((prev) => ({ ...prev, [fork.id]: data }));
          }
        } catch (e) {
          // silently ignore background comparison failures
        }
      }
    };

    prefetchForkStatuses();
    return () => {
      isMounted = false;
    };
  }, [repos]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('input-repo-search')?.focus();
      } else if (e.key === '1') {
        setActiveTab('repos');
      } else if (e.key === '2') {
        setActiveTab('forks');
      } else if (e.key === '3') {
        setActiveTab('starred');
      } else if (e.key === '4') {
        setActiveTab('audit');
      } else if (e.key === 'r' || e.key === 'R') {
        loadGitHubData();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadGitHubData]);

  // OAuth popup message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate that message comes from the same origin
      if (event.origin !== window.location.origin && !event.origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        addToast('success', 'Connected to GitHub', 'Your GitHub account has been authenticated successfully.');
        setAuthModalOpen(false);
        fetchSession().then((sess) => {
          if (sess?.authenticated) {
            loadGitHubData();
          }
        });
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        addToast('error', 'OAuth Failed', event.data.error || 'Authentication was denied or encountered an error.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchSession, loadGitHubData]);

  // PAT login
  const handlePatLogin = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', 'Connected with Token', `Authenticated as @${data.user.login}`);
        await fetchSession();
        await loadGitHubData();
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('error', 'Authentication Error', err.message);
      return false;
    }
  };

  // Inline PAT quick submit
  const handleInlinePatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePat.trim()) return;
    setInlinePatLoading(true);
    try {
      const ok = await handlePatLogin(inlinePat.trim());
      if (ok) {
        setInlinePat('');
      }
    } finally {
      setInlinePatLoading(false);
    }
  };

  // Demo login
  const handleDemoLogin = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchSession();
        await loadGitHubData();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Demo load failed', err);
      return false;
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      setRepos([]);
      setStarred([]);
      setSelectedRepoIds(new Set());
      addToast('info', 'Signed Out', 'Disconnected from GitHub.');
    } catch (err: any) {
      console.error(err);
    }
  };

  // 1-Click Sync Fork
  const handleSyncFork = async (repo: GitHubRepo): Promise<boolean> => {
    setSyncingForkIds((prev) => new Set(prev).add(repo.id));
    try {
      const res = await fetch(`/api/github/forks/${repo.owner.login}/${repo.name}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: repo.default_branch || 'main' }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Fork Fast-Forwarded!', data.message || `Merged upstream into ${repo.name}`);
        setRepos((prev) =>
          prev.map((r) => (r.id === repo.id ? { ...r, pushed_at: new Date().toISOString() } : r))
        );
        // Mark fork as in-sync (up to date)
        setForkSyncStatuses((prev) => ({
          ...prev,
          [repo.id]: {
            parent_full_name: repo.parent?.full_name || 'upstream',
            parent_branch: 'main',
            fork_branch: repo.default_branch || 'main',
            status: 'up_to_date',
            behind_by: 0,
            ahead_by: 0,
          },
        }));
        return true;
      } else {
        addToast('error', 'Sync Failed', data.error || 'Could not auto-merge upstream branch.');
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Sync Failed', err.message);
      return false;
    } finally {
      setSyncingForkIds((prev) => {
        const next = new Set(prev);
        next.delete(repo.id);
        return next;
      });
    }
  };

  // Delete Repository
  const handleConfirmDelete = async (repo: GitHubRepo): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/github/repos/${repo.owner.login}/${repo.name}`, {
        method: 'DELETE',
      });
      
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: res.statusText || (text.length < 200 ? text : `Server returned status ${res.status}`) };
      }

      if (res.ok && data.success) {
        addToast('success', 'Repository Deleted', `${repo.full_name} was permanently removed.`);
        setRepos((prev) => prev.filter((r) => r.id !== repo.id));
        setRepoToDelete(null);
        setSelectedRepoIds((prev) => {
          const next = new Set(prev);
          next.delete(repo.id);
          return next;
        });
        return { success: true };
      } else {
        const errorMsg = data.error || data.message || `Failed to delete repository (HTTP ${res.status})`;
        addToast('error', 'Delete Failed', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred while deleting repository.';
      addToast('error', 'Delete Failed', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Archive / Unarchive toggle
  const handleArchiveToggle = async (repo: GitHubRepo, newArchivedState: boolean) => {
    try {
      const res = await fetch(`/api/github/repos/${repo.owner.login}/${repo.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: newArchivedState }),
      });
      if (res.ok) {
        setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, archived: newArchivedState } : r)));
        addToast(
          'success',
          newArchivedState ? 'Repository Archived' : 'Repository Restored',
          `${repo.name} is now ${newArchivedState ? 'read-only' : 'active'}.`
        );
      } else {
        const data = await res.json();
        addToast('error', 'Archive Toggle Failed', data.error || 'Could not update archive state.');
      }
    } catch (err: any) {
      addToast('error', 'Archive Error', err.message);
    }
  };

  // Batch Archive selected repos
  const handleBatchArchive = async () => {
    const selectedList = repos.filter((r) => selectedRepoIds.has(r.id));
    if (selectedList.length === 0) return;

    let successCount = 0;
    for (const repo of selectedList) {
      try {
        const res = await fetch(`/api/github/repos/${repo.owner.login}/${repo.name}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: true }),
        });
        if (res.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    setRepos((prev) =>
      prev.map((r) => (selectedRepoIds.has(r.id) ? { ...r, archived: true } : r))
    );
    setSelectedRepoIds(new Set());
    addToast('success', 'Batch Archive Complete', `Archived ${successCount} repositories.`);
  };

  // Batch Sync selected forks
  const handleBatchSyncForks = async () => {
    const selectedForks = repos.filter((r) => selectedRepoIds.has(r.id) && r.fork);
    if (selectedForks.length === 0) return;

    let syncCount = 0;
    for (const fork of selectedForks) {
      const ok = await handleSyncFork(fork);
      if (ok) syncCount++;
    }
    setSelectedRepoIds(new Set());
    addToast('success', 'Batch Sync Complete', `Fast-forwarded ${syncCount} of ${selectedForks.length} forks.`);
  };

  // Batch Delete selected repos with confirmation
  const handleConfirmBatchDelete = async (selectedList: GitHubRepo[]): Promise<{ succeeded: number; failed: number }> => {
    let succeeded = 0;
    let failed = 0;
    const deletedIds = new Set<number>();

    for (const repo of selectedList) {
      try {
        const res = await fetch(`/api/github/repos/${repo.owner.login}/${repo.name}`, {
          method: 'DELETE',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          succeeded++;
          deletedIds.add(repo.id);
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
    }

    if (succeeded > 0) {
      setRepos((prev) => prev.filter((r) => !deletedIds.has(r.id)));
      setSelectedRepoIds((prev) => {
        const next = new Set(prev);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });
      addToast(
        'success',
        'Batch Deletion Complete',
        `Successfully deleted ${succeeded} ${succeeded === 1 ? 'repository' : 'repositories'}.${
          failed > 0 ? ` (${failed} failed)` : ''
        }`
      );
    } else if (failed > 0) {
      addToast('error', 'Batch Deletion Failed', `Failed to delete ${failed} selected repositories.`);
    }

    return { succeeded, failed };
  };

  // Export selected repositories metadata
  const handleExportSelected = (format: 'json' | 'csv') => {
    const selectedList = repos.filter((r) => selectedRepoIds.has(r.id));
    if (selectedList.length === 0) return;

    if (format === 'json') {
      const jsonStr = JSON.stringify(selectedList, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `octopulse-repos-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('info', 'Export Generated', `Exported ${selectedList.length} repositories to JSON.`);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: number) => {
    setSelectedRepoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      const allFilteredIds = filteredRepos.map((r) => r.id);
      setSelectedRepoIds(new Set(allFilteredIds));
    } else {
      setSelectedRepoIds(new Set());
    }
  };

  // Unstar repository
  const handleUnstar = async (repo: GitHubRepo): Promise<boolean> => {
    try {
      const res = await fetch(`/api/github/starred/${repo.owner.login}/${repo.name}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStarred((prev) => prev.filter((r) => r.id !== repo.id));
        addToast('info', 'Unstarred Repository', `Removed ${repo.full_name} from starred collection.`);
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('error', 'Unstar Error', err.message);
      return false;
    }
  };

  // Metrics and derived lists
  const forkedRepos = useMemo(() => repos.filter((r) => r.fork), [repos]);
  const staleCandidates = useMemo(
    () =>
      repos.filter((r) => {
        const act = getActivityLevel(r.pushed_at, r.created_at);
        return act.level === 'stale' || act.level === 'dormant';
      }),
    [repos]
  );

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  // Filtered and Sorted Main Repositories
  const filteredRepos = useMemo(() => {
    return repos
      .filter((repo) => {
        // Search
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          !filters.search ||
          repo.name.toLowerCase().includes(searchLower) ||
          repo.full_name.toLowerCase().includes(searchLower) ||
          (repo.description && repo.description.toLowerCase().includes(searchLower)) ||
          (repo.topics && repo.topics.some((t) => t.toLowerCase().includes(searchLower)));

        if (!matchesSearch) return false;

        // Visibility
        if (filters.visibility === 'public' && repo.private) return false;
        if (filters.visibility === 'private' && !repo.private) return false;

        // Type
        if (filters.type === 'owned' && repo.fork) return false;
        if (filters.type === 'forked' && !repo.fork) return false;
        if (filters.type === 'archived' && !repo.archived) return false;

        // Language
        if (filters.language !== 'all' && repo.language !== filters.language) return false;

        // Activity Level
        if (filters.activity !== 'all') {
          const act = getActivityLevel(repo.pushed_at, repo.created_at);
          if (act.level !== filters.activity) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'pushed_desc') {
          return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        }
        if (filters.sort === 'pushed_asc') {
          return new Date(a.pushed_at).getTime() - new Date(b.pushed_at).getTime();
        }
        if (filters.sort === 'created_desc') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (filters.sort === 'created_asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (filters.sort === 'stars_desc') {
          return b.stargazers_count - a.stargazers_count;
        }
        if (filters.sort === 'size_desc') {
          return b.size - a.size;
        }
        if (filters.sort === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [repos, filters]);

  const selectedForksCount = useMemo(() => {
    return repos.filter((r) => selectedRepoIds.has(r.id) && r.fork).length;
  }, [repos, selectedRepoIds]);

  const isDemo = session?.authMethod === 'demo';

  return (
    <div className="min-h-screen bg-[#fffef2] text-[#1a1a1a] flex flex-col font-sans selection:bg-[#ffcc5c] selection:text-[#1a1a1a]">
      {/* Navigation Bar */}
      <Navbar
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onRefresh={loadGitHubData}
        loading={dataLoading}
        repoCount={repos.length}
        forkCount={forkedRepos.length}
        starredCount={starred.length}
        staleCount={staleCandidates.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Demo Mode / Connect Quick Notification Strip */}
        {isDemo && (
          <div className="bg-white border-2 border-[#1a1a1a] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-[4px_4px_0_#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#ffcc5c] border-2 border-[#1a1a1a] shrink-0 animate-pulse" />
              <span className="font-space font-bold text-[#1a1a1a]">
                Sandbox Demo Active: Previewing sample repository portfolio & fork sync.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#4ecdc4] hover:bg-[#38b2ac] text-[#1a1a1a] border-2 border-[#1a1a1a] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                Connect Real GitHub
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: All Repositories */}
        {activeTab === 'repos' && (
          <div className="space-y-4">
            {/* Filter and search bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              availableLanguages={availableLanguages}
              totalCount={repos.length}
              filteredCount={filteredRepos.length}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            {/* Repository List / Table / Grid */}
            {dataLoading && repos.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-white border-[3px] border-[#1a1a1a] rounded-2xl shadow-[6px_6px_0_#1a1a1a]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#ff6b6b] mx-auto stroke-[2.5]" />
                <p className="text-sm text-[#1a1a1a] font-space font-bold">Fetching repository catalog...</p>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="bg-white border-[3px] border-[#1a1a1a] rounded-2xl p-12 text-center space-y-3 shadow-[6px_6px_0_#1a1a1a]">
                <div className="w-14 h-14 rounded-2xl bg-[#fffef2] border-2 border-[#1a1a1a] flex items-center justify-center text-[#666] mx-auto shadow-[3px_3px_0_#1a1a1a]">
                  <Layers className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#1a1a1a]">No matching repositories found</h3>
                <p className="text-xs text-[#555] font-space font-medium">Adjust search query or active filter settings.</p>
              </div>
            ) : viewMode === 'table' ? (
              <RepoTableView
                repos={filteredRepos}
                selectedIds={selectedRepoIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeleteClick={(r) => setRepoToDelete(r)}
                onArchiveToggle={handleArchiveToggle}
                onSyncClick={(r) => {
                  setActiveTab('forks');
                }}
                onDirectSync={handleSyncFork}
                forkSyncStatuses={forkSyncStatuses}
                syncingForkIds={syncingForkIds}
                onOpenDrawer={(r) => setDrawerRepo(r)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRepos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    isSelected={selectedRepoIds.has(repo.id)}
                    onToggleSelect={handleToggleSelect}
                    onDeleteClick={(r) => setRepoToDelete(r)}
                    onArchiveToggle={handleArchiveToggle}
                    onSyncClick={
                      repo.fork
                        ? () => {
                            setActiveTab('forks');
                          }
                        : undefined
                    }
                    onDirectSync={repo.fork ? handleSyncFork : undefined}
                    forkSyncStatus={forkSyncStatuses[repo.id]}
                    isSyncing={syncingForkIds.has(repo.id)}
                    onOpenDrawer={(r) => setDrawerRepo(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Forks & Upstream Sync */}
        {activeTab === 'forks' && (
          <ForkManager
            forks={forkedRepos}
            onSyncFork={handleSyncFork}
            onDeleteClick={(r) => setRepoToDelete(r)}
            onRefresh={loadGitHubData}
            loading={dataLoading}
          />
        )}

        {/* Tab 3: Starred Repositories */}
        {activeTab === 'starred' && (
          <StarredRepos
            starred={starred}
            onUnstar={handleUnstar}
            loading={dataLoading}
          />
        )}

        {/* Tab 4: Stale Lifecycle Audit */}
        {activeTab === 'audit' && (
          <AuditView
            repos={repos}
            onDeleteClick={(r) => setRepoToDelete(r)}
            onArchiveToggle={handleArchiveToggle}
          />
        )}
      </main>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedRepoIds.size}
        totalCount={filteredRepos.length}
        onClearSelection={() => setSelectedRepoIds(new Set())}
        onBatchArchive={handleBatchArchive}
        onBatchDelete={() => setIsBatchDeleteModalOpen(true)}
        onBatchSyncForks={selectedForksCount > 0 ? handleBatchSyncForks : undefined}
        onExportSelected={handleExportSelected}
        forksSelectedCount={selectedForksCount}
      />

      {/* Slide-over Detailed Inspector Drawer */}
      <RepoDetailDrawer
        repo={drawerRepo}
        isOpen={Boolean(drawerRepo)}
        onClose={() => setDrawerRepo(null)}
        onDeleteClick={(r) => setRepoToDelete(r)}
        onArchiveToggle={handleArchiveToggle}
        onSyncClick={(r) => {
          setActiveTab('forks');
        }}
      />

      {/* Single Repo Delete Confirmation Modal */}
      <DeleteRepoModal
        repo={repoToDelete}
        isOpen={Boolean(repoToDelete)}
        onClose={() => setRepoToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
        sessionScopes={session?.scopes}
        authMethod={session?.authMethod}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Multiple Repos Batch Delete Confirmation Modal */}
      <BatchDeleteModal
        repos={repos.filter((r) => selectedRepoIds.has(r.id))}
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirmBatchDelete={handleConfirmBatchDelete}
        sessionScopes={session?.scopes}
        authMethod={session?.authMethod}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Auth / Connect Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        session={session}
        onPatLogin={handlePatLogin}
        onDemoLogin={handleDemoLogin}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
