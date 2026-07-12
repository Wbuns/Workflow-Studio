export type ManagedProjectStatus = "active" | "recent" | "planned";

export type ManagedProject = {
  id: string;
  name: string;
  description: string;
  path: string;
  version: string;
  milestone: string;
  projectType: string;
  status: ManagedProjectStatus;
  lastOpened: string;
};

export type ProjectHealthItem = {
  label: string;
  value: string;
  detail: string;
};
