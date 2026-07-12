import type {
  DeveloperValidationReport,
  DeveloperWorkflowResult,
} from "../types/developerWorkflow";

function requireDeveloperBridge() {
  const developer = window.workflowStudio?.developer;
  if (!developer) {
    throw new Error("Developer workflow bridge is unavailable. Restart Workflow Studio after building.");
  }
  return developer;
}

export const DeveloperWorkflowService = {
  openDownloads(): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().openDownloads();
  },

  openPackageFolder(rootPath?: string): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().openPackageFolder(rootPath);
  },

  openBackupFolder(rootPath?: string): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().openBackupFolder(rootPath);
  },

  cleanSnapshotStaging(): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().cleanSnapshotStaging();
  },

  validateWorkspace(rootPath?: string): Promise<DeveloperValidationReport> {
    return requireDeveloperBridge().validateWorkspace(rootPath);
  },
};
