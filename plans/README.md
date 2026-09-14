# Project Plans

This folder is the sortable planning history for repository tasks.

## Naming convention

Create one Markdown file per task using local time in this format:

```text
YYYY-MM-DD-HHMM-short-task-slug.md
```

The timestamp keeps plans in chronological order when listed by filename.

## Task workflow

1. Create or update the task plan before implementation starts.
2. Record scope, ownership boundaries, acceptance criteria, risks, and dependencies.
3. Append timeline entries in chronological order as work progresses.
4. Mark completed, blocked, and follow-up items explicitly.
5. Commit and push the plan together with the related implementation.

## Timeline format

Use a sortable timestamp in the first column:

| Timestamp | Event | Result |
| --- | --- | --- |
| `YYYY-MM-DD HH:MM` | What changed or was checked | Outcome, commit, or blocker |

Do not store credentials or secret values in plan files.
