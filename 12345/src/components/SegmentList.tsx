import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clipboard,
  Clock3,
  Mic2,
  Play,
  SearchX,
  Square,
  Volume2,
} from "lucide-react";
import type { ResultTab, Segment } from "../types";
import {
  formatTime,
  initials,
  readingSpeed,
  segmentFlags,
  speakerColor,
} from "../lib/format";
import { copyToClipboard } from "../lib/exports";
import { cn } from "../utils/cn";
import { Badge, Button, EmptyState } from "./ui";

const fieldByTab = {
  subtitle: "bengali_subtitle",
  dubbing: "bengali_dubbing",
  source: "source_text",
} as const;

function confidenceTone(confidence: number) {
  if (confidence >= 0.9) return "text-emerald-300";
  if (confidence >= 0.72) return "text-amber-300";
  return "text-red-300";
}

export function SegmentList({
  project,
  tab,
  query,
  onUpdate,
  onSeek,
  notify,
}: {
  project: SegmentListProject;
  tab: Exclude<ResultTab, "export">;
  query: string;
  onUpdate: (segmentId: number, field: "bengali_subtitle" | "bengali_dubbing" | "source_text", value: string) => void;
  onSeek: (ms: number, segmentId: number) => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const [speaker, setSpeaker] = useState("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const copiedTimer = useRef<number | null>(null);

  const speakers = useMemo(
    () => Array.from(new Set(project.segments.map((segment) => segment.speaker))),
    [project.segments]
  );

  useEffect(() => {
    setSpeaker("all");
  }, [project.id]);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const visible = project.segments.filter((segment) => {
    const haystack =
      `${segment.source_text} ${segment.bengali_subtitle} ${segment.bengali_dubbing} ${segment.speaker} ${segment.tone}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesSpeaker = speaker === "all" || segment.speaker === speaker;
    return matchesQuery && matchesSpeaker;
  });

  const handleCopy = async (segment: Segment, text: string) => {
    const ok = await copyToClipboard(text);
    if (!ok) {
      notify("Clipboard permission was blocked. Select the text and copy manually.", "error");
      return;
    }
    setCopiedId(segment.id);
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopiedId(null), 1800);
    notify("Line copied to clipboard.", "success");
  };

  const handleSpeak = (segment: Segment, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      notify("Voice preview isn't supported in this browser.", "error");
      return;
    }
    const synth = window.speechSynthesis;
    if (speakingId === segment.id) {
      synth.cancel();
      setSpeakingId(null);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = tab === "source" ? (segment.source_language === "Japanese" ? "ja-JP" : "en-US") : "bn-BD";
    utterance.rate = tab === "dubbing" ? 0.94 : 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(segment.id);
    synth.speak(utterance);
    if (tab === "source") {
      notify("Reading the source line with your browser's voice.", "info");
    }
  };

  if (!visible.length) {
    return (
      <EmptyState
        icon={<SearchX size={20} />}
        title={project.segments.length ? "No lines match this filter" : "No dialogue yet"}
        description={
          project.segments.length
            ? "Try another speaker, clear the search, or switch tabs to see the full script."
            : "Run the localization pipeline to generate the first Bengali draft."
        }
        action={
          (query || speaker !== "all") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSpeaker("all");
                window.dispatchEvent(new CustomEvent("roy:clear-search"));
              }}
            >
              Clear filters
            </Button>
          )
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11.5px] text-muted">
          <span className="font-semibold text-slate-200">{visible.length}</span> of{" "}
          {project.segments.length} lines
          {query.trim() ? (
            <>
              {" "}
              matching <span className="font-semibold text-violet-200">“{query.trim()}”</span>
            </>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="speaker-filter">
            Filter by speaker
          </label>
          <select
            id="speaker-filter"
            value={speaker}
            onChange={(event) => setSpeaker(event.target.value)}
            className="select h-8 w-auto py-0 pr-8 text-[11.5px]"
          >
            <option value="all">All speakers ({speakers.length})</option>
            {speakers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2.5">
        {visible.map((segment) => {
          const flags = segmentFlags(segment);
          const primaryText = segment[fieldByTab[tab]];
          const textareaId = `segment-${tab}-${segment.id}`;
          const speed = readingSpeed(
            tab === "source" ? segment.bengali_subtitle : primaryText,
            segment
          );
          const isCopied = copiedId === segment.id;
          const isSpeaking = speakingId === segment.id;

          return (
            <article
              key={segment.id}
              className="group card border-line-soft bg-panel/80 p-3 transition hover:border-line sm:p-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 text-[11px] font-semibold text-faint">
                  {String(segment.id).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => onSeek(segment.start_ms, segment.id)}
                  className="mono inline-flex items-center gap-1 rounded-md border border-violet-400/20 bg-violet/10 px-1.5 py-1 text-[10.5px] font-medium text-violet-200 transition hover:border-violet-300/50 hover:bg-violet/20 hover:text-white"
                  title="Jump to this line in the preview"
                >
                  <Play size={9} className="fill-current" />
                  {formatTime(segment.start_ms)} – {formatTime(segment.end_ms)}
                </button>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border bg-gradient-to-br text-[9px] font-bold",
                      speakerColor(segment.speaker)
                    )}
                  >
                    {initials(segment.speaker)}
                  </span>
                  <span className="bn text-[11.5px] font-semibold text-slate-300">{segment.speaker}</span>
                </div>
                <span className="hidden items-center gap-1 rounded border border-line bg-panel-2 px-1.5 py-0.5 text-[10px] font-medium text-faint sm:inline-flex">
                  <Mic2 size={9} />
                  {segment.tone || "Neutral"}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  {flags.length > 0 && (
                    <span
                      title={flags.map((flag) => flag.reason).join(" · ")}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold",
                        flags.some((flag) => flag.tone === "danger")
                          ? "border-red-400/25 bg-red-500/10 text-red-200"
                          : "border-amber-400/25 bg-amber-500/10 text-amber-200"
                      )}
                    >
                      <AlertTriangle size={9} />
                      Review
                    </span>
                  )}
                  <span className={cn("mono text-[10px] font-semibold", confidenceTone(segment.confidence))}>
                    {Math.round(segment.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="mt-2.5">
                <label htmlFor={textareaId} className="sr-only">
                  {tab === "subtitle" ? "Bengali subtitle" : tab === "dubbing" ? "Bengali dubbing line" : "Source transcript"} for{" "}
                  {segment.speaker}
                </label>
                <textarea
                  id={textareaId}
                  value={primaryText}
                  onChange={(event) =>
                    onUpdate(segment.id, fieldByTab[tab], event.target.value)
                  }
                  rows={Math.min(5, Math.max(2, Math.ceil(primaryText.length / 54)))}
                  className={cn(
                    "textarea min-h-[48px] resize-none border-transparent bg-canvas/70 py-2 text-[13px] leading-relaxed focus:border-violet-400/60 focus:bg-canvas sm:text-[13.5px]",
                    (tab === "subtitle" || tab === "dubbing") && "bn"
                  )}
                  spellCheck={false}
                />
                {(tab === "subtitle" || tab === "dubbing") && segment.source_text && (
                  <p className="mt-1.5 line-clamp-1 text-[10.5px] text-faint">
                    <span className="mr-1 font-semibold tracking-wide text-faint/80 uppercase">SRC</span>
                    {segment.source_text}
                  </p>
                )}
                {tab === "dubbing" && (
                  <p className="bn mt-1 line-clamp-1 text-[10.5px] text-faint">
                    <span className="mr-1 font-sans font-semibold tracking-wide uppercase">SUB</span>
                    {segment.bengali_subtitle}
                  </p>
                )}
                {tab === "source" && (
                  <p className="bn mt-1 line-clamp-1 text-[10.5px] text-faint">
                    <span className="mr-1 font-sans font-semibold tracking-wide uppercase">BN</span>
                    {segment.bengali_subtitle}
                  </p>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span
                  className={cn(
                    "mono inline-flex items-center gap-1 text-[9.5px]",
                    speed > 19 ? "text-amber-300" : "text-faint"
                  )}
                >
                  <Clock3 size={9} />
                  {speed.toFixed(1)} chars/s
                </span>
                <span className="mono text-[9.5px] text-faint">
                  {primaryText.replace(/\s/g, "").length} ch
                </span>
                {segment.sfx && (
                  <Badge tone="cyan" className="px-1.5 py-0 text-[9.5px]">
                    {segment.sfx}
                  </Badge>
                )}
                {flags.length > 0 && (
                  <span className="hidden text-[9.5px] text-amber-200/80 md:inline">{flags[0].reason}</span>
                )}
                <div className="ml-auto flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleSpeak(segment, primaryText)}
                    className={cn(
                      "inline-flex h-6 items-center gap-1 rounded px-1.5 text-[10px] font-medium transition hover:bg-white/5",
                      isSpeaking ? "text-pink-300" : "text-faint hover:text-slate-200"
                    )}
                    aria-label={isSpeaking ? "Stop voice preview" : "Play voice preview"}
                    title="Browser voice preview"
                  >
                    {isSpeaking ? <Square size={9} className="fill-current" /> : <Volume2 size={11} />}
                    <span className="hidden sm:inline">{isSpeaking ? "Stop" : "Listen"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(segment, primaryText)}
                    className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[10px] font-medium text-faint transition hover:bg-white/5 hover:text-slate-200"
                    aria-label="Copy this line"
                  >
                    {isCopied ? (
                      <Check size={11} className="text-emerald-400" />
                    ) : (
                      <Clipboard size={10} />
                    )}
                    <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type SegmentListProject = { id: string; segments: Segment[] };
