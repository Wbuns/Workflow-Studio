import { useState } from "react";
import "./App.css";

type NavigationItem = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
};

const navigationItems: NavigationItem[] = [
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

const dashboardCards = [
  {
    title: "Current Milestone",
    value: "v0.2 Electron Shell",
    detail: "Desktop window, layout, navigation, and status bar.",
  },
  {
    title: "Workflow Rule",
    value: "Build before commit",
    detail: "Every milestone should remain installable and reversible.",
  },
  {
    title: "Next System",
    value: "Package Manager",
    detail: "Create, install, validate, and roll back milestone packages.",
  },
];

function App() {
  const [activePageId, setActivePageId] = useState("dashboard");

  const activePage =
    navigationItems.find((item) => item.id === activePageId) ??
    navigationItems[0];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Workflow Studio</p>
          <h1>{activePage.title}</h1>
        </div>
        <button className="primary-button" type="button">
          {activePage.actionLabel}
        </button>
      </header>

      <aside className="app-sidebar">
        <div className="brand">
          <div className="brand-mark">WS</div>
          <div>
            <strong>Workflow Studio</strong>
            <span>v0.2 Shell</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.id === activePageId ? "nav-item active" : "nav-item"
              }
              onClick={() => setActivePageId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <section className="hero-panel">
          <p className="eyebrow">{activePage.eyebrow}</p>
          <h2>{activePage.description}</h2>
          <p>
            This page is a stable placeholder for the future{" "}
            <strong>{activePage.label}</strong> module. Functionality will be
            added milestone by milestone.
          </p>
        </section>

        {activePage.id === "dashboard" ? (
          <section className="panel-grid">
            {dashboardCards.map((card) => (
              <article className="info-panel" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.value}</p>
                <span>{card.detail}</span>
              </article>
            ))}
          </section>
        ) : (
          <section className="module-panel">
            <h3>{activePage.label} Module</h3>
            <p>
              The {activePage.label} page is connected to the main navigation.
              Its backend behavior will be implemented after the Electron shell
              and layout foundation are complete.
            </p>
            <div className="module-checklist">
              <span>Navigation connected</span>
              <span>Placeholder page ready</span>
              <span>Future module boundary established</span>
            </div>
          </section>
        )}
      </main>

      <footer className="status-bar">
        <span>Active page: {activePage.label}</span>
        <span>Build status: Ready</span>
        <span>Mode: Electron + React</span>
      </footer>
    </div>
  );
}

export default App;