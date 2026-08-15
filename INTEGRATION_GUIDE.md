# Integration & Setup Guide

This guide walks you through configuring GitHub Authentication (OAuth 2.0 & Personal Access Tokens), database persistence, and production deployment for **RepoDeck**.

---

## 1. Authentication Methods

RepoDeck supports three distinct authentication methods:

```
┌────────────────────────┬───────────────────────────────────────────┬────────────────────────────────┐
│ Method                 │ Best For                                  │ Permissions Supported          │
├────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┤
│ 1. GitHub OAuth 2.0    │ Team & Hosted Deployment (1-click login)  │ repo, delete_repo, read:user   │
│ 2. Personal Access     │ Local Developers & Single-User Instances  │ Configurable (Classic PAT)     │
│    Token (PAT Classic) │                                           │                                │
│ 3. Demo Sandbox        │ UI Testing, Walkthroughs & Offline Demos  │ Simulated full privileges      │
└────────────────────────┴───────────────────────────────────────────┴────────────────────────────────┘
```

---

## 2. GitHub OAuth App Setup (Step-by-Step)

To enable 1-click GitHub authentication with popups:

### Step 1: Create GitHub OAuth Application
1. Navigate to [GitHub Developer Settings $\rightarrow$ OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App** (or **Register a new application**).
3. Fill in the application details:
   - **Application Name**: `RepoDeck` (or your chosen name)
   - **Homepage URL**: `http://localhost:3000` (or `https://your-domain.com` for production)
   - **Application Description**: `High-performance GitHub portfolio & fork manager.`
   - **Authorization callback URL**: `http://localhost:3000/auth/callback` (or `https://your-domain.com/auth/callback`)
4. Click **Register Application**.

### Step 2: Generate Client Secret
1. On the newly created OAuth App page, find **Client ID** and copy it.
2. Click **Generate a new client secret** and copy the resulting string.

### Step 3: Configure RepoDeck Environment
Add the credentials to your `.env` file:
```env
GITHUB_CLIENT_ID="your_oauth_client_id_here"
GITHUB_CLIENT_SECRET="your_oauth_client_secret_here"
APP_URL="http://localhost:3000"
```

### Step 4: OAuth Scopes Requested
RepoDeck automatically requests the following minimal scopes:
- `read:user`: Reads user profile avatar, name, and login.
- `repo`: Grants access to public and private repository lists, languages, contributors, and fork synchronization.
- `delete_repo`: Enables deletion of stale/dormant repositories directly from the audit console.

---

## 3. Classic Personal Access Token (PAT) Setup

For direct token access without creating an OAuth App:

1. Go to [GitHub Tokens (classic)](https://github.com/settings/tokens).
2. Click **Generate new token** $\rightarrow$ **Generate new token (classic)**.
3. Name the token: `RepoDeck CLI/Console`.
4. Select Expiration (e.g. `90 days` or `No expiration` for dedicated local tooling).
5. Check the following scopes:
   - [x] **`repo`** (Full control of private repositories)
   - [x] **`delete_repo`** (Delete repositories)
   - [x] **`read:user`** (Read user profile data)
6. Click **Generate token** and copy the `ghp_...` string.
7. Open RepoDeck $\rightarrow$ Click **Connect Real GitHub** $\rightarrow$ Select **Personal Access Token** $\rightarrow$ Paste token and connect.

> [!WARNING]
> **Why Classic Tokens instead of Fine-Grained (Beta)?**
> GitHub's Fine-Grained Personal Access Tokens (Beta) explicitly **block** the REST API endpoint `DELETE /repos/{owner}/{repo}` by design. If you attempt to delete a repository using a Fine-Grained token, GitHub returns `403 Forbidden`. To utilize RepoDeck's cleanup and deletion safeguards, always use a **Classic PAT** or OAuth.

---

## 4. Local Database Persistence & Storage

RepoDeck stores all indexed repository metadata, FTS5 BM25 search indexes, vector embeddings, and HTTP ETag caches in a single SQLite database file:

- **Default Location**: `.repodeck/repodeck.db`
- **WAL Journal**: `.repodeck/repodeck.db-wal` and `.repodeck/repodeck.db-shm`

### Recommended Docker Volume Mount
When running in Docker or Cloud Run with persistent disks, mount the `.repodeck` directory:
```bash
docker run -d -p 3000:3000 \
  -v /var/data/repodeck:/app/.repodeck \
  repodeck:latest
```

---

## 5. Troubleshooting & Error Codes

### Error: `401 Unauthorized / Bad credentials`
- **Cause**: The GitHub PAT has expired or was revoked.
- **Fix**: Re-generate a Classic PAT in GitHub Developer Settings and re-connect in RepoDeck.

### Error: `403 Forbidden / Must have admin rights to Repository`
- **Cause**: The authenticated token lacks the `delete_repo` scope when attempting a repository deletion.
- **Fix**: Ensure `delete_repo` is checked on your token at [GitHub Token Settings](https://github.com/settings/tokens).

### Error: `409 Conflict / Merge conflict detected`
- **Cause**: When attempting to fast-forward an upstream fork via `POST /api/github/forks/:owner/:repo/sync`, the fork branch has conflicting commit history against the upstream parent.
- **Fix**: Use Git on your local machine to resolve conflicts manually:
  ```bash
  git remote add upstream https://github.com/upstream-owner/parent-repo.git
  git fetch upstream
  git merge upstream/main
  # resolve conflicts in editor
  git push origin main
  ```

### Rate Limit Exhaustion (`403 API rate limit exceeded`)
- **Cause**: Unauthenticated IP requests or heavy external script usage on GitHub API.
- **How RepoDeck Protects You**:
  1. RepoDeck uses **HTTP ETags** and serves `304 Not Modified` responses from SQLite with **0 rate limit cost**.
  2. Single-roundtrip **GraphQL batching** loads 100 repositories in 1 request instead of 50+ N+1 REST queries.
  3. Real-time rate limit telemetry is displayed in the navigation pill and profile dropdown.
