import type { Segment } from "../types";

export function formatTime(ms: number, withMs = false): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const base = hours > 0
    ? `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (!withMs) return base;
  return `${base}.${String(safe % 1000).padStart(3, "0")}`;
}

export function formatSrt(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const hours = Math.floor(safe / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const millis = safe % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

export function formatVtt(ms: number): string {
  return formatSrt(ms).replace(",", ".");
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function segmentSeconds(segment: Segment): number {
  return Math.max(0.4, (segment.end_ms - segment.start_ms) / 1000);
}

/** Characters that actually occupy reading time (excludes spaces & punctuation). */
export function readingChars(text: string): number {
  return text.replace(/[\s।,.;:!?—–\-"'()[\]]/g, "").length;
}

export function readingSpeed(text: string, segment: Segment): number {
  return readingChars(text) / segmentSeconds(segment);
}

export type FlagTone = "danger" | "warning" | "info";

export interface SegmentFlag {
  reason: string;
  tone: FlagTone;
}

export function segmentFlags(segment: Segment): SegmentFlag[] {
  const flags: SegmentFlag[] = [];
  const duration = segment.end_ms - segment.start_ms;
  const cps = readingSpeed(segment.bengali_subtitle, segment);
  if (!segment.bengali_subtitle.trim()) {
    flags.push({ reason: "Missing Bengali subtitle", tone: "danger" });
  }
  if (duration < 900) flags.push({ reason: "Short timing window", tone: "warning" });
  if (duration > 7500) flags.push({ reason: "Long hold — split recommended", tone: "info" });
  if (cps > 19) flags.push({ reason: `${cps.toFixed(1)} chars/s — fast read`, tone: "warning" });
  if ((segment.confidence ?? 1) < 0.72) {
    flags.push({ reason: "Low ASR confidence", tone: "danger" });
  }
  return flags;
}

export interface AuditResult {
  score: number;
  issues: number;
  checked: number;
  flagged: { segmentId: number; reasons: string[] }[];
  readingAvg: number;
  summary: string;
}

export function auditProject(segments: Segment[], override?: number): AuditResult {
  let penalty = 0;
  const flagged: { segmentId: number; reasons: string[] }[] = [];
  let speedTotal = 0;

  segments.forEach((segment) => {
    const flags = segmentFlags(segment);
    speedTotal += readingSpeed(segment.bengali_subtitle, segment);
    if (flags.length > 0) {
      penalty += flags.some((f) => f.tone === "danger") ? 3.5 : 2;
      flagged.push({ segmentId: segment.id, reasons: flags.map((f) => f.reason) });
    }
  });

  const readingAvg = segments.length ? speedTotal / segments.length : 0;
  const score = Math.max(
    58,
    Math.min(100, Math.round((override ?? 100) - penalty - Math.max(0, readingAvg - 14) * 1.2))
  );

  const issues = flagged.length;
  return {
    score,
    issues,
    checked: segments.length,
    flagged,
    readingAvg,
    summary: issues
      ? `${issues} of ${segments.length} segments flagged. Timing, reading speed and confidence need a quick pass.`
      : `${segments.length} of ${segments.length} segments verified. Timing, reading speed and confidence are performance-ready.`,
  };
}

export function initials(name: string): string {
  const clean = name.replace(/[-_]/g, " ").trim();
  if (!clean) return "SP";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return clean.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const speakerPalette = [
  "from-violet-500/30 to-violet-500/5 text-violet-200 border-violet-400/30",
  "from-pink-500/30 to-pink-500/5 text-pink-200 border-pink-400/30",
  "from-cyan-500/30 to-cyan-500/5 text-cyan-200 border-cyan-400/30",
  "from-amber-500/30 to-amber-500/5 text-amber-200 border-amber-400/30",
  "from-emerald-500/30 to-emerald-500/5 text-emerald-200 border-emerald-400/30",
];

export function speakerColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return speakerPalette[hash % speakerPalette.length];
}

export function slugify(value: string): string {
  const ascii = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return ascii || "roy-ai-project";
}
