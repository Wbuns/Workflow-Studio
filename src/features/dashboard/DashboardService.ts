import { scanWorkspace } from "../../services/WorkspaceScanner";
import type { DashboardSummary, WorkspaceProjectMetadata } from "./DashboardTypes";

const fallbackMetadata: WorkspaceProjectMetadata = {
  schemaVersion: "1.0",
  name: "Workflow Studio",
  description: "A desktop tool for package-based AI-assisted software development.",
  version: "1.2.1",
  currentMilestone: "v1.2.1-workspace-scanner-foundation",
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

type ProjectMetadataBridge = {
  workspace?: {
    getProjectMetadata?: () => Promise<WorkspaceProjectMetadata>;
    getProject?: () => Promise<WorkspaceProjectMetadata>;
  };
  getProjectMetadata?: () => Promise<WorkspaceProjectMetadata>;
};

async function loadProjectMetadata(): Promise<WorkspaceProjectMetadata> {
  const bridge = (window as { workflowStudio?: ProjectMetadataBridge }).workflowStudio;

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

function toDashboardSummary(
  metadata: WorkspaceProjectMetadata,
  workspaceAnalysis: Awaited<ReturnType<typeof scanWorkspace>>,
): DashboardSummary {
  return {
    projectName: metadata.name || workspaceAnalysis.projectName,
    tagline: metadata.tagline ?? "Build software. Not setup.",
    description: metadata.description ?? "A managed Workflow Studio workspace.",
    version: metadata.version,
    currentMilestone: metadata.currentMilestone,
    projectType: workspaceAnalysis.projectType !== "unknown"
      ? workspaceAnalysis.projectType
      : metadata.projectType,
    gitEnabled: workspaceAnalysis.hasGit || metadata.gitEnabled,
    packageFolder: metadata.packageFolder,
    backupFolder: metadata.backupFolder,
    documentationCount: metadata.documentationPaths?.length ?? 0,
    devCommand: metadata.devCommand ?? "npm run dev",
    buildCommand: workspaceAnalysis.buildCommand ?? metadata.buildCommand ?? "npm run build",
    testCommand: metadata.testCommand || "Not configured yet",
    nextActions: [
      "Review workspace health",
      "Generate package",
      "Review documentation",
      "Check Git status",
      "Generate AI context",
    ],
    workspaceAnalysis,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [metadata, workspaceAnalysis] = await Promise.all([
    loadProjectMetadata(),
    scanWorkspace(),
  ]);

  return toDashboardSummary(metadata, workspaceAnalysis);
}
