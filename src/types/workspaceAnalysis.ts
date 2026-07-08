export type WorkspaceProjectType =
  | "react"
  | "electron"
  | "node"
  | "python"
  | "electron-react-typescript"
  | "unknown";

export type WorkspacePackageManager = "npm" | "pnpm" | "yarn" | "unknown";

export type WorkspaceCapability = {
  id: string;
  label: string;
  enabled: boolean;
  detail: string;
};

export type WorkspaceHealth = {
  score: number;
  warnings: string[];
  successes: string[];
};

export type WorkspaceAnalysis = {
  projectName: string;
  rootPath: string;
  projectType: WorkspaceProjectType;
  hasGit: boolean;
  hasPackageJson: boolean;
  hasReadme: boolean;
  hasDocs: boolean;
  hasWorkflowMetadata: boolean;
  buildCommand?: string;
  packageManager: WorkspacePackageManager;
  documentationPath?: string;
  capabilities: WorkspaceCapability[];
  health: WorkspaceHealth;
};
