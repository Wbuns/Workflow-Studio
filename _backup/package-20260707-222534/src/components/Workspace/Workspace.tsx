import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { PlaceholderPage } from "../../features/placeholder/PlaceholderPage";
import type { NavigationItem } from "../../types/navigation";

type WorkspaceProps = {
    activePage: NavigationItem;
};

export function Workspace({ activePage }: WorkspaceProps) {
    return (
        <main className="workspace">
            {activePage.id === "dashboard" ? (
                <DashboardPage activePage={activePage} />
            ) : (
                <PlaceholderPage activePage={activePage} />
            )}
        </main>
    );
}