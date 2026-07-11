import type { NavigationItem } from "../../types/navigation";

type SidebarProps = {
  activePageId: string;
  navigationItems: NavigationItem[];
  onNavigate: (pageId: string) => void;
};

type NavigationGroup = {
  label: string;
  itemIds: string[];
};

const navigationGroups: NavigationGroup[] = [
  { label: "Workspace", itemIds: ["dashboard", "projects", "ai-workspace"] },
  { label: "Development", itemIds: ["packages", "documentation", "git"] },
  { label: "Library", itemIds: ["templates"] },
  { label: "System", itemIds: ["settings"] },
];

export function Sidebar({ activePageId, navigationItems, onNavigate }: SidebarProps) {
  const itemsById = new Map(navigationItems.map((item) => [item.id, item]));

  return (
    <aside className="app-sidebar">
      <div className="brand">
        <div className="brand-mark">WS</div>
        <div>
          <strong>Workflow Studio</strong>
          <span>v1.4 Daily Driver</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navigationGroups.map((group) => {
          const items = group.itemIds
            .map((itemId) => itemsById.get(itemId))
            .filter((item): item is NavigationItem => Boolean(item));

          if (items.length === 0) return null;

          return (
            <section className="nav-group" key={group.label} aria-label={group.label}>
              <div className="nav-group-label">{group.label}</div>
              <div className="nav-group-items">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === activePageId ? "nav-item active" : "nav-item"}
                    onClick={() => onNavigate(item.id)}
                    aria-current={item.id === activePageId ? "page" : undefined}
                  >
                    <span>{item.label}</span>
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
