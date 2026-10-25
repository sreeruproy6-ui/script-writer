import {
  ArrowUpRight,
  BookMarked,
  CircleHelp,
  FolderKanban,
  KeyRound,
  LayoutGrid,
  Mic2,
  Plus,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "../utils/cn";
import type { ApiStatus, View } from "../types";
import { LogoMark, Wordmark } from "./ui";

export type SidebarNav = "new" | "projects" | "dubbing" | "glossary" | "help" | "settings";

interface SidebarContentProps {
  activeNav: SidebarNav;
  apiStatus: ApiStatus;
  projectCount: number;
  onNavigate: (view: View, nav: SidebarNav) => void;
  onNewProject: () => void;
  onClose?: () => void;
}

function SidebarContent({
  activeNav,
  apiStatus,
  projectCount,
  onNavigate,
  onNewProject,
  onClose,
}: SidebarContentProps) {
  const workspaceItems: { nav: SidebarNav; label: string; icon: typeof LayoutGrid; view: View; badge?: string }[] = [
    { nav: "projects", label: "Projects", icon: FolderKanban, view: "projects", badge: projectCount ? String(projectCount) : undefined },
    { nav: "dubbing", label: "Dubbing script", icon: Mic2, view: "results" },
    { nav: "glossary", label: "Glossary", icon: BookMarked, view: "glossary" },
  ];

  const supportItems: { nav: SidebarNav; label: string; icon: typeof LayoutGrid; view: View }[] = [
    { nav: "help", label: "Help & docs", icon: CircleHelp, view: "help" },
    { nav: "settings", label: "Studio settings", icon: Settings2, view: "settings" },
  ];

  const apiCopy =
    apiStatus === "verified"
      ? { label: "Gemini connected", color: "bg-emerald-400", text: "text-emerald-300" }
      : apiStatus === "checking"
        ? { label: "Verifying key", color: "bg-amber-400 animate-pulse", text: "text-amber-200" }
        : apiStatus === "error"
          ? { label: "Key rejected", color: "bg-red-400", text: "text-red-300" }
          : { label: "Demo mode ready", color: "bg-violet-400", text: "text-violet-200" };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <button
          type="button"
          onClick={() => {
            onNavigate("setup", "new");
            onClose?.();
          }}
          className="flex items-center gap-2.5 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-violet/60 focus-visible:outline-none"
          aria-label="Roy AI home"
        >
          <LogoMark size={38} />
          <Wordmark />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-faint hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <div className="px-3.5">
        <button
          type="button"
          onClick={() => {
            onNewProject();
            onClose?.();
          }}
          className={cn(
            "group relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all",
            activeNav === "new"
              ? "border-violet-400/30 bg-gradient-to-r from-violet/20 to-pink/10 text-white"
              : "border-line bg-panel-2 text-slate-200 hover:border-violet-400/30 hover:bg-panel-3"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet to-pink text-white shadow-lg shadow-violet/30">
              <Plus size={14} strokeWidth={2.8} />
            </span>
            New project
          </span>
          <Sparkles size={13} className="text-violet-soft/70 transition group-hover:text-pink-300" />
        </button>
      </div>

      <nav className="mt-6 min-h-0 flex-1 overflow-y-auto px-3.5 pb-4" aria-label="Main navigation">
        <p className="mb-2 px-2 text-[10px] font-bold tracking-[0.16em] text-faint uppercase">Workspace</p>
        <ul className="space-y-1">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.nav;
            return (
              <li key={item.nav}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(item.view, item.nav);
                    onClose?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn("nav-item", active && "active")}
                >
                  <Icon size={16} className={active ? "text-violet-soft" : "text-faint"} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="mono rounded border border-line bg-canvas px-1.5 py-px text-[10px] font-semibold text-muted">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 mb-2 px-2 text-[10px] font-bold tracking-[0.16em] text-faint uppercase">Support</p>
        <ul className="space-y-1">
          {supportItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.nav;
            return (
              <li key={item.nav}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(item.view, item.nav);
                    onClose?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn("nav-item", active && "active")}
                >
                  <Icon size={16} className={active ? "text-violet-soft" : "text-faint"} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 overflow-hidden rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet/15 via-panel-2 to-pink/[0.06] p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-violet-soft uppercase">
            <Sparkles size={11} />
            Studio tip
          </div>
          <p className="bn text-[12.5px] leading-relaxed font-medium text-slate-200">
            “ভাষা বদলায়, অনুভূতি নয়।”
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
            Localize the feeling first — the words follow.
          </p>
        </div>
      </nav>

      <div className="border-t border-line-soft p-3.5">
        <div className="rounded-xl border border-line bg-panel-2/80 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", apiCopy.color)} />
              <span className={cn("truncate text-[11px] font-semibold", apiCopy.text)}>{apiCopy.label}</span>
            </div>
            <KeyRound size={12} className="shrink-0 text-faint" />
          </div>
          <button
            type="button"
            onClick={() => {
              onNavigate("settings", "settings");
              onClose?.();
            }}
            className="mt-2 flex w-full items-center justify-between rounded-md bg-canvas/60 px-2 py-1.5 text-[10.5px] font-medium text-muted transition hover:text-white"
          >
            Manage API key
            <ArrowUpRight size={11} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between px-1 text-[10px] text-faint">
          <span>Roy AI Studio</span>
          <span className="mono rounded border border-line px-1.5 py-px">v2.4</span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  activeNav,
  apiStatus,
  projectCount,
  onNavigate,
  onNewProject,
  mobileOpen,
  onCloseMobile,
}: {
  activeNav: SidebarNav;
  apiStatus: ApiStatus;
  projectCount: number;
  onNavigate: (view: View, nav: SidebarNav) => void;
  onNewProject: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-line bg-[#080e19]/95 backdrop-blur-xl lg:flex">
        <SidebarContent
          activeNav={activeNav}
          apiStatus={apiStatus}
          projectCount={projectCount}
          onNavigate={onNavigate}
          onNewProject={onNewProject}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="animate-fade-up relative flex h-full w-[280px] max-w-[86vw] flex-col border-r border-line bg-[#080e19] shadow-2xl">
            <SidebarContent
              activeNav={activeNav}
              apiStatus={apiStatus}
              projectCount={projectCount}
              onNavigate={onNavigate}
              onNewProject={onNewProject}
              onClose={onCloseMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
}
