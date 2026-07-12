# Workspace Registry Foundation

**Milestone:** v2.1.1  
**Status:** Complete

## Purpose

The Workspace Registry is the application-level source of truth for projects known to Workflow Studio. It is persisted independently from each project's `.workflowstudio/project.json` metadata.

## Registry model

The versioned registry stores:

- Registered projects
- Active project ID
- Recent project ordering
- Favorite state
- Registration and last-opened timestamps
- Latest known project health
- Registry update timestamp

Project metadata remains owned by each project. The registry only stores the application-level information required to locate, rank, and switch between projects.

## Service responsibilities

`WorkspaceRegistryService` now provides UI-independent operations for:

- Loading and normalizing the registry
- Migrating the former recent-workspaces local-storage format
- Registering an analyzed workspace
- Removing a registered project
- Selecting the active project
- Favoriting and unfavoriting projects
- Resolving active, recent, and favorite project collections
- Registering a project selected through the existing folder bridge

## Persistence

The registry is stored under the application key:

`workflowstudio.workspaceRegistry`

The schema is explicitly versioned so future storage migrations can be introduced without coupling the registry to project metadata.

## Preserved behavior

- The current workspace is registered automatically at startup.
- The existing header workspace switcher continues to receive recent workspaces.
- Opening a workspace folder continues to analyze and activate it.
- No visual redesign is included in this milestone.

## Next milestone

v2.1.2 should connect project registration and removal actions to the Projects feature while reusing this registry service.
