export type WorkspaceSearchResultKind =
  | "navigation"
  | "documentation"
  | "package"
  | "snapshot"
  | "timeline"
  | "template"
  | "metadata";

export type WorkspaceSearchResult = {
  id: string;
  kind: WorkspaceSearchResultKind;
  title: string;
  detail: string;
  location?: string;
  keywords: string;
  pageId?: string;
  path?: string;
  occurredAt?: string;
};

export type WorkspaceSearchIndex = {
  generatedAt: string;
  results: WorkspaceSearchResult[];
  warnings: string[];
};
