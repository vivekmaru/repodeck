import { stmts, searchReposFTS, rowToRepo } from '../db/database.js';
import { getEmbedding, cosineSimilarity } from './embeddings.js';

export interface SearchResultItem {
  repo: any;
  score: number;
  matchType: 'fts5' | 'semantic' | 'hybrid';
  similarity?: number;
  rank?: number;
}

export interface SearchResponse {
  query: string;
  mode: 'hybrid' | 'fts' | 'semantic';
  latencyMs: number;
  total: number;
  results: any[];
}

export async function executeSearch(
  userId: string,
  query: string,
  mode: 'hybrid' | 'fts' | 'semantic' = 'hybrid',
  limit = 50,
  k = 60
): Promise<SearchResponse> {
  const startTime = performance.now();
  const trimmed = (query || '').trim();

  if (!trimmed) {
    const rows = stmts.getUserRepos.all(userId) as any[];
    const repos = rows.map(rowToRepo);
    return {
      query: '',
      mode,
      latencyMs: Math.round((performance.now() - startTime) * 100) / 100,
      total: repos.length,
      results: repos,
    };
  }

  // 1. Pure FTS5 Mode
  if (mode === 'fts') {
    const ftsResults = searchReposFTS(userId, trimmed, limit);
    return {
      query: trimmed,
      mode: 'fts',
      latencyMs: Math.round((performance.now() - startTime) * 100) / 100,
      total: ftsResults.length,
      results: ftsResults,
    };
  }

  // 2. Fetch Dense Vector Embeddings for User Repos
  const embeddingRows = stmts.getUserEmbeddings.all(userId) as any[];
  let vectorRanked: Array<{ repoId: number; similarity: number }> = [];

  if (embeddingRows.length > 0) {
    const queryVector = await getEmbedding(trimmed);
    vectorRanked = embeddingRows
      .map((row) => {
        const floatArray = new Float32Array(
          row.embedding_blob.buffer,
          row.embedding_blob.byteOffset,
          row.embedding_blob.byteLength / 4
        );
        const sim = cosineSimilarity(queryVector, floatArray);
        return { repoId: row.repo_id, similarity: sim };
      })
      .sort((a, b) => b.similarity - a.similarity);
  }

  // 3. Pure Semantic Vector Mode
  if (mode === 'semantic') {
    const topVectorMatches = vectorRanked.slice(0, limit);
    const repoMap = new Map<number, any>();
    for (const item of topVectorMatches) {
      const row = stmts.getRepoById.get(item.repoId, userId);
      if (row) {
        repoMap.set(item.repoId, {
          ...rowToRepo(row),
          _similarity: Math.round(item.similarity * 1000) / 1000,
          _matchType: 'semantic',
        });
      }
    }
    const results = topVectorMatches.map((v) => repoMap.get(v.repoId)).filter(Boolean);
    return {
      query: trimmed,
      mode: 'semantic',
      latencyMs: Math.round((performance.now() - startTime) * 100) / 100,
      total: results.length,
      results,
    };
  }

  // 4. Hybrid Search via Reciprocal Rank Fusion (RRF)
  const ftsList = searchReposFTS(userId, trimmed, 60);
  const rrfScores = new Map<number, { score: number; ftsRank?: number; vecRank?: number; similarity?: number }>();
  const repoObjectMap = new Map<number, any>();

  // Apply FTS5 BM25 rank scores
  ftsList.forEach((repo, rank) => {
    repoObjectMap.set(repo.id, repo);
    const current = rrfScores.get(repo.id) || { score: 0 };
    current.score += 1.0 / (k + rank + 1);
    current.ftsRank = rank + 1;
    rrfScores.set(repo.id, current);
  });

  // Apply Dense Semantic Vector rank scores (weighted 1.25 for conceptual query boost)
  vectorRanked.slice(0, 60).forEach((item, rank) => {
    if (!repoObjectMap.has(item.repoId)) {
      const row = stmts.getRepoById.get(item.repoId, userId);
      if (row) repoObjectMap.set(item.repoId, rowToRepo(row));
    }

    if (repoObjectMap.has(item.repoId)) {
      const current = rrfScores.get(item.repoId) || { score: 0 };
      current.score += 1.25 / (k + rank + 1);
      current.vecRank = rank + 1;
      current.similarity = Math.round(item.similarity * 1000) / 1000;
      rrfScores.set(item.repoId, current);
    }
  });

  // Sort by combined RRF score
  const mergedResults = Array.from(rrfScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([id, meta]) => {
      const baseRepo = repoObjectMap.get(id);
      if (!baseRepo) return null;
      return {
        ...baseRepo,
        _rrfScore: Math.round(meta.score * 10000) / 10000,
        _ftsRank: meta.ftsRank,
        _vecRank: meta.vecRank,
        _similarity: meta.similarity,
        _matchType: meta.ftsRank && meta.vecRank ? 'hybrid' : meta.ftsRank ? 'fts5' : 'semantic',
      };
    })
    .filter(Boolean);

  const duration = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    query: trimmed,
    mode: 'hybrid',
    latencyMs: duration,
    total: mergedResults.length,
    results: mergedResults,
  };
}
