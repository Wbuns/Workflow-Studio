# v2.1.5.2 — Downloaded Package Automation

## Added

- Install Latest Downloaded Package action.
- Native package picker.
- Automatic temporary extraction and manifest validation.
- Automatic backups before replacement files are installed.

# v2.1.5.1 — Developer Tools Foundation

## Added

- Developer Tools navigation and workspace page.
- Shared DeveloperWorkflowService.
- Safe folder-opening, snapshot cleanup, and validation bridge operations.
- Foundation for package, build, and validation automation.

# v2.1.4 — Active Workspace Transition Coordination

## Added

- Typed active-workspace transition event.
- Shared subscription API for project-aware services.
- Clean remounting of project-scoped feature pages when switching projects.

## Improved

- Prevented stale project state from remaining visible after a workspace switch.
- Preserved explicit workspace-root overrides and existing UI behavior.

# v2.1.3 — Active Workspace Service

## Added

- Shared ActiveWorkspaceService for resolving the registered active project.
- Active-workspace fallback for AI context, Git, documentation, packages, templates, and timeline services.
- Explicit root paths continue to override the active workspace.

# v2.1.2 — Project Registration

- Added registered-project management to Projects.
- Added project favorites and removal.
- Added project health refresh through Workspace Intelligence.
- Preserved active-workspace services and package safety.


# v2.0.2 — Command Palette and Workspace Refinement

## Added

- Keyboard command palette with `Ctrl+Shift+P`
- Searchable navigation and workspace actions
- Recent command ordering
- Readiness progress bars without percentages
- More discoverable Developer Tools section

## Improved

- Dashboard recommendations no longer point to the current Dashboard page
- Technical details now show an available-command count

# v2.0.1 — Unified Project Workspace

- Added unified project workspace dashboard
- Added compact status, recommendations, readiness, signals, and quick actions
- Refined sidebar section headers to appear non-interactive
- Preserved secure workspace command execution inside technical details

# v2.0.0 — Unified Workspace Visual Foundation

## Added

- Shared visual tokens and unified dark workspace surfaces.
- Compact package preview layout.
- Color-coded package safety summary cards.
- Dark compact skipped-file rows and improved responsive behavior.

---

# v1.5.3 — Package Safety and Export Polish

## Fixed

- Unified package readiness, preview, and export around one safe-file classifier.
- Excluded generated output, AI snapshot state, package history, backups, caches, logs, coverage, and protected paths.
- Added categorized skip reasons and packageable/skipped counts.
- Disabled package export when no packageable replacement files are available.
- Improved dark-theme command result styling and path wrapping.
- Updated application version identity to 1.5.3.

---

# v1.5.1 — Daily Driver UX Fixes

## Fixed

- Rebuilt snapshot history from snapshot ZIP files when the history index is missing or stale.
- Removed the duplicate snapshot creation action from the Snapshots tab.
- Added Refresh History and Open Snapshot Folder actions to the Snapshots tab.
- Added descriptive disabled labels to the AI Package Builder button.
- Improved sidebar group-label alignment, size, and readability.

---

# v1.5.0 — Daily Driver Release

## Released

- Centralized application release metadata and version identity.
- Updated the application package version to 1.5.0.
- Updated Sidebar, Header, and Status Bar release labeling.
- Documented the complete Daily Driver workflow and release boundaries.
- Updated project metadata, README, roadmap, and release documentation.

## Daily Driver systems

- Workspace intelligence and lifecycle readiness
- Embedded and PlatformIO project support
- AI Workspace and AI package builder
- Secure command execution and device-action permissions
- Package Explorer
- Unified Project Timeline
- Smart Recommendations

---

# v1.3.0 — Embedded Device Project Foundation

## Added

- Shared embedded workspace analysis models.
- Optional embedded-device project metadata fields.
- PlatformIO, ESP32-family, firmware entry-point, environment, board, and framework detection.
- Embedded project health checks and generated-output tracking warning.
- Read-only embedded target and command panels on the Dashboard.
- Embedded Project Support documentation.

## Safety

- Firmware flashing and serial-port execution are intentionally not included in this milestone.
- Product-specific behavior remains metadata and device-profile driven.

---

# Workflow Studio Changelog

All notable changes to Workflow Studio are documented here.

## v1.2.9 — Orivex Workspace Detection Polish

Completed

### Added

- Nested package.json discovery for app folders such as apps/desktop-studio.
- Nested application root detection for monorepo-style workspaces.
- Build, dev, package manager, source, Electron, React, and TypeScript detection from nested apps.
- Current milestone forwarding from .workflowstudio/project.json into generated AI continuation prompts.
- Recursive Markdown discovery for documentation folders.
- Project action button feedback so actions no longer feel inactive.

### Improved

- Orivex workspace detection now understands that the project root and app build root can be different folders.
- AI continuation prompts now use the selected workspace milestone instead of always reporting Workflow Studio v1.2.
- Documentation discovery now surfaces root Markdown files and nested documentation files.

## v1.2 — Workspace Intelligence

Completed

- Workspace scanner foundation
- Workspace health dashboard
- AI context engine
- Multi-workspace foundation
- Git, documentation, package, and template discovery polish

# v1.3.3 — Command Permissions and Embedded Device Actions

## Added

- Workspace command permission levels.
- Explicit approval for interactive and device-changing commands.
- PlatformIO firmware upload execution.
- Serial monitor session execution and stopping.
- Duplicate interactive and device-session protection.
- Permission indicators in the Dashboard.
- Copy-only blocking for unapproved metadata commands.

# v1.3.4 — Workspace Intelligence 2.0

## Added

- Phase-aware project lifecycle classification.
- Readiness categories for foundation, documentation, implementation, and delivery.
- Separate Not Started, In Progress, Ready, and Needs Attention states.
- Planning-aware embedded project guidance.
- Compact expandable capability and analyzer details.
- Lifecycle and current-milestone Dashboard summary.

## Changed

- Planned firmware work no longer reduces early embedded projects to a misleading failure state.
- Dashboard warnings are condensed into ordered recommended next steps.
- Raw analyzer output remains available without dominating the primary Dashboard.

# v1.3.5 — AI Context Engine 2.0

## Added

- Lifecycle-aware continuation prompts.
- Readiness categories in AI workspace context.
- Embedded platform, board, environment, framework, firmware, and device-profile context.
- Workspace command profiles with permission labels in generated prompts.
- Hardware, specification, and package-format documentation paths.
- Recommended next actions and missing-context notices.
- Copy Combined Prompt action using the current Developer Request.
- Workspace Context Preview on the AI Development page.

## Architecture

- AI context is generated from the shared workspace analysis model.
- No Orivex-specific behavior is hardcoded into generic AI services.


# v1.4.0 — AI Development UI Polish

## Added

- Focused Context, Package Builder, and Snapshots tabs.
- Compact workspace overview with persistent quick actions.
- Visible copied-state feedback for continuation and combined prompts.
- Improved responsive layouts for prompt preview, package preparation, and snapshot history.

## Preserved

- AI Context Engine 2.0 behavior.
- Existing package validation and export workflow.
- Snapshot creation and history data.


# v1.4.1 — AI Workspace Consolidation

## Changed

- Replaced separate AI and AI Development navigation entries with one AI Workspace.
- Promoted Developer Request into the primary workspace flow.
- Consolidated continuation prompts, combined prompts, package building, and snapshots without changing backend services.
- Removed duplicate AI routing from the active workspace.

# v1.4.2 — Dashboard Polish and Navigation Stability

## Added

- Dashboard Continue Working quick actions.
- Direct navigation to AI Workspace, Git, and Packages.
- Session persistence for the active page and AI Workspace tab.
- Session persistence for Developer Request and Package ID drafts.

## Fixed

- Creating an AI snapshot no longer returns the application to Dashboard after a renderer refresh.


# v1.4.3 — Navigation Refresh and Package Builder Repair

## Fixed

- Restored the missing AI Package Builder Electron handler and package export implementation.
- AI package failures now return specific validation messages and safety details.
- Generated packages again use the validated Workflow Studio manifest format.

## Changed

- Grouped sidebar navigation into Workspace, Development, Library, and System sections.
- Updated the sidebar version label for the Daily Driver series.
- Strengthened active-page contrast and accessibility state.


# v1.4.5 — Unified Project Timeline

## Added

- Project Timeline page
- Chronological Git commit history
- Generated and installed package activity
- AI snapshot activity
- Current uncommitted workspace change indicator
- Timeline filters and direct location opening

# v1.4.6 — Smart Recommendations

## Added

- Shared smart recommendation types and recommendation service.
- Priority-aware recommendations based on lifecycle, readiness, metadata, documentation, build configuration, embedded firmware state, and analyzer notices.
- High, medium, and low recommendation levels.
- Direct actions that route to the relevant Workflow Studio page.
- Project-agnostic embedded recommendations driven by workspace analysis.

## Changed

- Replaced the simple next-step list with richer recommendation cards that explain why each action matters.



# v1.5.2 — Package Readiness Alignment

## Fixed

- Package Builder readiness now uses the same safe replacement-file filter as package creation.
- Snapshot-only and generated-file changes no longer enable package creation.
- Disabled package actions now report `No Packageable Changes Detected`.
- Removed the duplicate Open Snapshot Folder action from the Snapshots tab.
\n\n# v2.0.3 — Global Workspace Search\n\n## Added\n\n- Ctrl+K project-wide search overlay.\n- Unified search results for documentation, packages, snapshots, timeline activity, templates, metadata, and navigation.\n- Keyboard navigation and secure active-workspace opening.\n\n\n# v2.0.4 — Project Intelligence\n\n## Added\n\n- Proactive Dashboard insights derived from shared workspace analysis.\n- Documentation-versus-implementation, testing, command availability, health, and next-action observations.\n- Clear positive, informational, and attention states with relevant navigation actions.\n
# v2.0.5.1 — Development Session Engine

## Added

- Provider-independent `DevelopmentSession` shared model.
- UI-independent `DevelopmentSessionService` for assembling workspace, documentation, command, Git, recommendation, and Developer Request context.
- Canonical continuation and combined prompts stored on each development session.

## Changed

- AI Workspace now consumes a typed development session while preserving its existing visual behavior and package safety workflow.


# v2.0.5.2 — AI Package Workflow

## Added

- Guided AI Development Pipeline in the AI Workspace.
- Development-session readiness checklist and summary.
- Provider-independent package-generation prompt.
- Copy Package-Generation Prompt and Open ChatGPT actions.
- Clear handoff into the existing Package Builder.

## Preserved

- Existing workspace analysis, snapshots, continuation prompts, package validation, and package safety behavior.


# v2.0.6.1 — Development Pipeline Feedback

## Added

- Persistent package-import, validation, installation, build, and commit-readiness states.
- Visible in-progress feedback while the integrated pipeline runs.
- Clear failed-stage presentation and expandable install/build logs.

## Changed

- Manual commands now live under an Advanced section.
- Project status now reflects the completed v2.0.5 orchestrator and active release-candidate polish.


# v2.0.6.2 — Dashboard and Sidebar Polish

- Added persistent collapsed sidebar mode.
- Refined Dashboard spacing and responsive card behavior.


# v2.0.6.3 — Command Palette and Search Polish

- Added command categories, recent commands, and fuzzy matching.
- Added search filters, history, and improved ranking.


# v2.0.6.4 — Dark Controls and Package Builder Polish

- Themed native controls and scrollbars.
- Improved package file and command presentation.


# v2.0.6.5 — Timeline and Workspace Preferences

- Added shared local workspace preferences.
- Remembered active page, sidebar state, and Timeline filter.
- Refined Timeline grouping and interaction styling.


# v2.0.6 — Release Candidate

- Completed the single-project daily-driver polish series.
- Synchronized package and project release metadata.
- Updated README and roadmap for v2.1 Multi-Project Workspace.

# v2.1.1 — Workspace Registry Foundation

## Added

- Versioned application-level Workspace Registry model.
- Registered, active, recent, and favorite project state.
- Project registration, removal, selection, favorite, and registry selector operations.
- Latest-known project health and registration timestamps.
- Automatic migration from the legacy recent-workspaces local-storage format.

## Changed

- Application workspace selection now consumes canonical registry selectors.
- Registry persistence is independent from project `.workflowstudio` metadata.

## Preserved

- Existing header workspace switching and folder-opening behavior.
- Existing Workspace Intelligence analysis flow.
- Current visual design and package safety behavior.
