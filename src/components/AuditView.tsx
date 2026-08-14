import { useMemo, useState } from 'react';
import { 
  Trash2, 
  Calendar, 
  Clock, 
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { GitHubRepo } from '../types';
import { formatAge, formatRelativeTime, formatRepoSize, getActivityLevel, getLanguageColor } from '../utils/github';

interface AuditViewProps {
  repos: GitHubRepo[];
  onDeleteClick: (repo: GitHubRepo) => void;
  onArchiveToggle: (repo: GitHubRepo, newArchivedState: boolean) => Promise<void>;
}

export function AuditView({ repos, onDeleteClick, onArchiveToggle }: AuditViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'dormant' | 'stale'>('all');

  const auditAnalysis = useMemo(() => {
    const active: GitHubRepo[] = [];
    const warm: GitHubRepo[] = [];
    const cool: GitHubRepo[] = [];
    const stale: GitHubRepo[] = [];
    const dormant: GitHubRepo[] = [];
    let totalStaleSizeKB = 0;

    repos.forEach((repo) => {
      const activity = getActivityLevel(repo.pushed_at, repo.created_at);
      if (activity.level === 'dormant') {
        dormant.push(repo);
        totalStaleSizeKB += repo.size;
      } else if (activity.level === 'stale') {
        stale.push(repo);
        totalStaleSizeKB += repo.size;
      } else if (activity.level === 'cool') {
        cool.push(repo);
      } else if (activity.level === 'warm') {
        warm.push(repo);
      } else {
        active.push(repo);
      }
    });

    const total = repos.length || 1;

    return {
      active,
      warm,
      cool,
      stale,
      dormant,
      totalStaleSizeKB,
      candidatesCount: dormant.length + stale.length,
      distribution: {
        activePct: (active.length / total) * 100,
        warmPct: (warm.length / total) * 100,
        coolPct: (cool.length / total) * 100,
        stalePct: (stale.length / total) * 100,
        dormantPct: (dormant.length / total) * 100,
      }
    };
  }, [repos]);

  const displayedList = useMemo(() => {
    if (filterType === 'dormant') return auditAnalysis.dormant;
    if (filterType === 'stale') return auditAnalysis.stale;
    return [...auditAnalysis.dormant, ...auditAnalysis.stale];
  }, [auditAnalysis, filterType]);

  return (
    <div className="space-y-6">
      {/* Top Header & Telemetry Strip */}
      <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-5 space-y-4 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-xl bg-[#ff6b6b] flex items-center justify-center -rotate-2 shadow-[3px_3px_0_#1a1a1a] shrink-0 text-white">
              <Trash2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a] dark:text-[#f0f6fc] leading-none">
                  Repository Lifecycle & Audit
                </h2>
                <span className="font-space text-xs font-bold px-2 py-0.5 rounded-md bg-[#ff6b6b]/20 text-[#9f1239] dark:text-[#ff7b72] border-2 border-[#ff6b6b] dark:border-[#ff7b72] shadow-[1px_1px_0_#1a1a1a]">
                  {auditAnalysis.candidatesCount} CANDIDATES
                </span>
              </div>
              <p className="text-xs text-[#555] dark:text-[#8b949e] font-medium mt-1">
                Pinpoint dormant and abandoned repositories. Safely archive or permanently remove to clean up your workspace.
              </p>
            </div>
          </div>

          <div className="bg-[#fffef2] dark:bg-[#21262d] px-4 py-2.5 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] shrink-0">
            <span className="text-[#666] dark:text-[#8b949e] mr-2">Reclaimable Footprint:</span>
            <span className="text-[#ff6b6b] dark:text-[#ff7b72] font-extrabold">{formatRepoSize(auditAnalysis.totalStaleSizeKB)}</span>
          </div>
        </div>

        {/* Activity Distribution Telemetry Bar */}
        <div className="space-y-2 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-space text-[#555] dark:text-[#8b949e] gap-2">
            <span className="font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">Portfolio Activity Breakdown ({repos.length} repos)</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-[#065f46] dark:text-[#39d353]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Active ({auditAnalysis.active.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#115e59] dark:text-[#4ecdc4]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ecdc4]" /> Recent ({auditAnalysis.warm.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#854d0e] dark:text-[#f0883e]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffcc5c]" /> Quiet ({auditAnalysis.cool.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#9a3412] dark:text-[#fb923c]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" /> Stale &gt;1y ({auditAnalysis.stale.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#9f1239] dark:text-[#ff7b72]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" /> Dormant &gt;2y ({auditAnalysis.dormant.length})
              </span>
            </div>
          </div>

          {/* Progress Bar Segments */}
          <div className="w-full h-3.5 bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-full overflow-hidden flex shadow-[1px_1px_0_#1a1a1a]">
            <div style={{ width: `${auditAnalysis.distribution.activePct}%` }} className="bg-[#10b981] h-full" title={`Active: ${auditAnalysis.active.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.warmPct}%` }} className="bg-[#4ecdc4] h-full" title={`Recent: ${auditAnalysis.warm.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.coolPct}%` }} className="bg-[#ffcc5c] h-full" title={`Quiet: ${auditAnalysis.cool.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.stalePct}%` }} className="bg-[#fb923c] h-full" title={`Stale: ${auditAnalysis.stale.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.dormantPct}%` }} className="bg-[#ff6b6b] h-full" title={`Dormant: ${auditAnalysis.dormant.length}`} />
          </div>
        </div>
      </div>

      {/* Filter Tabs for Audit */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-space font-bold border-2 border-[#1a1a1a] dark:border-[#30363d] transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#1a1a1a] dark:bg-[#f0f6fc] text-white dark:text-[#1a1a1a] shadow-[2px_2px_0_rgba(0,0,0,0.3)]'
              : 'bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a]'
          }`}
        >
          All Stale & Dormant ({auditAnalysis.candidatesCount})
        </button>
        <button
          onClick={() => setFilterType('dormant')}
          className={`px-3.5 py-2 rounded-xl text-xs font-space font-bold border-2 border-[#1a1a1a] dark:border-[#30363d] transition cursor-pointer ${
            filterType === 'dormant'
              ? 'bg-[#ff6b6b] text-white shadow-[2px_2px_0_#1a1a1a]'
              : 'bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a]'
          }`}
        >
          Dormant &gt;2y ({auditAnalysis.dormant.length})
        </button>
        <button
          onClick={() => setFilterType('stale')}
          className={`px-3.5 py-2 rounded-xl text-xs font-space font-bold border-2 border-[#1a1a1a] dark:border-[#30363d] transition cursor-pointer ${
            filterType === 'stale'
              ? 'bg-[#fb923c] text-white shadow-[2px_2px_0_#1a1a1a]'
              : 'bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a]'
          }`}
        >
          Stale 1-2y ({auditAnalysis.stale.length})
        </button>
      </div>

      {/* Audit List */}
      {displayedList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] text-center space-y-3 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000]">
          <div className="w-14 h-14 rounded-2xl bg-[#10b981]/20 border-2 border-[#10b981] flex items-center justify-center text-[#065f46] dark:text-[#39d353] mx-auto shadow-[3px_3px_0_#1a1a1a]">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h4 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">Clean Workspace</h4>
          <p className="text-xs text-[#555] dark:text-[#8b949e] font-medium">No repositories meet the selected stale threshold.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedList.map((repo) => {
            const age = formatAge(repo.created_at);
            const activity = getActivityLevel(repo.pushed_at, repo.created_at);
            const langColor = getLanguageColor(repo.language);
            const isDormant = activity.level === 'dormant';

            return (
              <div
                key={repo.id}
                id={`audit-repo-${repo.id}`}
                className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-[20px] p-5 flex flex-col justify-between shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] dark:hover:shadow-[6px_6px_0_#000000] transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-extrabold text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] dark:hover:text-[#ff7b72] text-base truncate flex items-center gap-1.5 transition"
                      >
                        <span className="truncate">{repo.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0 stroke-[2.5]" />
                      </a>
                      <p className="text-xs text-[#555] dark:text-[#8b949e] mt-2 line-clamp-2 leading-relaxed font-normal">
                        {repo.description || <span className="italic text-[#999] dark:text-[#666]">No description</span>}
                      </p>
                    </div>

                    <span className={`shrink-0 font-space text-[10px] font-bold px-2 py-0.5 rounded-md border-2 ${
                      isDormant ? 'bg-[#ff6b6b]/20 text-[#9f1239] dark:text-[#ff7b72] border-[#ff6b6b]' : 'bg-[#fb923c]/20 text-[#9a3412] dark:text-[#fb923c] border-[#fb923c]'
                    }`}>
                      {isDormant ? 'DORMANT >2Y' : 'STALE >1Y'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-[#555] dark:text-[#8b949e] font-space flex-wrap">
                    {repo.language && (
                      <div className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/40 dark:border-white/30" style={{ backgroundColor: langColor }} />
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
                      <span>Created {age.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
                      <span className={isDormant ? 'text-[#ff6b6b] dark:text-[#ff7b72] font-bold' : 'text-[#fb923c] dark:text-[#fb923c] font-bold'}>
                        Last commit {formatRelativeTime(repo.pushed_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-space font-medium text-[#666] dark:text-[#8b949e]">
                    Disk size: {formatRepoSize(repo.size)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onArchiveToggle(repo, !repo.archived)}
                      className="px-3 py-1.5 rounded-xl text-xs font-space font-bold bg-[#fffef2] dark:bg-[#21262d] hover:bg-[#ffcc5c] dark:hover:bg-[#f0883e] dark:hover:text-black text-[#1a1a1a] dark:text-[#f0f6fc] transition border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      {repo.archived ? 'Unarchive' : 'Archive (Safe)'}
                    </button>

                    <button
                      onClick={() => onDeleteClick(repo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-space font-bold bg-[#ff6b6b] hover:bg-[#fa5252] text-white transition border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
