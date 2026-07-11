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
