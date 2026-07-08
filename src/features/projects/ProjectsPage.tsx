import { ActionList, MetricCard, PageHeader, Panel } from "../../components/UI/StudioComponents";
import { currentProject, projectActions, projectHealthItems, recentProjects } from "../../data/projectManager";
import type { NavigationItem } from "../../types/navigation";

type ProjectsPageProps = { activePage: NavigationItem };

export function ProjectsPage({ activePage }: ProjectsPageProps) {
    return (
        <div className="workspace-page">
            <PageHeader eyebrow={activePage.eyebrow} title="Project Workspaces" description="Open, scan, validate, and resume managed development projects." actionLabel={activePage.actionLabel} />

            <section className="metrics-grid">
                {projectHealthItems.map((item) => (
                    <MetricCard key={item.label} label={item.label} value={item.value} detail={item.detail} status={item.value === "Ready" || item.value === "Enabled" ? "good" : "neutral"} />
                ))}
            </section>

            <section className="project-layout">
                <Panel title="Current Workspace">
                    <dl className="definition-grid">
                        <div><dt>Name</dt><dd>{currentProject.name}</dd></div>
                        <div><dt>Version</dt><dd>{currentProject.version}</dd></div>
                        <div><dt>Milestone</dt><dd>{currentProject.milestone}</dd></div>
                        <div><dt>Type</dt><dd>{currentProject.projectType}</dd></div>
                        <div className="wide-row"><dt>Path</dt><dd>{currentProject.path}</dd></div>
                    </dl>
                </Panel>

                <Panel title="Project Actions">
                    <ActionList actions={projectActions} />
                </Panel>
            </section>

            <Panel title="Recent Projects">
                <div className="recent-projects-list">
                    {recentProjects.map((project) => (
                        <article className="recent-project-card" key={project.id}>
                            <div>
                                <strong>{project.name}</strong>
                                <span>{project.description}</span>
                            </div>
                            <dl>
                                <div><dt>Status</dt><dd>{project.status}</dd></div>
                                <div><dt>Milestone</dt><dd>{project.milestone}</dd></div>
                                <div><dt>Last Opened</dt><dd>{project.lastOpened}</dd></div>
                            </dl>
                        </article>
                    ))}
                </div>
            </Panel>
        </div>
    );
}
