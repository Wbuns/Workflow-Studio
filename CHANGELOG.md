# Workflow Studio Changelog

All notable changes to Workflow Studio are documented here.

This project follows a milestone-based development workflow.

---

# v1.0 — Core Release

Completed July 2026.

## Added

- Electron desktop shell
- React + TypeScript + Vite application foundation
- Feature-based folder architecture
- Sidebar navigation
- Dashboard page
- Projects page
- Packages page
- Documentation Center
- AI Context page
- Git Assistant page
- Templates page
- Settings page
- Development Session service foundation
- Workspace metadata folder support
- Package installer workflow
- Package backup workflow
- Shared UI component library
- Responsive desktop workspace layout
- Live Git service foundation through Electron IPC
- Workflow Studio project metadata
- Orivex project metadata preparation

## Improved

- Reworked centered layout into a wider desktop-style workspace
- Reduced wasted space on large monitors
- Standardized panels, metric cards, action lists, headers, and status chips
- Improved page consistency across all left-sidebar sections
- Improved Git Assistant architecture by moving data through a typed service
- Improved project architecture alignment with service-based design

## Notes

Workflow Studio Core is now complete enough to become the daily development environment for Orivex.

After this release, Workflow Studio work should become secondary to Orivex development and should only expand when it directly improves the Orivex workflow.

---

# v1.1 — Real Workspace Integration

Planned.

## Goals

- Load real `.workflowstudio/project.json` files
- Make Orivex selectable as an active project
- Display active workspace metadata in the Dashboard
- Generate AI sessions from active workspace context
- Use active workspace Git status

---

# v0.1 — Foundation

## Added

- React project initialized
- TypeScript configured
- Vite configured
- Git repository initialized
- Electron dependencies installed
- Initial folder structure created
- Initial documentation created
