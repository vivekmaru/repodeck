import { useState, useMemo } from 'react';
import { 
  Star, 
  Search, 
  ExternalLink, 
  Table, 
  LayoutGrid, 
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { GitHubRepo } from '../types';
import { formatRelativeTime, getLanguageColor } from '../utils/github';

interface StarredReposProps {
  starred: GitHubRepo[];
  onUnstar: (repo: GitHubRepo) => Promise<boolean>;
  loading: boolean;
}

export function StarredRepos({ starred, onUnstar }: StarredReposProps) {
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortOrder, setSortOrder] = useState<'stars_desc' | 'stars_asc' | 'pushed_desc' | 'pushed_asc' | 'name_asc' | 'name_desc'>('stars_desc');
  const [unstarringId, setUnstarringId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    starred.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [starred]);

  const filteredStarred = useMemo(() => {
    return starred
      .filter((repo) => {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          !search ||
          repo.name.toLowerCase().includes(searchLower) ||
          repo.full_name.toLowerCase().includes(searchLower) ||
          (repo.description && repo.description.toLowerCase().includes(searchLower)) ||
          (repo.topics && repo.topics.some((t) => t.toLowerCase().includes(searchLower)));

        const matchesLang = selectedLanguage === 'all' || repo.language === selectedLanguage;

        return matchesSearch && matchesLang;
      })
      .sort((a, b) => {
        if (sortOrder === 'stars_desc') return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        if (sortOrder === 'stars_asc') return (a.stargazers_count || 0) - (b.stargazers_count || 0);
        if (sortOrder === 'pushed_desc') return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        if (sortOrder === 'pushed_asc') return new Date(a.pushed_at).getTime() - new Date(b.pushed_at).getTime();
        if (sortOrder === 'name_asc') return (a.full_name || a.name).localeCompare(b.full_name || b.name);
        if (sortOrder === 'name_desc') return (b.full_name || b.name).localeCompare(a.full_name || a.name);
        return 0;
      });
  }, [starred, search, selectedLanguage, sortOrder]);

  const handleUnstarClick = async (repo: GitHubRepo) => {
    setUnstarringId(repo.id);
    try {
      await onUnstar(repo);
    } finally {
      setUnstarringId(null);
    }
  };

  const handleColumnSort = (column: 'name' | 'stars' | 'pushed') => {
    if (column === 'stars') {
      setSortOrder(sortOrder === 'stars_desc' ? 'stars_asc' : 'stars_desc');
    } else if (column === 'pushed') {
      setSortOrder(sortOrder === 'pushed_desc' ? 'pushed_asc' : 'pushed_desc');
    } else if (column === 'name') {
      setSortOrder(sortOrder === 'name_asc' ? 'name_desc' : 'name_asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search starred repos by name, description or topic..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc] placeholder:text-[#888] dark:placeholder:text-[#666] focus:outline-none focus:bg-white dark:focus:bg-[#161b22] shadow-[2px_2px_0_#1a1a1a] transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Language Filter */}
            {availableLanguages.length > 0 && (
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold text-xs rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
              >
                <option value="all">Lang: All</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Selector */}
            <div className="flex items-center bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl px-3 shadow-[2px_2px_0_#1a1a1a]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] mr-1.5 shrink-0 stroke-[2.5]" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent border-0 text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold py-2 focus:outline-none font-space cursor-pointer"
              >
                <option value="stars_desc">⭐ Most Stars</option>
                <option value="stars_asc">🌟 Least Stars</option>
                <option value="pushed_desc">🕒 Recent Push</option>
                <option value="pushed_asc">⏳ Oldest Push</option>
                <option value="name_asc">🔤 Name (A-Z)</option>
                <option value="name_desc">🔤 Name (Z-A)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl p-0.5 shadow-[2px_2px_0_#1a1a1a]">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#4ecdc4] dark:bg-[#39d353] text-[#1a1a1a] font-bold shadow-[1px_1px_0_#1a1a1a]' : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
                }`}
              >
                <Table className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Grid View"
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-[#4ecdc4] dark:bg-[#39d353] text-[#1a1a1a] font-bold shadow-[1px_1px_0_#1a1a1a]' : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#555] dark:text-[#8b949e] pt-2 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10 font-space">
          <div>
            Showing <span className="text-[#1a1a1a] dark:text-[#f0f6fc] font-bold">{filteredStarred.length}</span> of{' '}
            <span className="text-[#1a1a1a] dark:text-[#f0f6fc] font-bold">{starred.length}</span> starred repositories
          </div>
          {(search || selectedLanguage !== 'all' || sortOrder !== 'stars_desc') && (
            <button 
              onClick={() => {
                setSearch('');
                setSelectedLanguage('all');
                setSortOrder('stars_desc');
              }} 
              className="text-[#ff6b6b] dark:text-[#ff7b72] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Content View */}
      {filteredStarred.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-12 text-center space-y-3 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000]">
          <div className="w-14 h-14 rounded-2xl bg-[#fffef2] dark:bg-[#21262d] border-[3px] border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f6fc] mx-auto shadow-[3px_3px_0_#1a1a1a]">
            <Star className="w-7 h-7 stroke-[2.5] fill-[#ffcc5c]" />
          </div>
          <h3 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">No starred repositories found</h3>
          <p className="text-xs text-[#555] dark:text-[#8b949e] font-medium">Try adjusting your search terms or language filter.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl overflow-hidden shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[3px] border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#0d1117] text-xs font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] select-none">
                <th 
                  className="py-3 px-4 cursor-pointer group/th hover:bg-[#fffae0] dark:hover:bg-[#21262d] transition"
                  onClick={() => handleColumnSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>REPOSITORY</span>
                    {sortOrder === 'name_asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" /> : sortOrder === 'name_desc' ? <ArrowDown className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" /> : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100" />}
                  </div>
                </th>
                <th className="py-3 px-4">LANGUAGE</th>
                <th 
                  className="py-3 px-4 cursor-pointer group/th hover:bg-[#fffae0] dark:hover:bg-[#21262d] transition"
                  onClick={() => handleColumnSort('stars')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>STARS</span>
                    {sortOrder === 'stars_desc' ? <ArrowDown className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" /> : sortOrder === 'stars_asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" /> : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100" />}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer group/th hover:bg-[#fffae0] dark:hover:bg-[#21262d] transition"
                  onClick={() => handleColumnSort('pushed')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>LAST PUSH</span>
                    {sortOrder === 'pushed_desc' ? <ArrowDown className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" /> : sortOrder === 'pushed_asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" /> : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-dashed divide-[#1a1a1a]/15 dark:divide-white/10 text-xs">
              {filteredStarred.map((repo) => {
                const langColor = getLanguageColor(repo.language);
                const isUnstarring = unstarringId === repo.id;

                return (
                  <tr key={repo.id} className="hover:bg-[#fffef2] dark:hover:bg-[#21262d]/60 text-[#1a1a1a] dark:text-[#f0f6fc] group transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <div className="min-w-0">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-extrabold text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] dark:hover:text-[#ff7b72] text-sm truncate flex items-center gap-1.5 transition"
                        >
                          <span className="truncate">{repo.full_name || repo.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0 stroke-[2.5]" />
                        </a>
                        {repo.description && (
                          <p className="text-xs text-[#555] dark:text-[#8b949e] truncate mt-0.5 font-normal">{repo.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-space text-xs">
                      {repo.language ? (
                        <div className="flex items-center gap-1.5 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                          <span className="w-2.5 h-2.5 rounded-full border border-black/40 dark:border-white/30" style={{ backgroundColor: langColor }} />
                          <span>{repo.language}</span>
                        </div>
                      ) : (
                        <span className="text-[#888] dark:text-[#8b949e]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-space text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#ffcc5c] text-[#1a1a1a] dark:text-[#ffcc5c] stroke-[2]" />
                        <span>{repo.stargazers_count.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-space text-xs font-medium text-[#666] dark:text-[#8b949e]">
                      {formatRelativeTime(repo.pushed_at)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleUnstarClick(repo)}
                        disabled={isUnstarring}
                        className="px-3 py-1.5 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#21262d] hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {isUnstarring ? (
                          <RefreshCw className="w-3 h-3 animate-spin stroke-[2.5]" />
                        ) : (
                          <Trash2 className="w-3 h-3 stroke-[2.5]" />
                        )}
                        <span>{isUnstarring ? 'Removing...' : 'Unstar'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStarred.map((repo) => {
            const langColor = getLanguageColor(repo.language);
            const isUnstarring = unstarringId === repo.id;

            return (
              <div
                key={repo.id}
                className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-5 shadow-[5px_5px_0_#1a1a1a] dark:shadow-[5px_5px_0_#000000] flex flex-col justify-between space-y-4 hover:-translate-y-1 transition duration-150"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-extrabold text-base text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] dark:hover:text-[#ff7b72] truncate flex items-center gap-1.5 flex-1"
                    >
                      <span className="truncate">{repo.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                    </a>
                  </div>

                  <p className="text-xs text-[#555] dark:text-[#8b949e] line-clamp-2 leading-relaxed">
                    {repo.description || 'No description available.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10 font-space text-xs">
                  <div className="flex items-center justify-between">
                    {repo.language ? (
                      <div className="flex items-center gap-1.5 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: langColor }} />
                        <span>{repo.language}</span>
                      </div>
                    ) : (
                      <span className="text-[#888] dark:text-[#8b949e]">Unknown</span>
                    )}

                    <div className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                      <Star className="w-3.5 h-3.5 fill-[#ffcc5c] text-[#1a1a1a] dark:text-[#ffcc5c] stroke-[2]" />
                      <span>{repo.stargazers_count.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#666] dark:text-[#8b949e]">
                      Pushed {formatRelativeTime(repo.pushed_at)}
                    </span>

                    <button
                      onClick={() => handleUnstarClick(repo)}
                      disabled={isUnstarring}
                      className="px-3 py-1.5 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#21262d] hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer inline-flex items-center gap-1"
                    >
                      {isUnstarring ? (
                        <RefreshCw className="w-3 h-3 animate-spin stroke-[2.5]" />
                      ) : (
                        <Trash2 className="w-3 h-3 stroke-[2.5]" />
                      )}
                      <span>Unstar</span>
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
