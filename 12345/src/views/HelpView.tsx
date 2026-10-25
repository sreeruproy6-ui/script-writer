import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileUp,
  KeyRound,
  Languages,
  Lock,
  Play,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wand2,
  WifiOff,
} from "lucide-react";
import { copyToClipboard } from "../lib/exports";
import { Badge, Button, Kbd, SectionTitle } from "../components/ui";

const FAQS = [
  {
    question: "Can I explore Roy AI without a Gemini API key?",
    answer:
      "Yes. Open the demo episode from the hero or sidebar — it is a complete sample project with 14 timecoded lines, a dubbing script, glossary and QA report. Nothing is uploaded and no key is required. To process your own media, add a Gemini key from Google AI Studio.",
  },
  {
    question: "Where is my API key stored?",
    answer:
      "Only in this browser tab's memory. It is cleared on refresh, never written to local storage, and never sent to a Roy AI server because there isn't one. Requests go directly from your browser to the Google Generative Language API. Project content is stored locally so you can return to it.",
  },
  {
    question: "Why does key verification fail?",
    answer:
      "Check three things: the key is copied fully from Google AI Studio, the Generative Language API is enabled for that Google Cloud project, and your browser is online. A 403 usually means the key is restricted or the API is not enabled. A 429 means you hit a quota — wait a minute and retry.",
  },
  {
    question: "Which media formats and size limits apply?",
    answer:
      "Roy AI accepts audio and video (MP4, MOV, WebM, MP3, WAV, M4A, FLAC, OPUS) up to 100 MB so mobile uploads stay reliable. For a full episode, export a compressed MP4 or audio-only MP3 at a modest bitrate. Voice memos recorded in the studio are sent as WebM audio.",
  },
  {
    question: "Can I paste this studio into a Blogger post?",
    answer:
      "No. This is a React application, not a single HTML script block, so pasting the source into a Blogger post will break. Publish the built app to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages) and embed it in Blogger with an iframe. That keeps Blogger's editor clean and preserves the API-key flow.",
  },
  {
    question: "What does the QA score actually check?",
    answer:
      "It audits every line for subtitle text, very short or very long timing windows, reading speed (characters per second, excluding punctuation), and speech-recognition confidence. The score is a review aid, not a guarantee of cultural accuracy — a human dubbing director should always sign off.",
  },
  {
    question: "Why are the subtitle and dubbing lines different?",
    answer:
      "Subtitles are written to be read quickly, so they stay concise. Dubbing lines are written to be performed: they add natural breaths, emotional beats and mouth-friendly phrasing while still respecting the same time window. Use the Dubbing script tab to hear browser voice previews.",
  },
  {
    question: "Does Roy AI upload my media to a server?",
    answer:
      "No Roy AI server is involved. The file is securely uploaded to Google's Gemini Files API using your key, analyzed, and deleted at the end of the run. Export files are generated in your browser. If a run fails before cleanup, the temporary Gemini file is removed on the next successful call.",
  },
];

const TROUBLESHOOT = [
  {
    icon: WifiOff,
    title: "Upload stalls or fails",
    copy: "Corporate networks can block XHR uploads. Try another network, Chrome, or a shorter clip under 25 MB.",
  },
  {
    icon: KeyRound,
    title: "“Key rejected”",
    copy: "Paste the full AI Studio key. Enable the Generative Language API; restricted keys need that API allow-listed.",
  },
  {
    icon: Languages,
    title: "Bengali looks off",
    copy: "Tighten the glossary, choose Natural register, and read the dubbing line aloud before exporting to your cast.",
  },
];

export function HelpView({
  onDemo,
  onNew,
  onOpenSettings,
  notify,
}: {
  onDemo: () => void;
  onNew: () => void;
  onOpenSettings: () => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const [open, setOpen] = useState<number | null>(0);

  const copyChecklist = async () => {
    const checklist = [
      "Roy AI setup checklist",
      "1. Create a Google AI Studio API key.",
      "2. Enable the Generative Language API for the project.",
      "3. Verify the key in Roy AI (memory only — never stored).",
      "4. Upload a clip under 100 MB, or open the demo episode.",
      "5. Tune source language, genre, Bengali register and glossary.",
      "6. Review every flagged segment and listen to the dubbing lines.",
      "7. Export SRT + dubbing TXT for the editor and voice cast.",
      "8. Keep the full JSON project as your continuity backup.",
    ].join("\n");
    const ok = await copyToClipboard(checklist);
    notify(ok ? "Setup checklist copied." : "Clipboard access was blocked.", ok ? "success" : "error");
  };

  return (
    <div className="animate-fade-up mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionTitle
        eyebrow="Support · Handbook"
        title="A clean pipeline, explained."
        description="Everything you need to connect Gemini, localize your first scene, and keep continuity across a whole season."
        action={
          <>
            <Button variant="secondary" size="sm" icon={<Play size={13} />} onClick={onDemo}>
              Open demo
            </Button>
            <Button variant="primary" size="sm" icon={<Sparkles size={13} />} onClick={onNew}>
              New project
            </Button>
          </>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { step: "01", icon: FileUp, title: "Bring the media", copy: "Upload a clip or record a voice memo. 100 MB max." },
          { step: "02", icon: Wand2, title: "Direct the voice", copy: "Choose genre, Bengali register, honorifics and glossary." },
          { step: "03", icon: ClipboardCheck, title: "Review & export", copy: "Fix flagged lines, then ship SRT, VTT, TXT and JSON." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="card relative overflow-hidden p-4">
              <span className="mono absolute top-3 right-3 text-[19px] font-bold text-line">{item.step}</span>
              <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/20 bg-violet/10 text-violet-soft">
                <Icon size={14} />
              </div>
              <h2 className="text-[12px] font-bold text-slate-100">{item.title}</h2>
              <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{item.copy}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_318px]">
        <section className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <h2 className="text-[12px] font-bold tracking-wide text-slate-100">Frequently asked</h2>
            <Badge tone="slate" className="ml-auto">
              {FAQS.length} answers
            </Badge>
          </div>
          <div className="divide-y divide-line-soft/70">
            {FAQS.map((faq, index) => {
              const isOpen = open === index;
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.02]"
                  >
                    <span className="mono text-[9.5px] font-semibold text-faint">{String(index + 1).padStart(2, "0")}</span>
                    <span className={`flex-1 text-[12px] font-semibold ${isOpen ? "text-violet-100" : "text-slate-200"}`}>
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-faint transition-transform ${isOpen ? "rotate-180 text-violet-soft" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="animate-fade-in px-4 pb-4 pl-11">
                      <p className="text-[11.5px] leading-[1.8] text-muted">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft bg-panel-2/30 px-4 py-3">
            <span className="text-[10.5px] text-faint">Still stuck? Check the API status in settings.</span>
            <Button variant="ghost" size="sm" icon={<Settings2 size={12} />} onClick={onOpenSettings}>
              Open settings
            </Button>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <KeyRound size={14} className="text-violet-soft" />
              <h2 className="text-[12px] font-bold text-slate-100">Connect Gemini</h2>
              <Badge tone="violet" className="ml-auto">
                2 min
              </Badge>
            </div>
            <ol className="space-y-2.5">
              {[
                "Open Google AI Studio and create a free API key.",
                "Enable the Generative Language API for that project.",
                "Paste the key in Roy AI and press Verify.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span className="mono mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-panel-2 text-[9px] font-bold text-violet-soft">
                    {index + 1}
                  </span>
                  <p className="text-[10.5px] leading-relaxed text-muted">{step}</p>
                </li>
              ))}
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm mt-3 w-full"
            >
              Google AI Studio <ExternalLink size={11} />
            </a>
            <p className="mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-faint">
              <Lock size={10} className="mt-0.5 shrink-0" /> The key lives in this tab only. Never stored, never proxied.
            </p>
          </section>

          <section className="card overflow-hidden bg-gradient-to-br from-violet/[0.1] to-pink/[0.03] p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-pink-300" />
              <h2 className="text-[12px] font-bold text-slate-100">No key yet?</h2>
            </div>
            <p className="text-[10.5px] leading-relaxed text-faint">
              The sample episode is fully interactive: preview subtitles, edit lines, check QA and export every format.
            </p>
            <Button variant="secondary" size="sm" icon={<Play size={12} />} block className="mt-2.5" onClick={onDemo}>
              Explore the demo
            </Button>
          </section>

          <section className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[12px] font-bold text-slate-100">Blogger embed</h2>
              <ArrowUpRight size={13} className="text-faint" />
            </div>
            <p className="text-[10.5px] leading-relaxed text-faint">
              Publish this React build to a static host, then embed it in a Blogger post:
            </p>
            <pre className="mono mt-2 overflow-x-auto rounded-lg border border-line bg-canvas p-2.5 text-[9px] leading-relaxed text-slate-300">
{`<iframe
  src="https://your-studio.site"
  style="width:100%;height:100vh;border:0"
  title="Roy AI Studio">
</iframe>`}
            </pre>
            <button
              type="button"
              onClick={async () => {
                const snippet =
                  '<iframe src="https://your-studio.site" style="width:100%;height:100vh;border:0" title="Roy AI Studio"></iframe>';
                const ok = await copyToClipboard(snippet);
                notify(ok ? "Blogger iframe snippet copied." : "Clipboard access was blocked.", ok ? "success" : "error");
              }}
              className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-violet-soft transition hover:text-white"
            >
              <Copy size={10} /> Copy iframe snippet
            </button>
          </section>

          <div className="card-soft px-3.5 py-3">
            <p className="mb-1.5 text-[9.5px] font-bold tracking-wide text-faint uppercase">Shortcuts</p>
            <div className="space-y-1.5 text-[10px] text-muted">
              <div className="flex items-center justify-between">
                <span>Focus studio search</span>
                <Kbd>/</Kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Close dialogs</span>
                <Kbd>Esc</Kbd>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {TROUBLESHOOT.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card-soft p-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Icon size={12} className="text-amber-300" />
                <h3 className="text-[11px] font-bold text-slate-200">{item.title}</h3>
              </div>
              <p className="text-[10px] leading-relaxed text-faint">{item.copy}</p>
            </div>
          );
        })}
      </div>

      <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <Check size={14} />
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-200">First localization checklist</p>
            <p className="text-[10px] text-faint">Key, glossary, review pass, exports — in one copyable list.</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={<Copy size={12} />} onClick={() => void copyChecklist()}>
          Copy checklist
        </Button>
      </div>
    </div>
  );
}
