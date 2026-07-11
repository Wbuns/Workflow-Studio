import type { WorkspaceAnalysis } from "../types/workspaceAnalysis";

export type WorkspaceScannerBridge = {
  workspace?: {
    scan?: (rootPath?: string) => Promise<WorkspaceAnalysis>;
  };
  scanWorkspace?: (rootPath?: string) => Promise<WorkspaceAnalysis>;
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
  testCommand: undefined,
  devCommand: "npm run dev",
  packageManager: "npm",
  documentationPath: "docs",
  documentationPaths: ["README.md", "docs"],
  readmePath: "README.md",
  workflowMetadataPath: ".workflowstudio/project.json",
  packageJsonPath: "package.json",
  applicationRootPath: ".",
  currentMilestone: "v1.2 — Workspace Intelligence and AI Context Engine",
  workspaceCommands: [
    { id: "dev", label: "Start development server", command: "npm run dev", category: "development", description: "Start the Vite development server.", source: "package-script" },
    { id: "build", label: "Build project", command: "npm run build", category: "build", description: "Compile and package Workflow Studio.", source: "package-script" },
    { id: "analysis", label: "Run project analysis", command: "Workflow Studio Analysis", category: "analysis", description: "Refresh the read-only workspace analysis.", source: "detected" },
  ],
  packageScripts: [
    { name: "dev", command: "vite" },
    { name: "build", command: "tsc -b && vite build && npm run electron:build" },
  ],
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

export async function scanWorkspace(rootPath?: string): Promise<WorkspaceAnalysis> {
  const bridge = (window as { workflowStudio?: WorkspaceScannerBridge }).workflowStudio;

  try {
    if (bridge?.workspace?.scan) {
      return await bridge.workspace.scan(rootPath);
    }

    if (bridge?.scanWorkspace) {
      return await bridge.scanWorkspace(rootPath);
    }
  } catch (error) {
    console.warn("Unable to scan workspace through Electron bridge.", error);
  }

  return {
    ...fallbackAnalysis,
    rootPath: rootPath ?? fallbackAnalysis.rootPath,
  };
}
