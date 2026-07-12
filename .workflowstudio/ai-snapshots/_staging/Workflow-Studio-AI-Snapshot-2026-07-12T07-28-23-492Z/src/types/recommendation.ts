export type RecommendationPriority = "high" | "medium" | "low";

export type RecommendationCategory =
  | "foundation"
  | "documentation"
  | "implementation"
  | "delivery"
  | "workflow";

export type SmartRecommendation = {
  id: string;
  title: string;
  detail: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  actionLabel?: string;
  targetPageId?: string;
};
