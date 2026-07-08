import type { DashboardSummary, WorkspaceProjectMetadata } from "./DashboardTypes";

const fallbackMetadata: WorkspaceProjectMetadata = {
  schemaVersion: "1.0",
  name: "Workflow Studio",
  description: "A desktop tool for package-based AI-assisted software development.",
  version: "0.5.0",
  currentMilestone: "v0.5.0-workspace-feature-pack",
  projectType: "electron-react-typescript",
  rootPath: ".",
  gitEnabled: true,
  devCommand: "npm run dev",
  buildCommand: "npm run build",
  testCommand: "",
  packageFolder: "_packages",
  backupFolder: "_backup",
  documentationPaths: ["README.md", "Roadmap.md", "docs"],
  tagline: "Build software. Not setup.",
};

type WorkflowStudioBridge = {
  version?: string;
  platform?: string;
  workspace?: {
    getProjectMetadata?: () => Promise<WorkspaceProjectMetadata>;
    getProject?: () => Promise<WorkspaceProjectMetadata>;
  };
  getProjectMetadata?: () => Promise<WorkspaceProjectMetadata>;
};

declare global {
  interface Window {
    workflowStudio?: WorkflowStudioBridge;
  }
}

async function loadProjectMetadata(): Promise<WorkspaceProjectMetadata> {
  const bridge = window.workflowStudio;

  try {
    if (bridge?.workspace?.getProjectMetadata) {
      return await bridge.workspace.getProjectMetadata();
    }

    if (bridge?.workspace?.getProject) {
      return await bridge.workspace.getProject();
    }

    if (bridge?.getProjectMetadata) {
      return await bridge.getProjectMetadata();
    }
  } catch (error) {
    console.warn("Unable to load workspace metadata through Electron bridge.", error);
  }

  return fallbackMetadata;
}

function toDashboardSummary(metadata: WorkspaceProjectMetadata): DashboardSummary {
  return {
    projectName: metadata.name,
    tagline: metadata.tagline ?? "Build software. Not setup.",
    description:
      metadata.description ??
      "A managed Workflow Studio workspace.",
    version: metadata.version,
    currentMilestone: metadata.currentMilestone,
    projectType: metadata.projectType,
    gitEnabled: metadata.gitEnabled,
    packageFolder: metadata.packageFolder,
    backupFolder: metadata.backupFolder,
    documentationCount: metadata.documentationPaths?.length ?? 0,
    devCommand: metadata.devCommand ?? "npm run dev",
    buildCommand: metadata.buildCommand ?? "npm run build",
    testCommand: metadata.testCommand || "Not configured yet",
    nextActions: [
      "Open project workspace",
      "Generate package",
      "Review documentation",
      "Check Git status",
      "Generate AI context",
    ],
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const metadata = await loadProjectMetadata();
  return toDashboardSummary(metadata);
}
