# Pantry Manager

Shared household pantry tracker for Ryan & Sabrina.

## Stack
- **Frontend**: Static HTML/JS — hosted on Netlify
- **Backend**: Netlify Function (secure proxy)
- **Database**: `pantry.json` in this repo via GitHub API

## Environment Variables (set in Netlify dashboard)
| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | Your GitHub Personal Access Token (repo scope) |
| `GITHUB_REPO` | `yourusername/pantry` |

## How it works
1. App loads → Netlify Function reads `pantry.json` from this repo
2. User makes a change → Function writes updated JSON back to repo
3. Both phones auto-sync every 30 seconds
