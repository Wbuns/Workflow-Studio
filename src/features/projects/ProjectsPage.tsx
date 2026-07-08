import { currentProject, projectActions, projectHealthItems, recentProjects } from "../../data/projectManager";
import type { NavigationItem } from "../../types/navigation";

type ProjectsPageProps = {
  activePage: NavigationItem;
};

export function ProjectsPage({ activePage }: ProjectsPageProps) {
  return (
    <>
      <section className="hero-panel project-hero">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{currentProject.name}</h2>
        <p>
          {currentProject.description} The Project Manager will become the place
          where Workflow Studio opens workspaces, validates metadata, and
          remembers recent development projects.
        </p>
      </section>

      <section className="project-layout">
        <article className="module-panel project-summary-panel">
          <h3>Current Workspace</h3>
          <div className="project-summary">
            <div>
              <span>Name</span>
              <strong>{currentProject.name}</strong>
            </div>
            <div>
              <span>Version</span>
              <strong>{currentProject.version}</strong>
            </div>
            <div>
              <span>Milestone</span>
              <strong>{currentProject.milestone}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{currentProject.projectType}</strong>
            </div>
            <div className="wide-row">
              <span>Path</span>
              <strong>{currentProject.path}</strong>
            </div>
          </div>
        </article>

        <article className="module-panel project-actions-panel">
          <h3>Project Actions</h3>
          <div className="action-list">
            {projectActions.map((action) => (
              <button type="button" key={action}>
                {action}
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="project-health-grid">
        {projectHealthItems.map((item) => (
          <article className="info-panel" key={item.label}>
            <h3>{item.label}</h3>
            <p>{item.value}</p>
            <span>{item.detail}</span>
          </article>
        ))}
      </section>

      <section className="module-panel recent-projects-panel">
        <h3>Recent Projects</h3>
        <div className="recent-projects-list">
          {recentProjects.map((project) => (
            <article className="recent-project-card" key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <span>{project.description}</span>
              </div>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>{project.status}</dd>
                </div>
                <div>
                  <dt>Milestone</dt>
                  <dd>{project.milestone}</dd>
                </div>
                <div>
                  <dt>Last Opened</dt>
                  <dd>{project.lastOpened}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
