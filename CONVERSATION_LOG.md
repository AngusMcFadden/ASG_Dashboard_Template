# Conversation Log — ASG Dashboard Template Setup

**Date:** 2026-03-20
**Repository:** [https://github.com/AngusMcFadden/ASG_Dashboard_Template](https://github.com/AngusMcFadden/ASG_Dashboard_Template)

---

## Summary

This session covers setting up the **ASG Dashboard Template** — a Node.js/Express web application for ingesting CSV files and storing them in a PostgreSQL database — and pushing the code to GitHub.

---

## Project Overview

The template provides:
- A drag-and-drop web UI for uploading CSV files (up to 100 MB)
- Automatic PostgreSQL table creation from CSV headers
- Column type detection (INTEGER, DOUBLE PRECISION, TEXT)
- A sidebar to browse, preview, and delete imported tables
- A REST API backed by Express and `pg`

**Stack:**
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 18 |
| Framework | Express 4 |
| Database | PostgreSQL >= 13 |
| CSV Parsing | csv-parse 5 |
| File Upload | multer |
| Config | dotenv |

---

## Steps Taken

### 1. Linked local repo to GitHub
The local repository at `c:\Users\satkinson\ASG_Dashboard_Template` already had the remote `origin` pointing to:
```
https://github.com/AngusMcFadden/ASG_Dashboard_Template
```

### 2. Resolved credential conflict
Git was authenticated as `ksuwildcat1975` (a different GitHub account), causing 403 errors on push. Resolution:
- Generated a **Personal Access Token** on the `AngusMcFadden` GitHub account (Settings → Developer Settings → Tokens → Classic → `repo` scope)
- Updated the remote URL to embed the token:
  ```bash
  git remote set-url origin https://AngusMcFadden:<TOKEN>@github.com/AngusMcFadden/ASG_Dashboard_Template.git
  ```

### 3. Deleted and recreated the GitHub repository
The existing remote repository was empty/stale. It was deleted via:
- GitHub → Repository Settings → Danger Zone → Delete this repository

A fresh repository was created at [https://github.com/new](https://github.com/new) with:
- Name: `ASG_Dashboard_Template`
- Visibility: Public
- No initialisation files (empty)

### 4. Pushed code
```bash
git push -u origin main
```
Output:
```
* [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

---

## Repository Structure

```
ASG_Dashboard_Template/
├── public/
│   └── index.html        # Single-page frontend (no framework)
├── uploads/              # Temp storage for CSV files (auto-deleted after import)
├── .env.example          # Environment variable template
├── .gitignore
├── package.json
├── README.md
└── server.js             # Express application entry point
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Serve the frontend |
| `POST` | `/upload` | Upload a CSV (`multipart/form-data`, field `csvfile`) |
| `GET` | `/tables` | List all imported tables |
| `GET` | `/tables/:name` | Return first 100 rows of a table |
| `DELETE` | `/tables/:name` | Drop a table |

---

## Issues Encountered

| Issue | Cause | Resolution |
|-------|-------|------------|
| `remote: Repository not found` | Repo didn't exist on GitHub | Deleted stale repo, created fresh one |
| `Permission denied to ksuwildcat1975` | Wrong GitHub credentials cached | Generated PAT for AngusMcFadden, updated remote URL |
| `src refspec master does not match any` | Local branch is `main`, not `master` | Used `git push -u origin main` |
