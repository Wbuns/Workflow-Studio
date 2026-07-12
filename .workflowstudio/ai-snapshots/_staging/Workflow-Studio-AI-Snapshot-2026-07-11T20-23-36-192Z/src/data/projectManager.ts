import type { ManagedProject, ProjectHealthItem } from "../types/project";

export const currentProject: ManagedProject = {
  id: "workflow-studio",
  name: "Workflow Studio",
  description:
    "A desktop tool for package-based AI-assisted software development.",
  path: "C:\\Users\\mitch\\Desktop\\GPT Workflow Studio",
  version: "0.7.0",
  milestone: "v0.7.0-project-manager-feature-pack",
  projectType: "electron-react-typescript",
  status: "active",
  lastOpened: "Current session",
};

export const recentProjects: ManagedProject[] = [
  currentProject,
  {
    id: "orivex",
    name: "Orivex",
    description:
      "Flagship creative software project that Workflow Studio is being built to support.",
    path: "C:\\Users\\mitch\\Desktop\\Orivex",
    version: "Future workspace",
    milestone: "Ready to connect later",
    projectType: "electron-react-typescript",
    status: "planned",
    lastOpened: "Not connected yet",
  },
];

export const projectHealthItems: ProjectHealthItem[] = [
  {
    label: "Metadata",
    value: "Ready",
    detail: ".workflowstudio/project.json is available.",
  },
  {
    label: "Git",
    value: "Enabled",
    detail: "Milestone commits are active for this workspace.",
  },
  {
    label: "Packages",
    value: "Tooling Ready",
    detail: "Package builder, installer, and validator exist.",
  },
  {
    label: "AI Context",
    value: "Planned",
    detail: "Context generation is targeted for the v0.9 feature pack.",
  },
];

export const projectActions = [
  "Open project workspace",
  "Scan existing folder",
  "Create new project",
  "Validate project metadata",
  "Generate project summary",
];
