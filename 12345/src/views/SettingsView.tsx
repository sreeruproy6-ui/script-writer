import { useState } from "react";
import {
  ArrowUpRight,
  BookMarked,
  Boxes,
  Database,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { ApiStatus, GlossaryTerm, StudioSettings } from "../types";
import { ANIME_GENRES, BENGALI_STYLES, CONTENT_TYPES, SOURCE_LANGUAGES } from "../data/demo";
import { Badge, Button, Field, Modal, SectionTitle, Toggle } from "../components/ui";
import { ApiKeyCard } from "../components/ApiKeyCard";

export function SettingsView({
  keyDraft,
  onKeyDraftChange,
  apiStatus,
  apiMessage,
  onVerify,
  settings,
  onSettingsChange,
  glossary,
  onOpenGlossary,
  onClearData,
  onResetSettings,
  onOpenHelp,
  notify,
}: {
  keyDraft: string;
  onKeyDraftChange: (value: string) => void;
  apiStatus: ApiStatus;
  apiMessage: string;
  onVerify: () => void;
  settings: StudioSettings;
  onSettingsChange: (patch: Partial<StudioSettings>) => void;
  glossary: GlossaryTerm[];
  onOpenGlossary: () => void;
  onClearData: () => void;
  onResetSettings: () => void;
  onOpenHelp: () => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="animate-fade-up mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionTitle
        eyebrow="Studio · Settings"
        title="Tune the studio to your workflow"
        description="Defaults apply to every new localization. The API key stays in this tab only; everything else is stored locally so your glossary survives a refresh."
        action={<Badge tone="green" dot>Autosaved locally</Badge>}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_318px]">
        <div className="min-w-0 space-y-4">
          <ApiKeyCard
            keyDraft={keyDraft}
            onKeyChange={onKeyDraftChange}
            status={apiStatus}
            statusMessage={apiMessage}
            onVerify={onVerify}
          />

          <section className="card overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan/10 text-cyan-200">
                <SlidersHorizontal size={14} />
              </div>
              <div>
                <h2 className="text-[12.5px] font-bold text-slate-100">Localization defaults</h2>
                <p className="text-[10.5px] text-faint">Pre-filled every time you start a new project.</p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source language" htmlFor="settings-source">
                  <select
                    id="settings-source"
                    className="select"
                    value={settings.sourceLang}
                    onChange={(event) => onSettingsChange({ sourceLang: event.target.value })}
                  >
                    {SOURCE_LANGUAGES.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Content type" htmlFor="settings-content">
                  <select
                    id="settings-content"
                    className="select"
                    value={settings.contentType}
                    onChange={(event) =>
                      onSettingsChange({ contentType: event.target.value as StudioSettings["contentType"] })
                    }
                  >
                    {CONTENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Anime genre" htmlFor="settings-genre">
                  <select
                    id="settings-genre"
                    className="select"
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
                <Field label="Bengali register" htmlFor="settings-style">
                  <select
                    id="settings-style"
                    className="select"
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

              <div className="divide-y divide-line-soft/70 rounded-xl border border-line bg-panel-2/40 px-3.5">
                <Toggle
                  checked={settings.honorifics}
                  onChange={(value) => onSettingsChange({ honorifics: value })}
                  title="Keep Japanese honorifics"
                  description="-san, -kun, -senpai and -sensei remain in Bengali output."
                />
                <Toggle
                  checked={settings.consistency}
                  onChange={(value) => onSettingsChange({ consistency: value })}
                  title="Strict character consistency"
                  description="Gemini locks each character to one voice and register."
                />
                <Toggle
                  checked={settings.autoQA}
                  onChange={(value) => onSettingsChange({ autoQA: value })}
                  title="Automatic QA audit"
                  description="Grade reading speed, timing and confidence after every run."
                />
              </div>

              <Field
                label="Default glossary"
                htmlFor="settings-glossary"
                optional
                hint="Use one mapping per line (Name=Bengali) or commas. Full editor available in Library."
              >
                <textarea
                  id="settings-glossary"
                  value={settings.glossary}
                  onChange={(event) => onSettingsChange({ glossary: event.target.value })}
                  className="textarea min-h-[86px] text-[12.5px]"
                  placeholder="Ren=রেন, Blood Moon=রক্তচাঁদ"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-line-soft bg-panel-2/30 px-4 py-2.5 text-[10px] text-faint">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-emerald-400" /> Applied to the next Gemini run
              </span>
              <span className="mono flex items-center gap-1.5">
                <Sparkles size={10} /> {settings.bengaliStyle}
              </span>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookMarked size={14} className="text-violet-soft" />
                <h2 className="text-[12.5px] font-bold text-slate-100">Continuity glossary</h2>
                <Badge tone="violet">{glossary.length} terms</Badge>
              </div>
              <Button variant="ghost" size="sm" icon={<ArrowUpRight size={12} />} onClick={onOpenGlossary}>
                Open glossary
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {glossary.slice(0, 8).map((term) => (
                <span
                  key={term.source}
                  className="rounded-md border border-line bg-canvas px-2 py-1 text-[10px] text-muted"
                >
                  {term.source} <span className="text-faint">→</span>{" "}
                  <span className="bn text-violet-200">{term.bangla}</span>
                </span>
              ))}
              {glossary.length > 8 && (
                <button
                  type="button"
                  onClick={onOpenGlossary}
                  className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold text-violet-soft hover:bg-panel-3"
                >
                  +{glossary.length - 8} more
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <Database size={14} className="text-cyan-300" />
              <h2 className="text-[12px] font-bold text-slate-100">Workspace & privacy</h2>
            </div>
            <dl className="space-y-2.5 text-[11px]">
              {[
                ["API key", "Memory only"],
                ["Media files", "Never stored"],
                ["Projects", "This browser"],
                ["Glossary", "This browser"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2 border-b border-line-soft/60 pb-2 last:border-0 last:pb-0">
                  <dt className="text-faint">{label}</dt>
                  <dd className="font-medium text-slate-300">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-500/[0.05] px-2.5 py-2 text-[9.5px] leading-relaxed text-emerald-200/80">
              <ShieldCheck size={11} className="mt-0.5 shrink-0" />
              No Roy AI backend exists. Media goes directly from this tab to Google's Gemini API.
            </p>
            <div className="mt-3 space-y-2">
              <Button
                variant="danger"
                size="sm"
                block
                icon={<Trash2 size={12} />}
                onClick={() => setConfirmOpen(true)}
              >
                Clear local projects
              </Button>
              <Button
                variant="ghost"
                size="sm"
                block
                icon={<RotateCcw size={12} />}
                onClick={() => setResetOpen(true)}
              >
                Reset studio defaults
              </Button>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Boxes size={14} className="text-violet-soft" />
              <h2 className="text-[12px] font-bold text-slate-100">About Roy AI</h2>
              <Badge tone="slate" className="ml-auto">
                v2.4
              </Badge>
            </div>
            <dl className="space-y-2 text-[10.5px]">
              {[
                ["Engine", "Gemini 2.5 Flash"],
                ["Target locale", "Bengali · bn-BD"],
                ["Interface", "English UI"],
                ["Built for", "Creator blogs"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="text-faint">{label}</dt>
                  <dd className="font-medium text-slate-300">{value}</dd>
                </div>
              ))}
            </dl>
            <Button variant="ghost" size="sm" block className="mt-2.5" icon={<ArrowUpRight size={12} />} onClick={onOpenHelp}>
              Read the handbook
            </Button>
          </section>

          <div className="rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet/[0.1] to-pink/[0.04] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-violet-200 uppercase">
              <KeyRound size={11} /> Key safety
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
              On a shared computer, refresh the page when you finish so the key leaves memory. Never commit a key to a
              public repository or paste it into a blog post.
            </p>
          </div>
        </aside>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear local projects?"
        subtitle="This removes saved projects and custom glossary terms from this browser. It cannot be undone."
        icon={<Trash2 size={15} />}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Keep my work
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={12} />}
              onClick={() => {
                onClearData();
                setConfirmOpen(false);
              }}
            >
              Yes, clear data
            </Button>
          </div>
        }
      >
        <p className="text-[12px] leading-relaxed text-muted">
          The demo episode will stay available. Generated projects, edits, and custom glossary mappings will be removed.
          Your API key is not included because it is never stored.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset studio defaults?"
        subtitle="Restore the recommended language, anime and QA settings."
        icon={<RotateCcw size={15} />}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onResetSettings();
                setResetOpen(false);
                notify("Studio defaults restored.", "success");
              }}
            >
              Reset defaults
            </Button>
          </div>
        }
      >
        <p className="text-[12px] leading-relaxed text-muted">
          Localization settings and API verification will return to their initial state. Projects and glossary terms are
          not affected by this reset.
        </p>
      </Modal>
    </div>
  );
}
