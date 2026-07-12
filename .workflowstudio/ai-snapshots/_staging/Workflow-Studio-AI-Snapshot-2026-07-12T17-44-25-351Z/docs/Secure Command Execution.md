# Secure Command Execution

Workflow Studio v1.3.2 introduces controlled native execution for detected workspace commands.

## Security boundaries

- Commands are selected by command ID, not accepted as arbitrary shell text.
- Every request triggers a fresh workspace analysis and command-profile lookup.
- Commands execute without a shell.
- Executables must be present in a small allowlist.
- Working directories must remain inside the active workspace.
- Interactive commands and device-changing commands remain disabled.
- Output is streamed through the Electron bridge.
- Running commands can be cancelled.

## Enabled in this milestone

Non-interactive and non-destructive commands such as builds and tests may run directly from the Dashboard.

## Deferred

Firmware upload, serial monitoring, arbitrary custom executables, persistent terminal sessions, and command permissions are deferred to later milestones.
