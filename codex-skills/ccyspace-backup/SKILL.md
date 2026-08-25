---
name: ccyspace-backup
description: Back up the CCY SPACE portfolio project and task context to GitHub, or list and restore saved versions. Use when the user says "备份", "存档", "保存当前版本", "备份当前版本", "备份这个版本", "备份任务", "备份对话记录", "查看备份", "查看历史任务", "列出历史任务", or asks to restore a CCY SPACE backup.
---

# CCYSPACE Backup

Use this skill for the CCY SPACE portfolio project at `cyakkkooo2-png/portfolio`.

## What this skill does

- Back up the latest project version to GitHub.
- Create a Git tag when the user gives a backup name.
- Update repository docs:
  - `项目维护说明.md`
  - `历史任务备份.md`
- Preserve task context as a useful summary, not as a claimed full verbatim chat export.
- List saved backups when the user says `查看历史任务`.

## Project defaults

- Local project path, when available: `C:\Users\test\Documents\Codex\2026-07-10\bang\work\portfolio`
- GitHub repo: `https://github.com/cyakkkooo2-png/portfolio`
- Production site: `https://ccyspace.icu/`
- Production host: Tencent Cloud Lighthouse
- Persistent data: `/var/www/ccyspace-data/data`
- Persistent uploads: `/var/www/ccyspace-data/uploads`
- Deployment source: GitHub `master`, checked automatically by the server
- Railway details are historical only; do not treat Railway as the current production host.

## Backup workflow

1. Locate the portfolio repository.
   - Prefer the current working directory if it contains the project.
   - Otherwise check the default path above.
2. Inspect Git state first.
   - Do not stage `client/dist/`, dependency folders, caches, secrets, `.env`, or unrelated local files.
   - If unrelated user changes exist, preserve them and ask before touching overlapping files.
3. Update `项目维护说明.md` if important project facts changed.
   - Treat Tencent Cloud Lighthouse as production unless the repository docs say it changed again.
   - Never put server data, uploads, certificates, tokens, `.env` files, or runtime secrets in GitHub.
4. Append a new entry to `历史任务备份.md` with:
   - backup name
   - date/time
   - commit hash
   - tag name, if created
   - short task summary
   - key decisions/changes
   - restore instructions
5. Commit the docs and relevant project changes with a clear message.
6. If the user supplied a backup name, create an annotated Git tag with that exact name.
7. Push the branch and tags to GitHub.
8. Report the commit, tag, and restore phrase.

## Task context rule

When the user asks to back up "对话记录", create a practical task summary and decision log. Do not claim full verbatim Codex chat history was exported unless an official export tool was actually used.

## Listing history

When the user says `查看历史任务` or similar:

1. Read `历史任务备份.md`.
2. List saved entries in reverse chronological order when possible.
3. Include backup name, commit, tag, website/repo links, and one-line summary.
4. If the file is missing, inspect Git tags and say no task index exists yet.

## Restore workflow

When the user asks to restore a backup:

1. Find the backup in `历史任务备份.md` or Git tags.
2. Prefer a non-destructive restore path:
   - create a new branch from the tag, or
   - explain the exact checkout command.
3. Do not run destructive commands such as reset/clean unless the user explicitly approves.

Example restore commands:

```powershell
git fetch --tags
git checkout -b restore-作品集1 作品集1
```
