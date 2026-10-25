import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  FileAudio,
  Lock,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { ProcessingState } from "../types";
import { PIPELINE_STAGES } from "../data/demo";
import { Badge, Button, LogoMark, ProgressBar } from "../components/ui";
import { cn } from "../utils/cn";

export function ProcessingView({
  processing,
  onCancel,
  onDemo,
}: {
  processing: ProcessingState;
  onCancel: () => void;
  onDemo: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const failed = Boolean(processing.error);
  const progress = failed ? processing.progress : Math.round(processing.progress);

  return (
    <div className="animate-fade-up mx-auto flex min-h-[calc(100vh-120px)] max-w-[1000px] items-start justify-center px-4 py-8 sm:px-6 lg:py-14">
      <div className="w-full max-w-2xl">
        <div className="card relative overflow-hidden p-6 sm:p-9">
          <div className="pointer-events-none absolute -top-32 -right-20 h-64 w-64 rounded-full bg-violet/20 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-pink/10 blur-[80px]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge tone={failed ? "red" : "violet"} dot>
                {failed ? "Processing failed" : processing.mode === "demo" ? "Demo pipeline" : "Gemini pipeline"}
              </Badge>
              <h1 className="mt-3 text-[22px] leading-tight font-extrabold tracking-tight text-white sm:text-[25px]">
                {failed ? "That run hit a snag." : "Localizing your episode."}
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                {failed ? processing.error : processing.message}
              </p>
            </div>
            <span className="mono hidden rounded-lg border border-line bg-canvas/70 px-2.5 py-1.5 text-[11px] text-muted sm:block">
              {elapsed}s
            </span>
          </div>

          <div className="relative mt-7 flex flex-col items-center">
            <div className="relative flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
              <div
                className={cn(
                  "absolute inset-0 rounded-full border border-dashed",
                  failed ? "border-red-400/25" : "animate-spin-slow border-violet-400/25"
                )}
              />
              <div className="absolute inset-3 rounded-full border border-line bg-panel-2/80 animate-pulse-glow" />
              <div className="absolute inset-6 rounded-full border border-violet-400/15" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet/20 to-pink/10">
                {failed ? (
                  <AlertTriangle size={30} className="text-red-300" />
                ) : (
                  <LogoMark size={46} />
                )}
              </div>
              {!failed && (
                <div className="absolute -right-1 top-4 flex h-7 items-center gap-1 rounded-full border border-line bg-panel px-2.5 shadow-lg">
                  <Sparkles size={10} className="text-pink-300" />
                  <span className="bn text-[10px] font-semibold text-violet-100">বাংলা</span>
                </div>
              )}
            </div>

            <div className="mt-6 w-full max-w-md text-center">
              <div className="mb-2 flex items-end justify-between">
                <span className="mono flex items-center gap-1.5 truncate text-[11px] text-muted">
                  <FileAudio size={12} className="shrink-0" />
                  <span className="truncate">{processing.fileName}</span>
                </span>
                <span className={cn("mono text-[19px] leading-none font-bold", failed ? "text-red-300" : "text-white")}>
                  {progress}%
                </span>
              </div>
              <ProgressBar value={progress} tone={failed ? "cyan" : "gradient"} className="h-2" />
              <p className="mt-2 text-[10.5px] text-faint">
                {failed
                  ? "Your file and key are still in memory. Retry from the workspace."
                  : "Keep this tab open — analysis continues right here in your browser."}
              </p>
            </div>
          </div>

          <ol className="relative mt-7 grid gap-2 sm:grid-cols-2">
            {PIPELINE_STAGES.map((stage, index) => {
              const done = !failed && (index < processing.stage || progress >= 100);
              const active = !failed && index === processing.stage && progress < 100;
              return (
                <li
                  key={stage.label}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition",
                    active
                      ? "border-violet-400/30 bg-violet/10"
                      : done
                        ? "border-emerald-400/15 bg-emerald-500/[0.04]"
                        : "border-line-soft bg-panel-2/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold",
                      done
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                        : active
                          ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                          : "border-line bg-panel-3 text-faint"
                    )}
                  >
                    {done ? (
                      <Check size={10} strokeWidth={3} />
                    ) : active ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[11.5px] font-semibold",
                        done ? "text-emerald-200/90" : active ? "text-white" : "text-muted"
                      )}
                    >
                      {stage.label}
                    </p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">
                      {active ? stage.active : stage.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-7 flex flex-col-reverse items-stretch gap-2.5 border-t border-line-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[10.5px] text-faint">
              <ShieldCheck size={12} className="text-emerald-400/80" />
              {processing.fileSize} · AI output is a draft for human review
            </div>
            <div className="flex gap-2">
              {failed && (
                <Button variant="primary" size="sm" icon={<Play size={13} />} onClick={onDemo}>
                  Run demo instead
                </Button>
              )}
              <Button variant="danger" size="sm" icon={<X size={13} />} onClick={onCancel}>
                {failed ? "Back to workspace" : "Cancel run"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Private by design", copy: "Direct browser → Google requests." },
            { icon: Clock, title: "Typically 2–4 min", copy: "A 24-minute episode with QA." },
            { icon: ArrowLeft, title: "Nothing is lost", copy: "You can cancel before results." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card-soft flex items-start gap-2.5 px-3.5 py-3">
                <Icon size={13} className="mt-0.5 shrink-0 text-violet-soft" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-200">{item.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-faint">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
