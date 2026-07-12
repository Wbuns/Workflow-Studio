import type {
  DeveloperAutomationRecord,
  DeveloperBuildSession,
  DeveloperGitAutomationState,
  DeveloperReleaseReadiness,
  DeveloperPackageInstallResult,
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

  async runBuild(rootPath?: string, workspaceName?: string): Promise<DeveloperBuildSession> {
    const bridge = window.workflowStudio?.workspace;
    if (!bridge?.scan || !bridge.runCommand) {
      throw new Error("Workspace build bridge is unavailable.");
    }
    const analysis = await bridge.scan(rootPath);
    const buildCommand = analysis.workspaceCommands.find((command) => command.category === "build" && command.permission === "safe");
    if (!buildCommand) throw new Error("A safe build command was not detected.");
    const execution = await bridge.runCommand(rootPath, buildCommand.id);
    await requireDeveloperBridge().recordAutomationOperation({
      id: `automation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: "build",
      label: buildCommand.label,
      workspaceName,
      rootPath,
      status: "started",
      startedAt: execution.startedAt,
      message: `Build started: ${execution.command}`,
      executionId: execution.executionId,
    });
    return { ...execution, output: [] };
  },

  subscribeToBuildOutput(listener: (line: string) => void): () => void {
    return window.workflowStudio?.workspace?.onCommandOutput?.((output) => {
      listener(`[${output.stream}] ${output.text}`);
    }) ?? (() => undefined);
  },

  installLatestPackage(rootPath?: string): Promise<DeveloperPackageInstallResult> {
    return requireDeveloperBridge().installLatestPackage(rootPath);
  },

  installPackage(rootPath?: string): Promise<DeveloperPackageInstallResult> {
    return requireDeveloperBridge().installPackage(rootPath);
  },

  async installLatestPackageAndBuild(rootPath?: string): Promise<DeveloperWorkflowResult> {
    const installed = await this.installLatestPackage(rootPath);
    if (!installed.ok) return installed;
    const build = await this.runBuild(rootPath);
    return {
      ok: build.status !== "failed",
      message: `${installed.message} Build started: ${build.command}`,
      details: installed.backupPath ? [`Backup: ${installed.backupPath}`] : undefined,
    };
  },

  async installPackageAndBuild(rootPath?: string): Promise<DeveloperWorkflowResult> {
    const installed = await this.installPackage(rootPath);
    if (!installed.ok) return installed;
    const build = await this.runBuild(rootPath);
    return {
      ok: build.status !== "failed",
      message: `${installed.message} Build started: ${build.command}`,
      details: installed.backupPath ? [`Backup: ${installed.backupPath}`] : undefined,
    };
  },

  validateWorkspace(rootPath?: string): Promise<DeveloperValidationReport> {
    return requireDeveloperBridge().validateWorkspace(rootPath);
  },

  listAutomationHistory(): Promise<DeveloperAutomationRecord[]> {
    return requireDeveloperBridge().listAutomationHistory();
  },

  clearAutomationHistory(): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().clearAutomationHistory();
  },

  reconcileAutomationHistory(): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().reconcileAutomationHistory();
  },

  getGitAutomationState(rootPath?: string): Promise<DeveloperGitAutomationState> {
    return requireDeveloperBridge().getGitAutomationState(rootPath);
  },

  commitChanges(rootPath: string | undefined, message: string): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().commitChanges(rootPath, message);
  },

  pushBranch(rootPath?: string): Promise<DeveloperWorkflowResult> {
    return requireDeveloperBridge().pushBranch(rootPath);
  },

  async getReleaseReadiness(rootPath?: string): Promise<DeveloperReleaseReadiness> {
    const [validation, git, history] = await Promise.all([
      this.validateWorkspace(rootPath),
      this.getGitAutomationState(rootPath),
      this.listAutomationHistory(),
    ]);
    const latestSnapshot = history.find((record) =>
      record.action === "create-snapshot" && record.rootPath === rootPath && record.status === "success",
    );
    const checks = [
      {
        id: "workspace",
        label: "Workspace validation",
        status: validation.ok ? "passed" as const : validation.score >= 70 ? "warning" as const : "failed" as const,
        detail: `Preflight score: ${validation.score}%.`,
      },
      {
        id: "build",
        label: "Successful build",
        status: git.hasSuccessfulBuild ? "passed" as const : "failed" as const,
        detail: git.hasSuccessfulBuild ? `Passed ${git.latestBuildAt ? new Date(git.latestBuildAt).toLocaleString() : "recently"}.` : "Run Build before release.",
      },
      {
        id: "git",
        label: "Git repository",
        status: git.isRepository ? "passed" as const : "failed" as const,
        detail: git.isRepository ? `Branch ${git.branch}; ${git.isClean ? "working tree clean" : `${git.changedFiles.length} changed file(s)`}.` : git.message,
      },
      {
        id: "remote",
        label: "Remote repository",
        status: git.remote ? "passed" as const : "warning" as const,
        detail: git.remote ? "Origin remote is configured." : "No origin remote is configured.",
      },
      {
        id: "snapshot",
        label: "AI snapshot",
        status: latestSnapshot ? "passed" as const : "warning" as const,
        detail: latestSnapshot ? `Latest recorded snapshot: ${new Date(latestSnapshot.startedAt).toLocaleString()}.` : "Create a current snapshot before release.",
      },
    ];
    const passed = checks.filter((check) => check.status === "passed").length;
    const score = Math.round((passed / checks.length) * 100);
    const ready = checks.every((check) => check.status !== "failed");
    const nextAction =
      !validation.ok ? "Resolve workspace validation failures."
      : !git.hasSuccessfulBuild ? "Run Build."
      : !latestSnapshot ? "Create Snapshot."
      : !git.isClean ? "Review and commit the current changes."
      : !git.remote ? "Configure an origin remote."
      : "Release preflight is ready.";
    return { ready, score, generatedAt: new Date().toISOString(), checks, nextAction };
  },
};
