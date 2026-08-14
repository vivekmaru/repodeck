# RepoDeck

A high-density GitHub repository management console, upstream fork synchronizer, and workspace lifecycle auditor.

## Features
- **High-Density Repository View & Keyboard Navigation**: Switch between a compact tabular view and card grid. Use `↑` / `↓` arrow keys to highlight rows, `Space` to select/deselect, and `Enter` to open the detail inspector drawer. Multi-select repositories for batch deletion, archiving, synchronization, and JSON/CSV metadata export.
- **Expandable Table Rows & Slide-over Detail Inspector**: Click or highlight any row to expand inline language percentage breakdowns (segmented color bar + stats) and recent contributor avatars, or open the full slide-over panel for commit stream history, clone snippets, and deep lifecycle metadata.
- **API Rate Limit Monitoring**: Live quota indicator on your profile pill (`API: 4843 OK`) and an expanded diagnostic gauge inside your profile dropdown showing remaining quota (e.g. `4,843 / 5,000`), capacity meter, and time remaining until reset.
- **Activity & Age Telemetry**: Instant classification of repositories into Active, Recent, Quiet, Stale (>1 year), and Dormant (>2 years) tiers.
- **1-Click Upstream Fork Synchronization**: Automatic upstream branch comparison and fast-forward merges via GitHub's `merge-upstream` API.
- **Stale & Dormant Cleanup Audit**: Calculate total reclaimable disk footprint with instant safe archiving and permanent deletion safeguards.
- **Starred Repositories Catalog**: Search and filter your starred libraries by language and topic with one-click unstarring.
- **Flexible Authentication & Scope Telemetry**: Connect with GitHub OAuth 2.0, Personal Access Token (PAT Classic with `repo`, `delete_repo`, `read:user`), or test drive in the interactive sandbox mode. Real-time scope verification highlights whether deletion permissions are available.
- **Professional & Playful Design System**: Clean typography pairing Plus Jakarta Sans for headings with Space Mono for code telemetry and Inter for body text, avoiding cartoonish fonts and generic AI slop.

## GitHub Token Permissions & Scopes
To enable all features:
- `repo`: Required for reading repositories, auditing metadata, and syncing upstream forks.
- `delete_repo`: **Required** for permanently deleting stale/dormant repositories via GitHub's REST API.
- `read:user`: Required for profile information and rate-limit diagnostics.
- *Note on Token Types*: GitHub requires a **Classic Personal Access Token** for repository deletion via API. GitHub Fine-Grained (Beta) tokens disallow repository deletion through the REST API.
