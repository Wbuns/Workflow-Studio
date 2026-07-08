import { getActiveWorkspace } from "../../services/WorkspaceService";
import type { ActiveWorkspace } from "../../types/workspace";
import type { DashboardSummary } from "./DashboardTypes";

function toDashboardSummary(workspace: ActiveWorkspace): DashboardSummary {
  const metadata = workspace.metadata;

  return {
    projectName: metadata.name,
    tagline: metadata.tagline ?? "Real workspace loaded.",
    description: metadata.description ?? "A managed Workflow Studio workspace.",
    version: metadata.version,
    currentMilestone: metadata.currentMilestone,
    projectType: metadata.projectType,
    rootPath: workspace.rootPath,
    gitEnabled: metadata.gitEnabled,
    packageFolder: metadata.packageFolder,
    backupFolder: metadata.backupFolder,
    documentationCount: metadata.documentationPaths?.length ?? 0,
    devCommand: metadata.devCommand ?? "npm run dev",
    buildCommand: metadata.buildCommand ?? "npm run build",
    testCommand: metadata.testCommand || "Not configured yet",
    nextActions: [
      "Generate AI continuation prompt",
      "Review active workspace metadata",
      "Continue current milestone package",
      "Run build before commit",
      "Return to Orivex Render Stack development",
    ],
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const workspace = await getActiveWorkspace();
  return toDashboardSummary(workspace);
}
