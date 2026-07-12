export type ProjectTimelineEventKind = "git" | "package" | "snapshot" | "workspace";

export type ProjectTimelineEvent = {
  id: string;
  kind: ProjectTimelineEventKind;
  title: string;
  detail: string;
  occurredAt: string;
  path?: string;
  status?: "success" | "warning" | "info";
};

export type ProjectTimelineResult = {
  generatedAt: string;
  events: ProjectTimelineEvent[];
  warnings: string[];
};
