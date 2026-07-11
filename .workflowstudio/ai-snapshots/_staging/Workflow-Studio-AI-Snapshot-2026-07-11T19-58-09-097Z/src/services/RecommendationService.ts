import type { SmartRecommendation } from "../types/recommendation";
import type { WorkspaceAnalysis } from "../types/workspaceAnalysis";

export type RecommendationContext = {
  lifecyclePhase: "Planning" | "Implementation" | "Testing" | "Release";
  readinessScore: number;
};

function addUnique(
  recommendations: SmartRecommendation[],
  recommendation: SmartRecommendation,
) {
  if (!recommendations.some((item) => item.id === recommendation.id)) {
    recommendations.push(recommendation);
  }
}

export function buildSmartRecommendations(
  analysis: WorkspaceAnalysis,
  context: RecommendationContext,
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];

  if (!analysis.hasWorkflowMetadata) {
    addUnique(recommendations, {
      id: "create-workflow-metadata",
      title: "Create Workflow Studio metadata",
      detail: "Add .workflowstudio/project.json so the project identity, milestone, and commands remain portable between sessions.",
      priority: "high",
      category: "foundation",
      actionLabel: "Open Projects",
      targetPageId: "projects",
    });
  }

  if (!analysis.hasDocs || !analysis.hasReadme) {
    addUnique(recommendations, {
      id: "complete-project-documentation",
      title: "Complete the project documentation foundation",
      detail: "A README and documentation folder give future development sessions enough context to continue safely.",
      priority: analysis.hasWorkflowMetadata ? "medium" : "high",
      category: "documentation",
      actionLabel: "Open Documentation",
      targetPageId: "documentation",
    });
  }

  if (analysis.embedded?.detected) {
    const embedded = analysis.embedded;

    if (!embedded.platformioConfigPath) {
      addUnique(recommendations, {
        id: "start-platformio-foundation",
        title: context.lifecyclePhase === "Planning"
          ? "Plan the firmware foundation"
          : "Add the PlatformIO configuration",
        detail: context.lifecyclePhase === "Planning"
          ? "Hardware planning is healthy. When implementation begins, create platformio.ini and select the first board environment."
          : "The embedded workspace has started implementation but still needs platformio.ini before firmware can build.",
        priority: context.lifecyclePhase === "Planning" ? "low" : "high",
        category: "implementation",
        actionLabel: "Open AI Workspace",
        targetPageId: "ai-workspace",
      });
    } else if (!embedded.firmwareSourcePath) {
      addUnique(recommendations, {
        id: "add-firmware-entry-point",
        title: "Add the firmware entry point",
        detail: "PlatformIO is configured, but the project still needs a detected source entry point such as src/main.cpp.",
        priority: "high",
        category: "implementation",
        actionLabel: "Open AI Workspace",
        targetPageId: "ai-workspace",
      });
    }

    if (embedded.platformioConfigPath && embedded.boardIdentifiers.length === 0) {
      addUnique(recommendations, {
        id: "define-board-environment",
        title: "Define the target board environment",
        detail: "Add a PlatformIO environment with the correct board identifier so build and upload commands target the intended hardware.",
        priority: "high",
        category: "implementation",
        actionLabel: "Review Documentation",
        targetPageId: "documentation",
      });
    }

    if (embedded.generatedOutputTracked) {
      addUnique(recommendations, {
        id: "remove-generated-output",
        title: "Remove generated firmware output from Git",
        detail: "Generated .pio or build output appears to be tracked. Remove it and update .gitignore before the next package.",
        priority: "high",
        category: "delivery",
        actionLabel: "Review Git",
        targetPageId: "git",
      });
    }
  } else {
    if (!analysis.buildCommand) {
      addUnique(recommendations, {
        id: "define-build-command",
        title: "Define a build command",
        detail: "Workflow Studio cannot validate the project until a build command is detected or added to project metadata.",
        priority: "high",
        category: "delivery",
        actionLabel: "Open AI Workspace",
        targetPageId: "ai-workspace",
      });
    } else if (!analysis.testCommand && context.lifecyclePhase !== "Planning") {
      addUnique(recommendations, {
        id: "add-test-command",
        title: "Add a repeatable test command",
        detail: "A test command will let future packages verify behavior in addition to compiling successfully.",
        priority: "medium",
        category: "delivery",
        actionLabel: "Open AI Workspace",
        targetPageId: "ai-workspace",
      });
    }
  }

  if (analysis.health.warnings.length > 0) {
    addUnique(recommendations, {
      id: "review-analyzer-notices",
      title: "Review workspace analyzer notices",
      detail: `${analysis.health.warnings.length} analyzer notice${analysis.health.warnings.length === 1 ? "" : "s"} remain. Confirm whether they represent planned work or a real configuration issue.`,
      priority: analysis.health.score < 70 ? "high" : "medium",
      category: "workflow",
      actionLabel: "Review Dashboard",
      targetPageId: "dashboard",
    });
  }

  addUnique(recommendations, {
    id: "prepare-next-ai-session",
    title: "Prepare the next AI development session",
    detail: "Review the current milestone, update the Developer Request, and create a fresh snapshot before beginning the next package.",
    priority: context.readinessScore >= 70 ? "medium" : "low",
    category: "workflow",
    actionLabel: "Open AI Workspace",
    targetPageId: "ai-workspace",
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 6);
}
