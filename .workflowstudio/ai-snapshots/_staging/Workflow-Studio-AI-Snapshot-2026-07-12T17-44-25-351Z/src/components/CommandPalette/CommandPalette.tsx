import { useEffect, useMemo, useRef, useState } from "react";
import type { NavigationItem } from "../../types/navigation";

type CommandPaletteProps = { navigationItems: NavigationItem[]; onNavigate: (pageId: string) => void };
type CommandCategory = "Navigation" | "Development" | "Workspace";
type PaletteCommand = { id: string; label: string; description: string; keywords: string; category: CommandCategory; run: () => void };
const RECENT_COMMANDS_KEY = "workflowstudio.commandPalette.recent";

function readRecentCommands(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_COMMANDS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch { return []; }
}

function fuzzyScore(command: PaletteCommand, query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const label = command.label.toLowerCase();
  const haystack = `${command.label} ${command.description} ${command.keywords} ${command.category}`.toLowerCase();
  return terms.reduce((score, term) => {
    if (label === term) return score + 18;
    if (label.startsWith(term)) return score + 12;
    if (label.includes(term)) return score + 8;
    if (haystack.includes(term)) return score + 3;
    let cursor = 0;
    for (const character of term) {
      cursor = haystack.indexOf(character, cursor);
      if (cursor === -1) return -1000;
      cursor += 1;
    }
    return score + 1;
  }, 0);
}

export function CommandPalette({ navigationItems, onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(readRecentCommands);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<PaletteCommand[]>(() => {
    const navigationCommands = navigationItems.map((item) => ({
      id: `navigate:${item.id}`, label: item.label, description: item.description,
      keywords: `${item.label} ${item.title} ${item.eyebrow} navigate open page`,
      category: "Navigation" as const, run: () => onNavigate(item.id),
    }));
    return [...navigationCommands,
      { id:"workspace:package-builder", label:"Open Package Builder", description:"Continue package creation and intake.", keywords:"package builder export milestone ai workspace", category:"Development", run:()=>onNavigate("ai-workspace") },
      { id:"workspace:snapshots", label:"Open Snapshot Tools", description:"Create, export, or review AI snapshots.", keywords:"snapshot ai history create export", category:"Development", run:()=>onNavigate("ai-workspace") },
      { id:"workspace:commands", label:"Open Workspace Commands", description:"Review build, validation, and developer commands.", keywords:"commands build run technical developer tools", category:"Workspace", run:()=>onNavigate("dashboard") },
      { id:"workspace:timeline", label:"Review Recent Activity", description:"Open packages, commits, and AI activity.", keywords:"history recent activity timeline", category:"Workspace", run:()=>onNavigate("timeline") },
    ];
  }, [navigationItems, onNavigate]);

  const filteredCommands = useMemo(() => commands.map((command)=>({command,score:fuzzyScore(command,query)})).filter((entry)=>!query.trim()||entry.score>=0).sort((left,right)=>{
    if(query.trim()&&right.score!==left.score)return right.score-left.score;
    const li=recentIds.indexOf(left.command.id),ri=recentIds.indexOf(right.command.id);
    if(li===-1&&ri===-1)return left.command.category.localeCompare(right.command.category)||left.command.label.localeCompare(right.command.label);
    if(li===-1)return 1;if(ri===-1)return -1;return li-ri;
  }).map((entry)=>entry.command), [commands,query,recentIds]);

  useEffect(()=>{
    function onKeyDown(event:KeyboardEvent){
      if(event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==="p"){event.preventDefault();setIsOpen((current)=>!current);return;}
      if(!isOpen)return;
      if(event.key==="Escape"){event.preventDefault();setIsOpen(false);}
      else if(event.key==="ArrowDown"){event.preventDefault();setActiveIndex((current)=>Math.min(current+1,Math.max(filteredCommands.length-1,0)));}
      else if(event.key==="ArrowUp"){event.preventDefault();setActiveIndex((current)=>Math.max(current-1,0));}
      else if(event.key==="Enter"&&filteredCommands[activeIndex]){event.preventDefault();executeCommand(filteredCommands[activeIndex]);}
    }
    window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown);
  },[activeIndex,filteredCommands,isOpen]);
  useEffect(()=>{if(!isOpen)return;setQuery("");setActiveIndex(0);window.setTimeout(()=>inputRef.current?.focus(),0);},[isOpen]);
  useEffect(()=>setActiveIndex(0),[query]);

  function executeCommand(command:PaletteCommand){
    const next=[command.id,...recentIds.filter((id)=>id!==command.id)].slice(0,8);
    setRecentIds(next);window.localStorage.setItem(RECENT_COMMANDS_KEY,JSON.stringify(next));setIsOpen(false);command.run();
  }
  if(!isOpen)return null;
  let previousCategory="";
  return <div className="command-palette-backdrop" role="presentation" onMouseDown={()=>setIsOpen(false)}>
    <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command Palette" onMouseDown={(event)=>event.stopPropagation()}>
      <div className="command-palette-search-row"><span aria-hidden="true">⌕</span><input ref={inputRef} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search commands, pages, and actions..." aria-label="Search commands"/><kbd>Esc</kbd></div>
      {!query&&recentIds.length>0&&<div className="command-palette-context">Recent commands are shown first</div>}
      <div className="command-palette-results" role="listbox">
        {filteredCommands.length?filteredCommands.map((command,index)=>{const showCategory=command.category!==previousCategory;previousCategory=command.category;return <div className="command-palette-entry" key={command.id}>{showCategory&&<div className="command-palette-category">{command.category}</div>}<button type="button" role="option" aria-selected={index===activeIndex} className={index===activeIndex?"command-palette-item active":"command-palette-item"} onMouseEnter={()=>setActiveIndex(index)} onClick={()=>executeCommand(command)}><span><strong>{command.label}</strong><small>{command.description}</small></span><span className="command-palette-meta">{recentIds.includes(command.id)&&<em>Recent</em>}<kbd>Enter</kbd></span></button></div>}):<div className="command-palette-empty"><strong>No matching commands</strong><span>Try a page name, action, or shorter phrase.</span></div>}
      </div><footer><span>↑↓ Navigate</span><span>Enter Run</span><span>Ctrl+Shift+P Toggle</span></footer>
    </section></div>;
}
