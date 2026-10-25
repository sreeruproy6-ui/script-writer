import { useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  FileAudio,
  FileVideo,
  Mic,
  Play,
  RotateCcw,
  Square,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { MediaInfo } from "../types";
import { ACCEPTED_TYPES, MAX_FILE_BYTES } from "../lib/gemini";
import { formatBytes, formatTime } from "../lib/format";
import { Badge, Button } from "./ui";
import { cn } from "../utils/cn";

export function MediaCard({
  file,
  media,
  onFile,
  onClear,
  onDemo,
  notify,
}: {
  file: File | null;
  media: MediaInfo;
  onFile: (file: File) => void;
  onClear: () => void;
  onDemo: () => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const acceptFile = (candidate: File | null | undefined) => {
    if (!candidate) return;
    const isMedia = candidate.type.startsWith("audio/") || candidate.type.startsWith("video/");
    if (!isMedia) {
      notify("That file isn't audio or video. Try MP4, MOV, WebM, MP3, WAV or M4A.", "error");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      notify(`That file is ${formatBytes(candidate.size)}. The limit is 100 MB — trim the clip and retry.`, "error");
      return;
    }
    if (candidate.size === 0) {
      notify("That file appears to be empty.", "error");
      return;
    }
    onFile(candidate);
    notify(`${candidate.name} is ready for localization.`, "success");
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const toggleRecording = async () => {
    if (recording) {
      stopRecording();
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      notify("Voice recording isn't supported in this browser. Upload an audio file instead.", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) {
          const recorded = new File([blob], `roy_recording_${Date.now()}.webm`, { type: "audio/webm" });
          acceptFile(recorded);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    } catch {
      notify("Microphone access was blocked. Allow it in your browser, or upload a file.", "error");
    }
  };

  return (
    <section className="card p-5" aria-labelledby="media-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-pink-400/25 bg-pink/10 text-pink-200">
            <Clapperboard size={16} />
          </div>
          <div>
            <h2 id="media-title" className="text-[13.5px] font-bold text-slate-100">
              Media input
            </h2>
            <p className="text-[11px] text-faint">A scene, an episode, or a voice memo</p>
          </div>
        </div>
        <Badge tone="slate">Max 100 MB</Badge>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files?.[0]);
        }}
        aria-label="Upload audio or video"
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-canvas/40 px-5 py-7 text-center transition-all",
          dragging
            ? "border-violet-400/80 bg-violet/10"
            : "border-line hover:border-violet-400/50 hover:bg-violet/[0.04]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
        <div className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet/20 to-pink/10 text-violet-soft transition group-hover:scale-105">
          <UploadCloud size={19} />
        </div>
        <p className="relative text-[13px] font-semibold text-slate-200">
          {dragging ? "Drop it here" : "Drop an episode or clip here"}
        </p>
        <p className="relative mt-1 text-[11px] text-faint">
          MP4, MOV, WebM, MP3, WAV, M4A, FLAC · up to 100 MB
        </p>
        <div className="relative mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-md border border-line bg-panel-2 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
            Browse files
          </span>
          <span className="text-[10.5px] text-faint">or drag and drop</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(event) => {
            acceptFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          size="sm"
          icon={<Play size={13} />}
          onClick={onDemo}
          className="flex-1"
        >
          Try demo episode
        </Button>
        <Button
          variant={recording ? "danger" : "secondary"}
          size="sm"
          onClick={toggleRecording}
          icon={recording ? <Square size={12} className="fill-current" /> : <Mic size={13} />}
          className="flex-1"
          aria-pressed={recording}
        >
          {recording ? `Stop · ${formatTime(seconds * 1000)}` : "Record voice"}
        </Button>
      </div>

      {recording && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-red-400/25 bg-red-500/[0.07] px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <div className="flex h-4 flex-1 items-end gap-[3px] overflow-hidden">
            {Array.from({ length: 28 }).map((_, index) => (
              <span
                key={index}
                className="eq-bar w-[3px] rounded-sm bg-red-400/70"
                style={{ height: `${30 + ((index * 37) % 70)}%`, animationDelay: `${index * 55}ms` }}
              />
            ))}
          </div>
          <span className="mono text-[11px] font-semibold text-red-200">{formatTime(seconds * 1000)}</span>
        </div>
      )}

      {file && (
        <div className="animate-fade-up mt-3 flex items-center gap-3 rounded-xl border border-line bg-panel-2/70 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-cyan-300">
            {file.type.startsWith("video") ? <FileVideo size={16} /> : <FileAudio size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-slate-200">{file.name}</p>
            <p className="mt-0.5 text-[10.5px] text-faint">
              {formatBytes(file.size)} · {file.type || "media"} · {media.url ? "Local preview ready" : "Ready to analyze"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              title="Replace file"
              aria-label="Replace file"
              className="rounded-md p-1.5 text-faint transition hover:bg-white/5 hover:text-white"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={onClear}
              title="Remove file"
              aria-label="Remove file"
              className="rounded-md p-1.5 text-faint transition hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
