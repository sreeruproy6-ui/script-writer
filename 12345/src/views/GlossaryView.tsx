import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  Check,
  Copy,
  Languages,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { GlossaryTerm, StudioSettings } from "../types";
import { BENGALI_STYLES } from "../data/demo";
import { copyToClipboard } from "../lib/exports";
import { Badge, Button, EmptyState, SectionTitle, Toggle } from "../components/ui";

export function GlossaryView({
  glossary,
  settings,
  onAddTerm,
  onRemoveTerm,
  onSettingsChange,
  notify,
}: {
  glossary: GlossaryTerm[];
  settings: StudioSettings;
  onAddTerm: (term: GlossaryTerm) => void;
  onRemoveTerm: (source: string) => void;
  onSettingsChange: (patch: Partial<StudioSettings>) => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
}) {
  const [source, setSource] = useState("");
  const [bangla, setBangla] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return glossary;
    return glossary.filter((term) =>
      `${term.source} ${term.bangla} ${term.note ?? ""}`.toLowerCase().includes(query)
    );
  }, [glossary, search]);

  const addTerm = () => {
    const cleanSource = source.trim();
    const cleanBangla = bangla.trim();
    if (!cleanSource || !cleanBangla) {
      notify("Add both the original term and its Bengali mapping.", "error");
      return;
    }
    onAddTerm({ source: cleanSource, bangla: cleanBangla, note: "Custom term" });
    setSource("");
    setBangla("");
    notify(`“${cleanSource}” locked as “${cleanBangla}”.`, "success");
  };

  const copyAll = async () => {
    const text = glossary.map((term) => `${term.source} = ${term.bangla}`).join("\n");
    const ok = await copyToClipboard(text);
    notify(ok ? "Glossary copied. Paste it into your localization doc." : "Clipboard access was blocked.", ok ? "success" : "error");
  };

  return (
    <div className="animate-fade-up mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <SectionTitle
        eyebrow="Library · Glossary"
        title="Keep every name in character"
        description="Your approved mappings are attached to every Gemini run. Lock the spelling once — keep it across all fourteen episodes."
        action={
          <>
            <Button variant="ghost" size="sm" icon={<Copy size={12} />} onClick={() => void copyAll()}>
              Copy glossary
            </Button>
            <Badge tone="violet">{glossary.length} locked terms</Badge>
          </>
        }
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/25 bg-violet/10 text-violet-soft">
                <Plus size={14} />
              </div>
              <div>
                <h2 className="text-[12.5px] font-bold text-slate-100">Add a protected term</h2>
                <p className="text-[10.5px] text-faint">Character names, lore, attacks, places or honorifics.</p>
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label htmlFor="glossary-source" className="label">
                  Original term
                </label>
                <input
                  id="glossary-source"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addTerm();
                  }}
                  className="input"
                  placeholder="e.g. Moonveil"
                />
              </div>
              <div>
                <label htmlFor="glossary-bangla" className="label">
                  Bengali mapping
                </label>
                <input
                  id="glossary-bangla"
                  value={bangla}
                  onChange={(event) => setBangla(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addTerm();
                  }}
                  className="input bn"
                  placeholder="যেমন: চাঁদের আবরণ"
                />
              </div>
              <Button variant="primary" icon={<Plus size={13} />} onClick={addTerm} className="sm:mb-px">
                Add term
              </Button>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-4 py-3">
              <div className="flex items-center gap-2">
                <BookMarked size={14} className="text-violet-soft" />
                <h2 className="text-[12px] font-bold tracking-wide text-slate-100">Approved mappings</h2>
              </div>
              <label className="relative flex w-full max-w-[210px] items-center">
                <Search size={12} className="pointer-events-none absolute left-2.5 text-faint" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search terms or names…"
                  aria-label="Search glossary"
                  className="input h-8 py-0 pr-2 pl-7.5 text-[11px]"
                />
              </label>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Search size={20} />}
                title={glossary.length ? "No matching terms" : "Your glossary is empty"}
                description={
                  glossary.length
                    ? "Try the original spelling, the Bengali mapping, or clear the search."
                    : "Add a character name to keep every future episode consistent."
                }
                action={
                  search ? (
                    <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-line-soft/70">
                {filtered.map((term) => (
                  <li
                    key={`${term.source}-${term.bangla}`}
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-200">{term.source}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-faint">
                        <Languages size={9} /> saved mapping
                      </p>
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <p className="bn truncate text-[12px] font-semibold text-violet-200">{term.bangla}</p>
                      <p className="mt-0.5 truncate text-[10px] text-faint">{term.note ?? "Custom term"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-300 sm:mr-2">
                        <Check size={10} />
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveTerm(term.source)}
                        aria-label={`Remove ${term.source}`}
                        className="rounded-md p-1.5 text-faint transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-line-soft bg-panel-2/30 px-4 py-2.5 text-[10px] text-faint">
              <span>{filtered.length} of {glossary.length} terms shown</span>
              <span className="flex items-center gap-1.5">
                <Sparkles size={10} className="text-violet-soft" /> Sent with every Gemini run
              </span>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-1 flex items-center gap-2 text-[12px] font-bold text-slate-100">
              <Sparkles size={13} className="text-pink-300" /> Register guide
            </h2>
            <p className="mb-3 text-[10.5px] leading-relaxed text-faint">
              Your active Bengali register changes how Gemini writes every line.
            </p>
            <div className="space-y-2">
              {[
                { name: "Natural", bn: "তুমি এখনো এখানে?", en: "You're still here?" },
                { name: "Formal", bn: "আপনি কি এখনো এখানে আছেন?", en: "Are you still here, sir?" },
                { name: "Dramatic", bn: "এখনো এখানে দাঁড়িয়ে আছ?!", en: "You DARE stay?!" },
              ].map((sample) => {
                const active = settings.bengaliStyle === sample.name;
                return (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() =>
                      onSettingsChange({ bengaliStyle: sample.name as StudioSettings["bengaliStyle"] })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-violet-400/40 bg-violet/10"
                        : "border-line bg-panel-2/40 hover:border-line/80 hover:bg-panel-2"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10.5px] font-bold ${active ? "text-violet-100" : "text-slate-300"}`}>
                        {sample.name}
                      </span>
                      {active && <Badge tone="violet">Active</Badge>}
                    </div>
                    <p className="bn mt-1 text-[11.5px] text-slate-200">{sample.bn}</p>
                    <p className="mt-0.5 text-[9.5px] text-faint">{sample.en}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[9.5px] leading-relaxed text-faint">
              {BENGALI_STYLES.find((style) => style.value === settings.bengaliStyle)?.blurb}
            </p>
          </section>

          <section className="card p-4">
            <h2 className="text-[12px] font-bold text-slate-100">Honorific policy</h2>
            <Toggle
              checked={settings.honorifics}
              onChange={(value) => onSettingsChange({ honorifics: value })}
              title="Keep Japanese honorifics"
              description="সেনপাই, -সান, -কুন remain visible in Bengali subtitles."
            />
            <Toggle
              checked={settings.consistency}
              onChange={(value) => onSettingsChange({ consistency: value })}
              title="Strict continuity"
              description="Protect spellings and each character's register."
            />
          </section>

          <div className="rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet/[0.1] to-pink/[0.04] p-4">
            <p className="text-[10px] font-bold tracking-wide text-violet-200 uppercase">Term of the episode</p>
            <p className="bn mt-1.5 text-[15px] font-bold text-white">রক্তচাঁদ</p>
            <p className="mt-0.5 text-[10.5px] text-faint">
              Blood Moon · <span className="text-slate-300">blood-moon</span>
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-faint">
              Keep it poetic — never translate literally as “লাল রক্তের চাঁদ”.
            </p>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyToClipboard(
                  "Continuity note · Blood Moon = রক্তচাঁদ\nKeep the poetic register; never localize as “লাল রক্তের চাঁদ”.\nHonorifics: keep -senpai / -sensei."
                );
                notify(
                  ok ? "Continuity note copied for your review doc." : "Clipboard access was blocked.",
                  ok ? "success" : "error"
                );
              }}
              className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-violet-soft transition hover:text-white"
            >
              Copy note <ArrowRight size={10} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
