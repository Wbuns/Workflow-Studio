import type { NavigationItem } from "../types/navigation";
import type { WorkspaceSearchIndex, WorkspaceSearchResult } from "../types/workspaceSearch";
import { listDocumentation } from "./DocumentationService";
import { listWorkspacePackages } from "./PackageLibraryService";
import { listWorkspaceTemplates } from "./TemplateLibraryService";
import { getProjectTimeline } from "./TimelineService";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export async function buildWorkspaceSearchIndex(
  rootPath: string | undefined,
  navigationItems: NavigationItem[],
): Promise<WorkspaceSearchIndex> {
  const warnings: string[] = [];
  const results: WorkspaceSearchResult[] = navigationItems.map((item) => ({
    id: `navigation:${item.id}`,
    kind: "navigation",
    title: item.label,
    detail: item.description,
    location: item.eyebrow,
    keywords: `${item.label} ${item.title} ${item.eyebrow} ${item.description}`,
    pageId: item.id,
  }));

  const [documents, packages, templates, timeline] = await Promise.all([
    listDocumentation(rootPath).catch(() => {
      warnings.push("Documentation search index could not be loaded.");
      return [];
    }),
    listWorkspacePackages(rootPath).catch(() => {
      warnings.push("Package search index could not be loaded.");
      return [];
    }),
    listWorkspaceTemplates(rootPath).catch(() => {
      warnings.push("Template search index could not be loaded.");
      return [];
    }),
    getProjectTimeline(rootPath).catch(() => {
      warnings.push("Timeline search index could not be loaded.");
      return { generatedAt: new Date().toISOString(), events: [], warnings: [] };
    }),
  ]);

  documents.forEach((entry) => {
    results.push({
      id: `documentation:${entry.path}`,
      kind: entry.kind === "metadata" ? "metadata" : "documentation",
      title: entry.title,
      detail: `Workspace ${entry.kind} document`,
      location: entry.path,
      keywords: `${entry.title} ${entry.path} ${entry.kind}`,
      pageId: "documentation",
      path: entry.path,
    });
  });

  packages.forEach((entry) => {
    results.push({
      id: `package:${entry.path}`,
      kind: "package",
      title: entry.name,
      detail: entry.detail,
      location: entry.path,
      keywords: `${entry.name} ${entry.path} ${entry.kind} ${entry.detail}`,
      pageId: "packages",
      path: entry.path,
    });
  });

  templates.forEach((entry) => {
    results.push({
      id: `template:${entry.path}`,
      kind: "template",
      title: entry.name,
      detail: entry.detail,
      location: entry.path,
      keywords: `${entry.name} ${entry.path} ${entry.kind} ${entry.detail}`,
      pageId: "templates",
      path: entry.path,
    });
  });

  timeline.events.forEach((event) => {
    results.push({
      id: `timeline:${event.id}`,
      kind: event.kind === "snapshot" ? "snapshot" : "timeline",
      title: event.title,
      detail: event.detail,
      location: event.path,
      keywords: `${event.title} ${event.detail} ${event.kind} ${event.path ?? ""}`,
      pageId: "timeline",
      path: event.path,
      occurredAt: event.occurredAt,
    });
  });

  warnings.push(...timeline.warnings);
  return { generatedAt: new Date().toISOString(), results, warnings };
}

export function filterWorkspaceSearchResults(
  results: WorkspaceSearchResult[],
  query: string,
): WorkspaceSearchResult[] {
  const normalized = normalize(query);
  if (!normalized) {
    return [...results].sort((left, right) => {
      const leftDate = left.occurredAt ? Date.parse(left.occurredAt) : 0;
      const rightDate = right.occurredAt ? Date.parse(right.occurredAt) : 0;
      if (rightDate !== leftDate) return rightDate - leftDate;
      if (left.kind === "navigation" && right.kind !== "navigation") return -1;
      if (right.kind === "navigation" && left.kind !== "navigation") return 1;
      return left.title.localeCompare(right.title);
    }).slice(0, 24);
  }
  const terms = normalized.split(/\s+/).filter(Boolean);
  return results.map((result) => {
    const title = normalize(result.title), detail = normalize(result.detail), location = normalize(result.location ?? "");
    const haystack = normalize(`${result.title} ${result.detail} ${result.location ?? ""} ${result.keywords}`);
    const score = terms.reduce((total, term) => {
      if (title === term) return total + 20;
      if (title.startsWith(term)) return total + 14;
      if (title.includes(term)) return total + 10;
      if (detail.includes(term)) return total + 5;
      if (location.includes(term)) return total + 4;
      if (haystack.includes(term)) return total + 2;
      let cursor = 0;
      for (const character of term) { cursor = haystack.indexOf(character, cursor); if (cursor === -1) return -1000; cursor += 1; }
      return total + 1;
    }, result.kind === "navigation" ? 2 : 0);
    return { result, score };
  }).filter((entry) => entry.score >= 0).sort((left, right) => right.score - left.score || left.result.title.localeCompare(right.result.title)).slice(0, 40).map((entry) => entry.result);
}
