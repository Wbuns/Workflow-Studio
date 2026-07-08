import { AIPage } from "../../features/ai/AIPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { DocumentationPage } from "../../features/documentation/DocumentationPage";
import { GitPage } from "../../features/git/GitPage";
import { PackagesPage } from "../../features/packages/PackagesPage";
import { ProjectsPage } from "../../features/projects/ProjectsPage";
import { TemplatesPage } from "../../features/templates/TemplatesPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";

type WorkspaceProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

export function Workspace({ activePage, activeWorkspace }: WorkspaceProps) {
  const rootPath = activeWorkspace?.rootPath;

  return (
    <main className="workspace">
      {activePage.id === "dashboard" && <DashboardPage activePage={activePage} rootPath={rootPath} />}
      {activePage.id === "projects" && (
        <ProjectsPage activePage={activePage} activeWorkspace={activeWorkspace} />
      )}
      {activePage.id === "packages" && (
        <PackagesPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "documentation" && (
        <DocumentationPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "ai" && <AIPage activePage={activePage} rootPath={rootPath} />}
      {activePage.id === "git" && <GitPage activePage={activePage} rootPath={rootPath} />}
      {activePage.id === "templates" && (
        <TemplatesPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "settings" && <SettingsPage activePage={activePage} />}
    </main>
  );
}
