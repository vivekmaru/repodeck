import { pipeline } from '@xenova/transformers';
import { stmts } from '../db/database.js';

let embedderPromise: Promise<any> | null = null;

// Initialize Xenova MiniLM embedding model singleton
export async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
  }
  return embedderPromise;
}

// Convert arbitrary query/text into 384-dimensional normalized vector
export async function getEmbedding(text: string): Promise<Float32Array> {
  const cleanText = (text || '').trim().replace(/\s+/g, ' ').slice(0, 512);
  if (!cleanText) {
    return new Float32Array(384);
  }

  try {
    const embedder = await getEmbedder();
    const output = await embedder(cleanText, { pooling: 'mean', normalize: true });
    return new Float32Array(output.data);
  } catch (err) {
    console.error('Failed to compute vector embedding:', err);
    return new Float32Array(384);
  }
}

// Cosine similarity for normalized vectors (equivalent to dot product)
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

// Format repository metadata for dense vector representation
export function formatRepoTextForEmbedding(repo: any): string {
  const parts = [
    `Repository: ${repo.name}`,
    repo.description ? `Description: ${repo.description}` : '',
    repo.language ? `Primary Language: ${repo.language}` : '',
    Array.isArray(repo.topics) && repo.topics.length > 0 ? `Topics: ${repo.topics.join(', ')}` : '',
    repo.fork ? 'Forked Repository' : 'Source Repository',
  ];
  return parts.filter(Boolean).join('. ');
}

// Background queue to compute and cache vector embeddings into SQLite
export async function indexReposEmbeddings(repos: any[], userId: string): Promise<void> {
  // Fire in background non-blocking
  setTimeout(async () => {
    try {
      const existingRows = stmts.getUserEmbeddings.all(userId) as any[];
      const existingSet = new Set(existingRows.map((r) => r.repo_id));

      for (const repo of repos) {
        if (!existingSet.has(repo.id)) {
          const text = formatRepoTextForEmbedding(repo);
          const vector = await getEmbedding(text);
          const buffer = Buffer.from(vector.buffer);
          stmts.upsertEmbedding.run(
            repo.id,
            userId,
            buffer,
            384,
            'all-MiniLM-L6-v2',
            Date.now()
          );
        }
      }
    } catch (err) {
      console.warn('Background embedding indexing warning:', err);
    }
  }, 100);
}
