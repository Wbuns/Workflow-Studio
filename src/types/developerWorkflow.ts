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
