# Active Workspace Service

The Active Workspace Service provides one renderer-side source for resolving the current project root from the Workspace Registry.

Existing services still accept an explicit root path. When one is not supplied, they now resolve the active registered project instead of relying on the Electron application's default folder.

This is an architectural migration milestone and does not redesign the interface.
