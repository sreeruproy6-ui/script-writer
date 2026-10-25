import { Globe2, Menu, Search, Sparkles, X } from "lucide-react";
import type { ApiStatus, ProjectResult, View } from "../types";
import { cn } from "../utils/cn";
import { Badge, Button } from "./ui";

const viewLabel: Record<View, string> = {
  setup: "New project",
  processing: "Processing",
  results: "Review & refine",
  projects: "Projects",
  glossary: "Glossary",
  help: "Help & docs",
  settings: "Studio settings",
};

export function TopBar({
  view,
  activeProject,
  apiStatus,
  search,
  onSearch,
  searchEnabled,
  onMenu,
  onSettings,
  onNewProject,
}: {
  view: View;
  activeProject: ProjectResult | null;
  apiStatus: ApiStatus;
  search: string;
  onSearch: (value: string) => void;
  searchEnabled: boolean;
  onMenu: () => void;
  onSettings: () => void;
  onNewProject: () => void;
}) {
  const crumb =
    view === "results" && activeProject
      ? activeProject.title_en || activeProject.title_bn
      : viewLabel[view];

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-[60px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 text-muted transition hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-[12px] md:flex">
          <span className="font-medium text-faint">Roy AI</span>
          <span className="text-faint/60">/</span>
          <span className={cn("truncate font-semibold", view === "results" ? "max-w-[220px] text-slate-200" : "text-slate-200")}>
            {crumb}
          </span>
          {view === "results" && activeProject && (
            <Badge tone="violet" className="ml-1 hidden xl:inline-flex">
              {activeProject.isDemo ? "Demo project" : "Localized"}
            </Badge>
          )}
        </div>

        <div className="flex-1" />

        {searchEnabled && (
          <label className="relative hidden w-full max-w-[260px] items-center sm:flex">
            <Search size={14} className="pointer-events-none absolute left-3 text-faint" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={view === "projects" ? "Search projects…" : "Search dialogue…"}
              aria-label="Search"
              className="h-9 w-full rounded-lg border border-line bg-panel-2/80 pr-8 pl-8 text-[12px] text-slate-200 transition outline-none placeholder:text-faint focus:border-violet-400/60 focus:bg-panel-2 focus:ring-2 focus:ring-violet/15"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="absolute right-2 rounded p-1 text-faint hover:text-white"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            ) : (
              <kbd className="mono absolute right-2 hidden rounded border border-line bg-canvas px-1 text-[9px] text-faint md:block">
                /
              </kbd>
            )}
          </label>
        )}

        <div className="hidden items-center gap-1.5 rounded-lg border border-line bg-panel-2/60 px-2.5 py-1.5 text-[11px] font-medium text-muted sm:flex">
          <Globe2 size={12} className="text-faint" />
          English UI
        </div>

        <button
          type="button"
          onClick={onSettings}
          title={
            apiStatus === "verified"
              ? "Gemini API connected"
              : apiStatus === "checking"
                ? "Verifying Gemini key"
                : "Connect your Gemini API key"
          }
          aria-label="API key status"
          className="hidden items-center gap-2 rounded-lg border border-line bg-panel-2/60 px-2.5 py-1.5 transition hover:border-line/80 hover:bg-panel-3 sm:flex"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              apiStatus === "verified" && "bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)]",
              apiStatus === "checking" && "animate-pulse bg-amber-400",
              apiStatus === "error" && "bg-red-400",
              apiStatus === "empty" && "bg-violet-400"
            )}
          />
          <span className="text-[11px] font-medium text-muted">
            {apiStatus === "verified" ? "API ready" : apiStatus === "checking" ? "Checking" : "API key"}
          </span>
        </button>

        <Button variant="primary" size="sm" icon={<Sparkles size={13} />} onClick={onNewProject} className="hidden md:inline-flex">
          New project
        </Button>

        <div
          title="Roy AI workspace"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-br from-violet/30 to-pink/20 text-[10px] font-bold text-violet-100"
        >
          RA
        </div>
      </div>

      {searchEnabled && (
        <div className="border-t border-line-soft px-4 py-2 sm:hidden">
          <label className="relative flex items-center">
            <Search size={13} className="pointer-events-none absolute left-3 text-faint" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={view === "projects" ? "Search projects…" : "Search dialogue…"}
              aria-label="Search"
              className="h-8 w-full rounded-lg border border-line bg-panel-2 pr-3 pl-8 text-[12px] text-slate-200 outline-none placeholder:text-faint focus:border-violet-400/60"
            />
          </label>
        </div>
      )}
    </header>
  );
}
