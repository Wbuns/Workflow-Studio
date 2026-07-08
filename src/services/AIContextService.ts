import { scanWorkspace } from "./WorkspaceScanner";
import type { WorkspaceAnalysis } from "../types/workspaceAnalysis";

export type AIContextSummary = {
  projectName: string;
  currentMilestone: string;
  architectureSummary: string;
  workspaceSummary: string;
  recommendedNextStep: string;
  continuationPrompt: string;
  generatedAt: string;
};

function formatList(items: string[], fallback: string): string {
  if (items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function summarizeArchitecture(analysis: WorkspaceAnalysis): string {
  const systems = analysis.capabilities
    .filter((capability) => capability.enabled)
    .map((capability) => capability.label);

  return [
    `${analysis.projectName} is detected as a ${analysis.projectType} workspace.`,
    `The current source root is ${analysis.rootPath}.`,
    `Active systems detected: ${systems.length > 0 ? systems.join(", ") : "none yet"}.`,
    "Business logic should stay in services, React should stay focused on presentation, and Electron should only provide native desktop integration.",
  ].join(" ");
}

function summarizeWorkspace(analysis: WorkspaceAnalysis): string {
  return [
    `Workspace health: ${analysis.health.score}%.`,
    `Package manager: ${analysis.packageManager}.`,
    `Build command: ${analysis.buildCommand ?? "not detected"}.`,
    `Documentation paths: ${analysis.documentationPaths.length > 0 ? analysis.documentationPaths.join(", ") : "not detected"}.`,
  ].join(" ");
}

function recommendNextStep(analysis: WorkspaceAnalysis): string {
  if (!analysis.buildCommand) {
    return "Add or confirm a build command so every package can be validated before commit.";
  }

  if (!analysis.hasWorkflowMetadata) {
    return "Create or repair .workflowstudio/project.json so the project can be resumed automatically.";
  }

  if (analysis.health.warnings.length > 0) {
    return `Resolve the highest-value workspace warning: ${analysis.health.warnings[0]}`;
  }

  return analysis.projectName === "Workflow Studio"
    ? "Continue Workflow Studio by expanding daily-use automation."
    : "Continue the active project roadmap using Workflow Studio as the context and package-management command center.";
}

function buildContinuationPrompt(analysis: WorkspaceAnalysis, generatedAt: string): string {
  return `Workflow Studio — Continue Development

Generated: ${generatedAt}

We are continuing development of ${analysis.projectName}.

Current workspace:
- Root: ${analysis.rootPath}
- Project type: ${analysis.projectType}
- Package manager: ${analysis.packageManager}
- Build command: ${analysis.buildCommand ?? "Not detected"}
- Dev command: ${analysis.devCommand ?? "Not detected"}
- Test command: ${analysis.testCommand ?? "Not detected"}
- Health score: ${analysis.health.score}%

Detected capabilities:
${formatList(
  analysis.capabilities
    .filter((capability) => capability.enabled)
    .map((capability) => capability.label),
  "No enabled capabilities detected yet.",
)}

Warnings:
${formatList(analysis.health.warnings, "No warnings detected.")}

Current milestone:
${analysis.currentMilestone ?? "Not specified in workspace metadata"}

Architecture rules:
- Use feature-based React architecture.
- Keep business logic in services.
- Keep Electron limited to native integration and secure bridge calls.
- Use shared TypeScript models for workspace data.
- Continue using package-based milestones.
- Build before every commit.
- Never commit broken builds.
- Prefer complete replacement files.

Next recommended step:
${recommendNextStep(analysis)}

Development workflow:
1. Create or install a small milestone package.
2. Run npm run build.
3. Test the affected UI.
4. Commit only after the build passes.
5. Update documentation when architecture or workflow changes.
`;
}

export async function generateAIContext(rootPath?: string): Promise<AIContextSummary> {
  const analysis = await scanWorkspace(rootPath);
  const generatedAt = new Date().toLocaleString();

  return {
    projectName: analysis.projectName,
    currentMilestone: analysis.currentMilestone ?? "Not specified in workspace metadata",
    architectureSummary: summarizeArchitecture(analysis),
    workspaceSummary: summarizeWorkspace(analysis),
    recommendedNextStep: recommendNextStep(analysis),
    continuationPrompt: buildContinuationPrompt(analysis, generatedAt),
    generatedAt,
  };
}
