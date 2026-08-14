import { useState, useMemo } from 'react';
import { 
  Star, 
  Search, 
  ExternalLink, 
  Table, 
  LayoutGrid, 
  X 
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
  const [unstarringId, setUnstarringId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    starred.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [starred]);

  const filteredStarred = useMemo(() => {
    return starred.filter((repo) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        repo.name.toLowerCase().includes(searchLower) ||
        repo.full_name.toLowerCase().includes(searchLower) ||
        (repo.description && repo.description.toLowerCase().includes(searchLower)) ||
        (repo.topics && repo.topics.some((t) => t.toLowerCase().includes(searchLower)));

      const matchesLang = selectedLanguage === 'all' || repo.language === selectedLanguage;

      return matchesSearch && matchesLang;
    });
  }, [starred, search, selectedLanguage]);

  const handleUnstarClick = async (repo: GitHubRepo) => {
    setUnstarringId(repo.id);
    try {
      await onUnstar(repo);
    } finally {
      setUnstarringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-5 space-y-4 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search starred repos by name, description or topic..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl text-xs font-space font-medium text-[#1a1a1a] dark:text-[#f0f6fc] placeholder:text-[#888] dark:placeholder:text-[#666] focus:outline-none focus:bg-white dark:focus:bg-[#161b22] shadow-[2px_2px_0_#1a1a1a] transition"
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

          <div className="flex items-center gap-2.5">
            {availableLanguages.length > 0 && (
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
              >
                <option value="all">Lang: All</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl p-1 shadow-[2px_2px_0_#1a1a1a]">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] font-bold border border-[#1a1a1a]' : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
                }`}
              >
                <Table className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Grid View"
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] font-bold border border-[#1a1a1a]' : 'text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white'
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
            <span className="text-[#1a1a1a] dark:text-[#f0f6fc] font-bold">{starred.length}</span> starred repos
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-[#ff6b6b] dark:text-[#ff7b72] font-bold hover:underline cursor-pointer">
              Clear search
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
                <th className="py-3 px-4">REPOSITORY</th>
                <th className="py-3 px-4">LANGUAGE</th>
                <th className="py-3 px-4">STARS</th>
                <th className="py-3 px-4">LAST PUSH</th>
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
                    <td className="py-3 px-4 whitespace-nowrap font-space text-xs text-[#1a1a1a] dark:text-[#f0f6fc] font-bold">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-[#ffcc5c] text-[#1a1a1a] dark:text-[#ffcc5c] stroke-[2]" />
                        <span>{repo.stargazers_count.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-space text-xs font-semibold text-[#555] dark:text-[#8b949e]">
                      {formatRelativeTime(repo.pushed_at)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleUnstarClick(repo)}
                        disabled={isUnstarring}
                        className="px-3 py-1 rounded-xl text-xs font-space font-bold bg-white dark:bg-[#21262d] hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] dark:text-[#f0f6fc] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                      >
                        {isUnstarring ? 'Unstarring...' : 'Unstar'}
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
                id={`starred-card-${repo.id}`}
                className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-[20px] p-5 shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] dark:hover:shadow-[6px_6px_0_#000000] transition flex flex-col justify-between"
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
                        <span className="truncate">{repo.full_name || repo.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0 stroke-[2.5]" />
                      </a>
                      <p className="text-xs text-[#555] dark:text-[#8b949e] mt-2 line-clamp-2 leading-relaxed font-normal">
                        {repo.description || <span className="italic text-[#999] dark:text-[#666]">No description</span>}
                      </p>
                    </div>

                    <button
                      onClick={() => handleUnstarClick(repo)}
                      disabled={isUnstarring}
                      title="Unstar repository"
                      className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center bg-[#fffef2] dark:bg-[#21262d] hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] dark:text-[#f0f6fc] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                    >
                      <Star className={`w-4 h-4 fill-[#ffcc5c] text-[#1a1a1a] dark:text-[#ffcc5c] stroke-[2] ${isUnstarring ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="text-[10px] font-space font-bold px-2 py-0.5 bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] border border-[#1a1a1a] dark:border-[#30363d] rounded-md"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10 flex items-center justify-between text-xs font-space text-[#555] dark:text-[#8b949e]">
                  <div className="flex items-center gap-3">
                    {repo.language && (
                      <div className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/40 dark:border-white/30" style={{ backgroundColor: langColor }} />
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <span className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                      <Star className="w-3.5 h-3.5 fill-[#ffcc5c] text-[#1a1a1a] dark:text-[#ffcc5c] stroke-[2]" />
                      <span>{repo.stargazers_count}</span>
                    </span>
                  </div>

                  <span className="font-semibold text-[#888] dark:text-[#8b949e]">Pushed {formatRelativeTime(repo.pushed_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
