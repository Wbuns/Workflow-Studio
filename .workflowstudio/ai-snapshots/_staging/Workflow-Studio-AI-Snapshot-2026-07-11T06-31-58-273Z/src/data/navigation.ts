import type { NavigationItem } from "../types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    eyebrow: "Project Overview",
    title: "Dashboard",
    description:
      "Track the current milestone, project health, workflow status, and next development steps.",
    actionLabel: "New Project",
  },
  {
    id: "projects",
    label: "Projects",
    eyebrow: "Workspace Management",
    title: "Projects",
    description:
      "Open, organize, and manage Workflow Studio projects and future Orivex workspaces.",
    actionLabel: "Open Project",
  },
  {
    id: "packages",
    label: "Packages",
    eyebrow: "Milestone Packages",
    title: "Packages",
    description:
      "Create, install, validate, back up, and roll back safe development milestone packages.",
    actionLabel: "Create Package",
  },
  {
    id: "documentation",
    label: "Documentation",
    eyebrow: "Project Knowledge",
    title: "Documentation",
    description:
      "Keep design, architecture, workflow, AI, and project history documents close to the code.",
    actionLabel: "Open Docs",
  },
  {
    id: "ai",
    label: "AI",
    eyebrow: "AI Context",
    title: "AI",
    description:
      "Generate continuation prompts, collect project context, and manage reusable AI workflows.",
    actionLabel: "Generate Context",
  },
  {
    id: "ai-development",
    label: "AI Development",
    eyebrow: "AI Development Tools",
    title: "AI Development",
    description:
      "Create AI-ready snapshots, continuation prompts, documentation bundles, and snapshot history for the active workspace.",
    actionLabel: "Create Snapshot",
  },
  {
    id: "git",
    label: "Git",
    eyebrow: "Source Control",
    title: "Git",
    description:
      "Review repository status, prepare milestone commits, and keep builds clean before commit.",
    actionLabel: "Check Status",
  },
  {
    id: "templates",
    label: "Templates",
    eyebrow: "Reusable Starters",
    title: "Templates",
    description:
      "Manage templates for projects, packages, documentation, prompts, and future workflows.",
    actionLabel: "Browse Templates",
  },
  {
    id: "settings",
    label: "Settings",
    eyebrow: "Configuration",
    title: "Settings",
    description:
      "Configure project paths, package behavior, backup rules, AI preferences, and app options.",
    actionLabel: "Open Settings",
  },
];
