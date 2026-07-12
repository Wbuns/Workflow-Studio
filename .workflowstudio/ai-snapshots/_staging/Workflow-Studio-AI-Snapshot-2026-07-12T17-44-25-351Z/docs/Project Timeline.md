# Workflow Studio Project Timeline

**Version:** 1.4.5  
**Status:** Active  
**Last Updated:** July 2026

## Purpose

The Project Timeline combines important workspace activity into one chronological history. It helps developers understand recent progress without checking Git, Packages, and AI Snapshots independently.

## Activity Sources

The timeline currently includes:

- Recent Git commits
- Current uncommitted workspace changes
- Generated package folders
- Installed package history when metadata is available
- AI snapshot history

## Design Rules

- Timeline collection is read-only.
- Git and filesystem access remain in Electron.
- The React page consumes a shared typed event model.
- Missing activity sources should not break the entire timeline.
- Events are sorted newest first and may be filtered by category.

## Future Enhancements

Future milestones may add build results, milestone completion records, richer package metadata, and persistent command execution history.
