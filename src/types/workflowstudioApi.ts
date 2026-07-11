import type {
  ActiveWorkspace,
  AiContinuationPrompt,
  WorkspaceProjectMetadata,
} from "./workspace";
import type { WorkspaceCommandExecution, WorkspaceCommandOutput } from "./workspaceAnalysis";

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
    getActiveWorkspace: () => Promise<ActiveWorkspace>;
    getProjectMetadata: () => Promise<WorkspaceProjectMetadata>;
    generateContinuationPrompt: () => Promise<AiContinuationPrompt>;
    runCommand?: (rootPath: string | undefined, commandId: string) => Promise<WorkspaceCommandExecution>;
    cancelCommand?: (executionId: string) => Promise<{ ok: boolean; message: string }>;
    onCommandOutput?: (listener: (output: WorkspaceCommandOutput) => void) => () => void;
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
