import type { WorkspaceAnalysis } from "../types/workspaceAnalysis";

export type WorkspaceScannerBridge = {
  workspace?: {
    scan?: () => Promise<WorkspaceAnalysis>;
  };
  scanWorkspace?: () => Promise<WorkspaceAnalysis>;
};

const fallbackAnalysis: WorkspaceAnalysis = {
  projectName: "Workflow Studio",
  rootPath: ".",
  projectType: "electron-react-typescript",
  hasGit: true,
  hasPackageJson: true,
  hasReadme: true,
  hasDocs: true,
  hasWorkflowMetadata: true,
  buildCommand: "npm run build",
  packageManager: "npm",
  documentationPath: "docs",
  capabilities: [
    {
      id: "git",
      label: "Git",
      enabled: true,
      detail: "Repository detection is available.",
    },
    {
      id: "packages",
      label: "Packages",
      enabled: true,
      detail: "Package workflow folders are expected.",
    },
    {
      id: "documentation",
      label: "Documentation",
      enabled: true,
      detail: "Documentation folder is expected.",
    },
    {
      id: "ai-context",
      label: "AI Context",
      enabled: true,
      detail: "Workflow metadata supports AI continuation context.",
    },
  ],
  health: {
    score: 100,
    warnings: [],
    successes: [
      "Fallback workspace profile loaded.",
      "Workspace scanner bridge is ready to connect through Electron.",
    ],
  },
};

export async function scanWorkspace(): Promise<WorkspaceAnalysis> {
  const bridge = (window as { workflowStudio?: WorkspaceScannerBridge }).workflowStudio;

  try {
    if (bridge?.workspace?.scan) {
      return await bridge.workspace.scan();
    }

    if (bridge?.scanWorkspace) {
      return await bridge.scanWorkspace();
    }
  } catch (error) {
    console.warn("Unable to scan workspace through Electron bridge.", error);
  }

  return fallbackAnalysis;
}
