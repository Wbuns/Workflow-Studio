import type {
  WorkspaceAnalysis as SharedWorkspaceAnalysis,
  WorkspaceCommand,
} from "../../types/workspaceAnalysis";

export type WorkspaceAnalysis = SharedWorkspaceAnalysis;

export type GitStatus = {
  isRepository: boolean;
  branch: string;
  status: "clean" | "dirty" | "not-repository";
  changedFiles: string[];
  summary: string;
};

export type AISnapshotRecord = {
  id: string;
  name: string;
  filePath: string;
  createdAt: string;
  rootPath: string;
  includedRoots: string[];
  excludedPatterns: string[];
  sizeBytes?: number;
};

export type AISnapshotResult = {
  ok: boolean;
  message: string;
  snapshot?: AISnapshotRecord;
};

export type AIPackageSafetyState = "safe" | "warning" | "blocked";

export type AIPackageSkippedFile = {
  path: string;
  reason: string;
  category: "generated" | "protected" | "deleted" | "unsupported" | "missing";
};

export type AIPackageBuilderResult = {
  ok: boolean;
  message: string;
  packageId?: string;
  packagePath?: string;
  files?: string[];
  installCommand?: string;
  buildCommand?: string;
  suggestedCommitMessage?: string;
  warnings?: string[];
  skippedFiles?: AIPackageSkippedFile[];
  safetyState?: AIPackageSafetyState;
  validationSummary?: string;
};

export type AIPackageReadiness = {
  isRepository: boolean;
  changedFiles: string[];
  packageableFiles: string[];
  skippedFiles: AIPackageSkippedFile[];
  counts: {
    changed: number;
    packageable: number;
    skipped: number;
    generated: number;
    protected: number;
    deleted: number;
    unsupported: number;
    missing: number;
  };
  message: string;
};


export type ImportedPackageFile = {
  source: string;
  target: string;
  exists: boolean;
};

export type ImportedPackageResult = {
  ok: boolean;
  canceled?: boolean;
  message: string;
  sourcePath?: string;
  packagePath?: string;
  packageId?: string;
  targetProject?: string;
  description?: string;
  generatedAt?: string;
  suggestedInstallCommand?: string;
  suggestedBuildCommand?: string;
  suggestedCommitMessage?: string;
  files: ImportedPackageFile[];
  warnings: string[];
  safetyState: AIPackageSafetyState;
};

export type AIReadinessItem = {
  label: string;
  status: "Ready" | "In Progress" | "Not Started" | "Needs Attention";
};

export type AIWorkspaceContext = {
  lifecycle: "Planning" | "Implementation" | "Testing" | "Release";
  readiness: AIReadinessItem[];
  nextActions: string[];
  missingMetadata: string[];
};

type WorkflowStudioBridge = {
  workspace?: {
    scan?: (rootPath?: string) => Promise<WorkspaceAnalysis>;
    gitStatus?: (rootPath?: string) => Promise<GitStatus>;
    createAISnapshot?: (rootPath?: string) => Promise<AISnapshotResult>;
    listAISnapshots?: (rootPath?: string) => Promise<AISnapshotRecord[]>;
    openAISnapshotFolder?: (rootPath?: string) => Promise<{ ok: boolean; message: string }>;
    getAIPackageReadiness?: (rootPath?: string) => Promise<AIPackageReadiness>;
    createAIPackage?: (input: { rootPath?: string; developerRequest: string; packageId?: string }) => Promise<AIPackageBuilderResult>;
    importGeneratedPackage?: (rootPath?: string, sourcePath?: string) => Promise<ImportedPackageResult>;
  };
};

function bridge() {
  return (window as unknown as { workflowStudio?: WorkflowStudioBridge }).workflowStudio;
}

export async function scanWorkspace(rootPath?: string) {
  return bridge()?.workspace?.scan?.(rootPath) ?? null;
}

export async function getGitStatus(rootPath?: string) {
  return bridge()?.workspace?.gitStatus?.(rootPath) ?? null;
}

export async function createAISnapshot(rootPath?: string): Promise<AISnapshotResult> {
  const createSnapshot = bridge()?.workspace?.createAISnapshot;
  if (!createSnapshot) {
    return { ok: false, message: "AI snapshot backend is not available. Restart Workflow Studio after installing the package." };
  }
  return createSnapshot(rootPath);
}

export async function listAISnapshots(rootPath?: string): Promise<AISnapshotRecord[]> {
  return bridge()?.workspace?.listAISnapshots?.(rootPath) ?? [];
}

export async function openAISnapshotFolder(rootPath?: string) {
  return bridge()?.workspace?.openAISnapshotFolder?.(rootPath)
    ?? Promise.resolve({ ok: false, message: "Snapshot folder backend is not available." });
}

export async function getAIPackageReadiness(rootPath?: string): Promise<AIPackageReadiness> {
  const getReadiness = bridge()?.workspace?.getAIPackageReadiness;
  if (!getReadiness) {
    return {
      isRepository: false,
      changedFiles: [],
      packageableFiles: [],
      skippedFiles: [],
      counts: { changed: 0, packageable: 0, skipped: 0, generated: 0, protected: 0, deleted: 0, unsupported: 0, missing: 0 },
      message: "Package readiness backend is not available. Restart Workflow Studio after installing the package.",
    };
  }
  return getReadiness(rootPath);
}

export async function createAIPackage(input: {
  rootPath?: string;
  developerRequest: string;
  packageId?: string;
}): Promise<AIPackageBuilderResult> {
  const createPackage = bridge()?.workspace?.createAIPackage;
  if (!createPackage) {
    return {
      ok: false,
      message: "AI Package Builder backend is not available. Restart Workflow Studio after installing the package.",
      warnings: ["Electron bridge method workspace.createAIPackage was not found."],
    };
  }
  return createPackage(input);
}

export async function importGeneratedPackage(rootPath?: string, sourcePath?: string): Promise<ImportedPackageResult> {
  const importPackage = bridge()?.workspace?.importGeneratedPackage;
  if (!importPackage) {
    return {
      ok: false,
      message: "Package intake backend is not available. Restart Workflow Studio after installing the package.",
      files: [],
      warnings: ["Electron bridge method workspace.importGeneratedPackage was not found."],
      safetyState: "blocked",
    };
  }
  return importPackage(rootPath, sourcePath);
}

function inferLifecycle(analysis: WorkspaceAnalysis): AIWorkspaceContext["lifecycle"] {
  const milestone = analysis.currentMilestone?.toLowerCase() ?? "";
  if (/release|shipping|production|launch/.test(milestone)) return "Release";
  if (/test|validation|qa|verification/.test(milestone)) return "Testing";
  const notStarted = analysis.embedded?.detected
    ? !analysis.embedded.platformioConfigPath && !analysis.embedded.firmwareSourcePath
    : !analysis.hasPackageJson;
  return notStarted ? "Planning" : "Implementation";
}

function readinessStatus(checks: boolean[], started = true): AIReadinessItem["status"] {
  if (!started) return "Not Started";
  const score = checks.length ? checks.filter(Boolean).length / checks.length : 0;
  if (score >= 0.9) return "Ready";
  if (score >= 0.45) return "In Progress";
  return "Needs Attention";
}

export function buildAIWorkspaceContext(analysis: WorkspaceAnalysis | null): AIWorkspaceContext {
  if (!analysis) {
    return {
      lifecycle: "Planning",
      readiness: [],
      nextActions: ["Open a managed workspace."],
      missingMetadata: ["Workspace analysis is not available."],
    };
  }

  const lifecycle = inferLifecycle(analysis);
  const embedded = analysis.embedded;
  const hardwareDocumented = Boolean(
    embedded?.hardwareDocumentationPaths.length || embedded?.specificationPaths.length,
  );
  const implementationChecks = embedded?.detected
    ? [Boolean(embedded.platformioConfigPath), Boolean(embedded.firmwareSourcePath), embedded.environments.length > 0, embedded.boardIdentifiers.length > 0]
    : [analysis.hasPackageJson, Boolean(analysis.buildCommand)];
  const implementationStarted = implementationChecks.some(Boolean);
  const deliveryChecks = embedded?.detected
    ? [Boolean(analysis.buildCommand), !embedded.generatedOutputTracked]
    : [Boolean(analysis.buildCommand), Boolean(analysis.testCommand)];
  const deliveryStarted = Boolean(analysis.buildCommand || analysis.testCommand);

  const readiness: AIReadinessItem[] = [
    { label: "Foundation", status: readinessStatus([analysis.hasGit, analysis.hasWorkflowMetadata, analysis.hasReadme]) },
    { label: "Documentation", status: readinessStatus([analysis.hasDocs, analysis.hasReadme, !embedded?.detected || hardwareDocumented]) },
    { label: embedded?.detected ? "Firmware" : "Implementation", status: readinessStatus(implementationChecks, implementationStarted) },
    { label: "Build & Validation", status: readinessStatus(deliveryChecks, deliveryStarted) },
  ];

  const nextActions: string[] = [];
  if (!analysis.hasWorkflowMetadata) nextActions.push("Create Workflow Studio project metadata.");
  if (!analysis.hasDocs) nextActions.push("Create project documentation.");
  if (embedded?.detected) {
    if (!embedded.platformioConfigPath) nextActions.push(lifecycle === "Planning" ? "Begin the firmware foundation milestone when planning is complete." : "Add platformio.ini.");
    if (embedded.platformioConfigPath && !embedded.firmwareSourcePath) nextActions.push("Add the firmware source entry point.");
    if (embedded.platformioConfigPath && embedded.boardIdentifiers.length === 0) nextActions.push("Define the target board environment.");
  } else {
    if (!analysis.buildCommand) nextActions.push("Define a build command.");
    if (analysis.buildCommand && !analysis.testCommand) nextActions.push("Add validation or test coverage when appropriate.");
  }
  nextActions.push("Review Git status before the next package.");

  const missingMetadata: string[] = [];
  if (!analysis.currentMilestone) missingMetadata.push("Current milestone is not defined in project metadata.");
  if (embedded?.detected && !embedded.deviceProfile) missingMetadata.push("Device profile is not defined.");
  if (embedded?.detected && !embedded.boardIdentifiers.length) missingMetadata.push("Target board identifier is not defined yet.");

  return { lifecycle, readiness, nextActions: nextActions.slice(0, 5), missingMetadata };
}

function commandLines(commands: WorkspaceCommand[]): string {
  if (!commands.length) return "- No workspace commands detected.";
  return commands.map((item) => `- ${item.label}: ${item.command} [${item.permission}]`).join("\n");
}

function listOrFallback(items: string[], fallback: string): string {
  return (items.length ? items : [fallback]).map((item) => `- ${item}`).join("\n");
}

export function buildContinuationPrompt(
  analysis: WorkspaceAnalysis | null,
  gitStatus: GitStatus | null,
) {
  const context = buildAIWorkspaceContext(analysis);
  const generatedAt = new Date().toLocaleString();
  const projectName = analysis?.projectName ?? "Selected workspace";
  const embedded = analysis?.embedded;

  return `${projectName} — Continue Development

Generated: ${generatedAt}

We are continuing development of ${projectName}.

Project identity:
- Root: ${analysis?.rootPath ?? "Unknown"}
- Project type: ${analysis?.projectType ?? "unknown"}
- Lifecycle: ${context.lifecycle}
- Current milestone: ${analysis?.currentMilestone ?? "Not specified"}
- Package manager: ${analysis?.packageManager ?? "unknown"}

Readiness:
${context.readiness.map((item) => `- ${item.label}: ${item.status}`).join("\n") || "- Not available"}

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
${listOrFallback(context.nextActions, "Review the current milestone.")}

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

export function buildCombinedPrompt(prompt: string, developerRequest: string): string {
  const request = developerRequest.trim();
  if (!request) return prompt;
  return `${prompt}\n\n--- Developer Request ---\n\n${request}`;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function formatBytes(sizeBytes?: number) {
  if (!sizeBytes || sizeBytes < 0) return "Unknown size";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
