import { useMemo, useState } from "react";
import { ArrowUpRight, Clock3, FolderKanban, Languages, Mic2, Plus, SearchX, ShieldCheck, Users } from "lucide-react";
import type { ProjectResult } from "../types";
import { POSTER } from "../data/demo";
import { auditProject, formatDate, formatTime } from "../lib/format";
import { Badge, Button, EmptyState, ProgressBar, SectionTitle } from "../components/ui";
import { cn } from "../utils/cn";

type Filter = "all" | "ready" | "review" | "demo";

export function ProjectsView({
  projects,
  query,
  onOpen,
  onNew,
}: {
  projects: ProjectResult[];
  query: string;
  onOpen: (project: ProjectResult) => void;
  onNew: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const withAudit = useMemo(
    () => projects.map((project) => ({ project, audit: auditProject(project.segments, project.qaOverride) })),
    [projects]
  );

  const filtered = withAudit.filter(({ project, audit }) => {
    const haystack = `${project.title_bn} ${project.title_en} ${project.fileName} ${project.sourceLanguage}`.toLowerCase();
    const matchesSearch = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "demo" && project.isDemo) ||
      (filter === "review" && audit.issues > 0) ||
      (filter === "ready" && audit.score >= 90);
    return matchesSearch && matchesFilter;
  });

  const totalSegments = projects.reduce((sum, project) => sum + project.segments.length, 0);
  const totalRuntime = projects.reduce((sum, project) => sum + project.durationMs, 0);
  const avgScore = withAudit.length
    ? Math.round(withAudit.reduce((sum, item) => sum + item.audit.score, 0) / withAudit.length)
    : 0;

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All projects", count: projects.length },
    { id: "ready", label: "QA 90+", count: withAudit.filter(({ audit }) => audit.score >= 90).length },
    { id: "review", label: "Needs review", count: withAudit.filter(({ audit }) => audit.issues > 0).length },
    { id: "demo", label: "Demo", count: projects.filter((project) => project.isDemo).length },
  ];

  return (
    <div className="animate-fade-up mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionTitle
        eyebrow="Workspace · Projects"
        title="Your localization library"
        description="Every subtitle and dubbing draft you generate in this browser, with its QA state and glossary intact."
        action={
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={onNew}>
            New project
          </Button>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Projects", value: String(projects.length), icon: FolderKanban },
          { label: "Segments localized", value: String(totalSegments), icon: Languages },
          { label: "Avg. QA score", value: projects.length ? `${avgScore}` : "—", icon: ShieldCheck },
          { label: "Runtime handled", value: totalRuntime ? formatTime(totalRuntime) : "00:00", icon: Clock3 },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-soft flex items-center gap-3 px-3.5 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 text-violet-soft">
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="mono text-[15px] leading-tight font-bold text-white">{stat.value}</p>
                <p className="mt-0.5 truncate text-[10px] text-faint">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
              filter === item.id
                ? "border-violet-400/40 bg-violet/15 text-violet-100"
                : "border-line bg-panel-2/40 text-muted hover:border-line/80 hover:text-slate-200"
            )}
          >
            {item.label}
            <span className={cn("mono rounded-full px-1 text-[9px]", filter === item.id ? "bg-violet-400/20" : "bg-white/5 text-faint")}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-4">
          <EmptyState
            icon={<SearchX size={20} />}
            title="No projects in this view"
            description={
              query.trim()
                ? `Nothing matches “${query.trim()}”. Try a different title or filter.`
                : "Start with a demo episode to see what a finished localization looks like."
            }
            action={
              <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={onNew}>
                New project
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ project, audit }) => (
            <article
              key={project.id}
              className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-400/35"
            >
              <button
                type="button"
                onClick={() => onOpen(project)}
                className="relative block w-full overflow-hidden text-left focus-visible:outline-none"
                aria-label={`Open ${project.title_en}`}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-panel-3">
                  <img
                    src={POSTER}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/20 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    <Badge tone={project.isDemo ? "violet" : "green"} dot>
                      {project.isDemo ? "Demo" : "Localized"}
                    </Badge>
                    <span
                      className={cn(
                        "mono inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9.5px] font-bold backdrop-blur",
                        audit.score >= 90
                          ? "border-emerald-400/30 bg-emerald-950/60 text-emerald-200"
                          : "border-amber-400/30 bg-amber-950/60 text-amber-100"
                      )}
                    >
                      <ShieldCheck size={10} /> {audit.score}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <h3 className="bn truncate text-[14px] leading-snug font-bold text-white">{project.title_bn}</h3>
                      <p className="mt-0.5 truncate text-[10.5px] text-slate-300/80">{project.title_en}</p>
                    </div>
                    <span className="mono shrink-0 rounded border border-white/15 bg-black/50 px-1.5 py-0.5 text-[9.5px] text-slate-200 backdrop-blur">
                      {formatTime(project.durationMs)}
                    </span>
                  </div>
                  <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </button>
              <div className="p-3.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-faint">
                  <span className="flex items-center gap-1">
                    <Mic2 size={10} /> {project.segments.length} segments
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {new Set(project.segments.map((segment) => segment.speaker)).size} voices
                  </span>
                  <span className="ml-auto">{formatDate(project.createdAt)}</span>
                </div>
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between text-[9.5px]">
                    <span className="text-faint">{project.sourceLanguage} → Bengali</span>
                    <span className={audit.issues ? "text-amber-300" : "text-emerald-300"}>
                      {audit.issues ? `${audit.issues} flagged` : "QA verified"}
                    </span>
                  </div>
                  <ProgressBar value={audit.score} tone={audit.score >= 90 ? "green" : "gradient"} className="h-1" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => onOpen(project)}>
                    Open studio
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpen(project)}
                    aria-label={`Open ${project.title_en}`}
                    className="px-2"
                  >
                    <ArrowUpRight size={13} />
                  </Button>
                </div>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={onNew}
            className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel/30 px-5 py-8 text-center transition hover:border-violet-400/50 hover:bg-violet/[0.04]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet/10 text-violet-soft">
              <Plus size={18} />
            </span>
            <span className="mt-2.5 text-[12px] font-semibold text-slate-200">Start a new localization</span>
            <span className="mt-1 max-w-[200px] text-[10.5px] leading-relaxed text-faint">
              Upload a clip, or explore the demo episode first.
            </span>
          </button>
        </div>
      )}

      <p className="mt-5 text-[10px] text-faint">
        Projects are stored in this browser only. Clearing site data removes them permanently.
      </p>
    </div>
  );
}
