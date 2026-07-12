import { useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord, WorkspaceRegistryState } from "../../types/workspaceRegistry";

type ProjectsPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
  registry: WorkspaceRegistryState;
  onAddProject: () => Promise<void>;
  onSelectProject: (projectId: string) => void;
  onToggleFavorite: (projectId: string, isFavorite: boolean) => void;
  onRemoveProject: (projectId: string) => void;
  onRefreshProject: (projectId: string) => Promise<void>;
};

export function ProjectsPage({ activePage, activeWorkspace, registry, onAddProject, onSelectProject, onToggleFavorite, onRemoveProject, onRefreshProject }: ProjectsPageProps) {
  const [actionStatus, setActionStatus] = useState("Registered projects are stored independently from project metadata.");

  async function refresh(project: WorkspaceRecord) {
    setActionStatus(`Refreshing ${project.name}…`);
    await onRefreshProject(project.id);
    setActionStatus(`Refreshed ${project.name}.`);
  }

  function remove(project: WorkspaceRecord) {
    if (!window.confirm(`Remove ${project.name} from Workflow Studio? The project files will not be deleted.`)) return;
    onRemoveProject(project.id);
    setActionStatus(`Removed ${project.name} from the registry.`);
  }

  return (
    <>
      <section className="hero-panel project-hero">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Registered Projects</h2>
        <p>Manage multiple software and embedded workspaces from one registry. Removing a project only removes its registry entry.</p>
        <button className="primary-button" type="button" onClick={() => void onAddProject()}>Add Existing Project</button>
      </section>

      <section className="module-panel recent-projects-panel">
        <div className="section-heading-row"><div><h3>Project Registry</h3><p>{registry.projects.length} registered project{registry.projects.length === 1 ? "" : "s"}</p></div></div>
        <div className="registered-project-list">
          {registry.projects.map((project) => (
            <article className={project.id === activeWorkspace?.id ? "registered-project-card active" : "registered-project-card"} key={project.id}>
              <div className="registered-project-main">
                <div><span className="project-favorite-mark">{project.isFavorite ? "★" : "☆"}</span><strong>{project.name}</strong></div>
                <span>{project.rootPath}</span>
                <small>{project.projectType} · Health {project.health.score}% · Last opened {new Date(project.lastOpenedAt).toLocaleString()}</small>
                {project.health.warnings.length > 0 && <small>{project.health.warnings.join(" · ")}</small>}
              </div>
              <div className="registered-project-actions">
                <button type="button" onClick={() => onSelectProject(project.id)} disabled={project.id === activeWorkspace?.id}>{project.id === activeWorkspace?.id ? "Active" : "Open"}</button>
                <button type="button" onClick={() => onToggleFavorite(project.id, !project.isFavorite)}>{project.isFavorite ? "Unfavorite" : "Favorite"}</button>
                <button type="button" onClick={() => void refresh(project)}>Refresh Health</button>
                <button className="danger-button" type="button" onClick={() => remove(project)}>Remove</button>
              </div>
            </article>
          ))}
          {registry.projects.length === 0 && <p>No projects registered yet. Add an existing project to begin.</p>}
        </div>
        <p className="action-status">{actionStatus}</p>
      </section>
    </>
  );
}
