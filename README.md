# Workflow Studio

A desktop tool for managing package-based AI-assisted software development.

Workflow Studio is not intended to replace an IDE. It is designed to manage the information around development: projects, milestones, packages, documentation, Git status, AI context, and long-term continuity.

## Current Status

**v1.2 — Workspace Intelligence is complete.**

Completed major systems:

- Electron desktop application
- Responsive desktop UI
- Dashboard, Projects, Packages, Documentation, AI, Git, and workspace shell pages
- Package installation workflow with validation and backups
- Workspace metadata loading from `.workflowstudio/project.json`
- Real workspace integration
- Shared Electron bridge architecture
- Shared Git type architecture
- Workspace Scanner foundation
- Workspace intelligence detection
- Dashboard workspace health display
- AI Context Engine foundation
- Multi-workspace foundation

## v1.2 Highlights

Workflow Studio can now understand managed workspaces more automatically.

It can detect and summarize:

- Git repository presence
- `package.json`
- README status
- Documentation folder status
- Workflow Studio metadata
- Package manager
- Build command
- Project type
- Workspace health
- Workspace capabilities

The AI Context Engine can generate continuation-style development context from workspace metadata and detected project information, reducing the need to manually rebuild project context between chats.

## Development Workflow

This project follows a package-based workflow:

1. Plan a small milestone.
2. Generate an installable package.
3. Install the package.
4. Build the project.
5. Test the feature.
6. Commit only if the build passes.
7. Update documentation when the milestone changes project direction.

## Standard Commands

```powershell
cd "C:\Users\mitch\Desktop\GPT Workflow Studio"
npm run build
```

After a successful package install and build:

```powershell
git add .
git commit -m "Describe completed milestone"
```

## Next Direction

Workflow Studio v1.2 is now stable enough to use as the primary project-management companion while returning to Orivex development.

Recommended next Workflow Studio work later:

- v1.3 Workspace polish and persistence hardening
- v1.4 AI prompt export improvements
- v1.5 Package history and rollback UI
- v1.6 Deeper Orivex project integration
