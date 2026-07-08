import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";

type ProjectsPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

export function ProjectsPage({ activePage, activeWorkspace }: ProjectsPageProps) {
  return (
    <>
      <section className="hero-panel project-hero">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activeWorkspace?.name ?? "No workspace selected"}</h2>
        <p>
          The Project Manager now reflects the selected workspace from the header. Use
          <strong> Open Folder </strong>
          to add another project, then choose it from the workspace selector.
        </p>
      </section>

      <section className="project-layout">
        <article className="module-panel project-summary-panel">
          <h3>Current Workspace</h3>
          <div className="project-summary">
            <div>
              <span>Name</span>
              <strong>{activeWorkspace?.name ?? "Unknown"}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{activeWorkspace?.projectType ?? "Unknown"}</strong>
            </div>
            <div>
              <span>Managed</span>
              <strong>{activeWorkspace?.isManaged ? "Yes" : "No"}</strong>
            </div>
            <div>
              <span>Last Opened</span>
              <strong>{activeWorkspace?.lastOpenedAt ?? "Not available"}</strong>
            </div>
            <div className="wide-row">
              <span>Path</span>
              <strong>{activeWorkspace?.rootPath ?? "Open a workspace folder"}</strong>
            </div>
          </div>
        </article>

        <article className="module-panel project-actions-panel">
          <h3>Workspace Actions</h3>
          <div className="action-list">
            <button type="button">Validate project metadata</button>
            <button type="button">Generate AI continuation prompt</button>
            <button type="button">Review package folder</button>
            <button type="button">Check build command</button>
            <button type="button">Prepare next milestone</button>
          </div>
        </article>
      </section>

      <section className="module-panel recent-projects-panel">
        <h3>Workspace Switching</h3>
        <p>
          The active workspace is controlled by the header selector. Dashboard, AI, Git, and
          Documentation now receive the selected workspace path so they can scan the project you are
          actually working on.
        </p>
      </section>
    </>
  );
}
