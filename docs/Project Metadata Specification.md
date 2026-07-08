# Workflow Studio Project Metadata Specification

**Version:** 1.0
**Status:** Active
**Last Updated:** July 2026

---

# Purpose

This document defines the project metadata system used by Workflow Studio.

The metadata system allows Workflow Studio to understand, manage, resume, package, document, and automate software projects without relying on memory or scattered chat history.

A managed project should contain enough information for Workflow Studio, developers, and AI assistants to understand the project quickly and safely.

---

# Core Concept

Workflow Studio should treat projects as structured workspaces, not plain folders.

A workspace contains:

* Source code
* Documentation
* Milestones
* Package history
* AI context
* Build commands
* Git information
* Templates
* Workflow settings

The metadata system makes that workspace understandable.

---

# Metadata Folder

Each managed project may contain a hidden metadata folder:

```text
.workflowstudio/
```

This folder stores Workflow Studio-specific information for that project.

---

# Proposed Structure

```text
.workflowstudio/

├── project.json
├── milestones.json
├── packages.json
├── ai-context.json
├── templates.json
├── settings.json
└── history/
```

---

# project.json

The main project file.

It should describe:

* Project name
* Description
* Current version
* Current milestone
* Project type
* Root folder
* Git repository
* Build command
* Test command
* Package command
* Documentation paths

Example:

```json
{
  "name": "Workflow Studio",
  "description": "A desktop tool for package-based AI-assisted software development.",
  "version": "0.1.0",
  "currentMilestone": "v0.2-electron-shell",
  "projectType": "electron-react-typescript",
  "buildCommand": "npm run build",
  "testCommand": "",
  "gitEnabled": true
}
```

---

# milestones.json

Tracks project milestones.

Each milestone may include:

* ID
* Name
* Status
* Description
* Started date
* Completed date
* Related package
* Suggested commit message
* Notes

---

# packages.json

Tracks installed and created packages.

Each package may include:

* Package ID
* Name
* Version
* Installed date
* Build result
* Commit hash
* Rollback availability
* Files changed

---

# ai-context.json

Stores AI-related project context.

This may include:

* Active continuation prompt
* Important design rules
* Current architecture summary
* Current milestone summary
* Recently completed work
* Known issues
* Preferred development workflow

---

# templates.json

Tracks project templates.

Templates may include:

* Documentation templates
* Package templates
* Prompt templates
* Component templates
* Milestone templates

---

# settings.json

Stores project-specific Workflow Studio settings.

Examples:

* Preferred package folder
* Backup behavior
* Build verification rules
* Documentation update rules
* AI provider preferences
* UI preferences

---

# history/

The history folder may store snapshots, summaries, or archived metadata.

It should help Workflow Studio reconstruct project progress over time.

---

# Design Rules

Metadata should be:

* Human-readable
* Versioned
* Portable
* Safe to back up
* Easy to validate
* Independent of a specific AI provider

Workflow Studio should avoid storing unnecessary private or sensitive information.

---

# Compatibility

The metadata format should evolve carefully.

Future versions should support migration from older metadata versions.

Breaking metadata changes should be avoided whenever possible.

---

# Future Enhancements

Future metadata versions may support:

* Multiple build profiles
* Multiple AI providers
* Plugin settings
* Marketplace package records
* Team collaboration
* Cloud sync
* Release channels
* Project analytics

---

# Guiding Principle

A Workflow Studio project should be understandable from its metadata, documentation, and source files alone.

No project should depend on memory, hidden context, or old conversations to continue development.

---

# Related Documents

* Technical Architecture.md
* Package System.md
* AI Workflow.md
* Development Workflow.md
