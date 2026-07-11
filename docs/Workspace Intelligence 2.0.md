# Workspace Intelligence 2.0

**Version:** 1.3.4  
**Status:** Active  
**Last Updated:** July 2026

## Purpose

Workspace Intelligence 2.0 makes Dashboard health phase-aware. A planned feature that has not started is different from a missing or invalid requirement.

## Lifecycle Phases

Workflow Studio currently recognizes four lifecycle phases:

- Planning
- Implementation
- Testing
- Release

The current milestone and detected project structure are used to infer the phase without changing existing project metadata requirements.

## Readiness Categories

The Dashboard separates readiness into:

- Foundation
- Documentation
- Implementation or Firmware
- Build and Validation

Categories that have not started are labelled **Not Started** and are excluded from the active readiness average. This prevents early documentation-first projects from appearing broken.

## Guidance

The Dashboard presents a short ordered list of recommended next steps. Raw analyzer successes, notices, and capability details remain available inside an expandable technical-details section.

## Embedded Projects

For an embedded project in planning:

- Missing PlatformIO configuration is planned work.
- Missing firmware entry points are planned work.
- Board and framework fields display as not selected yet.
- Documentation and workspace foundations can still report high readiness.

Once firmware configuration begins, incomplete target settings become actionable implementation warnings.

## Architecture

- Electron remains responsible for filesystem analysis.
- Dashboard business logic derives lifecycle and readiness in the dashboard service.
- React renders the summary and does not perform native analysis.
- Existing secure command execution is preserved unchanged.
