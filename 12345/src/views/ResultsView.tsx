import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Braces,
  Check,
  CheckCircle2,
  Clock3,
  Cloud,
  Copy,
  Download,
  FileJson,
  FileText,
  FileVideo,
  Globe2,
  Languages,
  Mic2,
  Plus,
  RefreshCw,
  ScrollText,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  X,
} from "lucide-react";
import type { MediaInfo, ProjectResult, ResultTab } from "../types";
import { auditProject, formatDate, formatTime } from "../lib/format";
import { buildExport, copyToClipboard, downloadExport, exportReadiness, shareExport, type ExportKind } from "../lib/exports";
import { Badge, Button, ProgressBar, SectionTitle } from "../components/ui";
import { MediaPreview, type SeekRequest } from "../components/MediaPreview";
import { SegmentList } from "../components/SegmentList";
import { cn } from "../utils/cn";

const TABS: { id: ResultTab; label: string; icon: typeof ScrollText }[] = [
  { id: "subtitle", label: "Bengali subtitles", icon: ScrollText },
  { id: "dubbing", label: "Dubbing script", icon: Mic2 },
  { id: "source", label: "Source transcript", icon: Languages },
  { id: "export", label: "Export & share", icon: Download },
];

const EXPORTS: {
  id: ExportKind;
  title: string;
  desc: string;
  tag: string;
  icon: typeof FileText;
  featured?: boolean;
}[] = [
  {
    id: "srt",
    title: "Bengali subtitles",
    desc: "Standard SubRip file for editors, YouTube and VLC.",
    tag: ".SRT",
    icon: FileText,
    featured: true,
  },
  {
    id: "vtt",
    title: "Web subtitles",
    desc: "WebVTT for HTML5 players and streaming platforms.",
    tag: ".VTT",
    icon: Globe2,
  },
  {
    id: "dubbing",
    title: "Dubbing script",
    desc: "Timecoded, performable lines with tone and SFX notes.",
    tag: ".TXT",
    icon: Mic2,
    featured: true,
  },
  {
    id: "subtitle",
    title: "Bengali text only",
    desc: "Clean subtitle lines for copywriting or review docs.",
    tag: ".TXT",
    icon: FileText,
  },
  {
    id: "source",
    title: "Source transcript",
    desc: "Original-language dialogue with speaker and timing.",
    tag: ".TXT",
    icon: Languages,
  },
  {
    id: "json",
    title: "Full project",
    desc: "Structured JSON with glossary, segments and metadata.",
    tag: ".JSON",
    icon: Braces,
  },
];

export function ResultsView({
  project,
  media,
  tab,
  onTabChange,
  query,
  onQueryChange,
  onUpdate,
  onNewProject,
  onOpenGlossary,
  notify,
}: {
  project: ProjectResult;
  media: MediaInfo;
  tab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onUpdate: (segmentId: number, field: "bengali_subtitle" | "bengali_dubbing" | "source_text", value: string) => void;
  onNewProject: () => void;
  onOpenGlossary: () => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const [seekRequest, setSeekRequest] = useState<SeekRequest | undefined>(undefined);
  const seekNonce = useRef(0);
  const audit = useMemo(() => auditProject(project.segments, project.qaOverride), [project.segments, project.qaOverride]);
  const readiness = exportReadiness(project);
  const speakers = new Set(project.segments.map((segment) => segment.speaker)).size;
  const avgConfidence = project.segments.length
    ? project.segments.reduce((sum, segment) => sum + segment.confidence, 0) / project.segments.length
    : 0;

  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [project.id]);

  useEffect(() => {
    const clear = () => onQueryChange("");
    window.addEventListener("roy:clear-search", clear);
    return () => window.removeEventListener("roy:clear-search", clear);
  }, [onQueryChange]);

  const requestSeek = (ms: number) => {
    seekNonce.current += 1;
    setSeekRequest({ ms, nonce: seekNonce.current });
  };

  const scrollToScripts = () => {
    document.getElementById("result-scripts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleExport = (kind: ExportKind) => {
    const payload = downloadExport(project, kind);
    notify(`${payload.label} downloaded · ${payload.filename}`, "success");
  };

  const handleShare = async (kind: ExportKind) => {
    try {
      const shared = await shareExport(project, kind);
      if (shared) notify("Project assets shared.", "success");
      else notify("Sharing isn't available here, so the file was downloaded instead.", "info");
    } catch {
      notify("Could not share this file. Try downloading it instead.", "error");
    }
  };

  const copyActiveScript = async () => {
    const content = buildExport(project, tab === "export" ? "json" : tab === "subtitle" ? "srt" : tab).content;
    const ok = await copyToClipboard(content);
    notify(
      ok ? (tab === "export" ? "Full project JSON copied." : "Script copied to clipboard.") : "Clipboard access was blocked.",
      ok ? "success" : "error"
    );
  };

  const jumpToFlag = (segmentId: number) => {
    const segment = project.segments.find((item) => item.id === segmentId);
    if (!segment) return;
    onTabChange("subtitle");
    requestSeek(segment.start_ms);
    scrollToScripts();
  };

  const copyShort = project.summary_bn.length > 190 ? `${project.summary_bn.slice(0, 190)}…` : project.summary_bn;

  return (
    <div className="animate-fade-up mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionTitle
        eyebrow="Review & refine"
        title={<span className="bn">{project.title_bn}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{project.title_en}</span>
            <Badge tone={audit.score >= 90 ? "green" : "amber"} dot>
              QA {audit.score}/100
            </Badge>
            <span className="text-faint">·</span>
            <span className="text-faint">{formatDate(project.createdAt)}</span>
          </span>
        }
        action={
          <>
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={onNewProject}>
              New project
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => {
                onTabChange("export");
                scrollToScripts();
              }}
            >
              Export assets
            </Button>
          </>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Badge tone="violet">{project.sourceLanguage}</Badge>
        <span className="text-[10px] text-faint">→</span>
        <Badge tone="pink">Bengali (bn-BD)</Badge>
        <Badge tone="slate">{formatTime(project.durationMs)} runtime</Badge>
        <Badge tone="slate">{project.segments.length} segments</Badge>
        <Badge tone="slate">{speakers} speakers</Badge>
        <Badge tone="cyan">{Math.round(avgConfidence * 100)}% avg. confidence</Badge>
        <span className="ml-auto hidden items-center gap-1.5 text-[10.5px] text-emerald-300/90 sm:flex">
          <Cloud size={12} /> Autosaved in this browser
        </span>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_336px]">
        <div className="min-w-0 space-y-4">
          <div className="card p-3 sm:p-3.5">
            <MediaPreview
              project={project}
              media={media}
              captionMode={tab === "dubbing" ? "dubbing" : "subtitle"}
              seekRequest={seekRequest}
            />
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-panel-2 text-cyan-300">
                  <FileVideo size={13} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-200">{project.fileName}</p>
                  <p className="text-[9.5px] text-faint">
                    {project.fileSize} · {project.fileType || "media"}
                  </p>
                </div>
              </div>
              <div className="mono ml-auto flex items-center gap-3 text-[9.5px] text-faint">
                <span>{project.segments.length} SEG</span>
                <span>{formatTime(project.durationMs)}</span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    audit.issues === 0 ? "text-emerald-300/80" : "text-amber-300/90"
                  )}
                >
                  <ShieldCheck size={10} /> {audit.issues === 0 ? "QA VERIFIED" : "QA REVIEW"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-[11px] font-bold tracking-[0.14em] text-faint uppercase">Episode brief</h2>
              <Badge tone={project.isDemo ? "violet" : "green"}>{project.isDemo ? "Demo" : "Localized"}</Badge>
            </div>
            <p className="bn text-[12.5px] leading-[1.85] text-slate-300">{copyShort}</p>
            <dl className="mt-3.5 space-y-2 border-t border-line-soft pt-3 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Detected</dt>
                <dd className="font-medium text-slate-300">{project.detected_languages.join(" · ")}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Content type</dt>
                <dd className="font-medium capitalize text-slate-300">{project.contentType}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Characters</dt>
                <dd className="font-medium text-slate-300">{speakers} speaking roles</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Glossary</dt>
                <dd className="font-medium text-slate-300">{project.glossary.length} locked terms</dd>
              </div>
            </dl>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3">
              <ShieldCheck size={14} className="text-emerald-400" />
              <h2 className="flex-1 text-[11px] font-bold tracking-[0.14em] text-faint uppercase">Quality audit</h2>
              <Badge tone={audit.issues ? "amber" : "green"} dot>
                {audit.issues ? `${audit.issues} flagged` : "Clean"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 px-4 py-4">
              <div
                className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${audit.score >= 90 ? "#34d399" : "#fbbf24"} ${audit.score * 3.6}deg, #1f2b41 0deg)`,
                }}
              >
                <div className="absolute inset-[5px] flex flex-col items-center justify-center rounded-full bg-panel">
                  <span className="text-[23px] leading-none font-extrabold text-white">{audit.score}</span>
                  <span className="mt-0.5 text-[8.5px] font-bold tracking-wider text-faint">/ 100</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-100">
                  {audit.issues ? "Ready with review notes" : "Performance-ready draft"}
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{audit.summary}</p>
                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-faint">
                  <Wand2 size={10} /> Avg. {audit.readingAvg.toFixed(1)} chars/s
                </p>
              </div>
            </div>

            {audit.flagged.length > 0 && (
              <div className="border-t border-line-soft px-4 py-3">
                <p className="mb-2 text-[10px] font-bold tracking-wide text-faint uppercase">Needs your ears</p>
                <ul className="space-y-1.5">
                  {audit.flagged.slice(0, 2).map((flag) => {
                    const segment = project.segments.find((item) => item.id === flag.segmentId);
                    return (
                      <li key={flag.segmentId}>
                        <button
                          type="button"
                          onClick={() => jumpToFlag(flag.segmentId)}
                          className="flex w-full items-start gap-2 rounded-md border border-amber-400/15 bg-amber-500/[0.05] px-2 py-1.5 text-left transition hover:border-amber-400/35 hover:bg-amber-500/10"
                        >
                          <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-300" />
                          <span className="min-w-0">
                            <span className="mono text-[9.5px] text-amber-200">
                              SEG {String(flag.segmentId).padStart(2, "0")}
                            </span>
                            <span className="ml-1.5 text-[10px] text-slate-300">{segment?.speaker}</span>
                            <span className="block text-[9.5px] leading-relaxed text-faint">{flag.reasons[0]}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2">
                  <ProgressBar value={readiness} tone="green" />
                  <p className="mt-1.5 text-[9.5px] text-faint">{readiness}% of lines pass automatic checks</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t border-line-soft bg-panel-2/30 px-3 py-2.5">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={12} />}
                className="flex-1"
                onClick={() => notify(audit.summary, audit.issues ? "info" : "success")}
              >
                Re-run audit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<FileText size={12} />}
                className="flex-1"
                onClick={onOpenGlossary}
              >
                Glossary
              </Button>
            </div>
          </section>

          <div className="rounded-xl border border-violet-400/15 bg-gradient-to-br from-violet/[0.09] to-pink/[0.04] px-4 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-violet-200 uppercase">
              <Sparkles size={11} /> Director&apos;s note
            </p>
            <p className="bn mt-1.5 text-[11.5px] leading-relaxed text-slate-300">
              আকানের সংলাপে অভিমান আর রেনের সংলাপে সংযম রাখা হয়েছে। ডাবিং ট্যাবে গিয়ে টেকগুলো শুনে নিন।
            </p>
          </div>
        </aside>
      </div>

      <section className="card mt-5 scroll-mt-20" id="result-scripts">
        <div className="flex flex-col gap-3 border-b border-line-soft px-4 pt-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={14} className="text-violet-soft" />
              <h2 className="text-[12.5px] font-bold text-slate-100">Localization workspace</h2>
              <Badge tone="violet" className="hidden sm:inline-flex">
                Editable
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon={<Copy size={12} />} onClick={copyActiveScript}>
                {tab === "export" ? "Copy JSON" : "Copy script"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Share2 size={12} />}
                onClick={() =>
                  void handleShare(
                    tab === "export" ? "json" : tab === "dubbing" ? "dubbing" : tab === "source" ? "source" : "srt"
                  )
                }
                className="hidden sm:inline-flex"
              >
                Share
              </Button>
            </div>
          </div>

          <div className="scrollbar-none -mb-px flex gap-1 overflow-x-auto">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[11.5px] font-semibold transition",
                    active
                      ? "border-violet-400 text-white"
                      : "border-transparent text-muted hover:border-line hover:text-slate-200"
                  )}
                >
                  <Icon size={13} className={active ? "text-violet-soft" : "text-faint"} />
                  {item.label}
                  {item.id !== "export" && (
                    <span className="mono ml-0.5 rounded bg-panel-3 px-1 py-px text-[9px] text-faint">
                      {project.segments.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {tab !== "export" ? (
          <>
            <div className="flex flex-col gap-2.5 border-b border-line-soft px-4 py-3 sm:flex-row sm:items-center sm:px-5">
              <label className="relative flex-1">
                <Search size={13} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search dialogue, speaker or translation…"
                  aria-label="Search dialogue"
                  className="input h-9 py-0 pr-8 pl-8 text-[12px]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    aria-label="Clear dialogue search"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-faint hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </label>
              <div className="flex items-center gap-2 text-[10px] text-faint">
                <CheckCircle2 size={12} className="text-emerald-400/80" />
                Local edits save automatically
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <SegmentList
                project={project}
                tab={tab}
                query={query}
                onUpdate={onUpdate}
                onSeek={(ms, segmentId) => {
                  requestSeek(ms);
                  notify(`Jumped to segment ${String(segmentId).padStart(2, "0")} in the preview.`, "info");
                }}
                notify={notify}
              />
            </div>
          </>
        ) : (
          <ExportPanel
            project={project}
            audit={audit}
            onExport={handleExport}
            onShare={handleShare}
            onOpenGlossary={onOpenGlossary}
            notify={notify}
          />
        )}
      </section>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10.5px] text-faint">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-emerald-400/80" />
          AI draft reviewed by your studio. Always spot-check cultural nuance before publishing.
        </span>
        <span className="mono flex items-center gap-2">
          <Users size={11} /> {project.segments.length} lines · {Math.round(readiness)}% QA
        </span>
      </footer>
    </div>
  );
}

function ExportPanel({
  project,
  audit,
  onExport,
  onShare,
  onOpenGlossary,
  notify,
}: {
  project: ProjectResult;
  audit: ReturnType<typeof auditProject>;
  onExport: (kind: ExportKind) => void;
  onShare: (kind: ExportKind) => Promise<void>;
  onOpenGlossary: () => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const subChars = project.segments.reduce((sum, segment) => sum + segment.bengali_subtitle.length, 0);
  const dubChars = project.segments.reduce((sum, segment) => sum + segment.bengali_dubbing.length, 0);
  const copyGlossary = async () => {
    const text = project.glossary.map((term) => `${term.source} = ${term.bangla}`).join("\n");
    const ok = await copyToClipboard(text);
    notify(ok ? "Glossary copied as plain text." : "Clipboard access was blocked.", ok ? "success" : "error");
  };

  return (
    <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_290px]">
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-[13px] font-bold text-slate-100">Download localization assets</h3>
            <p className="mt-0.5 text-[11px] text-muted">Standard formats, ready for editors, players and voice actors.</p>
          </div>
          <Badge tone="green" dot>
            {audit.issues ? "Review notes included" : "QA verified"}
          </Badge>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {EXPORTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col rounded-xl border p-3.5 transition hover:border-violet-400/40 hover:bg-panel-2",
                  item.featured ? "border-violet-400/25 bg-violet/5" : "border-line bg-panel-2/40"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-violet-soft">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-[11.5px] font-bold text-slate-100">{item.title}</h4>
                      <span className="mono rounded border border-line px-1 py-px text-[8.5px] font-semibold text-faint">
                        {item.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{item.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <Button
                    variant={item.featured ? "primary" : "secondary"}
                    size="sm"
                    icon={<Download size={11} />}
                    className="flex-1"
                    onClick={() => onExport(item.id)}
                  >
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void onShare(item.id)}
                    aria-label={`Share ${item.title}`}
                    className="px-2"
                  >
                    <Share2 size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line-soft bg-panel-2/40 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[10.5px] text-muted">
            <FileJson size={12} className="text-cyan-300" /> Need a ZIP bundle?
          </span>
          <button
            type="button"
            onClick={() => void onShare("json")}
            className="ml-auto flex items-center gap-1 text-[10.5px] font-semibold text-violet-soft transition hover:text-white"
          >
            Share full project <ArrowUpRight size={11} />
          </button>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-line bg-panel-2/50 p-3.5">
          <h4 className="mb-2.5 text-[10px] font-bold tracking-[0.14em] text-faint uppercase">Asset summary</h4>
          <dl className="space-y-2 text-[11px]">
            {[
              ["Runtime", formatTime(project.durationMs)],
              ["Segments", String(project.segments.length)],
              ["Subtitle characters", String(subChars)],
              ["Dubbing characters", String(dubChars)],
              ["Glossary terms", String(project.glossary.length)],
              ["QA score", `${audit.score} / 100`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-faint">{label}</dt>
                <dd className="mono font-medium text-slate-300">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-line bg-panel-2/50 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-[0.14em] text-faint uppercase">Locked glossary</h4>
            <button
              type="button"
              onClick={() => void copyGlossary()}
              className="rounded p-1 text-faint transition hover:text-white"
              aria-label="Copy glossary"
            >
              <Copy size={11} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {project.glossary.slice(0, 6).map((term) => (
              <span key={term.source} className="rounded-md border border-line bg-canvas px-1.5 py-1 text-[9.5px] text-muted">
                <span className="text-slate-300">{term.source}</span>
                <span className="mx-1 text-faint">→</span>
                <span className="bn text-violet-200">{term.bangla}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenGlossary}
            className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-violet-soft transition hover:text-white"
          >
            Manage glossary <ArrowUpRight size={10} />
          </button>
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-amber-200 uppercase">
            <AlertTriangle size={11} /> Before publishing
          </p>
          <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-slate-300">
            <li className="flex gap-1.5">
              <Check size={10} className="mt-0.5 shrink-0 text-emerald-400" /> Spot-check flagged segments.
            </li>
            <li className="flex gap-1.5">
              <Check size={10} className="mt-0.5 shrink-0 text-emerald-400" /> Keep honorifics consistent across episodes.
            </li>
            <li className="flex gap-1.5">
              <Check size={10} className="mt-0.5 shrink-0 text-emerald-400" /> Read dubbing lines aloud once.
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => notify("All assets are generated locally from this project. Nothing is queued server-side.", "info")}
          className="flex w-full items-center gap-1.5 rounded-lg border border-line bg-panel-2/30 px-3 py-2 text-left text-[10px] text-faint transition hover:text-muted"
        >
          <Clock3 size={11} /> Exported files are generated instantly in your browser.
        </button>
      </aside>
    </div>
  );
}
