import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Flower2,
  FolderOpen,
  Languages,
  Lock,
  Play,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  Workflow,
} from "lucide-react";
import type { ApiStatus, MediaInfo, ProjectResult, StudioSettings } from "../types";
import { ANIME_GENRES, BENGALI_STYLES, CONTENT_TYPES, POSTER, SOURCE_LANGUAGES } from "../data/demo";
import { Badge, Button, Field, SectionTitle, Toggle } from "../components/ui";
import { ApiKeyCard } from "../components/ApiKeyCard";
import { MediaCard } from "../components/MediaCard";
import { formatDate, formatTime } from "../lib/format";

const PIPELINE = [
  {
    icon: AudioLines,
    title: "Listen & align",
    copy: "Speaker detection, scene beats and word-level timing.",
  },
  {
    icon: Languages,
    title: "Localize to Bengali",
    copy: "Natural bn-BD subtitles plus a performance dubbing script.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & review",
    copy: "Reading speed, timing and character continuity checks.",
  },
  {
    icon: FileText,
    title: "Export anywhere",
    copy: "SRT, VTT, TXT and a full JSON project for your editor.",
  },
];

export function SetupView({
  file,
  media,
  onFile,
  onClearFile,
  onDemo,
  onRunDemo,
  onStart,
  onOpenHelp,
  onOpenSettings,
  keyDraft,
  onKeyDraftChange,
  apiStatus,
  apiMessage,
  onVerify,
  settings,
  onSettingsChange,
  recentProjects,
  onOpenProject,
  onOpenProjects,
  notify,
}: {
  file: File | null;
  media: MediaInfo;
  onFile: (file: File) => void;
  onClearFile: () => void;
  onDemo: () => void;
  onRunDemo: () => void;
  onStart: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  keyDraft: string;
  onKeyDraftChange: (value: string) => void;
  apiStatus: ApiStatus;
  apiMessage: string;
  onVerify: () => void;
  settings: StudioSettings;
  onSettingsChange: (patch: Partial<StudioSettings>) => void;
  recentProjects: ProjectResult[];
  onOpenProject: (project: ProjectResult) => void;
  onOpenProjects: () => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const featured = recentProjects[0];
  const savedRecents = recentProjects.filter((project) => !project.isDemo).slice(0, 2);

  return (
    <div className="animate-fade-up mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionTitle
        eyebrow="Workspace · New project"
        title={
          <>
            From raw episode to <span className="gradient-text">Bengali-ready.</span>
          </>
        }
        description="Upload a scene, tune the voice of the localization, and leave with subtitles plus a dubbing script your cast can actually perform."
        action={
          <>
            <Button variant="primary" size="sm" icon={<Play size={13} />} onClick={onDemo}>
              Open demo studio
            </Button>
            <Button variant="secondary" size="sm" icon={<FolderOpen size={13} />} onClick={onOpenProjects}>
              Projects
            </Button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="violet" dot>
          Gemini 2.5 Flash
        </Badge>
        <Badge tone="slate">Bangla · bn-BD</Badge>
        <Badge tone="slate">SRT · VTT · JSON</Badge>
        <button
          type="button"
          onClick={onOpenHelp}
          className="ml-auto hidden items-center gap-1 text-[11.5px] font-semibold text-muted transition hover:text-white sm:flex"
        >
          How Roy AI works <ArrowRight size={12} />
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-5">
          <ApiKeyCard
            keyDraft={keyDraft}
            onKeyChange={onKeyDraftChange}
            status={apiStatus}
            statusMessage={apiMessage}
            onVerify={onVerify}
          />

          <MediaCard
            file={file}
            media={media}
            onFile={onFile}
            onClear={onClearFile}
            onDemo={onRunDemo}
            notify={notify}
          />

          <section className="card overflow-hidden" aria-labelledby="settings-title">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan/10 text-cyan-200">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h2 id="settings-title" className="text-[13.5px] font-bold text-slate-100">
                    Localization & dubbing settings
                  </h2>
                  <p className="text-[11px] text-faint">Direct the tone before a single line is written</p>
                </div>
              </div>
              <Badge tone="cyan">Target · Bengali (bn-BD)</Badge>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source language" htmlFor="source-language">
                  <select
                    id="source-language"
                    className="select"
                    value={settings.sourceLang}
                    onChange={(event) => onSettingsChange({ sourceLang: event.target.value })}
                  >
                    {SOURCE_LANGUAGES.map((language) => (
                      <option key={language} value={language}>
                        {language}
                        {language === "Japanese" ? " (日本語)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Content type" htmlFor="content-type">
                  <select
                    id="content-type"
                    className="select"
                    value={settings.contentType}
                    onChange={(event) => onSettingsChange({ contentType: event.target.value as StudioSettings["contentType"] })}
                  >
                    {CONTENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {settings.contentType === "anime" && (
                <div className="rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet/[0.08] to-pink/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Flower2 size={14} className="text-pink-300" />
                    <h3 className="text-[12px] font-bold tracking-wide text-violet-100">Anime localization tuning</h3>
                    <Badge tone="pink" className="ml-auto">
                      Story-first
                    </Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Genre" htmlFor="anime-genre">
                      <select
                        id="anime-genre"
                        className="select bg-[#0a1020]"
                        value={settings.animeGenre}
                        onChange={(event) => onSettingsChange({ animeGenre: event.target.value })}
                      >
                        {ANIME_GENRES.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Bengali register" htmlFor="bengali-style">
                      <select
                        id="bengali-style"
                        className="select bg-[#0a1020]"
                        value={settings.bengaliStyle}
                        onChange={(event) =>
                          onSettingsChange({ bengaliStyle: event.target.value as StudioSettings["bengaliStyle"] })
                        }
                      >
                        {BENGALI_STYLES.map((style) => (
                          <option key={style.value} value={style.value}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-3 divide-y divide-line-soft/70">
                    <Toggle
                      checked={settings.honorifics}
                      onChange={(value) => onSettingsChange({ honorifics: value })}
                      title="Keep Japanese honorifics"
                      description="-san, -kun, -senpai and -sensei stay untouched."
                    />
                    <Toggle
                      checked={settings.consistency}
                      onChange={(value) => onSettingsChange({ consistency: value })}
                      title="Strict character consistency"
                      description="Lock one voice, register and name spelling per character."
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-faint">
                    <Sparkles size={11} className="text-pink-300/80" />
                    {BENGALI_STYLES.find((style) => style.value === settings.bengaliStyle)?.blurb}
                  </div>
                </div>
              )}

              <Field
                label="Custom glossary & character names"
                htmlFor="custom-glossary"
                optional
                hint="One mapping per line or comma-separated. These go to Gemini exactly as written."
              >
                <textarea
                  id="custom-glossary"
                  className="textarea min-h-[76px] text-[12.5px]"
                  placeholder={"Ren=রেন, Akane=আকানে\nBlood Moon=রক্তচাঁদ"}
                  value={settings.glossary}
                  onChange={(event) => onSettingsChange({ glossary: event.target.value })}
                />
              </Field>
            </div>

            <div className="border-t border-line-soft bg-panel-2/40 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2 text-[10.5px] leading-relaxed text-faint">
                  <Lock size={12} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  <p className="max-w-sm">
                    {file ? (
                      <>
                        <span className="font-semibold text-slate-300">{file.name}</span> will be uploaded to Gemini
                        for analysis. Your key never leaves this tab.
                      </>
                    ) : (
                      <>
                        Add media to begin — or run the demo to explore the full studio without a key.{" "}
                        <button
                          type="button"
                          onClick={onDemo}
                          className="font-semibold text-violet-soft underline underline-offset-2 hover:text-white"
                        >
                          Try the demo
                        </button>
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onStart}
                  icon={<Wand2 size={15} />}
                  trailing={<ArrowRight size={15} />}
                  className="shrink-0 sm:min-w-[196px]"
                >
                  Start localization
                </Button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          {featured && (
            <section className="card group overflow-hidden">
              <button
                type="button"
                onClick={() => onOpenProject(featured)}
                className="relative block w-full overflow-hidden text-left focus-visible:outline-none"
                aria-label={`Open demo project ${featured.title_en}`}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-panel-3">
                  <img
                    src={POSTER}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080d18] via-[#080d18]/20 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                    <Badge tone="violet" dot>
                      Featured demo
                    </Badge>
                    <span className="mono rounded-md border border-white/15 bg-black/45 px-1.5 py-0.5 text-[9px] text-slate-200 backdrop-blur">
                      {formatTime(featured.durationMs)}
                    </span>
                  </div>
                  <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <Play size={17} className="ml-0.5 fill-current" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <h2 className="bn truncate text-[14px] font-bold text-white">{featured.title_bn}</h2>
                    <p className="mt-0.5 truncate text-[10px] text-slate-300/80">{featured.title_en}</p>
                  </div>
                </div>
              </button>
              <div className="p-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="pink">{featured.segments.length} timed lines</Badge>
                  <Badge tone="cyan">Dubbing script</Badge>
                  <Badge tone="slate">No key needed</Badge>
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
                  A complete Bengali localization with glossary, QA notes and every export format. Edit freely — it autosaves.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Play size={11} />}
                    className="flex-1"
                    onClick={() => onOpenProject(featured)}
                  >
                    Open demo studio
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onOpenProjects}
                    aria-label="View all projects"
                    className="px-2"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </section>
          )}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3.5">
              <Workflow size={14} className="text-violet-soft" />
              <h2 className="flex-1 text-[12px] font-bold tracking-wide text-slate-100">What happens next</h2>
              <Badge tone="violet">4 stages</Badge>
            </div>
            <ol className="relative space-y-4 px-4 py-4">
              <div className="absolute top-8 bottom-9 left-[30px] w-px bg-gradient-to-b from-violet-500/40 via-line to-transparent" />
              {PIPELINE.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="relative flex gap-3">
                    <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 text-muted">
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[11.5px] font-semibold text-slate-200">
                        <span className="mono mr-1 text-[10px] text-faint">0{index + 1}</span>
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">{step.copy}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center justify-between border-t border-line-soft bg-panel-2/40 px-4 py-2.5 text-[10.5px] text-faint">
              <span className="flex items-center gap-1.5">
                <Clock size={11} /> ~2–4 min / episode
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300/90">
                <ShieldCheck size={11} /> QA included
              </span>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <h2 className="flex-1 text-[12px] font-bold tracking-wide text-slate-100">Quality guardrails</h2>
              <button
                type="button"
                onClick={onOpenSettings}
                className="rounded p-1 text-faint transition hover:text-white"
                aria-label="Open studio settings"
              >
                <Settings2 size={13} />
              </button>
            </div>
            <ul className="space-y-2.5">
              {[
                {
                  label: "Honorifics",
                  value: settings.honorifics ? "Retained" : "Localized",
                },
                {
                  label: "Character voice",
                  value: settings.consistency ? "Locked" : "Standard",
                },
                { label: "Bengali register", value: settings.bengaliStyle },
                { label: "Auto QA audit", value: settings.autoQA ? "After every run" : "Manual" },
              ].map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="text-muted">{item.label}</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Check size={11} className="text-emerald-400" />
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {savedRecents.length > 0 && (
            <section className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3.5">
                <h2 className="flex-1 text-[12px] font-bold tracking-wide text-slate-100">Recent projects</h2>
                <button
                  type="button"
                  onClick={onOpenProjects}
                  className="text-[10.5px] font-semibold text-violet-soft transition hover:text-white"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-line-soft/70">
                {savedRecents.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onOpenProject(project)}
                    className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.025]"
                  >
                    <img
                      src={POSTER}
                      alt=""
                      className="h-11 w-16 shrink-0 rounded-md border border-line object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="bn truncate text-[12px] font-semibold text-slate-200 group-hover:text-white">
                        {project.title_bn}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-faint">
                        {project.segments.length} segments · {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <ChevronRight size={13} className="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-violet-soft" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="rounded-xl border border-line-soft bg-panel-2/40 px-4 py-3 text-[10.5px] leading-relaxed text-faint">
            <span className="font-semibold text-slate-300">Built for creator blogs.</span> Everything runs in your
            browser — no server, no database, no stored API key.
          </div>
        </aside>
      </div>
    </div>
  );
}
