export type WorkspaceProjectType =
  | "react"
  | "electron"
  | "node"
  | "python"
  | "embedded"
  | "esp32"
  | "platformio"
  | "electron-react-typescript"
  | "unknown";

export type WorkspacePackageManager = "npm" | "pnpm" | "yarn" | "platformio" | "unknown";

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

export type WorkspaceCommandCategory =
  | "development"
  | "build"
  | "test"
  | "embedded"
  | "maintenance"
  | "analysis";

export type WorkspaceCommandPermission = "safe" | "interactive" | "device-changing" | "blocked";

export type WorkspaceCommand = {
  id: string;
  label: string;
  command: string;
  category: WorkspaceCommandCategory;
  description: string;
  source: "package-script" | "platformio" | "metadata" | "detected";
  workingDirectory?: string;
  destructive?: boolean;
  interactive?: boolean;
  permission: WorkspaceCommandPermission;
};

export type WorkspaceCommandExecutionStatus = "running" | "completed" | "failed" | "cancelled";

export type WorkspaceCommandExecution = {
  executionId: string;
  commandId: string;
  label: string;
  command: string;
  status: WorkspaceCommandExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  message?: string;
  permission: WorkspaceCommandPermission;
};

export type WorkspaceCommandOutput = {
  executionId: string;
  stream: "stdout" | "stderr" | "system";
  text: string;
  timestamp: string;
};

export type EmbeddedWorkspaceAnalysis = {
  detected: boolean;
  platform?: string;
  boardIdentifiers: string[];
  environments: string[];
  frameworks: string[];
  firmwareSourcePath?: string;
  platformioConfigPath?: string;
  buildCommand?: string;
  uploadCommand?: string;
  serialMonitorCommand?: string;
  cleanCommand?: string;
  deviceProfile?: string;
  hardwareDocumentationPaths: string[];
  specificationPaths: string[];
  packageFormatDocumentationPaths: string[];
  generatedOutputTracked: boolean;
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
  workspaceCommands: WorkspaceCommand[];
  embedded?: EmbeddedWorkspaceAnalysis;
  capabilities: WorkspaceCapability[];
  health: WorkspaceHealth;
};
