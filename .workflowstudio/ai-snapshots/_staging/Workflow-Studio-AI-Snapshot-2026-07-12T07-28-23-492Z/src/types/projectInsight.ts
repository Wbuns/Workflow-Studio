export type ProjectInsightTone = "positive" | "attention" | "information";

export type ProjectInsight = {
  id: string;
  title: string;
  detail: string;
  tone: ProjectInsightTone;
  actionLabel?: string;
  targetPageId?: string;
};
