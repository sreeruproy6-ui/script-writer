import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Captions,
  CaptionsOff,
  Maximize2,
  Music2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { MediaInfo, ProjectResult } from "../types";
import { POSTER } from "../data/demo";
import { formatTime } from "../lib/format";
import { cn } from "../utils/cn";

export interface SeekRequest {
  ms: number;
  nonce: number;
}

export function MediaPreview({
  project,
  media,
  captionMode,
  seekRequest,
}: {
  project: ProjectResult;
  media: MediaInfo;
  captionMode: "subtitle" | "dubbing";
  seekRequest?: SeekRequest;
}) {
  const [showCaptions, setShowCaptions] = useState(true);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [detectedDuration, setDetectedDuration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const timeRef = useRef(0);
  const duration = detectedDuration || project.durationMs || 82400;
  const hasVideo = Boolean(media.url && media.mime?.startsWith("video"));
  const hasAudio = Boolean(media.url && media.mime?.startsWith("audio"));

  useEffect(() => {
    const firstStart = project.segments[0]?.start_ms ?? 0;
    timeRef.current = firstStart;
    setDetectedDuration(0);
    setTime(firstStart);
    setPlaying(false);
    setMuted(false);
    // Start on the first line so the preview always opens on a caption.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const seek = (ms: number, autoplay = false) => {
    const clamped = Math.max(0, Math.min(duration, Math.round(ms)));
    timeRef.current = clamped;
    setTime(clamped);
    const element = mediaRef.current;
    if (element) {
      try {
        element.currentTime = clamped / 1000;
      } catch {
        // Metadata may not be ready yet; the browser will clamp on load.
      }
      if (autoplay) {
        void element.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    }
    if (autoplay) setPlaying(true);
  };

  useEffect(() => {
    if (!seekRequest) return;
    seek(seekRequest.ms, true);
    // Only react to explicit jump requests, not to every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekRequest?.nonce]);

  useEffect(() => {
    if (!playing || hasVideo || hasAudio) return;
    const timer = window.setInterval(() => {
      const next = Math.min(duration, timeRef.current + 120);
      timeRef.current = next;
      setTime(next);
      if (next >= duration) setPlaying(false);
    }, 120);
    return () => window.clearInterval(timer);
  }, [playing, hasVideo, hasAudio, duration]);

  const current = project.segments.find((segment) => time >= segment.start_ms && time < segment.end_ms);
  const percent = Math.min(100, (time / duration) * 100);
  const caption =
    captionMode === "dubbing"
      ? current?.bengali_dubbing ?? current?.bengali_subtitle
      : current?.bengali_subtitle;

  const syncMediaTime = (ms: number) => {
    timeRef.current = ms;
    setTime(ms);
  };

  const toggle = () => {
    const element = mediaRef.current;
    if (element) {
      if (element.paused) {
        void element.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      } else {
        element.pause();
        setPlaying(false);
      }
      return;
    }
    if (timeRef.current >= duration) {
      timeRef.current = 0;
      setTime(0);
    }
    setPlaying((previous) => !previous);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current.requestFullscreen?.().catch(() => undefined);
    }
  };

  const toggleMute = () => {
    const element = mediaRef.current;
    if (element) element.muted = !muted;
    setMuted((currentMuted) => !currentMuted);
  };

  return (
    <div ref={containerRef} className="overflow-hidden rounded-xl border border-line bg-black">
      <div className="relative aspect-video w-full overflow-hidden bg-[#050810]">
        <img
          src={POSTER}
          alt={`${project.title_en} preview`}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition duration-700",
            playing && !hasVideo ? "scale-[1.02]" : "scale-100"
          )}
        />
        {hasVideo && (
          <video
            ref={(element) => {
              mediaRef.current = element;
            }}
            src={media.url}
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            preload="metadata"
            onTimeUpdate={(event) => syncMediaTime(event.currentTarget.currentTime * 1000)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onLoadedMetadata={(event) => {
              const length = event.currentTarget.duration;
              if (Number.isFinite(length) && length > 0) setDetectedDuration(Math.round(length * 1000));
            }}
            onClick={toggle}
          />
        )}
        {hasAudio && (
          <audio
            ref={(element) => {
              mediaRef.current = element;
            }}
            src={media.url}
            preload="metadata"
            onTimeUpdate={(event) => syncMediaTime(event.currentTarget.currentTime * 1000)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onLoadedMetadata={(event) => {
              const length = event.currentTarget.duration;
              if (Number.isFinite(length) && length > 0) setDetectedDuration(Math.round(length * 1000));
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04070e] via-[#04070e]/25 to-[#04070e]/45" />
        {playing && !hasVideo && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden opacity-60">
            <div className="scan-line h-px w-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-bold tracking-wide text-white backdrop-blur">
              {hasVideo || hasAudio ? "SOURCE PREVIEW" : "STORYBOARD PREVIEW"}
            </span>
            <span className="rounded-md border border-violet-300/25 bg-violet-950/60 px-2 py-1 text-[10px] font-semibold text-violet-100 backdrop-blur">
              {captionMode === "dubbing" ? "ডাবিং টেক" : "বাংলা সাবটাইটেল"}
            </span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-slate-200 backdrop-blur sm:flex">
            <span className={cn("h-1.5 w-1.5 rounded-full", playing ? "animate-pulse bg-emerald-400" : "bg-slate-400")} />
            {playing ? "Playing" : "Paused"}
          </div>
        </div>

        {!playing && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Play preview"
            className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-2xl backdrop-blur-md transition hover:scale-105 hover:border-violet-300/50 hover:bg-violet-500/30"
          >
            <Play size={22} className="ml-0.5 fill-current" />
          </button>
        )}

        {playing && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Pause preview"
            className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/70 opacity-0 backdrop-blur transition hover:opacity-100 focus:opacity-100"
          >
            <Pause size={17} className="fill-current" />
          </button>
        )}

        {hasAudio && playing && (
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-end gap-1.5">
            {Array.from({ length: 20 }).map((_, index) => (
              <span
                key={index}
                className="eq-bar w-1.5 rounded-full bg-gradient-to-t from-violet-400/60 to-pink-300/90"
                style={{ height: `${16 + ((index * 53) % 54)}px`, animationDelay: `${index * 70}ms` }}
              />
            ))}
          </div>
        )}

        {showCaptions && (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/55 to-transparent px-4 pt-12 pb-4 sm:px-8 sm:pb-6">
            {current ? (
              <div key={`${current.id}-${captionMode}`} className="animate-fade-in mx-auto max-w-xl text-center">
                <div className="mb-1.5 flex items-center justify-center gap-2">
                  <span className="rounded border border-white/15 bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-slate-200 uppercase backdrop-blur">
                    {current.speaker}
                  </span>
                  <span className="text-[9.5px] font-medium text-violet-200/80">
                    {captionMode === "dubbing" ? current.tone : formatTime(current.start_ms)}
                  </span>
                </div>
                <p className="bn text-[15px] leading-relaxed font-semibold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.9)] sm:text-[18px]">
                  {captionMode === "dubbing" ? `“${caption}”` : caption}
                </p>
                {captionMode === "subtitle" && current.source_text && (
                  <p className="mt-1 truncate text-[10.5px] text-slate-300/70">{current.source_text}</p>
                )}
              </div>
            ) : (
              <div className="mx-auto flex max-w-md items-center justify-center gap-2 text-center text-[11px] text-slate-400">
                <Music2 size={12} />
                <span className="bn">সংলাপের বাইরে — অ্যাকশন ও অ্যাটমোস্ফিয়ার</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line bg-[#0a1120] px-3 py-2.5 sm:px-4">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="mono shrink-0 text-[10.5px] text-slate-300">{formatTime(time)}</span>
          <div className="relative flex-1">
            <input
              type="range"
              min={0}
              max={duration}
              step={50}
              value={Math.min(time, duration)}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Seek preview timeline"
              className="range-slider w-full"
              style={{ "--fill": `${percent}%` } as CSSProperties}
            />
          </div>
          <span className="mono shrink-0 text-[10.5px] text-faint">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-slate-200 transition hover:bg-violet-500/25 hover:text-white"
          >
            {playing ? <Pause size={13} className="fill-current" /> : <Play size={13} className="ml-0.5 fill-current" />}
          </button>
          <button
            type="button"
            onClick={() => seek(time - 5000)}
            aria-label="Back 5 seconds"
            className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition hover:bg-white/5 hover:text-white"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={() => seek(time + 5000)}
            aria-label="Forward 5 seconds"
            className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition hover:bg-white/5 hover:text-white"
          >
            <RotateCw size={13} />
          </button>
          <span className="mono ml-1 hidden text-[10px] text-faint sm:inline">
            {current ? `SEG ${String(current.id).padStart(2, "0")} / ${String(project.segments.length).padStart(2, "0")}` : "GAP"}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition hover:bg-white/5 hover:text-white"
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button
              type="button"
              onClick={() => setShowCaptions((value) => !value)}
              aria-label={showCaptions ? "Hide captions" : "Show captions"}
              aria-pressed={showCaptions}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-white/5",
                showCaptions ? "text-violet-200" : "text-faint hover:text-white"
              )}
            >
              {showCaptions ? <Captions size={14} /> : <CaptionsOff size={14} />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Fullscreen preview"
              className="flex h-7 w-7 items-center justify-center rounded-md text-faint transition hover:bg-white/5 hover:text-white"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
