import { AIPage } from "../../features/ai/AIPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { DocumentationPage } from "../../features/documentation/DocumentationPage";
import { GitPage } from "../../features/git/GitPage";
import { PackagesPage } from "../../features/packages/PackagesPage";
import { ProjectsPage } from "../../features/projects/ProjectsPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { TemplatesPage } from "../../features/templates/TemplatesPage";
import type { NavigationItem } from "../../types/navigation";

type WorkspaceProps = {
    activePage: NavigationItem;
};

export function Workspace({ activePage }: WorkspaceProps) {
    return (
        <main className="workspace">
            {activePage.id === "dashboard" && <DashboardPage activePage={activePage} />}
            {activePage.id === "projects" && <ProjectsPage activePage={activePage} />}
            {activePage.id === "packages" && <PackagesPage activePage={activePage} />}
            {activePage.id === "documentation" && <DocumentationPage activePage={activePage} />}
            {activePage.id === "ai" && <AIPage activePage={activePage} />}
            {activePage.id === "git" && <GitPage activePage={activePage} />}
            {activePage.id === "templates" && <TemplatesPage activePage={activePage} />}
            {activePage.id === "settings" && <SettingsPage activePage={activePage} />}
        </main>
    );
}
