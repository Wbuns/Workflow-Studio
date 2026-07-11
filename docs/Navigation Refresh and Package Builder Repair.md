# Navigation Refresh and Package Builder Repair

**Version:** 1.4.3  
**Status:** Active

## Purpose

Restore self-hosted AI package generation and simplify the primary navigation without changing page identities or backend security boundaries.

## Package Builder Repair

The preload bridge and renderer service already requested `workspace:createAIPackage`, but the Electron main process no longer registered the handler. This milestone restores the validated package creation implementation.

Generated packages:

- Require a Developer Request.
- Require a Git workspace.
- Include only safe changed replacement files.
- Exclude generated output, backups, snapshots, and package exports.
- Produce a valid `manifest.json` and `README.md`.
- Return detailed warnings and validation state to the UI.

## Navigation Refresh

The sidebar is grouped into:

- Workspace
- Development
- Library
- System

Existing page IDs remain unchanged so routing and saved navigation state remain compatible.
