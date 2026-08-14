import type { Dispatch, SetStateAction } from 'react';
import { Search, ArrowUpDown, LayoutGrid, Table, X } from 'lucide-react';
import { FilterOptions } from '../types';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: Dispatch<SetStateAction<FilterOptions>>;
  availableLanguages: string[];
  totalCount: number;
  filteredCount: number;
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
}

export function FilterBar({
  filters,
  setFilters,
  availableLanguages,
  totalCount,
  filteredCount,
  viewMode,
  setViewMode,
}: FilterBarProps) {
  const hasActiveFilters = 
    Boolean(filters.search) || 
    filters.visibility !== 'all' || 
    filters.type !== 'all' || 
    filters.activity !== 'all' || 
    filters.language !== 'all';

  return (
    <div className="bg-white border-[3px] border-[#1a1a1a] rounded-2xl p-4 shadow-[6px_6px_0_#1a1a1a] space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1a1a] stroke-[2.5]" />
          <input
            type="text"
            id="input-repo-search"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search repositories, topics, or descriptions (press / to focus)..."
            className="w-full pl-10 pr-14 py-2 bg-[#fffef2] border-2 border-[#1a1a1a] rounded-xl text-xs font-bold text-[#1a1a1a] placeholder:text-[#888] focus:outline-none focus:bg-white shadow-[2px_2px_0_#1a1a1a] transition"
          />
          {filters.search ? (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a] hover:text-[#ff6b6b] p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-space font-bold text-[#1a1a1a] bg-white border border-[#1a1a1a] rounded">
              /
            </kbd>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type / Source */}
          <select
            id="select-filter-type"
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as any }))}
            className="bg-[#fffef2] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white transition"
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
            className="bg-[#fffef2] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white transition"
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
            className="bg-[#fffef2] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white transition"
          >
            <option value="all">Activity: All</option>
            <option value="active">● Active (&lt;30d)</option>
            <option value="warm">● Recent (&lt;4m)</option>
            <option value="cool">● Quiet (&lt;1y)</option>
            <option value="stale">● Stale (&gt;1y)</option>
            <option value="dormant">● Dormant (&gt;2y)</option>
          </select>

          {/* Language */}
          {availableLanguages.length > 0 && (
            <select
              id="select-filter-language"
              value={filters.language}
              onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value }))}
              className="bg-[#fffef2] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none font-space shadow-[2px_2px_0_#1a1a1a] cursor-pointer hover:bg-white transition"
            >
              <option value="all">Lang: All</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          )}

          {/* Sort order */}
          <div className="flex items-center bg-[#fffef2] border-2 border-[#1a1a1a] rounded-xl px-2.5 shadow-[2px_2px_0_#1a1a1a]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#1a1a1a] mr-1.5 shrink-0 stroke-[2.5]" />
            <select
              id="select-sort-order"
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as any }))}
              className="bg-transparent border-0 text-[#1a1a1a] text-xs font-bold py-2 focus:outline-none font-space cursor-pointer"
            >
              <option value="pushed_desc">Recent Push</option>
              <option value="pushed_asc">Oldest Push (Stale)</option>
              <option value="created_desc">Newest Repo</option>
              <option value="created_asc">Oldest Repo</option>
              <option value="stars_desc">Most Stars</option>
              <option value="size_desc">Largest Disk Size</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-white border-2 border-[#1a1a1a] rounded-xl p-0.5 shadow-[2px_2px_0_#1a1a1a]">
            <button
              onClick={() => setViewMode('table')}
              title="Table View (Dense list)"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#4ecdc4] text-[#1a1a1a] font-bold shadow-[1px_1px_0_#1a1a1a]'
                  : 'text-[#666] hover:text-[#1a1a1a]'
              }`}
            >
              <Table className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#4ecdc4] text-[#1a1a1a] font-bold shadow-[1px_1px_0_#1a1a1a]'
                  : 'text-[#666] hover:text-[#1a1a1a]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary info and filter reset */}
      <div className="flex items-center justify-between text-xs font-space text-[#555] pt-2 border-t-2 border-dashed border-[#1a1a1a]/15">
        <div>
          [ SHOWING <span className="text-[#1a1a1a] font-bold">{filteredCount}</span> OF{' '}
          <span className="text-[#1a1a1a] font-bold">{totalCount}</span> REPOSITORIES ]
        </div>

        {hasActiveFilters && (
          <button
            onClick={() =>
              setFilters({
                search: '',
                visibility: 'all',
                type: 'all',
                activity: 'all',
                language: 'all',
                sort: 'pushed_desc',
              })
            }
            className="text-[#ff6b6b] hover:text-[#e04f4f] font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>RESET FILTERS</span>
          </button>
        )}
      </div>
    </div>
  );
}

