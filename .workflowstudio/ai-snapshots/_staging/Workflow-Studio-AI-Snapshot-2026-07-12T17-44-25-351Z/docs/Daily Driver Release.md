# Workflow Studio v1.5.0 — Daily Driver Release

**Status:** Released  
**Version:** 1.5.0  
**Release line:** Daily Driver

## Purpose

The v1.5.0 release marks the point where Workflow Studio is ready for regular project-management and AI-assisted development use across software and embedded-device workspaces.

## Included systems

- Managed workspace registry and project metadata
- Workspace analysis and readiness intelligence
- Embedded and PlatformIO project awareness
- AI Workspace with continuation prompts and developer requests
- AI snapshots and package generation
- Secure workspace commands and embedded-device permissions
- Package Explorer with folders and breadcrumbs
- Unified project timeline
- Smart project recommendations
- Git, documentation, packages, projects, templates, and settings pages

## Release identity

Application name, version, release name, and technology label are now defined in one shared source file:

```text
src/config/appMetadata.ts
```

UI surfaces should use this metadata rather than maintaining independent version strings.

## Daily workflow

1. Select or open a workspace.
2. Review Dashboard readiness and recommendations.
3. Prepare the next task in AI Workspace.
4. Create a snapshot when source context changes.
5. Build and validate a milestone package.
6. Run the project build.
7. Review Git status and commit only after validation.
8. Use Timeline to review recent project activity.

## Release boundaries

Workflow Studio remains a project operating environment rather than a replacement for an IDE, Git, or PlatformIO. Native execution remains constrained by the secure command bridge and permission model.

## Next development line

Post-v1.5 work should focus on real-world use, bug fixes, workflow friction, device profiles, embedded project bootstrap, and release tracking rather than broad feature expansion without user feedback.
