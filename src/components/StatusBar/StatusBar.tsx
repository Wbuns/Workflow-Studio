import type { NavigationItem } from "../../types/navigation";

type StatusBarProps = {
  activePage: NavigationItem;
};

export function StatusBar({ activePage }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>Active page: {activePage.label}</span>
      <span>Build status: Ready</span>
      <span>Mode: Electron + React</span>
    </footer>
  );
}
