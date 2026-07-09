import type {
  ActiveWorkspace,
  AiContinuationPrompt,
  WorkspaceProjectMetadata,
} from "./workspace";

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
