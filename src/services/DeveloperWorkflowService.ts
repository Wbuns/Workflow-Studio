import type {
  DeveloperBuildSession,
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

  async runBuild(rootPath?: string): Promise<DeveloperBuildSession> {
    const bridge = window.workflowStudio?.workspace;
    if (!bridge?.scan || !bridge.runCommand) {
      throw new Error("Workspace build bridge is unavailable.");
    }
    const analysis = await bridge.scan(rootPath);
    const buildCommand = analysis.workspaceCommands.find((command) => command.category === "build" && command.permission === "safe");
    if (!buildCommand) throw new Error("A safe build command was not detected.");
    const execution = await bridge.runCommand(rootPath, buildCommand.id);
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
};
