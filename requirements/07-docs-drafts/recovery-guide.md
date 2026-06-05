# User Recovery Guide

## Corvus Mark Does Not Delete Bookmarks

v1.0 does not call bookmark delete APIs.

## Undo the Last Organize

Use:

```text
Popup → Rollback
```

Rollback uses MoveLog and only moves back bookmarks successfully moved in the last operation.

## Export Browser Bookmark Backup

Before a large organize run, use Chrome Bookmark Manager:

```text
Chrome → Bookmarks and lists → Bookmark Manager → ⋮ → Export bookmarks
```

## If Rollback Fails

1. Export DiagnosticReport.
2. Check MoveLog.
3. Restore from browser HTML backup if needed.
4. Open a GitHub issue without uploading API Keys.
