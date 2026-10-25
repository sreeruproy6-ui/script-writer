import { useCallback, useEffect, useRef, useState } from "react";
import { FlaskConical, KeyRound, Play, ShieldCheck, Sparkles } from "lucide-react";
import type {
  ApiStatus,
  GlossaryTerm,
  MediaInfo,
  ProcessingState,
  ProjectResult,
  ResultTab,
  StudioSettings,
  ToastData,
  View,
} from "./types";
import {
  DEFAULT_GLOSSARY,
  DEFAULT_SETTINGS,
  DEMO_RESULT,
  PIPELINE_STAGES,
  SAMPLE_MEDIA,
} from "./data/demo";
import { formatBytes } from "./lib/format";
import { runGeminiPipeline, verifyGeminiKey } from "./lib/gemini";
import { Button, Field, Modal, Toasts } from "./components/ui";
import { Sidebar, type SidebarNav } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { SetupView } from "./views/SetupView";
import { ProcessingView } from "./views/ProcessingView";
import { ResultsView } from "./views/ResultsView";
import { ProjectsView } from "./views/ProjectsView";
import { GlossaryView } from "./views/GlossaryView";
import { HelpView } from "./views/HelpView";
import { SettingsView } from "./views/SettingsView";

const STORAGE_KEY = "roy-ai:studio:v1";

interface StoredData {
  settings: StudioSettings;
  glossary: GlossaryTerm[];
  savedProjects: ProjectResult[];
  demoProject: ProjectResult;
}

function loadStore(): StoredData {
  const fallback: StoredData = {
    settings: DEFAULT_SETTINGS,
    glossary: DEFAULT_GLOSSARY,
    savedProjects: [],
    demoProject: DEMO_RESULT,
  };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredData>;
    const savedProjects = Array.isArray(parsed.savedProjects)
      ? parsed.savedProjects.filter((project) => project?.id && Array.isArray(project.segments))
      : [];
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      glossary: Array.isArray(parsed.glossary)
        ? parsed.glossary.filter(
            (term) => term && typeof term.source === "string" && typeof term.bangla === "string"
          )
        : DEFAULT_GLOSSARY,
      savedProjects,
      demoProject:
        parsed.demoProject && Array.isArray(parsed.demoProject.segments)
          ? { ...DEMO_RESULT, ...parsed.demoProject }
          : DEMO_RESULT,
    };
  } catch {
    return fallback;
  }
}

function mergeGlossary(globalTerms: GlossaryTerm[], draft = ""): GlossaryTerm[] {
  const map = new Map<string, GlossaryTerm>();
  globalTerms.forEach((term) => {
    if (term.source?.trim() && term.bangla?.trim()) {
      map.set(term.source.trim().toLowerCase(), {
        source: term.source.trim(),
        bangla: term.bangla.trim(),
        note: term.note,
      });
    }
  });
  draft
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [source, ...rest] = line.split("=");
      const bangla = rest.join("=").trim();
      if (source?.trim() && bangla) {
        map.set(source.trim().toLowerCase(), { source: source.trim(), bangla });
      }
    });
  return Array.from(map.values());
}

export default function App() {
  const [initial] = useState<StoredData>(loadStore);
  const [view, setView] = useState<View>("setup");
  const [activeTab, setActiveTab] = useState<ResultTab>("subtitle");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState<StudioSettings>(initial.settings);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(initial.glossary);
  const [savedProjects, setSavedProjects] = useState<ProjectResult[]>(initial.savedProjects);
  const [demoProject, setDemoProject] = useState<ProjectResult>(initial.demoProject);
  const [activeProject, setActiveProject] = useState<ProjectResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaInfo>({});
  const [previewMedia, setPreviewMedia] = useState<MediaInfo>({});
  const [mediaMap, setMediaMap] = useState<Record<string, MediaInfo>>({});
  const [keyDraft, setKeyDraft] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("empty");
  const [apiMessage, setApiMessage] = useState("");
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [query, setQuery] = useState("");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const toastCounter = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const processingRef = useRef<ProcessingState | null>(null);
  const demoRef = useRef<ProjectResult>(demoProject);
  const urlRegistry = useRef<string[]>([]);

  const projects = [demoProject, ...savedProjects];

  useEffect(() => {
    processingRef.current = processing;
  }, [processing]);

  useEffect(() => {
    demoRef.current = demoProject;
  }, [demoProject]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, glossary, savedProjects, demoProject })
      );
    } catch {
      // Storage can be full or blocked; the studio still works in memory.
    }
  }, [settings, glossary, savedProjects, demoProject]);

  useEffect(() => {
    const urls = urlRegistry.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        const input = Array.from(
          document.querySelectorAll<HTMLInputElement>('input[aria-label="Search"]')
        ).find((element) => element.offsetParent !== null);
        if (input) {
          event.preventDefault();
          input.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const notify = useCallback((message: string, tone: "success" | "error" | "info" = "info") => {
    toastCounter.current += 1;
    const id = toastCounter.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4600);
  }, []);

  /* ------------------------------------------------------------- navigation */

  const resetToSetup = useCallback(() => {
    setView("setup");
    setActiveTab("subtitle");
    setActiveProject(null);
    setQuery("");
    setMobileOpen(false);
  }, []);

  const newProject = () => {
    abortRef.current?.abort();
    setProcessing(null);
    setSelectedFile(null);
    setSelectedMedia({});
    setPreviewMedia({});
    resetToSetup();
  };

  const openProject = (project: ProjectResult) => {
    setActiveProject(project);
    setPreviewMedia(project.isDemo ? {} : mediaMap[project.id] ?? {});
    setActiveTab("subtitle");
    setQuery("");
    setView("results");
    setMobileOpen(false);
  };

  const openDemo = () => openProject(demoProject.isDemo ? demoProject : { ...demoProject, isDemo: true });

  const navigate = (next: View, nav: SidebarNav) => {
    if (view === "processing" && processing && !processing.error && nav !== "new") {
      notify("This run is still in progress. Cancel it from the processing screen first.", "info");
      return;
    }
    setMobileOpen(false);
    setQuery("");
    if (nav === "new") {
      newProject();
      return;
    }
    if (nav === "dubbing") {
      if (activeProject) {
        setActiveTab("dubbing");
        setView("results");
      } else {
        setActiveProject(demoProject);
        setPreviewMedia({});
        setActiveTab("dubbing");
        setView("results");
      }
      return;
    }
    setView(next);
  };

  const activeNav: SidebarNav =
    view === "projects"
      ? "projects"
      : view === "results" && activeTab === "dubbing"
        ? "dubbing"
        : view === "results"
          ? "projects"
          : view === "glossary"
            ? "glossary"
            : view === "help"
              ? "help"
              : view === "settings"
                ? "settings"
                : "new";

  /* ------------------------------------------------------------- API key */

  const verifyKey = async () => {
    if (!keyDraft.trim()) {
      notify("Paste a Gemini API key first.", "error");
      return false;
    }
    setApiStatus("checking");
    setApiMessage("Contacting Google…");
    const result = await verifyGeminiKey(keyDraft);
    if (result.ok) {
      setApiKey(keyDraft.trim());
      setApiStatus("verified");
      setApiMessage(result.message);
      notify("Gemini key verified. You're ready to localize.", "success");
      return true;
    }
    setApiKey("");
    setApiStatus("error");
    setApiMessage(result.message);
    notify(result.message, "error");
    return false;
  };

  const handleKeyChange = (value: string) => {
    setKeyDraft(value);
    if (apiStatus !== "empty" || apiKey) {
      setApiKey("");
      setApiStatus("empty");
      setApiMessage("");
    }
  };

  /* ------------------------------------------------------------- media */

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    urlRegistry.current.push(url);
    setSelectedFile(file);
    setSelectedMedia({ url, mime: file.type, name: file.name, size: formatBytes(file.size) });
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setSelectedMedia({});
  };

  /* ------------------------------------------------------------- demo pipeline */

  const startDemo = (fileName?: string) => {
    setProcessing({
      mode: "demo",
      fileName: fileName ?? SAMPLE_MEDIA.name,
      fileSize: SAMPLE_MEDIA.size,
      progress: 3,
      stage: 0,
      message: PIPELINE_STAGES[0].active,
    });
    setView("processing");
  };

  useEffect(() => {
    if (view !== "processing") return;
    if (processingRef.current?.mode !== "demo" || processingRef.current.error) return;

    let progress = processingRef.current.progress;
    let stage = 0;
    let finishTimer: number | undefined;

    const interval = window.setInterval(() => {
      progress = Math.min(100, progress + 6.5);
      stage = Math.min(3, Math.floor(progress / 25));
      setProcessing((previous) =>
        previous && previous.mode === "demo"
          ? {
              ...previous,
              progress,
              stage,
              message: PIPELINE_STAGES[stage].active,
            }
          : previous
      );

      if (progress >= 100) {
        window.clearInterval(interval);
        finishTimer = window.setTimeout(() => {
          const base = demoRef.current;
          const finished: ProjectResult = {
            ...base,
            id: DEMO_RESULT.id,
            fileName: processingRef.current?.fileName ?? SAMPLE_MEDIA.name,
            fileSize: processingRef.current?.fileSize ?? SAMPLE_MEDIA.size,
            createdAt: Date.now(),
            isDemo: true,
          };
          setDemoProject(finished);
          setActiveProject(finished);
          setPreviewMedia({});
          setProcessing(null);
          setActiveTab("subtitle");
          setQuery("");
          setView("results");
          notify("Demo localization ready — 14 timed lines and a full dubbing script.", "success");
        }, 650);
      }
    }, 360);

    return () => {
      window.clearInterval(interval);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [view, processing?.mode, notify]);

  /* ------------------------------------------------------------- real pipeline */

  const startApiProcessing = async (file: File, key: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const glossaryTerms = mergeGlossary(glossary, settings.glossary);
    let mediaSnapshot: MediaInfo = selectedMedia;
    if (!selectedMedia.url) {
      const url = URL.createObjectURL(file);
      urlRegistry.current.push(url);
      mediaSnapshot = { url, mime: file.type, name: file.name, size: formatBytes(file.size) };
    }

    setProcessing({
      mode: "api",
      fileName: file.name,
      fileSize: formatBytes(file.size),
      progress: 2,
      stage: 0,
      message: PIPELINE_STAGES[0].active,
    });
    setView("processing");

    try {
      const result = await runGeminiPipeline({
        file,
        apiKey: key,
        settings,
        glossary: glossaryTerms,
        signal: controller.signal,
        onProgress: (stage, progress, message) => {
          setProcessing((previous) =>
            previous ? { ...previous, stage, progress, message } : previous
          );
        },
      });
      const completed = { ...result, glossary: result.glossary.length ? result.glossary : glossaryTerms };
      setSavedProjects((previous) => [completed, ...previous.filter((item) => item.id !== completed.id)]);
      setMediaMap((previous) => ({ ...previous, [completed.id]: mediaSnapshot }));
      setActiveProject(completed);
      setPreviewMedia(mediaSnapshot);
      setSelectedFile(null);
      setSelectedMedia({});
      setProcessing(null);
      setActiveTab("subtitle");
      setQuery("");
      setView("results");
      notify("Localization complete. Review the flagged lines, then export.", "success");
    } catch (error) {
      const err = error as Error;
      if (err?.name === "AbortError") {
        setProcessing(null);
        setView((current) => (current === "processing" ? "setup" : current));
      } else {
        const message = err?.message || "Gemini could not process this media. Try again.";
        setProcessing((previous) => (previous ? { ...previous, error: message } : previous));
        notify(message, "error");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleStart = () => {
    if (!selectedFile) {
      notify("Add an audio or video file first — or run the demo episode.", "error");
      document.getElementById("media-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!apiKey) {
      setKeyModalOpen(true);
      return;
    }
    void startApiProcessing(selectedFile, apiKey);
  };

  const verifyAndStart = async () => {
    const verified = await verifyKey();
    if (!verified) return;
    if (!selectedFile) {
      setKeyModalOpen(false);
      notify("Your key is ready. Add media to start localizing.", "success");
      return;
    }
    setKeyModalOpen(false);
    await startApiProcessing(selectedFile, keyDraft.trim());
  };

  const cancelProcessing = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    const failed = Boolean(processingRef.current?.error);
    setProcessing(null);
    setView("setup");
    notify(failed ? "Returned to the workspace." : "Processing canceled.", "info");
  };

  /* ------------------------------------------------------------- content actions */

  const updateSegment = (
    segmentId: number,
    field: "bengali_subtitle" | "bengali_dubbing" | "source_text",
    value: string
  ) => {
    if (!activeProject) return;
    const next: ProjectResult = {
      ...activeProject,
      segments: activeProject.segments.map((segment) =>
        segment.id === segmentId ? { ...segment, [field]: value } : segment
      ),
    };
    setActiveProject(next);
    if (next.isDemo) {
      setDemoProject(next);
    } else {
      setSavedProjects((previous) => previous.map((project) => (project.id === next.id ? next : project)));
    }
  };

  const addTerm = (term: GlossaryTerm) => {
    setGlossary((previous) => {
      if (previous.some((item) => item.source.toLowerCase() === term.source.toLowerCase())) {
        return previous.map((item) =>
          item.source.toLowerCase() === term.source.toLowerCase() ? term : item
        );
      }
      return [term, ...previous];
    });
  };

  const removeTerm = (source: string) => {
    setGlossary((previous) => previous.filter((term) => term.source !== source));
    notify(`“${source}” removed from the glossary.`, "info");
  };

  const clearData = () => {
    setSavedProjects([]);
    setGlossary(DEFAULT_GLOSSARY);
    setDemoProject(DEMO_RESULT);
    setActiveProject((previous) => (previous?.isDemo ? DEMO_RESULT : null));
    setMediaMap({});
    setPreviewMedia({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore blocked storage.
    }
    setView("projects");
    notify("Local projects and custom glossary terms cleared.", "success");
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setKeyDraft("");
    setApiKey("");
    setApiStatus("empty");
    setApiMessage("");
  };

  /* ------------------------------------------------------------- render */

  const searchEnabled = view === "results" || view === "projects";

  return (
    <div className="studio-bg min-h-screen">
      <Sidebar
        activeNav={activeNav}
        apiStatus={apiStatus}
        projectCount={projects.length}
        onNavigate={navigate}
        onNewProject={newProject}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:pl-[250px]">
        <TopBar
          view={view}
          activeProject={activeProject}
          apiStatus={apiStatus}
          search={query}
          onSearch={setQuery}
          searchEnabled={searchEnabled}
          onMenu={() => setMobileOpen(true)}
          onSettings={() => navigate("settings", "settings")}
          onNewProject={newProject}
        />

        <main className="min-h-[calc(100vh-140px)]">
          {view === "processing" && processing && (
            <ProcessingView processing={processing} onCancel={cancelProcessing} onDemo={openDemo} />
          )}

          {view === "results" && activeProject && (
            <ResultsView
              project={activeProject}
              media={previewMedia}
              tab={activeTab}
              onTabChange={setActiveTab}
              query={query}
              onQueryChange={setQuery}
              onUpdate={updateSegment}
              onNewProject={newProject}
              onOpenGlossary={() => navigate("glossary", "glossary")}
              notify={notify}
            />
          )}

          {view === "projects" && (
            <ProjectsView projects={projects} query={query} onOpen={openProject} onNew={newProject} />
          )}

          {view === "glossary" && (
            <GlossaryView
              glossary={glossary}
              settings={settings}
              onAddTerm={addTerm}
              onRemoveTerm={removeTerm}
              onSettingsChange={(patch) => setSettings((previous) => ({ ...previous, ...patch }))}
              notify={notify}
            />
          )}

          {view === "help" && (
            <HelpView
              onDemo={openDemo}
              onNew={newProject}
              onOpenSettings={() => navigate("settings", "settings")}
              notify={notify}
            />
          )}

          {view === "settings" && (
            <SettingsView
              keyDraft={keyDraft}
              onKeyDraftChange={handleKeyChange}
              apiStatus={apiStatus}
              apiMessage={apiMessage}
              onVerify={() => void verifyKey()}
              settings={settings}
              onSettingsChange={(patch) => setSettings((previous) => ({ ...previous, ...patch }))}
              glossary={glossary}
              onOpenGlossary={() => navigate("glossary", "glossary")}
              onClearData={clearData}
              onResetSettings={resetSettings}
              onOpenHelp={() => navigate("help", "help")}
              notify={notify}
            />
          )}

          {(view === "setup" || view === "results" || view === "processing") &&
            (view === "setup" ||
              (view === "results" && !activeProject) ||
              (view === "processing" && !processing)) && (
              <SetupView
                file={selectedFile}
                media={selectedMedia}
                onFile={handleFile}
                onClearFile={clearSelectedFile}
                onDemo={openDemo}
                onRunDemo={() => startDemo()}
                onStart={handleStart}
                onOpenHelp={() => navigate("help", "help")}
                onOpenSettings={() => navigate("settings", "settings")}
                keyDraft={keyDraft}
                onKeyDraftChange={handleKeyChange}
                apiStatus={apiStatus}
                apiMessage={apiMessage}
                onVerify={() => void verifyKey()}
                settings={settings}
                onSettingsChange={(patch) => setSettings((previous) => ({ ...previous, ...patch }))}
                recentProjects={projects}
                onOpenProject={openProject}
                onOpenProjects={() => navigate("projects", "projects")}
                notify={notify}
              />
            )}
        </main>

        <footer className="mx-auto flex max-w-[1280px] flex-col gap-2 border-t border-line-soft px-4 py-5 text-[10px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={11} className="text-emerald-400/70" />
            Roy AI Studio · Bengali localization for anime, film and creators. Demo episode is fictional.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("help", "help")}
              className="transition hover:text-slate-200"
            >
              Handbook
            </button>
            <span className="text-line">·</span>
            <button
              type="button"
              onClick={() => navigate("settings", "settings")}
              className="transition hover:text-slate-200"
            >
              Privacy
            </button>
            <span className="text-line">·</span>
            <span className="mono">API key never stored</span>
          </div>
        </footer>
      </div>

      <Toasts toasts={toasts} onDismiss={(id) => setToasts((previous) => previous.filter((toast) => toast.id !== id))} />

      <Modal
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        title="One key to start the engine"
        subtitle="Your media is ready. Add a Gemini API key to run transcription, localization and QA."
        icon={<KeyRound size={15} />}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              icon={<Play size={12} />}
              onClick={() => {
                setKeyModalOpen(false);
                startDemo();
              }}
            >
              Run the demo instead
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={apiStatus === "checking"}
              icon={<Sparkles size={13} />}
              onClick={() => void verifyAndStart()}
              disabled={!keyDraft.trim()}
            >
              Verify &amp; start
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-line bg-panel-2 px-3 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-canvas text-cyan-300">
            <FlaskConical size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] font-semibold text-slate-200">
              {selectedFile?.name ?? "No media selected"}
            </p>
            <p className="text-[10px] text-faint">
              {selectedFile ? formatBytes(selectedFile.size) : "Add a file from the workspace to process it"}
            </p>
          </div>
          <span className="chip border-emerald-400/20 bg-emerald-500/10 text-[9px] text-emerald-200">Local only</span>
        </div>

        <Field
          label="Gemini API key"
          htmlFor="modal-api-key"
          hint="Kept in this tab's memory only. Requests go directly from your browser to Google."
        >
          <input
            id="modal-api-key"
            type="password"
            value={keyDraft}
            onChange={(event) => handleKeyChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void verifyAndStart();
            }}
            placeholder="AIzaSy..."
            autoComplete="off"
            spellCheck={false}
            className="input mono"
          />
        </Field>

        {apiMessage && (
          <p
            className={`mt-2 rounded-md border px-2.5 py-2 text-[10.5px] leading-relaxed ${
              apiStatus === "error"
                ? "border-red-400/25 bg-red-500/[0.07] text-red-200"
                : "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200"
            }`}
          >
            {apiMessage}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-[10px] text-faint">
          <span>The demo never needs a key.</span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-violet-soft underline underline-offset-2 hover:text-white"
          >
            Get a key ↗
          </a>
        </div>
      </Modal>
    </div>
  );
}
