# AI Context Engine 2.0

**Version:** 1.3.5  
**Status:** Active

## Purpose

AI Context Engine 2.0 turns the shared workspace analysis model into a complete continuation prompt. It does not rescan projects independently and does not hardcode product-specific behavior.

## Included Context

Generated prompts include project identity, lifecycle phase, current milestone, readiness categories, embedded target data, command profiles and permissions, Git status, documentation paths, hardware and package-format references, warnings, recommended next actions, and architecture rules.

## Embedded Projects

Embedded details come from workspace analysis and `.workflowstudio/project.json` metadata. Device profiles provide reusable product context for Orivex Display and future devices without adding product assumptions to generic services.

## Combined Prompts

The AI Development page can copy either the generated continuation prompt or a combined prompt containing the current Developer Request. Detected facts remain separate from developer instructions in the UI.

## Missing Context

The page surfaces missing milestone, board, and device-profile metadata as opportunities to improve future prompts. Missing planned firmware files are not treated as broken context during the planning phase.

## Architecture

- Shared workspace analysis remains the source of truth.
- Prompt generation stays in the AI Development service.
- Electron remains limited to scanning and native integration.
- Product-specific context remains metadata driven.
