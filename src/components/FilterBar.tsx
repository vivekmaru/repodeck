import type { Dispatch, SetStateAction } from 'react';
import { Search, ArrowUpDown, LayoutGrid, Table, X, Sparkles, Zap, Brain, RefreshCw, Layers, SlidersHorizontal, ArrowDownAZ } from 'lucide-react';
import { FilterOptions, AuditThresholdsConfig } from '../types';
import { formatThresholdLabel } from '../utils/github';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: Dispatch<SetStateAction<FilterOptions>>;
  availableLanguages: string[];
  totalCount: number;
  filteredCount: number;
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
  searchLatency?: number | null;
  onReindexEmbeddings?: () => Promise<void>;
  isReindexing?: boolean;
  auditConfig?: AuditThresholdsConfig;
}

export function FilterBar({
  filters,
  setFilters,
  availableLanguages,
  totalCount,
  filteredCount,
  viewMode,
  setViewMode,
  searchLatency,
  onReindexEmbeddings,
  isReindexing,
  auditConfig,
}: FilterBarProps) {
  const currentSearchMode = filters.searchMode || 'hybrid';
  const staleLabel = formatThresholdLabel(auditConfig?.staleMonths || 12);
  const dormantLabel = formatThresholdLabel(auditConfig?.dormantMonths || 24);
  const warmLabel = formatThresholdLabel(auditConfig?.warmMonths || 4);

  const activeFacetCount = [
    Boolean(filters.search),
    filters.visibility !== 'all',
    filters.type !== 'all',
    filters.activity !== 'all',
    filters.language !== 'all',
    filters.sort !== 'pushed_desc',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFacetCount > 0;

  return (
    <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-4 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] space-y-3.5 transition">
      {/* Tier 1: Search & Engine Strategy */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Main Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
          <input
            type="text"
            id="input-repo-search"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder={
              currentSearchMode === 'hybrid'
                ? 'Search repositories by keyword, concept, or stack (e.g. "auth middleware", "python api", "audio")...'
                : currentSearchMode === 'semantic'
                ? 'Semantic search by intent, architecture, or purpose...'
                : 'Exact keyword search by token (SQLite FTS5)...'
            }
            className="w-full pl-10 pr-14 py-2.5 bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc] placeholder:text-[#777] dark:placeholder:text-[#8b949e] focus:outline-none focus:bg-white dark:focus:bg-[#161b22] focus:border-[#58a6ff] shadow-[2px_2px_0_#1a1a1a] transition"
          />
          {filters.search ? (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] p-0.5 cursor-pointer"
              title="Clear search query"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] bg-white dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] rounded shadow-[1px_1px_0_#1a1a1a]">
              /
            </kbd>
          )}
        </div>

        {/* Search Mode Segmented Pills */}
        <div className="flex items-center bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl p-1 shadow-[2px_2px_0_#1a1a1a] shrink-0 gap-1">
          <span className="text-[10px] font-space font-bold text-[#777] dark:text-[#8b949e] px-2 hidden sm:inline flex items-center gap-1">
            <Layers className="w-3 h-3" />
            MODE:
          </span>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, searchMode: 'hybrid' }))}
            title="Smart Hybrid: Blends exact keyword tokens with dense semantic embeddings via Reciprocal Rank Fusion"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-space font-bold transition cursor-pointer flex items-center gap-1.5 ${
              currentSearchMode === 'hybrid'
                ? 'bg-purple-600 text-white shadow-[1px_1px_0_#1a1a1a]'
                : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hybrid</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, searchMode: 'fts' }))}
            title="Exact Match: Fast SQLite FTS5 BM25 tokenized keyword search (<1ms)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-space font-bold transition cursor-pointer flex items-center gap-1.5 ${
              currentSearchMode === 'fts'
                ? 'bg-amber-500 text-black shadow-[1px_1px_0_#1a1a1a]'
                : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Exact</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, searchMode: 'semantic' }))}
            title="Semantic AI: Dense vector embedding matching for concepts and tech stacks"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-space font-bold transition cursor-pointer flex items-center gap-1.5 ${
              currentSearchMode === 'semantic'
                ? 'bg-indigo-600 text-white shadow-[1px_1px_0_#1a1a1a]'
                : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Semantic</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Refinement Facets + Ordering & Layout */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-[#1a1a1a]/10 dark:border-white/10">
        {/* Facet Group with Visual Indicator */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-space font-bold text-[#777] dark:text-[#8b949e] mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>FACETS:</span>
          </div>

          {/* Type / Source */}
          <select
            id="select-filter-type"
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as any }))}
            className="bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#58a6ff] font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white dark:hover:bg-[#30363d] transition"
          >
            <option value="all">Sources: All</option>
            <option value="owned">Sources: Owned</option>
            <option value="forked">Sources: Forks</option>
            <option value="archived">Sources: Archived</option>
          </select>

          {/* Visibility */}
          <select
            id="select-filter-visibility"
            value={filters.visibility}
            onChange={(e) => setFilters((prev) => ({ ...prev, visibility: e.target.value as any }))}
            className="bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#58a6ff] font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white dark:hover:bg-[#30363d] transition"
          >
            <option value="all">Vis: All</option>
            <option value="public">Vis: Public</option>
            <option value="private">Vis: Private</option>
          </select>

          {/* Activity Tier */}
          <select
            id="select-filter-activity"
            value={filters.activity}
            onChange={(e) => setFilters((prev) => ({ ...prev, activity: e.target.value as any }))}
            className="bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#58a6ff] font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white dark:hover:bg-[#30363d] transition"
          >
            <option value="all">Activity: All</option>
            <option value="active">● Active (&lt;{auditConfig?.activeDays || 30}d)</option>
            <option value="warm">● Recent (&lt;{warmLabel})</option>
            <option value="cool">● Quiet (&lt;{staleLabel})</option>
            <option value="stale">● Stale (&gt;{staleLabel})</option>
            <option value="dormant">● Dormant (&gt;{dormantLabel})</option>
          </select>

          {/* Language */}
          {availableLanguages.length > 0 && (
            <select
              id="select-filter-language"
              value={filters.language}
              onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value }))}
              className="bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#58a6ff] font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white dark:hover:bg-[#30363d] transition"
            >
              <option value="all">Language: All</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right Side: Sort & View Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
          {/* Sort Selector */}
          <div className="flex items-center bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl px-2.5 shadow-[2px_2px_0_#1a1a1a]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] mr-1.5 shrink-0 stroke-[2.5]" />
            <select
              id="select-sort-order"
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as any }))}
              className="bg-transparent border-0 text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold py-1.5 focus:outline-none font-space cursor-pointer"
            >
              <optgroup label="Activity / Commits">
                <option value="pushed_desc">🕒 Recent Push</option>
                <option value="pushed_asc">⏳ Oldest Push (Stale)</option>
              </optgroup>
              <optgroup label="Popularity & Size">
                <option value="stars_desc">⭐ Most Stars</option>
                <option value="stars_asc">🌟 Least Stars</option>
                <option value="forks_desc">🍴 Most Forks</option>
                <option value="size_desc">💾 Largest Size</option>
                <option value="size_asc">📦 Smallest Size</option>
              </optgroup>
              <optgroup label="Creation Date & Name">
                <option value="created_desc">🆕 Newest Repo</option>
                <option value="created_asc">📜 Oldest Repo</option>
                <option value="name_asc">🔤 Name (A-Z)</option>
                <option value="name_desc">🔤 Name (Z-A)</option>
              </optgroup>
            </select>
          </div>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl p-0.5 shadow-[2px_2px_0_#1a1a1a]">
            <button
              onClick={() => setViewMode('table')}
              title="Table View (Dense keyboard-navigable list)"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#4ecdc4] dark:bg-[#39d353] text-[#1a1a1a] font-bold shadow-[1px_1px_0_#1a1a1a]'
                  : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
              }`}
            >
              <Table className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Grid Card View (Visual cards with language distributions)"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#4ecdc4] dark:bg-[#39d353] text-[#1a1a1a] font-bold shadow-[1px_1px_0_#1a1a1a]'
                  : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier 3: Telemetry & State Status */}
      <div className="flex flex-wrap items-center justify-between text-xs font-space font-bold text-[#666] dark:text-[#8b949e] pt-1.5 border-t border-[#1a1a1a]/10 dark:border-white/10 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div>
            Showing <span className="text-[#1a1a1a] dark:text-[#f0f6fc] font-extrabold font-mono tabular-nums">{filteredCount}</span> of{' '}
            <span className="text-[#1a1a1a] dark:text-[#f0f6fc] font-extrabold font-mono tabular-nums">{totalCount}</span> repositories
          </div>

          {/* Search Latency Telemetry Pill */}
          {filters.search && typeof searchLatency === 'number' && (
            <span className="px-2 py-0.5 rounded-md bg-[#fffef2] dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] text-[11px] text-[#1a1a1a] dark:text-[#f0f6fc] inline-flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{searchLatency.toFixed(1)}ms</span>
              <span className="text-[#888] dark:text-[#8b949e]">({currentSearchMode.toUpperCase()})</span>
            </span>
          )}

          {/* Re-index Embeddings Trigger */}
          {onReindexEmbeddings && (
            <button
              type="button"
              onClick={onReindexEmbeddings}
              disabled={isReindexing}
              title="Re-compute local vector embeddings for all repositories"
              className="text-[11px] text-[#777] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white underline cursor-pointer inline-flex items-center gap-1 transition"
            >
              {isReindexing ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#4ecdc4]" />
                  <span className="text-[#4ecdc4]">Re-indexing vectors...</span>
                </>
              ) : (
                <span>Re-index Vectors</span>
              )}
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() =>
              setFilters({
                search: '',
                searchMode: currentSearchMode,
                visibility: 'all',
                type: 'all',
                activity: 'all',
                language: 'all',
                sort: 'pushed_desc',
              })
            }
            className="text-xs font-bold text-[#ff6b6b] hover:underline flex items-center gap-1 cursor-pointer transition"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            Reset {activeFacetCount} active filter{activeFacetCount > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  );
}

