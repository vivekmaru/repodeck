import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), '.repodeck');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'repodeck.db');
export const db = new DatabaseSync(dbPath);

// Enable high-performance SQLite PRAGMAs
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = -64000;
  PRAGMA temp_store = MEMORY;
  PRAGMA foreign_keys = ON;
`);

// Initialize Database Schema
db.exec(`
  -- 1. HTTP ETag & Response Cache Table
  CREATE TABLE IF NOT EXISTS http_cache (
    key TEXT PRIMARY KEY,
    etag TEXT,
    data TEXT NOT NULL,
    status INTEGER NOT NULL,
    headers_json TEXT,
    cached_at INTEGER NOT NULL,
    ttl_ms INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_http_cache_cached_at ON http_cache(cached_at);

  -- 2. Repositories Relational Table
  CREATE TABLE IF NOT EXISTS repositories (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    owner_login TEXT NOT NULL,
    owner_avatar TEXT,
    owner_html_url TEXT,
    description TEXT,
    private INTEGER NOT NULL,
    fork INTEGER NOT NULL,
    parent_name TEXT,
    parent_full_name TEXT,
    parent_html_url TEXT,
    parent_branch TEXT,
    parent_owner_login TEXT,
    parent_owner_avatar TEXT,
    parent_owner_html_url TEXT,
    default_branch TEXT NOT NULL,
    html_url TEXT NOT NULL,
    language TEXT,
    languages_json TEXT,
    topics_json TEXT,
    stargazers_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    size_kb INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    pushed_at TEXT NOT NULL,
    behind_by INTEGER DEFAULT 0,
    ahead_by INTEGER DEFAULT 0,
    drift_status TEXT DEFAULT 'up_to_date',
    synced_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_repos_user_pushed ON repositories(user_id, pushed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_repos_user_fork ON repositories(user_id, fork);

  -- 3. FTS5 Full-Text Virtual Table with BM25 Indexing
  CREATE VIRTUAL TABLE IF NOT EXISTS repos_fts USING fts5(
    name,
    full_name,
    description,
    topics,
    language,
    content='repositories',
    content_rowid='id',
    tokenize='porter unicode61 remove_diacritics 1'
  );

  -- 4. Triggers to keep FTS5 synchronized with repositories
  CREATE TRIGGER IF NOT EXISTS repos_ai AFTER INSERT ON repositories BEGIN
    INSERT INTO repos_fts(rowid, name, full_name, description, topics, language)
    VALUES (new.id, new.name, new.full_name, coalesce(new.description, ''), coalesce(new.topics_json, ''), coalesce(new.language, ''));
  END;

  CREATE TRIGGER IF NOT EXISTS repos_ad AFTER DELETE ON repositories BEGIN
    INSERT INTO repos_fts(repos_fts, rowid, name, full_name, description, topics, language)
    VALUES('delete', old.id, old.name, old.full_name, coalesce(old.description, ''), coalesce(old.topics_json, ''), coalesce(old.language, ''));
  END;

  CREATE TRIGGER IF NOT EXISTS repos_au AFTER UPDATE ON repositories BEGIN
    INSERT INTO repos_fts(repos_fts, rowid, name, full_name, description, topics, language)
    VALUES('delete', old.id, old.name, old.full_name, coalesce(old.description, ''), coalesce(old.topics_json, ''), coalesce(old.language, ''));
    INSERT INTO repos_fts(rowid, name, full_name, description, topics, language)
    VALUES (new.id, new.name, new.full_name, coalesce(new.description, ''), coalesce(new.topics_json, ''), coalesce(new.language, ''));
  END;

  -- 5. Starred Repositories Table
  CREATE TABLE IF NOT EXISTS starred_repos (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    repo_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    data_json TEXT NOT NULL,
    synced_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_starred_user ON starred_repos(user_id);

  -- 6. Branches Cache Table
  CREATE TABLE IF NOT EXISTS branches_cache (
    repo_full_name TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    data_json TEXT NOT NULL,
    synced_at INTEGER NOT NULL,
    PRIMARY KEY (repo_full_name, branch_name)
  );

  -- 7. Dense Vector Embeddings Table (384-dimensional Float32Array)
  CREATE TABLE IF NOT EXISTS vector_embeddings (
    repo_id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    embedding_blob BLOB NOT NULL,
    dimensions INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_embeddings_user ON vector_embeddings(user_id);
`);

// Prepared statement helpers for performance
export const stmts = {
  // HTTP Cache
  getHttpCache: db.prepare('SELECT etag, data, status, headers_json, cached_at, ttl_ms FROM http_cache WHERE key = ?'),
  setHttpCache: db.prepare(`
    INSERT OR REPLACE INTO http_cache (key, etag, data, status, headers_json, cached_at, ttl_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  deleteExpiredHttpCache: db.prepare('DELETE FROM http_cache WHERE cached_at + ttl_ms < ?'),

  // Repositories
  getUserRepos: db.prepare('SELECT * FROM repositories WHERE user_id = ? ORDER BY pushed_at DESC'),
  getRepoById: db.prepare('SELECT * FROM repositories WHERE id = ? AND user_id = ?'),
  upsertRepo: db.prepare(`
    INSERT OR REPLACE INTO repositories (
      id, user_id, name, full_name, owner_login, owner_avatar, owner_html_url,
      description, private, fork, parent_name, parent_full_name, parent_html_url,
      parent_branch, parent_owner_login, parent_owner_avatar, parent_owner_html_url,
      default_branch, html_url, language, languages_json, topics_json,
      stargazers_count, forks_count, open_issues_count, archived, size_kb,
      created_at, updated_at, pushed_at, behind_by, ahead_by, drift_status, synced_at
    ) VALUES (
      @id, @user_id, @name, @full_name, @owner_login, @owner_avatar, @owner_html_url,
      @description, @private, @fork, @parent_name, @parent_full_name, @parent_html_url,
      @parent_branch, @parent_owner_login, @parent_owner_avatar, @parent_owner_html_url,
      @default_branch, @html_url, @language, @languages_json, @topics_json,
      @stargazers_count, @forks_count, @open_issues_count, @archived, @size_kb,
      @created_at, @updated_at, @pushed_at, @behind_by, @ahead_by, @drift_status, @synced_at
    )
  `),
  deleteRepo: db.prepare('DELETE FROM repositories WHERE user_id = ? AND owner_login = ? AND name = ?'),
  deleteRepoById: db.prepare('DELETE FROM repositories WHERE user_id = ? AND id = ?'),
  updateRepoArchived: db.prepare('UPDATE repositories SET archived = ?, updated_at = ? WHERE user_id = ? AND owner_login = ? AND name = ?'),
  updateForkStatus: db.prepare(`
    UPDATE repositories 
    SET behind_by = @behind_by, ahead_by = @ahead_by, drift_status = @drift_status, synced_at = @synced_at
    WHERE user_id = @user_id AND id = @id
  `),

  // Starred Repos
  getUserStarred: db.prepare('SELECT data_json FROM starred_repos WHERE user_id = ? ORDER BY synced_at DESC'),
  upsertStarred: db.prepare(`
    INSERT OR REPLACE INTO starred_repos (id, user_id, repo_id, full_name, data_json, synced_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  deleteStarred: db.prepare('DELETE FROM starred_repos WHERE user_id = ? AND full_name = ?'),
  clearUserStarred: db.prepare('DELETE FROM starred_repos WHERE user_id = ?'),

  // Embeddings
  getEmbedding: db.prepare('SELECT embedding_blob FROM vector_embeddings WHERE repo_id = ? AND user_id = ?'),
  getUserEmbeddings: db.prepare('SELECT repo_id, embedding_blob FROM vector_embeddings WHERE user_id = ?'),
  upsertEmbedding: db.prepare(`
    INSERT OR REPLACE INTO vector_embeddings (repo_id, user_id, embedding_blob, dimensions, model_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
};

// Repository conversion helper
export function rowToRepo(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    full_name: row.full_name,
    owner: {
      login: row.owner_login,
      avatar_url: row.owner_avatar || '',
      html_url: row.owner_html_url || '',
    },
    description: row.description || '',
    private: Boolean(row.private),
    fork: Boolean(row.fork),
    parent: row.parent_full_name
      ? {
          name: row.parent_name || '',
          full_name: row.parent_full_name,
          html_url: row.parent_html_url || '',
          default_branch: row.parent_branch || 'main',
          owner: {
            login: row.parent_owner_login || '',
            avatar_url: row.parent_owner_avatar || '',
            html_url: row.parent_owner_html_url || '',
          },
        }
      : undefined,
    default_branch: row.default_branch,
    html_url: row.html_url,
    language: row.language,
    languages: row.languages_json ? JSON.parse(row.languages_json) : undefined,
    topics: row.topics_json ? JSON.parse(row.topics_json) : [],
    stargazers_count: row.stargazers_count || 0,
    forks_count: row.forks_count || 0,
    open_issues_count: row.open_issues_count || 0,
    archived: Boolean(row.archived),
    size: row.size_kb || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pushed_at: row.pushed_at,
    behind_by: row.behind_by,
    ahead_by: row.ahead_by,
    drift_status: row.drift_status,
  };
}

export function repoToRow(repo: any, userId: string): any {
  return {
    id: repo.id,
    user_id: userId,
    name: repo.name,
    full_name: repo.full_name,
    owner_login: repo.owner?.login || '',
    owner_avatar: repo.owner?.avatar_url || '',
    owner_html_url: repo.owner?.html_url || '',
    description: repo.description || '',
    private: repo.private ? 1 : 0,
    fork: repo.fork ? 1 : 0,
    parent_name: repo.parent?.name || null,
    parent_full_name: repo.parent?.full_name || null,
    parent_html_url: repo.parent?.html_url || null,
    parent_branch: repo.parent?.default_branch || null,
    parent_owner_login: repo.parent?.owner?.login || null,
    parent_owner_avatar: repo.parent?.owner?.avatar_url || null,
    parent_owner_html_url: repo.parent?.owner?.html_url || null,
    default_branch: repo.default_branch || 'main',
    html_url: repo.html_url,
    language: repo.language || null,
    languages_json: repo.languages ? JSON.stringify(repo.languages) : null,
    topics_json: repo.topics ? JSON.stringify(repo.topics) : '[]',
    stargazers_count: repo.stargazers_count || 0,
    forks_count: repo.forks_count || 0,
    open_issues_count: repo.open_issues_count || 0,
    archived: repo.archived ? 1 : 0,
    size_kb: repo.size || 0,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    behind_by: repo.behind_by || 0,
    ahead_by: repo.ahead_by || 0,
    drift_status: repo.drift_status || 'up_to_date',
    synced_at: Date.now(),
  };
}

// Bulk Upsert Repositories in a Single Transaction for Maximum Performance
export function bulkUpsertRepos(repos: any[], userId: string): void {
  db.exec('BEGIN TRANSACTION;');
  try {
    for (const repo of repos) {
      const row = repoToRow(repo, userId);
      stmts.upsertRepo.run(row);
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Sub-millisecond FTS5 BM25 search
export function searchReposFTS(userId: string, query: string, limit = 50): any[] {
  if (!query || query.trim() === '') {
    const rows = stmts.getUserRepos.all(userId) as any[];
    return rows.map(rowToRepo);
  }

  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((term) => `"${term.replace(/"/g, '""')}"*`)
    .join(' ');

  if (!terms) {
    const rows = stmts.getUserRepos.all(userId) as any[];
    return rows.map(rowToRepo);
  }

  try {
    const sql = `
      SELECT r.*, bm25(repos_fts, 5.0, 3.5, 1.2, 2.0, 2.5) as fts_rank
      FROM repos_fts f
      JOIN repositories r ON r.id = f.rowid
      WHERE repos_fts MATCH ? AND r.user_id = ?
      ORDER BY fts_rank
      LIMIT ?;
    `;
    const searchStmt = db.prepare(sql);
    const rows = searchStmt.all(terms, userId, limit) as any[];
    return rows.map((r) => ({
      ...rowToRepo(r),
      _score: r.fts_rank,
      _matchType: 'fts5',
    }));
  } catch (e) {
    // If FTS syntax error (e.g. malformed operator), fallback to prefix substring query
    const fallbackSql = `
      SELECT * FROM repositories
      WHERE user_id = ? AND (
        name LIKE ? OR description LIKE ? OR language LIKE ?
      )
      ORDER BY pushed_at DESC
      LIMIT ?;
    `;
    const pattern = `%${query.trim()}%`;
    const rows = db.prepare(fallbackSql).all(userId, pattern, pattern, pattern, limit) as any[];
    return rows.map(rowToRepo);
  }
}
