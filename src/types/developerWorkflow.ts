export type DeveloperWorkflowActionState = "idle" | "running" | "success" | "error";

export type DeveloperWorkflowResult = {
  ok: boolean;
  message: string;
  path?: string;
  details?: string[];
};

export type DeveloperValidationCheck = {
  id: string;
  label: string;
  status: "passed" | "warning" | "failed";
  detail: string;
};

export type DeveloperValidationReport = {
  ok: boolean;
  score: number;
  checks: DeveloperValidationCheck[];
  generatedAt: string;
};

export type DeveloperPackageInstallResult = DeveloperWorkflowResult & {
  packageId?: string;
  packagePath?: string;
  backupPath?: string;
  filesInstalled?: number;
};

export type DeveloperBuildSession = {
  executionId: string;
  label: string;
  command: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  output: string[];
};

export type DeveloperAutomationAction =
  | "install-package"
  | "build"
  | "validate-workspace"
  | "clean-snapshot-staging"
  | "open-folder"
  | "git-commit"
  | "git-push";

export type DeveloperAutomationRecord = {
  id: string;
  action: DeveloperAutomationAction;
  label: string;
  workspaceName?: string;
  rootPath?: string;
  status: "success" | "failed" | "started";
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  message: string;
  packageId?: string;
  exitCode?: number;
  details?: string[];
};


export type DeveloperGitAutomationState = {
  isRepository: boolean;
  branch: string;
  changedFiles: string[];
  isClean: boolean;
  remote?: string;
  upstream?: string;
  hasSuccessfulBuild: boolean;
  latestBuildAt?: string;
  suggestedCommitMessage: string;
  canCommit: boolean;
  canPush: boolean;
  message: string;
};
