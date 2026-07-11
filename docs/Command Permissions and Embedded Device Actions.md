# Command Permissions and Embedded Device Actions

**Version:** 1.3.3  
**Status:** Active  
**Last Updated:** July 2026

## Purpose

Workflow Studio classifies workspace commands before native execution so command safety is visible and enforced in both the interface and Electron process.

## Permission levels

- **Safe** — non-interactive commands such as builds, tests, and clean operations.
- **Interactive** — long-running sessions such as development servers and serial monitors. Explicit approval is required.
- **Device-changing** — commands such as firmware upload that modify a connected device. Explicit approval is required.
- **Blocked** — commands that remain copy-only because they are custom metadata commands or internal actions that do not map to an approved executable profile.

## Embedded actions

PlatformIO firmware uploads and serial-monitor sessions are generated from the current workspace analysis. Electron re-scans the workspace and resolves the command by ID immediately before every execution.

Only one interactive session may run at a time. Firmware upload is blocked while another interactive or device-changing session is active.

## Security boundaries

Workflow Studio continues to use:

- an executable allowlist;
- shell-free process spawning;
- workspace-contained working directories;
- fresh command-profile validation;
- streamed output and explicit cancellation.

This milestone does not provide an arbitrary terminal or unrestricted custom-command execution.
