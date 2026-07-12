import type {
  CreateDevelopmentSessionInput,
  DevelopmentSession,
} from "../types/developmentSession";
import type { WorkspaceCommand } from "../types/workspaceAnalysis";

function commandLines(commands: WorkspaceCommand[]): string {
  if (!commands.length) return "- No workspace commands detected.";
  return commands
    .map((item) => `- ${item.label}: ${item.command} [${item.permission}]`)
    .join("\n");
}

function listOrFallback(items: string[], fallback: string): string {
  return (items.length ? items : [fallback]).map((item) => `- ${item}`).join("\n");
}

function createSessionId(projectName: string, generatedAt: Date): string {
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${safeName || "workspace"}-${generatedAt.toISOString()}`;
}

export function buildDevelopmentContinuationPrompt(
  input: Omit<CreateDevelopmentSessionInput, "developerRequest">,
): string {
  const { analysis, gitStatus, workspaceContext } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const projectName = analysis?.projectName ?? "Selected workspace";
  const embedded = analysis?.embedded;

  return `${projectName} — Continue Development

Generated: ${generatedAt.toLocaleString()}

We are continuing development of ${projectName}.

Project identity:
- Root: ${analysis?.rootPath ?? "Unknown"}
- Project type: ${analysis?.projectType ?? "unknown"}
- Lifecycle: ${workspaceContext.lifecycle}
- Current milestone: ${analysis?.currentMilestone ?? "Not specified"}
- Package manager: ${analysis?.packageManager ?? "unknown"}

Readiness:
${workspaceContext.readiness.map((item) => `- ${item.label}: ${item.status}`).join("\n") || "- Not available"}

Embedded target:
- Platform: ${embedded?.platform ?? "Not detected"}
- Board: ${embedded?.boardIdentifiers.join(", ") || "Not detected"}
- Environments: ${embedded?.environments.join(", ") || "Not detected"}
- Framework: ${embedded?.frameworks.join(", ") || "Not detected"}
- Device profile: ${embedded?.deviceProfile ?? "Not specified"}
- Firmware source: ${embedded?.firmwareSourcePath ?? "Not started"}

Workspace commands:
${commandLines(analysis?.workspaceCommands ?? [])}

Git status:
- Repository: ${gitStatus?.isRepository ? "Yes" : "No"}
- Branch: ${gitStatus?.branch ?? "Unknown"}
- Status: ${gitStatus?.summary ?? "Not checked"}

Relevant documentation:
${listOrFallback(analysis?.documentationPaths ?? [], "No documentation paths detected.")}

Hardware and specification documentation:
${listOrFallback([
    ...(embedded?.hardwareDocumentationPaths ?? []),
    ...(embedded?.specificationPaths ?? []),
    ...(embedded?.packageFormatDocumentationPaths ?? []),
  ], "No embedded hardware or package-format documentation detected.")}

Current warnings:
${listOrFallback(analysis?.health.warnings ?? [], "No active warnings.")}

Recommended next actions:
${listOrFallback(workspaceContext.nextActions, "Review the current milestone.")}

Architecture and workflow rules:
- Use feature-based React architecture.
- Keep business logic in services.
- Keep Electron limited to native integration and secure bridge calls.
- Use shared TypeScript models.
- Prefer small, installable milestones.
- Build before every commit.
- Never commit broken builds.
- Prefer complete replacement files when appropriate.

Next request:
Review this workspace context and recommend the next safest milestone. Preserve existing behavior unless the request explicitly changes it.`;
}

export function buildDevelopmentCombinedPrompt(
  continuationPrompt: string,
  developerRequest?: string,
): string {
  const request = developerRequest?.trim() ?? "";
  if (!request) return continuationPrompt;
  return `${continuationPrompt}\n\n--- Developer Request ---\n\n${request}`;
}


export function buildPackageGenerationPrompt(
  combinedPrompt: string,
  projectName: string,
  currentMilestone?: string,
): string {
  return `${combinedPrompt}

--- Package Generation Requirements ---

Create a complete, installable Workflow Studio milestone package for ${projectName}.

Package requirements:
- Use the current milestone ${currentMilestone ?? "defined in the Developer Request"}.
- Produce complete replacement files rather than partial patches when practical.
- Include manifest.json with source and target mappings.
- Include README.md with purpose, installation steps, validation checklist, and suggested commit message.
- Include all changed implementation and documentation files under files/.
- Preserve existing behavior unless the Developer Request explicitly changes it.
- Do not weaken package validation, backups, build checks, or security boundaries.
- The result must be delivered as a downloadable ZIP that can be extracted and installed with the existing Workflow Studio package installer.
- Build must pass after installation.

Return the completed package, not only an implementation plan.`;
}

export function createDevelopmentSession(input: CreateDevelopmentSessionInput): DevelopmentSession {
  const generatedAt = input.generatedAt ?? new Date();
  const continuationPrompt = buildDevelopmentContinuationPrompt({
    analysis: input.analysis,
    gitStatus: input.gitStatus,
    workspaceContext: input.workspaceContext,
    generatedAt,
  });
  const developerRequest = input.developerRequest?.trim() ?? "";
  const analysis = input.analysis;
  const embedded = analysis?.embedded;
  const projectName = analysis?.projectName ?? "Selected workspace";
  const combinedPrompt = buildDevelopmentCombinedPrompt(continuationPrompt, developerRequest);

  return {
    id: createSessionId(projectName, generatedAt),
    generatedAt: generatedAt.toISOString(),
    project: {
      name: projectName,
      rootPath: analysis?.rootPath ?? "",
      projectType: analysis?.projectType ?? "unknown",
      packageManager: analysis?.packageManager ?? "unknown",
      currentMilestone: analysis?.currentMilestone,
    },
    workspace: analysis,
    workspaceContext: input.workspaceContext,
    documentation: {
      paths: analysis?.documentationPaths ?? [],
      hardwarePaths: embedded?.hardwareDocumentationPaths ?? [],
      specificationPaths: embedded?.specificationPaths ?? [],
      packageFormatPaths: embedded?.packageFormatDocumentationPaths ?? [],
    },
    commands: {
      buildCommand: analysis?.buildCommand,
      testCommand: analysis?.testCommand,
      devCommand: analysis?.devCommand,
      workspaceCommands: analysis?.workspaceCommands ?? [],
    },
    gitStatus: input.gitStatus,
    developerRequest,
    continuationPrompt,
    combinedPrompt,
    packageGenerationPrompt: buildPackageGenerationPrompt(
      combinedPrompt,
      projectName,
      analysis?.currentMilestone,
    ),
    warnings: analysis?.health.warnings ?? [],
    recommendations: input.workspaceContext.nextActions,
  };
}
