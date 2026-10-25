import type { GlossaryTerm, ProjectResult, Segment, StudioSettings } from "../types";

export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const ACCEPTED_TYPES = "video/*,audio/*";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const UPLOAD_BASE = "https://generativelanguage.googleapis.com/upload/v1beta";
const MODEL = "gemini-2.5-flash";
/** Base64 inflates by ~33%; keep direct inline requests under Gemini's 20 MB payload cap. */
const INLINE_LIMIT = 12 * 1024 * 1024;

export interface VerifyResult {
  ok: boolean;
  modelCount?: number;
  message: string;
}

function friendlyHttpError(status: number, detail?: string): string {
  if (status === 400) return detail || "The API key is invalid or the request was rejected.";
  if (status === 401 || status === 403)
    return "This key is not authorized. Check that the Generative Language API is enabled for it.";
  if (status === 404) return "The selected Gemini model is unavailable for this API key.";
  if (status === 413) return "The media file is too large for a single Gemini upload.";
  if (status === 429) return "Gemini rate limit or quota reached. Wait a moment and retry.";
  return detail || `Gemini request failed (HTTP ${status}).`;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data?.error?.message ?? "";
  } catch {
    return "";
  }
}

export async function verifyGeminiKey(apiKey: string): Promise<VerifyResult> {
  const key = apiKey.trim();
  if (!key) return { ok: false, message: "Enter a Gemini API key first." };
  try {
    const response = await fetch(`${API_BASE}/models?key=${encodeURIComponent(key)}`);
    if (!response.ok) {
      const detail = await readError(response);
      return { ok: false, message: friendlyHttpError(response.status, detail) };
    }
    const data = (await response.json()) as { models?: unknown[] };
    return {
      ok: true,
      modelCount: data.models?.length ?? 0,
      message: `Key verified · ${data.models?.length ?? 0} Gemini models available.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof TypeError
          ? "Could not reach Google. Check your internet connection, or use Demo mode."
          : "Key verification failed. Please try again.",
    };
  }
}

function abortError(): DOMException {
  return new DOMException("Operation canceled", "AbortError");
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      window.clearTimeout(timer);
      reject(abortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function buildPrompt(settings: StudioSettings, glossary: GlossaryTerm[]): string {
  const glossaryText = glossary.length
    ? glossary.map((term) => `${term.source} = ${term.bangla}`).join("\n")
    : "No custom glossary supplied.";

  return `You are Roy AI, a senior anime localization director and dubbing script editor for Bangladeshi Bengali (bn-BD).

Analyze the attached audio/video from beginning to end. Detect every spoken line, the speaker, and accurate timestamps. Never invent dialogue that is not supported by the audio. If speech is unclear, keep the line and lower "confidence" instead of guessing wildly.

LOCALIZATION DIRECTIVES
- Target language: Bengali (bn-BD), written in Bengali script. Keep it natural, not machine-literal.
- Content type: ${settings.contentType}.
- Anime genre: ${settings.animeGenre}.
- Bengali register: ${settings.bengaliStyle}.
- Honorifics (${settings.honorifics ? "KEEP" : "LOCALIZE"}): retain -san, -kun, -senpai, -sensei exactly where a character uses them.
- Character voice consistency: ${settings.consistency ? "STRICT — one voice and register per character." : "standard"}.
- Subtitle line should be timed and concise (roughly 12–17 Bengali characters per second). A dubbing line should be performable, with natural breaths and emotion, but fit the same window.
- Use SFX cues in Bengali inside square brackets. Use an empty string when there is no SFX.
- Keep character and lore spellings exactly as the approved glossary:
${glossaryText}

Return ONLY valid JSON. No markdown, no code fences, no commentary. JSON shape:
{
  "title_bn": "Bengali episode title",
  "title_en": "English/Japanese title",
  "summary_bn": "Two-sentence Bengali summary",
  "detected_languages": ["Japanese", "Bengali"],
  "segments": [
    {
      "id": 1,
      "start_ms": 0,
      "end_ms": 2500,
      "speaker": "Character name",
      "source_language": "detected language",
      "source_text": "original dialogue",
      "bengali_subtitle": "বাংলা সাবটাইটেল",
      "bengali_dubbing": "অভিনয়যোগ্য বাংলা ডাবিং সংলাপ",
      "tone": "Emotion / delivery note",
      "sfx": "[সাউন্ড ইফেক্ট]",
      "confidence": 0.95,
      "review_note": "Clean or a short QA note"
    }
  ],
  "glossary": [{"source": "Original name", "bangla": "বাংলা নাম"}]
}`;
}

function extractJson(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^\uFEFF/, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Gemini returned an unreadable response. Please retry.");
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("Gemini returned malformed JSON. Please run the analysis again.");
  }
}

function normalizeSegments(value: unknown): Segment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      const parsedStart = Number(raw.start_ms ?? raw.startMs ?? 0);
      const start = Number.isFinite(parsedStart) ? parsedStart : 0;
      const parsedEnd = Number(raw.end_ms ?? raw.endMs ?? start + 2500);
      const end = Number.isFinite(parsedEnd) ? parsedEnd : start + 2500;
      const parsedConfidence = Number(raw.confidence ?? 0.9);
      return {
        id: Number(raw.id ?? index + 1) || index + 1,
        start_ms: Math.max(0, Math.round(start)),
        end_ms: Math.max(Math.round(start) + 400, Math.round(end)),
        speaker: String(raw.speaker ?? "Speaker"),
        source_language: String(raw.source_language ?? "Japanese"),
        source_text: String(raw.source_text ?? ""),
        bengali_subtitle: String(raw.bengali_subtitle ?? ""),
        bengali_dubbing: String(raw.bengali_dubbing ?? raw.bengali_subtitle ?? ""),
        tone: String(raw.tone ?? "Neutral"),
        sfx: raw.sfx ? String(raw.sfx) : "",
        confidence: Number.isFinite(parsedConfidence) ? Math.min(1, Math.max(0, parsedConfidence)) : 0.9,
        review_note: raw.review_note ? String(raw.review_note) : "Clean",
      } satisfies Segment;
    })
    .filter((segment) => segment.bengali_subtitle.trim().length > 0)
    .sort((a, b) => a.start_ms - b.start_ms)
    .map((segment, index) => ({ ...segment, id: index + 1 }));
}

export interface PipelineOptions {
  file: File;
  apiKey: string;
  settings: StudioSettings;
  glossary: GlossaryTerm[];
  signal?: AbortSignal;
  onProgress: (stage: number, progress: number, message: string) => void;
}

interface UploadedFile {
  name: string;
  uri: string;
  mimeType: string;
  state?: string;
}

export async function runGeminiPipeline(options: PipelineOptions): Promise<ProjectResult> {
  const { file, apiKey, settings, glossary, signal, onProgress } = options;
  throwIfAborted(signal);

  // Small clips go straight to Gemini as inline data. This avoids the resumable
  // upload headers entirely, which some browsers and proxies block via CORS.
  if (file.size <= INLINE_LIMIT) {
    return runInlinePipeline(options);
  }

  onProgress(0, 5, "Checking file and preparing a secure upload…");

  const contentType = file.type || "application/octet-stream";
  const initiate = await fetch(
    `${UPLOAD_BASE}/files?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(file.size),
        "X-Goog-Upload-Header-Content-Type": contentType,
      },
      body: JSON.stringify({ file: { display_name: file.name } }),
      signal,
    }
  );

  if (!initiate.ok) {
    throw new Error(friendlyHttpError(initiate.status, await readError(initiate)));
  }

  const uploadUrl = initiate.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error(
      "Gemini did not return an upload URL. Your browser may be blocking a required header; try Demo mode or Chrome."
    );
  }

  onProgress(1, 12, "Uploading media to Gemini…");

  const uploaded = await new Promise<UploadedFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", handleAbort);
      fn();
    };
    function handleAbort() {
      xhr.abort();
      finish(() => reject(abortError()));
    }

    xhr.open("POST", uploadUrl, true);
    xhr.setRequestHeader("X-Goog-Upload-Offset", "0");
    xhr.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = 12 + Math.round((event.loaded / event.total) * 58);
      onProgress(
        1,
        Math.min(72, percent),
        `Uploading media · ${(event.loaded / (1024 * 1024)).toFixed(1)} / ${(event.total / (1024 * 1024)).toFixed(1)} MB`
      );
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        finish(() =>
          reject(new Error(friendlyHttpError(xhr.status, xhr.responseText?.slice(0, 240))))
        );
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as { file?: UploadedFile };
        if (!data.file?.name || !data.file?.uri) throw new Error("Missing file reference");
        finish(() => resolve(data.file as UploadedFile));
      } catch {
        finish(() => reject(new Error("The upload completed, but Gemini returned an invalid file reference.")));
      }
    };
    xhr.onerror = () => finish(() => reject(new Error("Network error while uploading media. Check your connection.")));
    xhr.ontimeout = () => finish(() => reject(new Error("The upload timed out. Try a smaller clip.")));
    signal?.addEventListener("abort", handleAbort, { once: true });
    xhr.send(file);
  });

  onProgress(1, 76, "Gemini is processing the media…");
  let fileState = uploaded.state ?? "PROCESSING";
  let attempts = 0;
  while (fileState === "PROCESSING" && attempts < 90) {
    throwIfAborted(signal);
    await sleep(2000, signal);
    attempts += 1;
    const check = await fetch(`${API_BASE}/${uploaded.name}?key=${encodeURIComponent(apiKey)}`, { signal });
    if (check.ok) {
      const stateData = (await check.json()) as { state?: string };
      fileState = stateData.state ?? fileState;
      onProgress(2, 78, `Gemini is listening · state ${fileState.toLowerCase()}…`);
    }
  }

  if (fileState === "FAILED") {
    throw new Error("Gemini could not decode this media. Try converting it to MP4 or MP3 and retry.");
  }
  if (fileState === "PROCESSING") {
    throw new Error("Gemini media processing took too long. Try a shorter clip or retry.");
  }

  throwIfAborted(signal);
  onProgress(2, 84, "Generating Bengali subtitles and dubbing script…");

  const project = await requestProject({
    apiKey,
    signal,
    onProgress,
    settings,
    glossary,
    file,
    parts: [{ fileData: { mimeType: uploaded.mimeType, fileUri: uploaded.uri } }],
  });

  // Remove the temporary Gemini file; failures here must not hide the result.
  void fetch(`${API_BASE}/${uploaded.name}?key=${encodeURIComponent(apiKey)}`, {
    method: "DELETE",
  }).catch(() => undefined);

  return project;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("Could not read this media file."));
      else resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error("Could not read this media file. Try another format."));
    reader.readAsDataURL(file);
  });
}

interface Part {
  text?: string;
  fileData?: { mimeType: string; fileUri: string };
  inlineData?: { mimeType: string; data: string };
}

export async function runInlinePipeline(options: PipelineOptions): Promise<ProjectResult> {
  const { file, apiKey, settings, glossary, signal, onProgress } = options;
  throwIfAborted(signal);
  if (file.size > INLINE_LIMIT) {
    throw new Error("This file is too large for direct analysis. Try a compressed clip under 12 MB.");
  }

  onProgress(1, 30, `Preparing ${(file.size / (1024 * 1024)).toFixed(1)} MB for direct analysis…`);
  const data = await fileToBase64(file);
  throwIfAborted(signal);
  onProgress(2, 58, "Gemini is listening directly to your media…");

  return requestProject({
    apiKey,
    signal,
    onProgress,
    settings,
    glossary,
    file,
    parts: [{ inlineData: { mimeType: file.type || "application/octet-stream", data } }],
  });
}

async function requestProject({
  apiKey,
  signal,
  onProgress,
  settings,
  glossary,
  file,
  parts,
}: {
  apiKey: string;
  signal?: AbortSignal;
  onProgress: PipelineOptions["onProgress"];
  settings: StudioSettings;
  glossary: GlossaryTerm[];
  file: File;
  parts: Part[];
}): Promise<ProjectResult> {
  throwIfAborted(signal);
  onProgress(2, 84, "Generating Bengali subtitles and dubbing script…");

  const response = await fetch(
    `${API_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [...parts, { text: buildPrompt(settings, glossary) }] }],
        generationConfig: {
          temperature: 0.45,
          responseMimeType: "application/json",
          maxOutputTokens: 65536,
        },
        systemInstruction: {
          parts: [
            {
              text: "You are a meticulous Bengali anime localization director. Return only the requested JSON.",
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(friendlyHttpError(response.status, await readError(response)));
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new Error("Gemini blocked this media. Check that you have rights to process it.");
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text.trim()) {
    throw new Error("Gemini returned an empty result. Try a shorter or clearer clip.");
  }

  const parsed = extractJson(text);
  const segments = normalizeSegments(parsed.segments);
  if (!segments.length) throw new Error("No dialogue was detected in this media. Try a clip with speech.");

  const resultGlossary = Array.isArray(parsed.glossary)
    ? (parsed.glossary as GlossaryTerm[]).filter((term) => term?.source && term?.bangla)
    : glossary;

  onProgress(3, 96, "Running quality audit…");

  const durationMs = Math.max(
    segments[segments.length - 1].end_ms,
    Math.round(
      segments.reduce((longest, segment) => Math.max(longest, segment.end_ms - segment.start_ms), 0)
    )
  );

  return {
    id: `project-${Date.now()}`,
    title_bn: String(parsed.title_bn ?? "বাংলা লোকালাইজেশন"),
    title_en: String(parsed.title_en ?? file.name.replace(/\.[^.]+$/, "")),
    summary_bn: String(parsed.summary_bn ?? "Gemini generated a Bengali localization draft for this media."),
    detected_languages: Array.isArray(parsed.detected_languages)
      ? (parsed.detected_languages as unknown[]).map(String)
      : ["Japanese", "Bengali"],
    segments,
    glossary: resultGlossary,
    fileName: file.name,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    fileType: file.type || "media",
    durationMs,
    contentType: settings.contentType,
    sourceLanguage: settings.sourceLang,
    targetLanguage: "Bengali (bn-BD)",
    createdAt: Date.now(),
    status: "ready",
  };
}
