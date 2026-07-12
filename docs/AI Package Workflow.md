# Workflow Studio AI Package Workflow

**Version:** 2.0.5.2  
**Status:** Active  
**Last Updated:** July 2026

## Purpose

The AI Package Workflow exposes the Development Session Engine through a guided, provider-independent development pipeline.

## Workflow

1. Workflow Studio analyzes the active workspace automatically.
2. The AI Workspace builds a typed development session.
3. The developer reviews session readiness and the Developer Request.
4. Workflow Studio creates a package-generation prompt.
5. The prompt is copied and ChatGPT is opened for the manual provider handoff.
6. The generated ZIP returns to Workflow Studio through the existing Package Builder and package installer.

## Safety

This milestone does not install packages automatically and does not weaken validation. Generated packages must still use the standard manifest, backup, validation, build, test, and commit workflow.

## Architecture

Package-generation prompt construction belongs to `DevelopmentSessionService`. The React page displays workflow state and delegates context assembly to the service. This keeps the workflow provider-independent and reusable by future AI integrations.
