# Workflow Studio Workspace Command Profiles

**Version:** 1.0  
**Status:** Active  
**Introduced:** Workflow Studio v1.3.1

## Purpose

Workspace Command Profiles provide a project-neutral representation of useful development commands. React, Electron, Node, embedded, and future project types expose commands through the same shared model.

## Command Model

Each command includes:

- Stable identifier
- User-facing label
- Shell command text
- Category
- Description
- Detection source
- Optional working directory
- Interactive flag
- Destructive or state-changing flag

## Sources

Commands may be detected from:

- package.json scripts
- PlatformIO configuration
- Workflow Studio project metadata
- Built-in analysis capabilities

## Current Security Boundary

v1.3.1 is read-only. Workflow Studio displays and copies commands but does not execute them.

Native execution must be implemented through a secure Electron bridge with command allow-listing, working-directory validation, streamed output, cancellation, and explicit confirmation for device-changing actions.

## Metadata Commands

Projects may optionally add a `commands` array to `.workflowstudio/project.json`:

```json
{
  "commands": [
    {
      "id": "docs:validate",
      "label": "Validate documentation",
      "command": "npm run docs:validate",
      "description": "Check documentation structure and links."
    }
  ]
}
```

Metadata commands remain copy-only in this milestone.

## Future Use

The same model will support:

- Native command execution
- Output and error streaming
- Build history
- Firmware upload confirmation
- Serial-monitor sessions
- AI context generation
- Per-device command profiles
