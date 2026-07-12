# Windows Command Runner Fix

Electron now launches approved Windows command shims such as `npm.cmd`, `pnpm.cmd`, and `yarn.cmd` through the Windows command processor.

The existing executable allowlist, permission checks, workspace-bound working directory, output streaming, and cancellation behavior remain in place.
