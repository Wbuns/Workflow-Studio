# Electron Automation Execution ID Fix

The Electron-local `DeveloperAutomationRecord` type now includes:

```ts
executionId?: string;
```

This matches the shared renderer type and allows build completion records to reconcile by execution ID.
