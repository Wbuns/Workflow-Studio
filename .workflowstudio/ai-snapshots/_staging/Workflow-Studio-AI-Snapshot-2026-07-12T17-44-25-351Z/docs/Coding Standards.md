# Workflow Studio Coding Standards

**Version:** 1.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

This document defines the coding standards for Workflow Studio.

The goal is not to enforce unnecessary rules, but to ensure the codebase remains readable, maintainable, scalable, and approachable over many years of development.

Consistency is more valuable than personal preference.

---

# Guiding Principles

Code should be:

- Readable
- Predictable
- Modular
- Well documented
- Strongly typed
- Easy to refactor

Future developers—including future AI sessions—should understand the project without unnecessary effort.

---

# General Rules

- Prefer clarity over cleverness.
- Keep files focused on a single responsibility.
- Avoid duplicated logic.
- Remove dead code instead of commenting it out.
- Prefer composition over large monolithic components.
- Refactor when complexity grows rather than accepting it.

---

# TypeScript

Workflow Studio uses TypeScript as the primary language.

Guidelines:

- Prefer explicit types.
- Avoid `any` whenever practical.
- Define reusable interfaces.
- Use enums and unions where appropriate.
- Enable strict type checking.

Strong typing is considered part of the project's documentation.

---

# React

Components should:

- Have one responsibility.
- Be reusable.
- Be easy to test.
- Remain reasonably small.

Business logic should be separated from presentation whenever practical.

---

# Component Size

As a general guideline:

- Small component: under 150 lines
- Medium component: under 300 lines
- Large component: split into smaller components

These are guidelines rather than hard limits.

---

# Folder Organization

Organize code by feature.

Example:

```
features/

    dashboard/

    projects/

    packages/

    ai/

    documentation/
```

Avoid organizing primarily by file type.

---

# Naming Conventions

Components:

```
ProjectCard.tsx
Sidebar.tsx
PackageList.tsx
```

Hooks:

```
useProject.ts
usePackages.ts
```

Services:

```
ProjectService.ts
GitService.ts
PackageService.ts
```

Interfaces:

```
Project
Package
Milestone
```

Use descriptive names over abbreviations.

---

# Functions

Functions should:

- Do one thing well.
- Have descriptive names.
- Avoid unnecessary side effects.
- Be small enough to understand quickly.

Prefer early returns over deeply nested conditionals.

---

# State Management

Keep state as local as practical.

Lift state only when multiple components genuinely require it.

Avoid unnecessary global state.

---

# Error Handling

Errors should:

- Be handled intentionally.
- Provide useful information.
- Never silently fail.

Unexpected conditions should be logged appropriately.

---

# Comments

Good code should reduce the need for comments.

Use comments to explain:

- Why something exists.
- Architectural decisions.
- Non-obvious behavior.

Avoid comments that merely repeat the code.

---

# Documentation

Public APIs, major systems, and important architectural decisions should be documented.

Documentation is considered part of the implementation.

---

# Dependencies

Before adding a dependency, ask:

- Does the platform already provide this?
- Can we implement it simply ourselves?
- Will this dependency still be maintained years from now?

Favor long-term stability over convenience.

---

# Performance

Optimize when necessary—not prematurely.

Prioritize:

- Correctness
- Readability
- Maintainability

Profile before optimizing.

---

# Security

Workflow Studio should:

- Validate user input.
- Never execute unknown code automatically.
- Clearly identify potentially destructive actions.
- Preserve backups before modifying projects.

Security should be considered throughout development.

---

# Testing

Every milestone should include testing.

Minimum expectations:

- Project builds successfully.
- Existing features continue working.
- New functionality behaves as expected.

A passing build is required before committing.

---

# Git

Commits should represent stable milestones.

Never commit:

- Broken builds
- Temporary debugging code
- Incomplete refactors

Commit messages should describe completed work clearly.

---

# Refactoring

Refactor when:

- Complexity increases.
- Duplication appears.
- Architecture becomes unclear.

Refactoring should improve maintainability without changing behavior.

---

# AI Collaboration

AI should assist with:

- Architecture
- Documentation
- Refactoring
- Code generation
- Review

Developers remain responsible for:

- Product direction
- Final validation
- Testing
- Approval

---

# Guiding Principle

Write code that will still make sense to someone reading it years later.

The best code is not the shortest—it is the easiest to understand, maintain, and extend.

---

# Related Documents

- Design Bible.md
- Technical Architecture.md
- Development Workflow.md
- AI Workflow.md