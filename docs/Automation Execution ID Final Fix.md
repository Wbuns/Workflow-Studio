# Automation Execution ID Final Fix

The v2.1.8 and v2.1.9 packages carried an older copy of `developerWorkflow.ts` that did not include the optional `executionId` field.

This hotfix restores:

```ts
executionId?: string;
```

on `DeveloperAutomationRecord` in the final v2.1.9 state.
