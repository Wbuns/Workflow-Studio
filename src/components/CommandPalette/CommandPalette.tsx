import { useEffect, useMemo, useRef, useState } from "react";
import type { NavigationItem } from "../../types/navigation";

type CommandPaletteProps = {
  navigationItems: NavigationItem[];
  onNavigate: (pageId: string) => void;
};

type PaletteCommand = {
  id: string;
  label: string;
  description: string;
  keywords: string;
  run: () => void;
};

const RECENT_COMMANDS_KEY = "workflowstudio.commandPalette.recent";

function readRecentCommands(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_COMMANDS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function CommandPalette({ navigationItems, onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(readRecentCommands);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<PaletteCommand[]>(() => {
    const navigationCommands = navigationItems.map((item) => ({
      id: `navigate:${item.id}`,
      label: item.label,
      description: item.description,
      keywords: `${item.label} ${item.title} ${item.eyebrow} navigate open page`,
      run: () => onNavigate(item.id),
    }));

    return [
      ...navigationCommands,
      {
        id: "workspace:package-builder",
        label: "Open Package Builder",
        description: "Open AI Workspace and continue package creation.",
        keywords: "package builder export milestone ai workspace",
        run: () => onNavigate("ai-workspace"),
      },
      {
        id: "workspace:snapshots",
        label: "Open Snapshot Tools",
        description: "Open AI Workspace snapshot creation and history.",
        keywords: "snapshot ai history create",
        run: () => onNavigate("ai-workspace"),
      },
      {
        id: "workspace:commands",
        label: "Open Workspace Commands",
        description: "Open Dashboard developer tools and workspace commands.",
        keywords: "commands build run technical developer tools",
        run: () => onNavigate("dashboard"),
      },
    ];
  }, [navigationItems, onNavigate]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matching = normalizedQuery
      ? commands.filter((command) => `${command.label} ${command.description} ${command.keywords}`.toLowerCase().includes(normalizedQuery))
      : commands;

    return [...matching].sort((left, right) => {
      const leftRecent = recentIds.indexOf(left.id);
      const rightRecent = recentIds.indexOf(right.id);
      if (leftRecent === -1 && rightRecent === -1) return left.label.localeCompare(right.label);
      if (leftRecent === -1) return 1;
      if (rightRecent === -1) return -1;
      return leftRecent - rightRecent;
    });
  }, [commands, query, recentIds]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setIsOpen((current) => !current);
        return;
      }
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(filteredCommands.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter" && filteredCommands[activeIndex]) {
        event.preventDefault();
        executeCommand(filteredCommands[activeIndex]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filteredCommands, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function executeCommand(command: PaletteCommand) {
    const nextRecent = [command.id, ...recentIds.filter((id) => id !== command.id)].slice(0, 6);
    setRecentIds(nextRecent);
    window.localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(nextRecent));
    setIsOpen(false);
    command.run();
  }

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command Palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-palette-search-row">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and workspace actions..."
            aria-label="Search commands"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-palette-results" role="listbox">
          {filteredCommands.length ? filteredCommands.map((command, index) => (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "command-palette-item active" : "command-palette-item"}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => executeCommand(command)}
            >
              <span><strong>{command.label}</strong><small>{command.description}</small></span>
              <kbd>Enter</kbd>
            </button>
          )) : <p className="command-palette-empty">No matching commands.</p>}
        </div>
        <footer><span>↑↓ Navigate</span><span>Enter Run</span><span>Ctrl+Shift+P Toggle</span></footer>
      </section>
    </div>
  );
}
