import type {
  ActiveWorkspace,
  AiContinuationPrompt,
  WorkspaceProjectMetadata,
} from "./workspace";
import type { DeveloperAutomationRecord, DeveloperGitAutomationState, DeveloperPackageInstallResult, DeveloperValidationReport, DeveloperWorkflowResult } from "./developerWorkflow";
import type { WorkspaceAnalysis, WorkspaceCommandExecution, WorkspaceCommandOutput } from "./workspaceAnalysis";

export type GitFileStatus = {
  path: string;
  status: string;
};

export type GitRepositoryStatus = {
  available: boolean;
  branch: string;
  ahead: number;
  behind: number;
  isClean: boolean;
  changedFiles: GitFileStatus[];
  summary: string;
  raw?: string;
  error?: string;
};

export type WorkflowStudioBridge = {
  version?: string;
  platform?: string;
  workspace?: {
    scan?: (rootPath?: string) => Promise<WorkspaceAnalysis>;
    getActiveWorkspace: () => Promise<ActiveWorkspace>;
    getProjectMetadata: () => Promise<WorkspaceProjectMetadata>;
    generateContinuationPrompt: () => Promise<AiContinuationPrompt>;
    runCommand?: (rootPath: string | undefined, commandId: string, approvedPermission?: "interactive" | "device-changing") => Promise<WorkspaceCommandExecution>;
    cancelCommand?: (executionId: string) => Promise<{ ok: boolean; message: string }>;
    onCommandOutput?: (listener: (output: WorkspaceCommandOutput) => void) => () => void;
  };
  developer?: {
    openDownloads: () => Promise<DeveloperWorkflowResult>;
    openPackageFolder: (rootPath?: string) => Promise<DeveloperWorkflowResult>;
    openBackupFolder: (rootPath?: string) => Promise<DeveloperWorkflowResult>;
    cleanSnapshotStaging: () => Promise<DeveloperWorkflowResult>;
    installLatestPackage: (rootPath?: string) => Promise<DeveloperPackageInstallResult>;
    installPackage: (rootPath?: string) => Promise<DeveloperPackageInstallResult>;
    validateWorkspace: (rootPath?: string) => Promise<DeveloperValidationReport>;
    listAutomationHistory: () => Promise<DeveloperAutomationRecord[]>;
    clearAutomationHistory: () => Promise<DeveloperWorkflowResult>;
    reconcileAutomationHistory: () => Promise<DeveloperWorkflowResult>;
    recordAutomationOperation: (record: DeveloperAutomationRecord) => Promise<DeveloperAutomationRecord>;
    getGitAutomationState: (rootPath?: string) => Promise<DeveloperGitAutomationState>;
    commitChanges: (rootPath: string | undefined, message: string) => Promise<DeveloperWorkflowResult>;
    pushBranch: (rootPath?: string) => Promise<DeveloperWorkflowResult>;
  };
  git?: {
    getStatus: () => Promise<GitRepositoryStatus>;
  };
};

declare global {
  interface Window {
    workflowStudio?: WorkflowStudioBridge;
  }
}
