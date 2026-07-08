import { useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";

type ProjectsPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

export function ProjectsPage({ activePage, activeWorkspace }: ProjectsPageProps) {
  const [actionStatus, setActionStatus] = useState("Workspace actions are guidance-only for now. Use the related page for the full workflow.");

  function handleAction(action: string) {
    setActionStatus(action);
  }

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
            <button type="button" onClick={() => handleAction("Metadata validation is represented by the Dashboard health scan and Projects summary.")}>
              Validate project metadata
            </button>
            <button type="button" onClick={() => handleAction("Open the AI page and use Copy Prompt to generate the current continuation prompt.")}>
              Generate AI continuation prompt
            </button>
            <button type="button" onClick={() => handleAction("Open the Packages page to review _packages, _backup, and package history.")}>
              Review package folder
            </button>
            <button type="button" onClick={() => handleAction("The Dashboard scans package.json scripts and displays detected dev/build/test commands.")}>
              Check build command
            </button>
            <button type="button" onClick={() => handleAction("Milestone preparation will become a dedicated v1.3 workflow. For now, use the AI page continuation prompt.")}>
              Prepare next milestone
            </button>
          </div>
          <p className="action-status">{actionStatus}</p>
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
