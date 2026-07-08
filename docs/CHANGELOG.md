# Workflow Studio Changelog

All notable changes to Workflow Studio are documented here.


# v1.2.7 — Usability Reality Check

Completed.

## Added

- Real Git status page for the selected workspace.
- Electron Open Folder dialog support.
- Workspace selector path propagation into Dashboard, AI, Git, and Documentation.
- Documentation page that lists detected Markdown project knowledge files.
- Settings page notes for future UI scale and compact display options.

## Fixed

- Git page no longer appears as a placeholder during v1.2 testing.
- Documentation page no longer appears as a placeholder during v1.2 testing.
- Workspace selector now changes the active workspace path used by workspace-aware pages.

---

This project follows a milestone-based development workflow.

---

# v1.2 — Workspace Intelligence

Completed July 2026.

## Added

- Workspace Scanner foundation.
- Workspace analysis model for shared workspace discovery.
- Workspace intelligence detection for project structure and capabilities.
- Detection for Git repository presence.
- Detection for `package.json`.
- Detection for README files.
- Detection for documentation folders.
- Detection for Workflow Studio metadata.
- Package manager detection.
- Build command detection.
- Project type detection.
- Dashboard workspace health display.
- Workspace capability indicators.
- AI Context Engine foundation.
- Generated continuation context foundation.
- Multi-workspace foundation.
- Workspace selector structure.
- Recent workspace registry structure.

## Improved

- Dashboard now uses workspace intelligence instead of static placeholder information.
- AI page now has the foundation for generated development context.
- Workspace data is moving toward a shared source of truth.
- Project metadata is better aligned with the current application state.

## Fixed

- Regenerated the v1.2.5 package after the package validator correctly rejected an invalid manifest.
- Confirmed package validation catches missing manifest fields before installation.

---

# v1.1 — Real Workspace Integration

Completed.

## Added

- Real managed workspace loading through `.workflowstudio/project.json`.
- Shared Electron bridge architecture.
- Shared Git type architecture.
- Git status normalization improvements.

## Improved

- Workflow Studio now reads real workspace metadata instead of relying only on hardcoded UI data.
- Git page and project metadata are better aligned with the active workspace.

---

# v1.0 — Core Application

Completed.

## Added

- Electron application shell.
- Responsive desktop UI.
- Dashboard page.
- Projects page.
- Packages page.
- Documentation page.
- AI page.
- Git page.
- Package system foundation.
- Workspace metadata foundation.

---

# v0.1 — Foundation

Completed.

## Added

- React project initialized.
- TypeScript configured.
- Vite configured.
- Git repository initialized.
- Electron dependencies installed.
- Initial folder structure created.

### Project folders

- docs/
- prompts/
- templates/
- tools/
- _packages/
- _backup/
- electron/

### Documentation

Created:

- README
- Roadmap
- Continue Prompt
- Vision
- Project Charter
- Design Bible
- Technical Architecture
- Development Workflow
- Package System
- Coding Standards
- UI Guidelines
- AI Workflow

---

# Upcoming

## v1.3 — Workspace Polish and Persistence

Planned.

Potential goals:

- Refine workspace selector behavior.
- Improve recent workspace persistence.
- Improve missing-workspace error states.
- Add package history UI.
- Improve AI prompt export workflow.
- Improve documentation freshness indicators.

## v1.4 — Package History and Rollback UI

Planned.

## v1.5 — Orivex Integration Support

Planned.
