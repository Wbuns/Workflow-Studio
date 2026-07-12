import { appVersionLabel } from "../../config/appMetadata";
import type { NavigationItem } from "../../types/navigation";

type SidebarProps = {
  activePageId: string;
  navigationItems: NavigationItem[];
  collapsed: boolean;
  onNavigate: (pageId: string) => void;
  onToggleCollapsed: () => void;
};

type NavigationGroup = { label: string; itemIds: string[] };

const navigationGroups: NavigationGroup[] = [
  { label: "Workspace", itemIds: ["dashboard", "projects", "ai-workspace", "timeline"] },
  { label: "Development", itemIds: ["packages", "documentation", "git"] },
  { label: "Library", itemIds: ["templates"] },
  { label: "System", itemIds: ["settings"] },
];

const navigationIcons: Record<string, string> = {
  dashboard: "◫", projects: "◆", "ai-workspace": "✦", timeline: "◷",
  packages: "▣", documentation: "▤", git: "⑂", templates: "◇", settings: "⚙",
};

export function Sidebar({ activePageId, navigationItems, collapsed, onNavigate, onToggleCollapsed }: SidebarProps) {
  const itemsById = new Map(navigationItems.map((item) => [item.id, item]));
  return (
    <aside className={collapsed ? "app-sidebar collapsed" : "app-sidebar"}>
      <div className="brand">
        <div className="brand-mark">WS</div>
        <div className="brand-copy"><strong>Workflow Studio</strong><span>{appVersionLabel}</span></div>
        <button className="sidebar-collapse-button" type="button" onClick={onToggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? "›" : "‹"}</button>
      </div>
      <nav className="nav-list" aria-label="Primary navigation">
        {navigationGroups.map((group) => {
          const items = group.itemIds.map((itemId) => itemsById.get(itemId)).filter((item): item is NavigationItem => Boolean(item));
          if (!items.length) return null;
          return (
            <section className="nav-group" key={group.label} aria-label={group.label}>
              <div className="nav-group-label" aria-hidden={collapsed}>{collapsed ? <span className="nav-group-divider" /> : group.label}</div>
              <div className="nav-group-items">
                {items.map((item) => (
                  <button key={item.id} type="button" className={item.id === activePageId ? "nav-item active" : "nav-item"} onClick={() => onNavigate(item.id)} aria-current={item.id === activePageId ? "page" : undefined} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}>
                    <span className="nav-item-icon" aria-hidden="true">{navigationIcons[item.id] ?? "•"}</span>
                    <span className="nav-item-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
