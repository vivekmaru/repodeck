# REST & Search API Reference

RepoDeck exposes an Express backend API for authentication, GitHub data proxying, local SQLite search, and vector re-indexing.

---

## Base URL
```
http://localhost:3000
```

---

## 1. Authentication Endpoints

### `GET /api/auth/url`
Generates a GitHub OAuth 2.0 authorization URL with CSRF protection.
- **Response `200 OK`**:
  ```json
  {
    "url": "https://github.com/login/oauth/authorize?client_id=...&scope=read:user%20repo%20delete_repo&state=..."
  }
  ```

---

### `GET /auth/callback`
OAuth 2.0 authorization code exchange handler. Exchanges code for GitHub access token, sets secure HTTP-only cookies (`gh_token`, `gh_auth_method`), and communicates result to the browser window via `postMessage`.

---

### `POST /api/auth/pat`
Authenticates via Personal Access Token (Classic).
- **Body**:
  ```json
  {
    "token": "ghp_xxxxxxxxxxxxxxxxxxxx"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": { "login": "octocat", "avatar_url": "..." },
    "scopes": ["repo", "delete_repo", "read:user"]
  }
  ```

---

### `POST /api/auth/demo`
Activates the simulated Demo Sandbox session seeded with multi-tiered repositories, drift counters, and branches.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": { "login": "octo-developer", "name": "Octo Developer" },
    "scopes": ["repo", "delete_repo", "read:user"]
  }
  ```

---

### `POST /api/auth/logout`
Clears session cookies (`gh_token`, `gh_auth_method`, `oauth_state`).

---

### `GET /api/auth/session`
Returns current session status, user profile, token scopes, and remaining API quota.
- **Response `200 OK`**:
  ```json
  {
    "authenticated": true,
    "user": { "login": "octocat", "name": "Mona Lisa", "avatar_url": "..." },
    "scopes": ["repo", "delete_repo", "read:user"],
    "rateLimit": {
      "limit": 5000,
      "remaining": 4890,
      "reset": 1755302400,
      "used": 110
    },
    "authMethod": "oauth",
    "clientIdConfigured": true
  }
  ```

---

## 2. Search & Vector Engine Endpoints

### `GET /api/search`
Queries repositories using SQLite FTS5 Full-Text Search, Local Dense Vector Embeddings, or Reciprocal Rank Fusion (RRF).

- **Query Parameters**:
  - `q` (*string, required*): The search query string (e.g. `fastapi`, `python api`, `audio visualizer`).
  - `mode` (*string, optional*):
    - `hybrid` *(default)*: Combines FTS5 BM25 and MiniLM cosine similarity via RRF.
    - `fts`: Exact tokenized FTS5 keyword BM25 match (<1ms).
    - `semantic`: Dense vector cosine similarity search via `all-MiniLM-L6-v2`.
  - `limit` (*number, optional*): Maximum results to return (default: `50`).

- **Response `200 OK`**:
  ```json
  {
    "query": "web framework python",
    "mode": "hybrid",
    "latencyMs": 14.82,
    "total": 3,
    "results": [
      {
        "id": 103,
        "name": "fastapi",
        "full_name": "octo-developer/fastapi",
        "language": "Python",
        "description": "FastAPI framework, high performance, easy to learn",
        "_matchType": "hybrid",
        "_rrfScore": 0.0369,
        "_ftsRank": 1,
        "_vecRank": 1,
        "_similarity": 0.62
      }
    ]
  }
  ```

---

### `POST /api/search/reindex`
Forces re-computation of 384-dimensional dense vector embeddings for all cached repositories using local ONNX inference.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 48,
    "durationMs": 420.5
  }
  ```

---

## 3. Repositories Endpoints

### `GET /api/github/repos`
Lists all repositories for the authenticated user. Automatically attempts single-roundtrip **GraphQL batch ingestion** (or REST fallback) and caches results in SQLite with ETag validation.

- **Query Parameters**:
  - `refresh` (*boolean, optional*): Pass `true` to bypass cache and validate ETags against GitHub.

---

### `GET /api/github/repos/:owner/:repo/details`
Aggregates language byte counts, top contributors with commit counts, and recent commit history logs.
- **Response `200 OK`**:
  ```json
  {
    "languages": { "TypeScript": 145000, "HTML": 12000, "CSS": 8400 },
    "totalBytes": 165400,
    "contributors": [
      { "id": 1, "login": "developer", "contributions": 42, "avatar_url": "..." }
    ],
    "commits": [
      { "sha": "e65701a", "message": "feat: release v1.0", "author": "developer", "date": "2026-08-15T12:00:00Z" }
    ]
  }
  ```

---

### `PATCH /api/github/repos/:owner/:repo`
Toggles repository archived status.
- **Body**:
  ```json
  { "archived": true }
  ```

---

### `DELETE /api/github/repos/:owner/:repo`
Permanently deletes a repository from GitHub and removes it from the local SQLite database.
- **Header Required**: `Authorization: Bearer <PAT>` or OAuth cookie.
- **Response `200 OK`**:
  ```json
  { "success": true, "message": "Repository octocat/old-project deleted permanently." }
  ```

---

## 4. Upstream Fork Synchronization Endpoints

### `GET /api/github/forks/:owner/:repo/compare`
Compares a forked repository against its upstream parent default branch.
- **Query Parameters**:
  - `force` (*boolean, optional*): Force a live GitHub compare request instead of serving recent SQLite drift status.
- **Response `200 OK`**:
  ```json
  {
    "status": "behind",
    "behind_by": 14,
    "ahead_by": 0,
    "parent_full_name": "fastapi/fastapi",
    "parent_branch": "master",
    "fork_branch": "master",
    "html_url": "https://github.com/fastapi/fastapi/compare/master...user:master"
  }
  ```

---

### `POST /api/github/forks/:owner/:repo/sync`
Performs a fast-forward merge of the upstream default branch into the fork via GitHub's `merge-upstream` API.
- **Body**:
  ```json
  { "branch": "main" }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Successfully synced main with upstream!",
    "merge_type": "fast-forward",
    "base_branch": "main"
  }
  ```

---

## 5. Starred Repositories Endpoints

### `GET /api/github/starred`
Lists user's starred repositories with SQLite caching and ETag background validation.

### `DELETE /api/github/starred/:owner/:repo`
Unstars a repository.

---

## 6. Health & System Telemetry

### `GET /api/health`
Returns process uptime and server timestamp.
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "uptime": 142.5,
    "timestamp": "2026-08-16T01:25:00.000Z"
  }
  ```
