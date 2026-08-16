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
  ForkSyncStatus,
  ThemeMode,
  AuditThresholdsConfig
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
import { getActivityLevel, DEFAULT_AUDIT_CONFIG } from './utils/github';
import { api } from './services/api';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [starred, setStarred] = useState<GitHubRepo[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'repos' | 'forks' | 'starred' | 'audit'>('repos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Audit Thresholds & Lifecycle Configuration State with LocalStorage Persistence
  const [auditConfig, setAuditConfig] = useState<AuditThresholdsConfig>(() => {
    try {
      const saved = localStorage.getItem('repodeck_audit_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.staleMonths === 'number' && typeof parsed.dormantMonths === 'number') {
          return {
            presetId: parsed.presetId || 'custom',
            activeDays: parsed.activeDays || 30,
            warmMonths: parsed.warmMonths || 4,
            staleMonths: parsed.staleMonths || 12,
            dormantMonths: parsed.dormantMonths || 24,
            dateField: parsed.dateField || 'pushed_at',
          };
        }
      }
    } catch (e) {
      console.error('Failed to load saved audit config', e);
    }
    return DEFAULT_AUDIT_CONFIG;
  });

  const handleAuditConfigChange = (newConfig: AuditThresholdsConfig) => {
    setAuditConfig(newConfig);
    try {
      localStorage.setItem('repodeck_audit_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to persist audit config', e);
    }
  };

  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('repodeck_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('repodeck_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Selection state for batch operations
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set());

  // Fork sync state mapping & active operations
  const [forkSyncStatuses, setForkSyncStatuses] = useState<Record<number, ForkSyncStatus>>({});
  const [syncingForkIds, setSyncingForkIds] = useState<Set<number>>(new Set());

  // Modals & Drawers
  const [repoToDelete, setRepoToDelete] = useState<GitHubRepo | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [drawerRepo, setDrawerRepo] = useState<GitHubRepo | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filtering & Sorting
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    searchMode: 'hybrid',
    visibility: 'all',
    type: 'all',
    activity: 'all',
    language: 'all',
    sort: 'pushed_desc',
  });

  // Server-side SQLite FTS5 & Hybrid Search State
  const [searchResults, setSearchResults] = useState<GitHubRepo[] | null>(null);
  const [searchLatency, setSearchLatency] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

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
      const data = await api.auth.getSession();
      setSession(data);
      return data;
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
      const [reposData, starredData] = await Promise.all([
        api.repos.getRepos().catch(() => []),
        api.starred.getStarred().catch(() => []),
      ]);

      setRepos(Array.isArray(reposData) ? reposData : []);
      setStarred(Array.isArray(starredData) ? starredData : []);
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

  // Populate fork comparison status directly from cached repository records (0 network requests on mount)
  useEffect(() => {
    const initialStatuses: Record<number, ForkSyncStatus> = {};
    for (const r of repos) {
      if (r.fork) {
        initialStatuses[r.id] = {
          parent_full_name: r.parent?.full_name || `${r.owner.login}/${r.name}`,
          parent_branch: r.parent?.default_branch || 'main',
          fork_branch: r.default_branch || 'main',
          status: (r.drift_status as any) || (r.behind_by ? 'behind' : r.ahead_by ? 'ahead' : 'up_to_date'),
          behind_by: r.behind_by || 0,
          ahead_by: r.ahead_by || 0,
        };
      }
    }
    if (Object.keys(initialStatuses).length > 0) {
      setForkSyncStatuses((prev) => ({ ...initialStatuses, ...prev }));
    }
  }, [repos]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Server-side SQLite FTS5 & Hybrid Semantic Search debounced fetcher
  useEffect(() => {
    const trimmed = filters.search.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchLatency(null);
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const mode = filters.searchMode || 'hybrid';
        const res = await api.search.query(trimmed, mode);
        if (isMounted) {
          setSearchResults(res.results);
          setSearchLatency(res.latencyMs);
        }
      } catch (err) {
        console.warn('Search query failed, falling back to client-side filter:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [filters.search, filters.searchMode]);

  // Re-index embeddings trigger
  const handleReindexEmbeddings = async () => {
    setIsReindexing(true);
    try {
      const res = await api.search.reindex();
      addToast('success', 'Vectors Re-indexed', res.message || 'Computed embeddings for all repositories.');
    } catch (err: any) {
      addToast('error', 'Re-index Failed', err.message);
    } finally {
      setIsReindexing(false);
    }
  };

  // PAT login
  const handlePatLogin = async (token: string): Promise<boolean> => {
    try {
      const data = await api.auth.loginPat(token);
      if (data.success) {
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

  // Demo login
  const handleDemoLogin = async (): Promise<boolean> => {
    try {
      const data = await api.auth.loginDemo();
      if (data.success) {
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
      await api.auth.logout();
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
      const data = await api.forks.sync(repo.owner.login, repo.name, repo.default_branch || 'main');
      addToast('success', 'Fork Fast-Forwarded!', data.message || `Merged upstream into ${repo.name}`);
      setRepos((prev) =>
        prev.map((r) => (r.id === repo.id ? { ...r, pushed_at: new Date().toISOString() } : r))
      );
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
      const res = await api.repos.deleteRepo(repo.owner.login, repo.name);
      if (res.success) {
        addToast('success', 'Repository Deleted', `${repo.full_name} was permanently removed.`);
        setRepos((prev) => prev.filter((r) => r.id !== repo.id));
        setRepoToDelete(null);
        setSelectedRepoIds((prev) => {
          const next = new Set(prev);
          next.delete(repo.id);
          return next;
        });
        return { success: true };
      }
      return { success: false, error: res.message };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred while deleting repository.';
      addToast('error', 'Delete Failed', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Archive / Unarchive toggle
  const handleArchiveToggle = async (repo: GitHubRepo, newArchivedState: boolean) => {
    try {
      await api.repos.toggleArchive(repo.owner.login, repo.name, newArchivedState);
      setRepos((prev) => prev.map((r) => (r.id === repo.id ? { ...r, archived: newArchivedState } : r)));
      addToast(
        'success',
        newArchivedState ? 'Repository Archived' : 'Repository Restored',
        `${repo.name} is now ${newArchivedState ? 'read-only' : 'active'}.`
      );
    } catch (err: any) {
      addToast('error', 'Archive Error', err.message);
    }
  };

  // Batch Archive selected repos
  const handleBatchArchive = async () => {
    const selectedList = repos.filter((r) => selectedRepoIds.has(r.id)).map((r) => ({ owner: r.owner.login, repo: r.name }));
    if (selectedList.length === 0) return;

    try {
      const res = await api.repos.batchArchive(selectedList, true);
      setRepos((prev) =>
        prev.map((r) => (selectedRepoIds.has(r.id) ? { ...r, archived: true } : r))
      );
      setSelectedRepoIds(new Set());
      addToast('success', 'Batch Archive Complete', `Archived ${res.updated} repositories.`);
    } catch (err: any) {
      addToast('error', 'Batch Archive Failed', err.message);
    }
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
    const payload = selectedList.map((r) => ({ owner: r.owner.login, repo: r.name }));
    try {
      const res = await api.repos.batchDelete(payload);
      const deletedNames = new Set(res.results.filter((r) => r.success).map((r) => `${r.owner}/${r.repo}`));
      
      setRepos((prev) => prev.filter((r) => !deletedNames.has(`${r.owner.login}/${r.name}`)));
      setSelectedRepoIds(new Set());
      addToast(
        'success',
        'Batch Deletion Complete',
        `Successfully deleted ${res.deleted} repositories.`
      );
      return { succeeded: res.deleted, failed: res.total - res.deleted };
    } catch (err: any) {
      addToast('error', 'Batch Deletion Failed', err.message);
      return { succeeded: 0, failed: selectedList.length };
    }
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
      a.download = `repodeck-export-${new Date().toISOString().slice(0, 10)}.json`;
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
      const res = await api.starred.unstar(repo.owner.login, repo.name);
      if (res.success) {
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
        const act = getActivityLevel(r.pushed_at, r.created_at, auditConfig, r.updated_at);
        return act.level === 'stale' || act.level === 'dormant';
      }),
    [repos, auditConfig]
  );

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  // Filtered and Sorted Main Repositories (Server-backed FTS5 / Hybrid Search with client fallback)
  const filteredRepos = useMemo(() => {
    const sourceList = (filters.search && searchResults !== null) ? searchResults : repos;

    return sourceList
      .filter((repo) => {
        // If server search was not used or in offline fallback, check substring
        if (filters.search && searchResults === null) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            repo.name.toLowerCase().includes(searchLower) ||
            repo.full_name.toLowerCase().includes(searchLower) ||
            (repo.description && repo.description.toLowerCase().includes(searchLower)) ||
            (repo.topics && repo.topics.some((t) => t.toLowerCase().includes(searchLower)));
          if (!matchesSearch) return false;
        }

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
          const act = getActivityLevel(repo.pushed_at, repo.created_at, auditConfig, repo.updated_at);
          if (act.level !== filters.activity) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // If searching with Hybrid / FTS5 without explicit non-default sort, preserve relevance ranking!
        if (filters.search && searchResults !== null && filters.sort === 'pushed_desc') {
          return 0;
        }

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
          return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        }
        if (filters.sort === 'stars_asc') {
          return (a.stargazers_count || 0) - (b.stargazers_count || 0);
        }
        if (filters.sort === 'size_desc') {
          return (b.size || 0) - (a.size || 0);
        }
        if (filters.sort === 'size_asc') {
          return (a.size || 0) - (b.size || 0);
        }
        if (filters.sort === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (filters.sort === 'name_desc') {
          return b.name.localeCompare(a.name);
        }
        if (filters.sort === 'forks_desc') {
          return (b.forks_count || 0) - (a.forks_count || 0);
        }
        return 0;
      });
  }, [repos, searchResults, filters]);

  const selectedForksCount = useMemo(() => {
    return repos.filter((r) => selectedRepoIds.has(r.id) && r.fork).length;
  }, [repos, selectedRepoIds]);

  const isDemo = session?.authMethod === 'demo';

  return (
    <div className="min-h-screen bg-[#fffef2] dark:bg-[#0d1117] text-[#1a1a1a] dark:text-[#f0f6fc] flex flex-col font-sans selection:bg-[#ffcc5c] selection:text-[#1a1a1a]">
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
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] 2xl:max-w-[1840px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Demo Mode / Connect Quick Notification Strip */}
        {isDemo && (
          <div className="bg-white dark:bg-[#161b22] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-[4px_4px_0_#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#ffcc5c] border-2 border-[#1a1a1a] dark:border-[#30363d] shrink-0 animate-pulse" />
              <span className="font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                Sandbox Demo Active: Previewing sample repository portfolio, branch auditor & releases telemetry.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#4ecdc4] hover:bg-[#38b2ac] text-[#1a1a1a] border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
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
              searchLatency={searchLatency}
              onReindexEmbeddings={handleReindexEmbeddings}
              isReindexing={isReindexing}
              auditConfig={auditConfig}
            />

            {/* Repository List / Table / Grid */}
            {dataLoading && repos.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl shadow-[6px_6px_0_#1a1a1a]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#ff6b6b] mx-auto stroke-[2.5]" />
                <p className="text-sm text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold">Fetching repository catalog...</p>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-12 text-center space-y-3 shadow-[6px_6px_0_#1a1a1a]">
                <div className="w-14 h-14 rounded-2xl bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#666] dark:text-[#8b949e] mx-auto shadow-[3px_3px_0_#1a1a1a]">
                  <Layers className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">No matching repositories found</h3>
                <p className="text-xs text-[#555] dark:text-[#8b949e] font-space font-medium">Adjust search query or active filter settings.</p>
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
                currentSort={filters.sort}
                onSortChange={(newSort) => setFilters((prev) => ({ ...prev, sort: newSort }))}
                auditConfig={auditConfig}
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
                    auditConfig={auditConfig}
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
            config={auditConfig}
            onConfigChange={handleAuditConfigChange}
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
        auditConfig={auditConfig}
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
