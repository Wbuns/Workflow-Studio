import type { NavigationItem } from "../../types/navigation";

type AIPageProps = {
  activePage: NavigationItem;
};

const contextSources = [
  {
    name: "Project Metadata",
    path: ".workflowstudio/project.json",
    detail: "Project name, version, milestone, workspace folders, and commands.",
  },
  {
    name: "AI Context",
    path: ".workflowstudio/ai-context.json",
    detail: "Current focus, important rules, and next milestone guidance.",
  },
  {
    name: "Roadmap",
    path: "docs/Roadmap.md",
    detail: "Planned project direction and major milestones.",
  },
  {
    name: "Design Bible",
    path: "docs/Design Bible.md",
    detail: "Long-term product philosophy and decision framework.",
  },
  {
    name: "Development Workflow",
    path: "docs/Development Workflow.md",
    detail: "Build, test, commit, and package workflow rules.",
  },
];

const sessionSteps = [
  "Confirm Git status is clean before starting.",
  "Read workspace metadata and current milestone.",
  "Review recent package history and documentation changes.",
  "Generate continuation context for the next AI session.",
  "Build and test before committing generated changes.",
];

const continuationPrompt = `We are continuing Workflow Studio development.

Project: Workflow Studio
Purpose: Package-based AI-assisted development workspace.
Current focus: AI Context Feature Pack.
Rules:
- Small milestones
- Build before commit
- Never commit broken builds
- Prefer complete replacement files for multi-file changes
- Preserve project knowledge in docs and metadata

Next goal:
Implement the AI Context system so future sessions can resume projects without manually reconstructing context.`;

export function AIPage({ activePage }: AIPageProps) {
  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.description}</h2>
        <p>
          This page is the foundation for Workflow Studio&apos;s AI development
          system. It shows where project context will come from and previews the
          continuation prompt that future versions will generate automatically.
        </p>
      </section>

      <section className="panel-grid">
        <article className="info-panel">
          <h3>AI System</h3>
          <p>Context Builder</p>
          <span>Collect project metadata, docs, roadmap, and active tasks.</span>
        </article>
        <article className="info-panel">
          <h3>Session Goal</h3>
          <p>Resume Faster</p>
          <span>Start new AI conversations without rebuilding project history.</span>
        </article>
        <article className="info-panel">
          <h3>Next Feature</h3>
          <p>Export Prompt</p>
          <span>Create copy-ready AI session context from workspace data.</span>
        </article>
      </section>

      <section className="project-layout" style={{ marginTop: 18 }}>
        <article className="module-panel">
          <h3>Context Sources</h3>
          <div className="recent-projects-list">
            {contextSources.map((source) => (
              <article className="recent-project-card" key={source.path}>
                <div>
                  <strong>{source.name}</strong>
                  <span>{source.detail}</span>
                </div>
                <dl>
                  <div>
                    <dt>Path</dt>
                    <dd>{source.path}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>Ready</dd>
                  </div>
                  <div>
                    <dt>Use</dt>
                    <dd>AI Context</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </article>

        <article className="module-panel">
          <h3>Development Session Checklist</h3>
          <div className="action-list">
            {sessionSteps.map((step) => (
              <button type="button" key={step}>{step}</button>
            ))}
          </div>
        </article>
      </section>

      <section className="module-panel">
        <h3>Continuation Prompt Preview</h3>
        <p>
          Future versions will generate this from live project metadata,
          documentation, Git status, package history, and active milestone data.
        </p>
        <pre
          style={{
            marginTop: 18,
            padding: 18,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius: 14,
            color: "#dbeafe",
            background: "rgba(2, 6, 23, 0.72)",
            lineHeight: 1.6,
          }}
        >
          {continuationPrompt}
        </pre>
      </section>
    </>
  );
}
