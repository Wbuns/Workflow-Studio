import { scanWorkspace } from "../../services/WorkspaceScanner";
import type { WorkspaceAnalysis } from "../../types/workspaceAnalysis";
import type { DashboardSummary, ProjectLifecyclePhase, ReadinessCategory, ReadinessStatus } from "./DashboardTypes";

function getHealthStatus(score: number): DashboardSummary["healthStatus"] {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  return "Needs Attention";
}

function percentage(values: boolean[]): number {
  return values.length === 0 ? 0 : Math.round((values.filter(Boolean).length / values.length) * 100);
}

function statusFor(score: number): ReadinessStatus {
  if (score >= 90) return "Ready";
  if (score >= 45) return "In Progress";
  return "Needs Attention";
}

function inferLifecyclePhase(analysis: WorkspaceAnalysis): ProjectLifecyclePhase {
  const milestone = analysis.currentMilestone?.toLowerCase() ?? "";
  if (/release|shipping|production|launch/.test(milestone)) return "Release";
  if (/test|validation|qa|verification/.test(milestone)) return "Testing";

  const embeddedNotStarted = analysis.embedded?.detected
    && !analysis.embedded.platformioConfigPath
    && !analysis.embedded.firmwareSourcePath;
  const softwareNotStarted = !analysis.embedded?.detected && !analysis.hasPackageJson;
  return embeddedNotStarted || softwareNotStarted ? "Planning" : "Implementation";
}

function buildReadinessCategories(analysis: WorkspaceAnalysis, phase: ProjectLifecyclePhase): ReadinessCategory[] {
  const hardwareDocs = Boolean(
    analysis.embedded?.hardwareDocumentationPaths.length
    || analysis.embedded?.specificationPaths.length,
  );
  const foundationScore = percentage([
    analysis.hasGit,
    analysis.hasWorkflowMetadata,
    analysis.hasReadme,
  ]);
  const documentationScore = percentage([
    analysis.hasDocs,
    analysis.hasReadme,
    !analysis.embedded?.detected || hardwareDocs,
  ]);

  const implementationChecks = analysis.embedded?.detected
    ? [
        Boolean(analysis.embedded.platformioConfigPath),
        Boolean(analysis.embedded.firmwareSourcePath),
        analysis.embedded.environments.length > 0,
        analysis.embedded.boardIdentifiers.length > 0,
      ]
    : [analysis.hasPackageJson, Boolean(analysis.buildCommand)];
  const implementationStarted = implementationChecks.some(Boolean);
  const implementationScore = percentage(implementationChecks);

  const deliveryChecks = analysis.embedded?.detected
    ? [Boolean(analysis.buildCommand), !analysis.embedded.generatedOutputTracked]
    : [Boolean(analysis.buildCommand), Boolean(analysis.testCommand)];
  const deliveryStarted = Boolean(analysis.buildCommand || analysis.testCommand);
  const deliveryScore = percentage(deliveryChecks);

  return [
    {
      id: "foundation",
      label: "Foundation",
      score: foundationScore,
      status: statusFor(foundationScore),
      detail: "Repository, project metadata, and project overview.",
    },
    {
      id: "documentation",
      label: "Documentation",
      score: documentationScore,
      status: statusFor(documentationScore),
      detail: analysis.embedded?.detected
        ? "Product, architecture, and hardware knowledge."
        : "Project and architecture knowledge.",
    },
    {
      id: "implementation",
      label: analysis.embedded?.detected ? "Firmware" : "Implementation",
      score: implementationStarted ? implementationScore : undefined,
      status: implementationStarted ? statusFor(implementationScore) : "Not Started",
      detail: implementationStarted
        ? "Source entry point, target environment, and configuration."
        : phase === "Planning" ? "Planned work has not begun yet." : "Implementation files have not been detected.",
    },
    {
      id: "delivery",
      label: "Build & Validation",
      score: deliveryStarted ? deliveryScore : undefined,
      status: deliveryStarted ? statusFor(deliveryScore) : "Not Started",
      detail: deliveryStarted
        ? "Build, test, and generated-output readiness."
        : "Becomes active after implementation begins.",
    },
  ];
}

function calculateReadiness(categories: ReadinessCategory[]): number {
  const active = categories.filter((category) => category.score !== undefined);
  return active.length === 0
    ? 0
    : Math.round(active.reduce((total, category) => total + (category.score ?? 0), 0) / active.length);
}

function getNextActions(analysis: WorkspaceAnalysis, phase: ProjectLifecyclePhase): string[] {
  const actions: string[] = [];
  if (!analysis.hasWorkflowMetadata) actions.push("Create Workflow Studio metadata");
  if (!analysis.hasDocs) actions.push("Create project documentation");

  if (analysis.embedded?.detected) {
    if (phase === "Planning" && !analysis.embedded.platformioConfigPath) actions.push("Start the firmware milestone when hardware planning is complete");
    else if (!analysis.embedded.platformioConfigPath) actions.push("Add platformio.ini");
    if (analysis.embedded.platformioConfigPath && !analysis.embedded.firmwareSourcePath) actions.push("Add the firmware entry point");
    if (analysis.embedded.platformioConfigPath && analysis.embedded.boardIdentifiers.length === 0) actions.push("Define the target board environment");
  } else {
    if (!analysis.buildCommand) actions.push("Define a build command");
    if (analysis.buildCommand && !analysis.testCommand) actions.push("Add tests when implementation is ready");
  }

  actions.push("Generate AI continuation context");
  actions.push("Review Git status before the next package");
  return actions.slice(0, 5);
}

function toDashboardSummary(analysis: WorkspaceAnalysis): DashboardSummary {
  const lifecyclePhase = inferLifecyclePhase(analysis);
  const readinessCategories = buildReadinessCategories(analysis, lifecyclePhase);
  const readinessScore = calculateReadiness(readinessCategories);
  const nextActions = getNextActions(analysis, lifecyclePhase);
  const guidance = [
    ...nextActions.map((label) => ({ label, kind: "next" as const })),
    ...analysis.health.warnings
      .filter((warning) => !(
        lifecyclePhase === "Planning"
        && /platformio.ini|firmware source|board environment|board identifier|build command/.test(warning.toLowerCase())
      ))
      .slice(0, 3)
      .map((label) => ({ label, kind: "warning" as const })),
  ];

  return {
    projectName: analysis.projectName,
    tagline: lifecyclePhase === "Planning"
      ? "Project planning and documentation are active."
      : analysis.embedded?.detected ? "Embedded workspace intelligence is active." : "Workspace intelligence is active.",
    description: lifecyclePhase === "Planning" && analysis.embedded?.detected
      ? "Workflow Studio recognizes this as an embedded-device project. Firmware setup is tracked as planned work rather than treated as a broken workspace."
      : "Workflow Studio is organizing project readiness, technical capabilities, commands, documentation, and actionable guidance.",
    version: "v1.3",
    currentMilestone: analysis.currentMilestone ?? "Not specified",
    projectType: analysis.projectType,
    lifecyclePhase,
    readinessScore,
    readinessStatus: readinessScore >= 90 ? "Excellent" : readinessScore >= 70 ? "Good" : "Developing",
    readinessCategories,
    guidance,
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
    nextActions,
  };
}

export async function getDashboardSummary(rootPath?: string): Promise<DashboardSummary> {
  return toDashboardSummary(await scanWorkspace(rootPath));
}
