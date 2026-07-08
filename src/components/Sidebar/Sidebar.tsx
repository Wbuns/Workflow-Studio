import type { NavigationItem } from "../../types/navigation";

type SidebarProps = {
  activePageId: string;
  navigationItems: NavigationItem[];
  onNavigate: (pageId: string) => void;
};

export function Sidebar({
  activePageId,
  navigationItems,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <div className="brand-mark">WS</div>
        <div>
          <strong>Workflow Studio</strong>
          <span>v0.3 Shell</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activePageId ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
