import { scanWorkspace } from "../../services/WorkspaceScanner";
import type { WorkspaceAnalysis } from "../../types/workspaceAnalysis";
import type { DashboardSummary } from "./DashboardTypes";

function getHealthStatus(score: number): DashboardSummary["healthStatus"] {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  return "Needs Attention";
}

function getNextActions(analysis: WorkspaceAnalysis): string[] {
  const actions: string[] = [];

  if (!analysis.hasWorkflowMetadata) {
    actions.push("Create Workflow Studio metadata");
  }

  if (!analysis.buildCommand) {
    actions.push("Add a build script to package.json");
  }

  if (!analysis.hasDocs) {
    actions.push("Create a docs folder");
  }

  if (!analysis.testCommand) {
    actions.push("Add a test command when the project is ready");
  }

  actions.push("Generate AI continuation context");
  actions.push("Review Git status before the next package");

  return actions.slice(0, 5);
}

function toDashboardSummary(analysis: WorkspaceAnalysis): DashboardSummary {
  return {
    projectName: analysis.projectName,
    tagline: "Workspace intelligence is active.",
    description:
      "Workflow Studio is scanning this project for metadata, documentation, package workflow readiness, Git support, and development commands.",
    version: "v1.2",
    currentMilestone: "v1.2 Workspace Intelligence",
    projectType: analysis.projectType,
    gitEnabled: analysis.hasGit,
    packageFolder: "_packages",
    backupFolder: "_backup",
    documentationCount: analysis.documentationPaths.length,
    devCommand: analysis.devCommand ?? "Not configured yet",
    buildCommand: analysis.buildCommand ?? "Not configured yet",
    testCommand: analysis.testCommand ?? "Not configured yet",
    packageManager: analysis.packageManager,
    rootPath: analysis.rootPath,
    healthScore: analysis.health.score,
    healthStatus: getHealthStatus(analysis.health.score),
    healthWarnings: analysis.health.warnings,
    healthSuccesses: analysis.health.successes,
    capabilities: analysis.capabilities,
    workspaceAnalysis: analysis,
    nextActions: getNextActions(analysis),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const analysis = await scanWorkspace();
  return toDashboardSummary(analysis);
}
