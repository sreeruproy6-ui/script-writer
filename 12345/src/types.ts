export type View =
  | "setup"
  | "processing"
  | "results"
  | "projects"
  | "glossary"
  | "help"
  | "settings";

export type ResultTab = "subtitle" | "dubbing" | "source" | "export";

export type ApiStatus = "empty" | "checking" | "verified" | "error";

export type ContentType =
  | "anime"
  | "film"
  | "social"
  | "documentary"
  | "podcast"
  | "educational";

export interface Segment {
  id: number;
  start_ms: number;
  end_ms: number;
  speaker: string;
  source_language: string;
  source_text: string;
  bengali_subtitle: string;
  bengali_dubbing: string;
  tone: string;
  sfx?: string;
  confidence: number;
  review_note?: string;
}

export interface GlossaryTerm {
  source: string;
  bangla: string;
  note?: string;
}

export interface ProjectResult {
  id: string;
  title_bn: string;
  title_en: string;
  summary_bn: string;
  detected_languages: string[];
  segments: Segment[];
  glossary: GlossaryTerm[];
  fileName: string;
  fileSize: string;
  fileType: string;
  durationMs: number;
  contentType: ContentType;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: number;
  status: "ready" | "draft";
  isDemo?: boolean;
  qaOverride?: number;
}

export interface StudioSettings {
  sourceLang: string;
  contentType: ContentType;
  animeGenre: string;
  bengaliStyle: "Natural" | "Formal" | "Dramatic";
  honorifics: boolean;
  consistency: boolean;
  autoQA: boolean;
  glossary: string;
}

export interface ProcessingState {
  mode: "demo" | "api";
  fileName: string;
  fileSize: string;
  progress: number;
  stage: number;
  message: string;
  error?: string;
}

export interface ToastData {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

export interface MediaInfo {
  url?: string;
  mime?: string;
  name?: string;
  size?: string;
}
