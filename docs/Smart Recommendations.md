# Smart Recommendations

**Version:** 1.0  
**Status:** Active  
**Introduced:** Workflow Studio v1.4.6

## Purpose

Smart Recommendations turn workspace analysis into a short, prioritized set of useful next actions.

Recommendations are derived from shared workspace facts including:

- Project lifecycle phase
- Workspace readiness
- Project metadata
- Documentation presence
- Build and test commands
- Embedded firmware configuration
- PlatformIO board environments
- Generated-output warnings
- Analyzer notices

## Priority Levels

- **High** — a blocker or configuration issue that should be resolved before the next package or release.
- **Medium** — valuable follow-up work that improves repeatability or project readiness.
- **Low** — planned work or preparation that is not currently blocking progress.

## Architecture

Recommendation logic lives in a service and consumes the existing shared workspace analysis model. The Dashboard only renders recommendations and routes users to existing pages.

The service must remain project-agnostic. Device-specific recommendations are based on embedded metadata and detected configuration rather than hardcoded product names.

## Guiding Principle

Recommendations should reduce uncertainty without taking control away from the developer.
