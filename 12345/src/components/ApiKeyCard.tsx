import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ApiStatus } from "../types";
import { Badge, Button, Field } from "./ui";

export function ApiKeyCard({
  keyDraft,
  onKeyChange,
  status,
  statusMessage,
  onVerify,
  compact = false,
}: {
  keyDraft: string;
  onKeyChange: (value: string) => void;
  status: ApiStatus;
  statusMessage: string;
  onVerify: () => void;
  compact?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <section className="card p-5" id="api-key-card" aria-labelledby="api-key-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/25 bg-violet/10 text-violet-soft">
            <KeyRound size={16} />
          </div>
          <div>
            <h2 id="api-key-title" className="text-[13.5px] font-bold text-slate-100">
              Gemini API key
            </h2>
            <p className="text-[11px] text-faint">Powers transcription, translation and the QA pass</p>
          </div>
        </div>
        {status === "verified" ? (
          <Badge tone="green" dot>
            Verified
          </Badge>
        ) : status === "checking" ? (
          <Badge tone="amber" dot>
            Checking
          </Badge>
        ) : status === "error" ? (
          <Badge tone="red" dot>
            Check key
          </Badge>
        ) : (
          <Badge tone="slate">Optional for demo</Badge>
        )}
      </div>

      <Field label="Your key" htmlFor="api-key-input">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              id="api-key-input"
              type={visible ? "text" : "password"}
              value={keyDraft}
              onChange={(event) => onKeyChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onVerify();
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder="AIzaSy..."
              className="input mono pr-10"
              aria-describedby="api-key-note"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? "Hide API key" : "Show API key"}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-faint transition hover:bg-white/5 hover:text-slate-200"
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <Button
            variant={status === "verified" ? "secondary" : "primary"}
            onClick={onVerify}
            disabled={status === "checking" || !keyDraft.trim()}
            icon={
              status === "checking" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : status === "verified" ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : (
                <ShieldCheck size={14} />
              )
            }
            className="shrink-0"
          >
            {status === "checking" ? "Verifying…" : status === "verified" ? "Re-verify key" : "Verify key"}
          </Button>
        </div>
      </Field>

      {statusMessage && (
        <div
          className={`mt-2.5 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed ${
            status === "error"
              ? "border-red-400/25 bg-red-500/[0.07] text-red-200"
              : status === "verified"
                ? "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200"
                : "border-line bg-panel-2 text-muted"
          }`}
          role="status"
        >
          {status === "error" ? (
            <TriangleAlert size={13} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      <div id="api-key-note" className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-faint">
        <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400/80" />
        <p>
          Your key stays in this browser tab&apos;s memory. It is never saved to local storage or logged.
          Requests go directly to Google, so no server or CORS proxy is involved.
          {!compact && (
            <>
              {" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-violet-soft underline decoration-violet-400/40 underline-offset-2 hover:text-white"
              >
                Get a free key from Google AI Studio ↗
              </a>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
