import { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  GitFork, 
  Star, 
  Lock, 
  Globe, 
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
  ShieldCheck,
  FolderGit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GitHubRepo, RepoDetailsData } from '../types';
import { formatAge, formatRelativeTime, getActivityLevel, formatRepoSize, getLanguageColor } from '../utils/github';

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
  const [activeTab, setActiveTab] = useState<'languages' | 'contributors' | 'commits' | 'overview'>('languages');
  const [details, setDetails] = useState<RepoDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedClone, setCopiedClone] = useState(false);

  // Fetch repo details whenever the drawer opens or repo changes
  useEffect(() => {
    if (!isOpen || !repo) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/github/repos/${repo.owner.login}/${repo.name}/details`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: RepoDetailsData) => {
        if (isMounted) {
          setDetails(data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Failed to load details');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, repo]);

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
            className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white border-l-[3px] border-[#1a1a1a] shadow-[-10px_0_0_rgba(26,26,26,0.15)] flex flex-col h-full z-10"
          >
            {/* Drawer Header */}
            <div className="px-6 py-4.5 border-b-[3px] border-[#1a1a1a] bg-[#fffef2] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] shrink-0">
                  {repo.fork ? (
                    <GitFork className="w-5 h-5 stroke-[2.5]" />
                  ) : repo.private ? (
                    <Lock className="w-5 h-5 text-[#854d0e] stroke-[2.5]" />
                  ) : (
                    <FolderGit2 className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading text-xl font-extrabold text-[#1a1a1a] truncate tracking-tight">
                      {repo.name}
                    </h2>
                    {repo.private ? (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] bg-[#ffcc5c]/30 text-[#854d0e] uppercase">
                        Private
                      </span>
                    ) : (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] bg-white text-[#1a1a1a] uppercase">
                        Public
                      </span>
                    )}
                    {repo.fork && (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] bg-[#4ecdc4]/20 text-[#0f766e] uppercase">
                        Fork
                      </span>
                    )}
                    {repo.archived && (
                      <span className="text-[10px] font-space font-bold px-1.5 py-0.5 rounded border border-[#1a1a1a] bg-neutral-200 text-[#555] uppercase">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="font-space text-xs font-bold text-[#666] truncate mt-0.5">
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
                  className="p-2 rounded-xl bg-white hover:bg-[#fffef2] border-2 border-[#1a1a1a] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </a>
                <button
                  onClick={onClose}
                  title="Close panel (Esc)"
                  className="p-2 rounded-xl bg-white hover:bg-[#ff6b6b] hover:text-white border-2 border-[#1a1a1a] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Quick Actions & Clone Bar */}
            <div className="px-6 py-3 border-b-2 border-[#1a1a1a]/15 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {repo.fork && onSyncClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onSyncClick(repo);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold font-space bg-[#ffcc5c] hover:bg-[#ffbe3b] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] text-[#1a1a1a] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Sync Upstream</span>
                  </button>
                )}

                {onArchiveToggle && (
                  <button
                    onClick={() => onArchiveToggle(repo, !repo.archived)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold font-space bg-white hover:bg-[#fffef2] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] text-[#1a1a1a] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    {repo.archived ? (
                      <>
                        <ArchiveRestore className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Unarchive</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Archive</span>
                      </>
                    )}
                  </button>
                )}

                {onDeleteClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onDeleteClick(repo);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold font-space bg-white hover:bg-[#ff6b6b] hover:text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] text-[#ff6b6b] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {/* Quick Git Clone Button */}
              <button
                onClick={copyCloneCommand}
                title="Copy git clone command"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fffef2] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                {copiedClone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10b981] stroke-[2.5]" />
                    <span className="text-[#065f46]">Cloned!</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>git clone</span>
                    <Copy className="w-3 h-3 text-[#666]" />
                  </>
                )}
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 border-b-2 border-[#1a1a1a]/15 bg-[#fffef2] flex items-center gap-2 overflow-x-auto shrink-0 select-none">
              <button
                onClick={() => setActiveTab('languages')}
                className={`py-3 px-3.5 text-xs font-space font-bold flex items-center gap-2 border-b-[3px] -mb-[2px] transition cursor-pointer ${
                  activeTab === 'languages'
                    ? 'border-[#1a1a1a] text-[#1a1a1a]'
                    : 'border-transparent text-[#666] hover:text-[#1a1a1a]'
                }`}
              >
                <Code2 className="w-4 h-4 stroke-[2.5]" />
                <span>Languages</span>
                {languageList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white border border-[#1a1a1a] text-[10px]">
                    {languageList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('contributors')}
                className={`py-3 px-3.5 text-xs font-space font-bold flex items-center gap-2 border-b-[3px] -mb-[2px] transition cursor-pointer ${
                  activeTab === 'contributors'
                    ? 'border-[#1a1a1a] text-[#1a1a1a]'
                    : 'border-transparent text-[#666] hover:text-[#1a1a1a]'
                }`}
              >
                <Users className="w-4 h-4 stroke-[2.5]" />
                <span>Contributors</span>
                {details?.contributors && details.contributors.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white border border-[#1a1a1a] text-[10px]">
                    {details.contributors.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('commits')}
                className={`py-3 px-3.5 text-xs font-space font-bold flex items-center gap-2 border-b-[3px] -mb-[2px] transition cursor-pointer ${
                  activeTab === 'commits'
                    ? 'border-[#1a1a1a] text-[#1a1a1a]'
                    : 'border-transparent text-[#666] hover:text-[#1a1a1a]'
                }`}
              >
                <GitCommit className="w-4 h-4 stroke-[2.5]" />
                <span>Recent Commits</span>
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-3.5 text-xs font-space font-bold flex items-center gap-2 border-b-[3px] -mb-[2px] transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-[#1a1a1a] text-[#1a1a1a]'
                    : 'border-transparent text-[#666] hover:text-[#1a1a1a]'
                }`}
              >
                <Layers className="w-4 h-4 stroke-[2.5]" />
                <span>Lifecycle & Meta</span>
              </button>
            </div>

            {/* Drawer Body / Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              {repo.description && (
                <div className="p-4 rounded-xl bg-[#fffef2] border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]">
                  <p className="text-xs font-medium text-[#1a1a1a] leading-relaxed">
                    {repo.description}
                  </p>
                </div>
              )}

              {/* Loading State */}
              {loading && !details && (
                <div className="py-16 text-center space-y-2.5">
                  <RefreshCw className="w-7 h-7 animate-spin text-[#ff6b6b] mx-auto stroke-[2.5]" />
                  <p className="font-space font-bold text-xs text-[#1a1a1a]">
                    Fetching language percentages & contributors...
                  </p>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="p-4 rounded-xl bg-[#ff6b6b]/15 border-2 border-[#ff6b6b] text-[#9f1239] font-space text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Failed to load details from GitHub API</span>
                  </div>
                  <p className="font-medium text-[11px]">{error}</p>
                </div>
              )}

              {/* TAB 1: LANGUAGES & PERCENTAGES */}
              {activeTab === 'languages' && !loading && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-[#1a1a1a]">
                      Language Breakdown & Footprint
                    </h3>
                    <span className="font-space text-xs text-[#666]">
                      Total Code: <strong className="text-[#1a1a1a]">{formatRepoSize(details?.totalBytes ? Math.round(details.totalBytes / 1024) : repo.size)}</strong>
                    </span>
                  </div>

                  {languageList.length > 0 ? (
                    <>
                      {/* Segmented Progress Bar */}
                      <div className="space-y-2">
                        <div className="h-4 w-full rounded-lg overflow-hidden border-2 border-[#1a1a1a] flex bg-[#fffef2] shadow-[2px_2px_0_#1a1a1a]">
                          {languageList.map((lang) => (
                            <div
                              key={lang.name}
                              style={{
                                width: `${Math.max(lang.percentage, 1)}%`,
                                backgroundColor: lang.color,
                              }}
                              className="h-full transition-all duration-300 relative group"
                              title={`${lang.name}: ${lang.percentage.toFixed(1)}% (${formatRepoSize(Math.round(lang.bytes / 1024))})`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Detailed Language Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {languageList.map((lang) => (
                          <div
                            key={lang.name}
                            className="p-3 rounded-xl bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-[#1a1a1a] shrink-0"
                                style={{ backgroundColor: lang.color }}
                              />
                              <span className="font-space font-bold text-xs text-[#1a1a1a] truncate">
                                {lang.name}
                              </span>
                            </div>
                            <div className="text-right shrink-0 font-space text-xs">
                              <div className="font-bold text-[#1a1a1a]">
                                {lang.percentage.toFixed(1)}%
                              </div>
                              <div className="text-[10px] text-[#666]">
                                {formatRepoSize(Math.round(lang.bytes / 1024))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center bg-[#fffef2] rounded-xl border-2 border-dashed border-[#1a1a1a]/30 p-6">
                      <Code2 className="w-8 h-8 text-[#888] mx-auto mb-2" />
                      <p className="font-space text-xs font-bold text-[#555]">
                        No language statistics available for this repository.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CONTRIBUTORS */}
              {activeTab === 'contributors' && !loading && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-[#1a1a1a]">
                      Recent Contributors & Authors
                    </h3>
                    <span className="font-space text-xs text-[#666]">
                      {details?.contributors ? `${details.contributors.length} active contributors` : '0 contributors'}
                    </span>
                  </div>

                  {details?.contributors && details.contributors.length > 0 ? (
                    <div className="space-y-2">
                      {details.contributors.map((contrib, idx) => (
                        <div
                          key={contrib.id || contrib.login}
                          className="p-3 rounded-xl bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] flex items-center justify-between hover:bg-[#fffef2] transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-space font-bold text-xs text-[#888] w-4 text-center">
                              #{idx + 1}
                            </span>
                            <img
                              src={contrib.avatar_url}
                              alt={contrib.login}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={contrib.html_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-space font-bold text-xs text-[#1a1a1a] hover:text-[#ff6b6b] truncate flex items-center gap-1"
                                >
                                  <span>{contrib.login}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0 stroke-[2]" />
                                </a>
                                {contrib.type === 'Bot' && (
                                  <span className="px-1.5 py-0.2 rounded bg-neutral-100 border border-[#1a1a1a] text-[9px] font-space font-bold text-[#666]">
                                    BOT
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="font-space text-xs font-bold text-right shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-[#4ecdc4]/20 border border-[#4ecdc4] text-[#0f766e]">
                              {contrib.contributions} {contrib.contributions === 1 ? 'commit' : 'commits'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-[#fffef2] rounded-xl border-2 border-dashed border-[#1a1a1a]/30 p-6">
                      <Users className="w-8 h-8 text-[#888] mx-auto mb-2" />
                      <p className="font-space text-xs font-bold text-[#555]">
                        No contributor data returned by GitHub.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RECENT COMMITS */}
              {activeTab === 'commits' && !loading && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-[#1a1a1a]">
                      Recent Commit Stream
                    </h3>
                    <span className="font-space text-xs text-[#666]">
                      Branch: <strong className="text-[#1a1a1a]">{repo.default_branch || 'main'}</strong>
                    </span>
                  </div>

                  {details?.recentCommits && details.recentCommits.length > 0 ? (
                    <div className="space-y-2.5">
                      {details.recentCommits.map((cm) => (
                        <div
                          key={cm.sha}
                          className="p-3.5 rounded-xl bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-xs text-[#1a1a1a] leading-snug line-clamp-2">
                              {cm.commit.message}
                            </p>
                            <a
                              href={cm.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-space text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fffef2] border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#ffcc5c] shrink-0"
                            >
                              {cm.sha.substring(0, 7)}
                            </a>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-space text-[#666] pt-1 border-t border-[#1a1a1a]/10">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {cm.author?.avatar_url && (
                                <img
                                  src={cm.author.avatar_url}
                                  alt={cm.author.login}
                                  referrerPolicy="no-referrer"
                                  className="w-4 h-4 rounded-full border border-[#1a1a1a] shrink-0"
                                />
                              )}
                              <span className="truncate font-bold text-[#1a1a1a]">
                                {cm.author?.login || cm.commit.author.name}
                              </span>
                            </div>
                            <span className="shrink-0 text-[10px]">
                              {formatRelativeTime(cm.commit.author.date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-[#fffef2] rounded-xl border-2 border-dashed border-[#1a1a1a]/30 p-6">
                      <GitCommit className="w-8 h-8 text-[#888] mx-auto mb-2" />
                      <p className="font-space text-xs font-bold text-[#555]">
                        No commit history accessible.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LIFECYCLE & METADATA OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-heading font-bold text-sm text-[#1a1a1a]">
                    Repository Lifecycle & Telemetry
                  </h3>

                  <div className="grid grid-cols-2 gap-3 font-space text-xs">
                    <div className="p-3 rounded-xl bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] space-y-1">
                      <div className="text-[10px] text-[#666] font-bold uppercase">Activity Tier</div>
                      <div className="font-bold text-[#1a1a1a] capitalize flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                        <span>{activity.label}</span>
                      </div>
                      <div className="text-[10px] text-[#555]">{activity.description}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] space-y-1">
                      <div className="text-[10px] text-[#666] font-bold uppercase">Repository Age</div>
                      <div className="font-bold text-[#1a1a1a]">{age.label}</div>
                      <div className="text-[10px] text-[#555]">{new Date(repo.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] space-y-1">
                      <div className="text-[10px] text-[#666] font-bold uppercase">Last Push</div>
                      <div className="font-bold text-[#1a1a1a]">{formatRelativeTime(repo.pushed_at)}</div>
                      <div className="text-[10px] text-[#555]">{new Date(repo.pushed_at).toLocaleDateString()}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] space-y-1">
                      <div className="text-[10px] text-[#666] font-bold uppercase">Disk Size</div>
                      <div className="font-bold text-[#1a1a1a]">{formatRepoSize(repo.size)}</div>
                      <div className="text-[10px] text-[#555]">{repo.size.toLocaleString()} KB</div>
                    </div>
                  </div>

                  {/* Upstream Info if Fork */}
                  {repo.fork && repo.parent && (
                    <div className="p-3.5 rounded-xl bg-[#4ecdc4]/15 border-2 border-[#4ecdc4] space-y-1 font-space">
                      <div className="text-[10px] font-bold text-[#0f766e] uppercase">Upstream Parent</div>
                      <a
                        href={repo.parent.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-xs text-[#1a1a1a] hover:underline flex items-center gap-1"
                      >
                        <span>{repo.parent.full_name}</span>
                        <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                      </a>
                    </div>
                  )}

                  {/* Topics / Tags */}
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="space-y-1.5 font-space">
                      <div className="text-[10px] font-bold text-[#666] uppercase">Repository Topics</div>
                      <div className="flex flex-wrap gap-1.5">
                        {repo.topics.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-[#fffef2] border border-[#1a1a1a] text-xs font-bold text-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
