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

export type WorkspacePackageScript = {
  name: string;
  command: string;
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
  testCommand?: string;
  devCommand?: string;
  packageManager: WorkspacePackageManager;
  documentationPath?: string;
  documentationPaths: string[];
  readmePath?: string;
  workflowMetadataPath?: string;
  packageJsonPath?: string;
  applicationRootPath?: string;
  currentMilestone?: string;
  packageScripts: WorkspacePackageScript[];
  capabilities: WorkspaceCapability[];
  health: WorkspaceHealth;
};
