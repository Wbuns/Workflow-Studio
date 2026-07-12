import type { DashboardSummary } from "../features/dashboard/DashboardTypes";
import type { ProjectInsight } from "../types/projectInsight";

export function buildProjectInsights(summary: DashboardSummary): ProjectInsight[] {
  const insights: ProjectInsight[] = [];
  const analysis = summary.workspaceAnalysis;

  if (summary.gitEnabled && summary.healthWarnings.length === 0) {
    insights.push({
      id: "workspace-stable",
      title: "Workspace foundation is stable",
      detail: "No high-level workspace warnings are currently blocking the next milestone.",
      tone: "positive",
    });
  }

  if (summary.documentationCount >= 5 && summary.readinessCategories.find((item) => item.id === "implementation")?.status === "Not Started") {
    insights.push({
      id: "documentation-ahead",
      title: "Documentation is ahead of implementation",
      detail: "The project knowledge foundation is strong. The next useful work is likely an implementation milestone rather than more planning.",
      tone: "information",
      actionLabel: "Open AI Workspace",
      targetPageId: "ai-workspace",
    });
  }

  if (analysis.buildCommand && !analysis.testCommand && summary.lifecyclePhase !== "Planning") {
    insights.push({
      id: "testing-gap",
      title: "Build validation exists without a test command",
      detail: "Packages can compile, but repeatable behavior testing is not configured yet.",
      tone: "attention",
      actionLabel: "Review AI Workspace",
      targetPageId: "ai-workspace",
    });
  }

  if (analysis.health.warnings.length > 0) {
    insights.push({
      id: "analysis-notices",
      title: `${analysis.health.warnings.length} workspace notice${analysis.health.warnings.length === 1 ? "" : "s"} need review`,
      detail: "Review the analyzer notices and decide whether they describe planned work or a genuine configuration problem.",
      tone: summary.healthScore < 70 ? "attention" : "information",
      actionLabel: "Open Developer Tools",
      targetPageId: "dashboard",
    });
  }

  if (analysis.workspaceCommands.length > 0) {
    insights.push({
      id: "commands-ready",
      title: `${analysis.workspaceCommands.length} workspace command${analysis.workspaceCommands.length === 1 ? " is" : "s are"} available`,
      detail: "Build and project commands are detected and can be reviewed from Developer Tools.",
      tone: "positive",
    });
  }

  if (summary.recommendations.length > 0) {
    const top = summary.recommendations[0];
    insights.push({
      id: "top-recommendation",
      title: `Best next action: ${top.title}`,
      detail: top.detail,
      tone: top.priority === "high" ? "attention" : "information",
      actionLabel: top.actionLabel,
      targetPageId: top.targetPageId,
    });
  }

  return insights.slice(0, 5);
}
