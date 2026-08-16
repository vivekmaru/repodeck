import { useMemo, useState } from 'react';
import { 
  Trash2, 
  Calendar, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GitHubRepo, AuditThresholdsConfig, AuditPresetId } from '../types';
import { 
  formatAge, 
  formatRelativeTime, 
  formatRepoSize, 
  getActivityLevel, 
  getLanguageColor,
  formatThresholdLabel,
  AUDIT_PRESETS,
  DEFAULT_AUDIT_CONFIG 
} from '../utils/github';

interface AuditViewProps {
  repos: GitHubRepo[];
  config?: AuditThresholdsConfig;
  onConfigChange?: (newConfig: AuditThresholdsConfig) => void;
  onDeleteClick: (repo: GitHubRepo) => void;
  onArchiveToggle: (repo: GitHubRepo, newArchivedState: boolean) => Promise<void>;
}

export function AuditView({ 
  repos, 
  config = DEFAULT_AUDIT_CONFIG, 
  onConfigChange, 
  onDeleteClick, 
  onArchiveToggle 
}: AuditViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'dormant' | 'stale'>('all');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const staleLabel = formatThresholdLabel(config.staleMonths);
  const dormantLabel = formatThresholdLabel(config.dormantMonths);
  const warmLabel = formatThresholdLabel(config.warmMonths);

  const auditAnalysis = useMemo(() => {
    const active: GitHubRepo[] = [];
    const warm: GitHubRepo[] = [];
    const cool: GitHubRepo[] = [];
    const stale: GitHubRepo[] = [];
    const dormant: GitHubRepo[] = [];
    let totalStaleSizeKB = 0;

    repos.forEach((repo) => {
      const activity = getActivityLevel(repo.pushed_at, repo.created_at, config, repo.updated_at);
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
  }, [repos, config]);

  const displayedList = useMemo(() => {
    if (filterType === 'dormant') return auditAnalysis.dormant;
    if (filterType === 'stale') return auditAnalysis.stale;
    return [...auditAnalysis.dormant, ...auditAnalysis.stale];
  }, [auditAnalysis, filterType]);

  const applyPreset = (presetId: AuditPresetId) => {
    if (presetId === 'custom') {
      onConfigChange?.({
        ...config,
        presetId: 'custom',
      });
      return;
    }
    const preset = AUDIT_PRESETS[presetId];
    if (preset) {
      onConfigChange?.({
        presetId,
        ...preset.config,
      });
    }
  };

  const handleStaleChange = (months: number) => {
    const validMonths = Math.max(1, Math.min(60, months));
    const newDormant = Math.max(validMonths + 1, config.dormantMonths);
    onConfigChange?.({
      ...config,
      presetId: 'custom',
      staleMonths: validMonths,
      dormantMonths: newDormant,
    });
  };

  const handleDormantChange = (months: number) => {
    const validMonths = Math.max(config.staleMonths + 1, Math.min(120, months));
    onConfigChange?.({
      ...config,
      presetId: 'custom',
      dormantMonths: validMonths,
    });
  };

  const handleDateFieldChange = (dateField: 'pushed_at' | 'updated_at') => {
    onConfigChange?.({
      ...config,
      dateField,
    });
  };

  const resetToDefaults = () => {
    onConfigChange?.(DEFAULT_AUDIT_CONFIG);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Telemetry Strip */}
      <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-5 space-y-4 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-xl bg-[#ff6b6b] flex items-center justify-center -rotate-2 shadow-[3px_3px_0_#1a1a1a] shrink-0 text-white">
              <Trash2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a] dark:text-[#f0f6fc] leading-none">
                  Repository Lifecycle & Audit
                </h2>
                <span className="font-space text-xs font-bold px-2 py-0.5 rounded-md bg-[#ff6b6b]/20 text-[#9f1239] dark:text-[#ff7b72] border-2 border-[#ff6b6b] dark:border-[#ff7b72] shadow-[1px_1px_0_#1a1a1a]">
                  {auditAnalysis.candidatesCount} CANDIDATES
                </span>
                <span className="font-space text-xs font-bold px-2 py-0.5 rounded-md bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] border-2 border-[#58a6ff]/40 shadow-[1px_1px_0_#1a1a1a]">
                  {AUDIT_PRESETS[config.presetId]?.name || `Stale >${staleLabel}, Dormant >${dormantLabel}`}
                </span>
              </div>
              <p className="text-xs text-[#555] dark:text-[#8b949e] font-medium mt-1">
                Pinpoint dormant and abandoned repositories based on configurable inactivity thresholds. Safely archive or delete to reclaim workspace storage.
              </p>
            </div>
          </div>

          {/* Action & Metric Bar */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            <button
              id="btn-configure-audit-period"
              onClick={() => setIsConfigOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-space font-bold border-2 border-[#1a1a1a] dark:border-[#30363d] transition cursor-pointer shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 ${
                isConfigOpen
                  ? 'bg-[#1a1a1a] dark:bg-[#f0f6fc] text-white dark:text-[#1a1a1a]'
                  : 'bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] hover:bg-white dark:hover:bg-[#30363d]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Configure Thresholds</span>
              {isConfigOpen ? (
                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>

            <div className="bg-[#fffef2] dark:bg-[#21262d] px-3.5 py-2 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] shrink-0">
              <span className="text-[#666] dark:text-[#8b949e] mr-2">Reclaimable Footprint:</span>
              <span className="text-[#ff6b6b] dark:text-[#ff7b72] font-extrabold">{formatRepoSize(auditAnalysis.totalStaleSizeKB)}</span>
            </div>
          </div>
        </div>

        {/* Expandable Configuration Drawer / Panel */}
        {isConfigOpen && (
          <div 
            id="audit-period-config-panel"
            className="p-5 rounded-2xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#000000] space-y-5 transition"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10 pb-3">
              <div>
                <h3 className="font-heading text-sm sm:text-base font-bold text-[#1a1a1a] dark:text-[#f0f6fc] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#ff6b6b] stroke-[2.5]" />
                  Audit Inactivity Period &amp; Criteria Settings
                </h3>
                <p className="text-xs text-[#555] dark:text-[#8b949e] mt-0.5">
                  Choose an established preset or calibrate custom monthly inactivity windows. Settings persist automatically.
                </p>
              </div>
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-space font-bold rounded-lg border border-[#1a1a1a] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#555] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-[#f0f6fc] shadow-[1px_1px_0_#1a1a1a] cursor-pointer"
                title="Reset to Standard (1y / 2y)"
              >
                <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] uppercase tracking-wider block">
                1. Select Cleanup Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {(Object.keys(AUDIT_PRESETS) as AuditPresetId[])
                  .filter((p) => p !== 'custom')
                  .map((presetKey) => {
                    const preset = AUDIT_PRESETS[presetKey];
                    const isSelected = config.presetId === presetKey;
                    return (
                      <button
                        key={presetKey}
                        onClick={() => applyPreset(presetKey)}
                        className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#1a1a1a] dark:bg-[#f0f6fc] text-white dark:text-[#1a1a1a] border-[#1a1a1a] dark:border-[#f0f6fc] shadow-[3px_3px_0_#ff6b6b]'
                            : 'bg-white dark:bg-[#161b22] text-[#1a1a1a] dark:text-[#f0f6fc] border-[#1a1a1a] dark:border-[#30363d] hover:bg-[#fafafa] dark:hover:bg-[#21262d] shadow-[2px_2px_0_#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-heading font-extrabold text-xs">{preset.name}</span>
                          <span className={`text-[10px] font-space font-bold px-1.5 py-0.5 rounded border ${
                            isSelected 
                              ? 'bg-[#ff6b6b] text-white border-white/20' 
                              : 'bg-[#1a1a1a]/5 dark:bg-white/10 border-[#1a1a1a]/20 dark:border-white/20'
                          }`}>
                            {preset.badge}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-tight ${isSelected ? 'text-white/80 dark:text-black/80' : 'text-[#666] dark:text-[#8b949e]'}`}>
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Custom Sliders & Range Controls */}
            <div className="space-y-4 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] uppercase tracking-wider">
                  2. Fine-tune Inactivity Periods (Months)
                </label>
                {config.presetId === 'custom' && (
                  <span className="text-[11px] font-space font-bold text-[#f0883e] dark:text-[#ffcc5c]">
                    ● Custom Profile Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Stale Threshold Slider */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border-2 border-[#1a1a1a] dark:border-[#30363d] space-y-3 shadow-[2px_2px_0_#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-bold text-[#1a1a1a] dark:text-[#f0f6fc] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" />
                      Stale Inactivity Threshold
                    </span>
                    <span className="font-space font-extrabold text-xs px-2 py-0.5 rounded-md bg-[#fb923c]/20 text-[#9a3412] dark:text-[#fb923c] border border-[#fb923c]">
                      {config.staleMonths} mo ({formatThresholdLabel(config.staleMonths)})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={36}
                      step={1}
                      value={config.staleMonths}
                      onChange={(e) => handleStaleChange(Number(e.target.value))}
                      className="w-full accent-[#fb923c] cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStaleChange(config.staleMonths - 1)}
                        disabled={config.staleMonths <= 1}
                        className="w-6 h-6 flex items-center justify-center font-space font-bold text-xs bg-[#fffef2] dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] rounded hover:bg-[#fafafa] dark:hover:bg-[#30363d] disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleStaleChange(config.staleMonths + 1)}
                        disabled={config.staleMonths >= 36}
                        className="w-6 h-6 flex items-center justify-center font-space font-bold text-xs bg-[#fffef2] dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] rounded hover:bg-[#fafafa] dark:hover:bg-[#30363d] disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#666] dark:text-[#8b949e]">
                    Repositories with no activity for &gt;{formatThresholdLabel(config.staleMonths)} are flagged as stale cleanup candidates.
                  </p>
                </div>

                {/* Dormant Threshold Slider */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border-2 border-[#1a1a1a] dark:border-[#30363d] space-y-3 shadow-[2px_2px_0_#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-bold text-[#1a1a1a] dark:text-[#f0f6fc] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" />
                      Dormant Inactivity Threshold
                    </span>
                    <span className="font-space font-extrabold text-xs px-2 py-0.5 rounded-md bg-[#ff6b6b]/20 text-[#9f1239] dark:text-[#ff7b72] border border-[#ff6b6b]">
                      {config.dormantMonths} mo ({formatThresholdLabel(config.dormantMonths)})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={config.staleMonths + 1}
                      max={60}
                      step={1}
                      value={config.dormantMonths}
                      onChange={(e) => handleDormantChange(Number(e.target.value))}
                      className="w-full accent-[#ff6b6b] cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDormantChange(config.dormantMonths - 1)}
                        disabled={config.dormantMonths <= config.staleMonths + 1}
                        className="w-6 h-6 flex items-center justify-center font-space font-bold text-xs bg-[#fffef2] dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] rounded hover:bg-[#fafafa] dark:hover:bg-[#30363d] disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleDormantChange(config.dormantMonths + 1)}
                        disabled={config.dormantMonths >= 60}
                        className="w-6 h-6 flex items-center justify-center font-space font-bold text-xs bg-[#fffef2] dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] rounded hover:bg-[#fafafa] dark:hover:bg-[#30363d] disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#666] dark:text-[#8b949e]">
                    Repositories with no activity for &gt;{formatThresholdLabel(config.dormantMonths)} are flagged as dormant (prime delete candidates).
                  </p>
                </div>
              </div>
            </div>

            {/* Inactivity Basis & Save Bar */}
            <div className="pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-space">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">Inactivity Metric:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDateFieldChange('pushed_at')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      config.dateField === 'pushed_at'
                        ? 'bg-[#1a1a1a] dark:bg-[#f0f6fc] text-white dark:text-[#1a1a1a] border-[#1a1a1a]'
                        : 'bg-white dark:bg-[#21262d] text-[#555] dark:text-[#8b949e] border-[#1a1a1a]/20 dark:border-[#30363d]'
                    }`}
                  >
                    Last Commit (pushed_at)
                  </button>
                  <button
                    onClick={() => handleDateFieldChange('updated_at')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      config.dateField === 'updated_at'
                        ? 'bg-[#1a1a1a] dark:bg-[#f0f6fc] text-white dark:text-[#1a1a1a] border-[#1a1a1a]'
                        : 'bg-white dark:bg-[#21262d] text-[#555] dark:text-[#8b949e] border-[#1a1a1a]/20 dark:border-[#30363d]'
                    }`}
                  >
                    Last GitHub Activity (updated_at)
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-1.5 rounded-xl font-bold bg-[#10b981] hover:bg-[#059669] text-white border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Activity Distribution Telemetry Bar */}
        <div className="space-y-2 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-space text-[#555] dark:text-[#8b949e] gap-2">
            <span className="font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">Portfolio Activity Breakdown ({repos.length} repos)</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-[#065f46] dark:text-[#39d353]" title={`Active within last ${config.activeDays} days`}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Active ({auditAnalysis.active.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#115e59] dark:text-[#4ecdc4]" title={`Active within last ${warmLabel}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ecdc4]" /> Recent ({auditAnalysis.warm.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#854d0e] dark:text-[#f0883e]" title={`Active within last ${staleLabel}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffcc5c]" /> Quiet ({auditAnalysis.cool.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#9a3412] dark:text-[#fb923c]" title={`No activity in ${staleLabel} to ${dormantLabel}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" /> Stale &gt;{staleLabel} ({auditAnalysis.stale.length})
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#9f1239] dark:text-[#ff7b72]" title={`No activity in over ${dormantLabel}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" /> Dormant &gt;{dormantLabel} ({auditAnalysis.dormant.length})
              </span>
            </div>
          </div>

          {/* Progress Bar Segments */}
          <div className="w-full h-3.5 bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-full overflow-hidden flex shadow-[1px_1px_0_#1a1a1a]">
            <div style={{ width: `${auditAnalysis.distribution.activePct}%` }} className="bg-[#10b981] h-full" title={`Active (<${config.activeDays}d): ${auditAnalysis.active.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.warmPct}%` }} className="bg-[#4ecdc4] h-full" title={`Recent (<${warmLabel}): ${auditAnalysis.warm.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.coolPct}%` }} className="bg-[#ffcc5c] h-full" title={`Quiet (<${staleLabel}): ${auditAnalysis.cool.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.stalePct}%` }} className="bg-[#fb923c] h-full" title={`Stale (>${staleLabel}): ${auditAnalysis.stale.length}`} />
            <div style={{ width: `${auditAnalysis.distribution.dormantPct}%` }} className="bg-[#ff6b6b] h-full" title={`Dormant (>${dormantLabel}): ${auditAnalysis.dormant.length}`} />
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
          All Stale &amp; Dormant ({auditAnalysis.candidatesCount})
        </button>
        <button
          onClick={() => setFilterType('dormant')}
          className={`px-3.5 py-2 rounded-xl text-xs font-space font-bold border-2 border-[#1a1a1a] dark:border-[#30363d] transition cursor-pointer ${
            filterType === 'dormant'
              ? 'bg-[#ff6b6b] text-white shadow-[2px_2px_0_#1a1a1a]'
              : 'bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a]'
          }`}
        >
          Dormant &gt;{dormantLabel} ({auditAnalysis.dormant.length})
        </button>
        <button
          onClick={() => setFilterType('stale')}
          className={`px-3.5 py-2 rounded-xl text-xs font-space font-bold border-2 border-[#1a1a1a] dark:border-[#30363d] transition cursor-pointer ${
            filterType === 'stale'
              ? 'bg-[#fb923c] text-white shadow-[2px_2px_0_#1a1a1a]'
              : 'bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a]'
          }`}
        >
          Stale {staleLabel}-{dormantLabel} ({auditAnalysis.stale.length})
        </button>
      </div>

      {/* Audit List */}
      {displayedList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] text-center space-y-3 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000]">
          <div className="w-14 h-14 rounded-2xl bg-[#10b981]/20 border-2 border-[#10b981] flex items-center justify-center text-[#065f46] dark:text-[#39d353] mx-auto shadow-[3px_3px_0_#1a1a1a]">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h4 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">Clean Workspace</h4>
          <p className="text-xs text-[#555] dark:text-[#8b949e] font-medium">
            No repositories meet the current inactivity threshold (Stale &gt;{staleLabel}, Dormant &gt;{dormantLabel}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedList.map((repo) => {
            const age = formatAge(repo.created_at);
            const activity = getActivityLevel(repo.pushed_at, repo.created_at, config, repo.updated_at);
            const langColor = getLanguageColor(repo.language);
            const isDormant = activity.level === 'dormant';
            const relevantDate = config.dateField === 'updated_at' ? repo.updated_at : repo.pushed_at;

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
                      {isDormant ? `DORMANT >${dormantLabel.toUpperCase()}` : `STALE >${staleLabel.toUpperCase()}`}
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
                        {config.dateField === 'updated_at' ? 'Last activity ' : 'Last commit '}
                        {formatRelativeTime(relevantDate)}
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
