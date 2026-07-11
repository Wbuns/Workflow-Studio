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
