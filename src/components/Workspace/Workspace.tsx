import { AIWorkspacePage } from "../../features/ai-development/AIDevelopmentPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { DocumentationPage } from "../../features/documentation/DocumentationPage";
import { GitPage } from "../../features/git/GitPage";
import { PackagesPage } from "../../features/packages/PackagesPage";
import { ProjectsPage } from "../../features/projects/ProjectsPage";
import { TemplatesPage } from "../../features/templates/TemplatesPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { TimelinePage } from "../../features/timeline/TimelinePage";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";

type WorkspaceProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
  onNavigate: (pageId: string) => void;
};

export function Workspace({ activePage, activeWorkspace, onNavigate }: WorkspaceProps) {
  const rootPath = activeWorkspace?.rootPath;

  return (
    <main className="workspace">
      {activePage.id === "dashboard" && <DashboardPage activePage={activePage} rootPath={rootPath} onNavigate={onNavigate} />}
      {activePage.id === "projects" && (
        <ProjectsPage activePage={activePage} activeWorkspace={activeWorkspace} />
      )}
      {activePage.id === "timeline" && <TimelinePage activePage={activePage} rootPath={rootPath} />}
      {activePage.id === "packages" && (
        <PackagesPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "documentation" && (
        <DocumentationPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "ai-workspace" && (
        <AIWorkspacePage activePage={activePage} activeWorkspace={activeWorkspace} />
      )}
      {activePage.id === "git" && <GitPage activePage={activePage} rootPath={rootPath} />}
      {activePage.id === "templates" && (
        <TemplatesPage activePage={activePage} rootPath={rootPath} />
      )}
      {activePage.id === "settings" && <SettingsPage activePage={activePage} />}
    </main>
  );
}
