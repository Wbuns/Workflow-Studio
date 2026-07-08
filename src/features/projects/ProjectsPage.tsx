import { useEffect, useState } from "react";
import { getActiveWorkspace, getWorkspaceHealthItems } from "../../services/WorkspaceService";
import type { NavigationItem } from "../../types/navigation";
import type { ActiveWorkspace, WorkspaceHealthItem } from "../../types/workspace";

type ProjectsPageProps = {
  activePage: NavigationItem;
};

const projectActions = [
  "Validate project metadata",
  "Generate AI continuation prompt",
  "Review package folder",
  "Check build command",
  "Prepare next milestone",
];

export function ProjectsPage({ activePage }: ProjectsPageProps) {
  const [workspace, setWorkspace] = useState<ActiveWorkspace | null>(null);
  const [healthItems, setHealthItems] = useState<WorkspaceHealthItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    getActiveWorkspace().then((nextWorkspace) => {
      if (isMounted) {
        setWorkspace(nextWorkspace);
        setHealthItems(getWorkspaceHealthItems(nextWorkspace));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const metadata = workspace?.metadata;

  return (
    <>
      <section className="hero-panel project-hero">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{metadata?.name ?? "Loading active workspace"}</h2>
        <p>
          {metadata?.description ??
            "Workflow Studio is reading the active workspace metadata."} The
          Project Manager now uses real workspace information instead of static
          placeholder project data.
        </p>
      </section>

      {workspace && metadata ? (
        <>
          <section className="project-layout">
            <article className="module-panel project-summary-panel">
              <h3>Current Workspace</h3>
              <div className="project-summary">
                <div>
                  <span>Name</span>
                  <strong>{metadata.name}</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>{metadata.version}</strong>
                </div>
                <div>
                  <span>Milestone</span>
                  <strong>{metadata.currentMilestone}</strong>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{metadata.projectType}</strong>
                </div>
                <div className="wide-row">
                  <span>Path</span>
                  <strong>{workspace.rootPath}</strong>
                </div>
                <div className="wide-row">
                  <span>Metadata</span>
                  <strong>{workspace.metadataPath}</strong>
                </div>
              </div>
            </article>

            <article className="module-panel project-actions-panel">
              <h3>Workspace Actions</h3>
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
            {healthItems.map((item) => (
              <article className="info-panel" key={item.label}>
                <h3>{item.label}</h3>
                <p>{item.value}</p>
                <span>{item.detail}</span>
              </article>
            ))}
          </section>

          <section className="module-panel recent-projects-panel">
            <h3>Loaded Milestones</h3>
            {workspace.milestones.length ? (
              <div className="recent-projects-list">
                {workspace.milestones.map((milestone, index) => (
                  <article className="recent-project-card" key={milestone.id ?? index}>
                    <div>
                      <strong>{milestone.name ?? milestone.id ?? "Unnamed milestone"}</strong>
                      <span>{milestone.description ?? milestone.notes ?? "No description recorded."}</span>
                    </div>
                    <dl>
                      <div>
                        <dt>Status</dt>
                        <dd>{milestone.status ?? "Unknown"}</dd>
                      </div>
                      <div>
                        <dt>Package</dt>
                        <dd>{milestone.relatedPackage ?? "None"}</dd>
                      </div>
                      <div>
                        <dt>Commit</dt>
                        <dd>{milestone.suggestedCommitMessage ?? "Not set"}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p>No milestone history file was loaded for this workspace yet.</p>
            )}
          </section>
        </>
      ) : (
        <section className="module-panel">
          <h3>Loading Workspace</h3>
          <p>Reading .workflowstudio/project.json from the active workspace.</p>
        </section>
      )}
    </>
  );
}
