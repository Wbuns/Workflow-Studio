import { useEffect, useMemo, useRef, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceSearchIndex, WorkspaceSearchResult, WorkspaceSearchResultKind } from "../../types/workspaceSearch";
import { buildWorkspaceSearchIndex, filterWorkspaceSearchResults } from "../../services/WorkspaceSearchService";
import { openWorkspacePath } from "../../services/WorkspaceOpenService";

type WorkspaceSearchProps={rootPath?:string;navigationItems:NavigationItem[];onNavigate:(pageId:string)=>void};
type SearchFilter="all"|WorkspaceSearchResultKind;
const SEARCH_HISTORY_KEY="workflowstudio.workspaceSearch.history";
const filters:Array<{id:SearchFilter;label:string}>=[{id:"all",label:"All"},{id:"navigation",label:"Pages"},{id:"documentation",label:"Docs"},{id:"package",label:"Packages"},{id:"timeline",label:"Activity"},{id:"snapshot",label:"Snapshots"},{id:"template",label:"Templates"}];
function readHistory():string[]{try{const parsed=JSON.parse(window.localStorage.getItem(SEARCH_HISTORY_KEY)??"[]");return Array.isArray(parsed)?parsed.filter((value):value is string=>typeof value==="string"):[]}catch{return[]}}
function kindLabel(kind:WorkspaceSearchResult["kind"]){if(kind==="navigation")return"Page";if(kind==="documentation")return"Document";if(kind==="package")return"Package";if(kind==="snapshot")return"Snapshot";if(kind==="timeline")return"Activity";if(kind==="template")return"Template";return"Metadata"}
export function WorkspaceSearch({rootPath,navigationItems,onNavigate}:WorkspaceSearchProps){
  const[isOpen,setIsOpen]=useState(false),[query,setQuery]=useState(""),[filter,setFilter]=useState<SearchFilter>("all"),[history,setHistory]=useState<string[]>(readHistory);
  const[index,setIndex]=useState<WorkspaceSearchIndex>(),[loading,setLoading]=useState(false),[activeIndex,setActiveIndex]=useState(0);const inputRef=useRef<HTMLInputElement>(null);
  const results=useMemo(()=>{const ranked=filterWorkspaceSearchResults(index?.results??[],query);return filter==="all"?ranked:ranked.filter((result)=>result.kind===filter)},[filter,index,query]);
  async function loadIndex(){setLoading(true);try{setIndex(await buildWorkspaceSearchIndex(rootPath,navigationItems))}finally{setLoading(false)}}
  useEffect(()=>{function onKeyDown(event:KeyboardEvent){if(event.ctrlKey&&!event.shiftKey&&event.key.toLowerCase()==="k"){event.preventDefault();setIsOpen(true);return}if(!isOpen)return;if(event.key==="Escape"){event.preventDefault();setIsOpen(false)}else if(event.key==="ArrowDown"){event.preventDefault();setActiveIndex((current)=>Math.min(current+1,Math.max(results.length-1,0)))}else if(event.key==="ArrowUp"){event.preventDefault();setActiveIndex((current)=>Math.max(current-1,0))}else if(event.key==="Enter"&&results[activeIndex]){event.preventDefault();void activate(results[activeIndex])}}window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown)},[activeIndex,isOpen,results]);
  useEffect(()=>{if(!isOpen)return;setQuery("");setFilter("all");setActiveIndex(0);void loadIndex();window.setTimeout(()=>inputRef.current?.focus(),0)},[isOpen,rootPath]);
  useEffect(()=>setActiveIndex(0),[query,filter]);
  function remember(){const value=query.trim();if(!value)return;const next=[value,...history.filter((item)=>item.toLowerCase()!==value.toLowerCase())].slice(0,8);setHistory(next);window.localStorage.setItem(SEARCH_HISTORY_KEY,JSON.stringify(next))}
  async function activate(result:WorkspaceSearchResult){remember();setIsOpen(false);if(result.path&&result.kind!=="navigation"){const opened=await openWorkspacePath(rootPath,result.path);if(opened.ok)return}if(result.pageId)onNavigate(result.pageId)}
  if(!isOpen)return null;
  return <div className="workspace-search-backdrop" role="presentation" onMouseDown={()=>setIsOpen(false)}><section className="workspace-search" role="dialog" aria-modal="true" aria-label="Global Workspace Search" onMouseDown={(event)=>event.stopPropagation()}>
    <header className="workspace-search-header"><div><p className="eyebrow">Global Workspace Search</p><h2>Search the active project</h2></div><kbd>Esc</kbd></header>
    <div className="workspace-search-input-row"><span aria-hidden="true">⌕</span><input ref={inputRef} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search documentation, packages, snapshots, activity, templates, and pages..." aria-label="Search the active workspace"/><button className="text-button" type="button" onClick={()=>void loadIndex()} disabled={loading}>{loading?"Indexing…":"Refresh"}</button></div>
    <div className="workspace-search-filters" aria-label="Search filters">{filters.map((item)=><button key={item.id} type="button" className={filter===item.id?"active":""} onClick={()=>setFilter(item.id)}>{item.label}</button>)}</div>
    {!query&&history.length>0&&<div className="workspace-search-history"><span>Recent searches</span>{history.slice(0,5).map((value)=><button type="button" key={value} onClick={()=>setQuery(value)}>{value}</button>)}<button className="clear" type="button" onClick={()=>{setHistory([]);window.localStorage.removeItem(SEARCH_HISTORY_KEY)}}>Clear</button></div>}
    <div className="workspace-search-results" role="listbox">{loading&&!index?<p className="workspace-search-empty">Building the workspace index.</p>:results.length?results.map((result,resultIndex)=><button key={result.id} type="button" role="option" aria-selected={resultIndex===activeIndex} className={resultIndex===activeIndex?"workspace-search-result active":"workspace-search-result"} onMouseEnter={()=>setActiveIndex(resultIndex)} onClick={()=>void activate(result)}><span className={`workspace-search-kind kind-${result.kind}`}>{kindLabel(result.kind)}</span><span className="workspace-search-result-copy"><strong>{result.title}</strong><small>{result.detail}</small>{result.location&&<code>{result.location}</code>}</span><span className="workspace-search-action">{result.path?"Open":"Go"}</span></button>):<div className="workspace-search-empty"><strong>No workspace results</strong><span>Try another term or remove the current filter.</span></div>}</div>
    {index?.warnings.length?<footer className="workspace-search-warning">{index.warnings[0]}</footer>:<footer><span>↑↓ Navigate</span><span>Enter Open</span><span>Ctrl+K Search</span></footer>}
  </section></div>
}
