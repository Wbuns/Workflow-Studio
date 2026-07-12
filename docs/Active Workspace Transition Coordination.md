# Active Workspace Transition Coordination

Workflow Studio now treats an active-project change as an application-level transition.

## Behavior

- Project-scoped feature pages remount when the active workspace changes.
- Stale state from the previously active project is discarded.
- Shared services may subscribe to a typed active-workspace change event.
- Existing explicit root-path behavior remains unchanged.
- No project files are modified during a workspace switch.

## Event

`workflowstudio:active-workspace-changed`

The event includes the previous workspace and the newly active workspace.
