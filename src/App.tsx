import "./App.css";

const navigationItems = [
  "Dashboard",
  "Projects",
  "Packages",
  "Documentation",
  "AI",
  "Git",
  "Templates",
  "Settings",
];

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Workflow Studio</p>
          <h1>Dashboard</h1>
        </div>
        <button className="primary-button" type="button">
          New Project
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
              key={item}
              type="button"
              className={item === "Dashboard" ? "nav-item active" : "nav-item"}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <section className="hero-panel">
          <p className="eyebrow">Project Foundation</p>
          <h2>Build safer AI-assisted software.</h2>
          <p>
            Workflow Studio will manage projects, milestones, packages,
            documentation, AI context, Git, templates, and backups without
            replacing your IDE.
          </p>
        </section>

        <section className="panel-grid">
          <article className="info-panel">
            <h3>Current Milestone</h3>
            <p>v0.2 Electron Shell</p>
            <span>Desktop window, layout, navigation, and status bar.</span>
          </article>

          <article className="info-panel">
            <h3>Workflow Rule</h3>
            <p>Build before commit</p>
            <span>Every milestone should remain installable and reversible.</span>
          </article>

          <article className="info-panel">
            <h3>Next System</h3>
            <p>Package Manager</p>
            <span>Create, install, validate, and roll back milestone packages.</span>
          </article>
        </section>
      </main>

      <footer className="status-bar">
        <span>Build status: Ready</span>
        <span>Git: Clean after commit</span>
        <span>Mode: Electron + React</span>
      </footer>
    </div>
  );
}

export default App;