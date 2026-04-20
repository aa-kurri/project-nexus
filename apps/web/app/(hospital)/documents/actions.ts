"use server";

// ── Sarvam AI Document Intelligence ──────────────────────────────────────────
// API Reference: https://docs.sarvam.ai
// Endpoints used:
//   POST /translate       — multilingual text translation (22 Indian languages)
//   POST /parse-document  — OCR + structured text extraction from images / PDFs
//
// Set SARVAM_API_KEY in apps/web/.env.local to activate real API calls.
// Without the key, actions return a descriptive error (never crash).

import { createClient } from "@/utils/supabase/server";

const SARVAM_BASE = "https://api.sarvam.ai";

function getSarvamKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("SARVAM_API_KEY is not configured in .env.local");
  return key;
}

// ── Language catalogue (Sarvam-supported codes) ───────────────────────────────

export const LANGUAGE_OPTIONS = [
  { code: "en-IN", label: "English",              script: "Latin"      },
  { code: "hi-IN", label: "Hindi (हिन्दी)",       script: "Devanagari" },
  { code: "ta-IN", label: "Tamil (தமிழ்)",         script: "Tamil"      },
  { code: "te-IN", label: "Telugu (తెలుగు)",       script: "Telugu"     },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)",       script: "Kannada"    },
  { code: "ml-IN", label: "Malayalam (മലയാളം)",    script: "Malayalam"  },
  { code: "bn-IN", label: "Bengali (বাংলা)",        script: "Bengali"    },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)",     script: "Gujarati"   },
  { code: "mr-IN", label: "Marathi (मराठी)",        script: "Devanagari" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)",       script: "Gurmukhi"   },
  { code: "od-IN", label: "Odia (ଓଡ଼ିଆ)",           script: "Odia"       },
] as const;

export type LangCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

// ── translateText ─────────────────────────────────────────────────────────────

export interface TranslateResult {
  ok:             true;
  translatedText: string;
  sourceText:     string;
  sourceLang:     string;
  targetLang:     string;
}

export async function translateText(
  input:         string,
  sourceLang:    string,
  targetLang:    string,
  speakerGender: "Male" | "Female" = "Female",
): Promise<TranslateResult | { ok: false; error: string }> {
  const text = input.trim();
  if (!text)            return { ok: false, error: "Input text is required" };
  if (text.length > 5000)
    return { ok: false, error: "Text must be ≤ 5 000 characters. Split into sections for longer documents." };
  if (sourceLang === targetLang)
    return { ok: false, error: "Source and target language must differ" };

  try {
    const res = await fetch(`${SARVAM_BASE}/translate`, {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "api-subscription-key":  getSarvamKey(),
      },
      body: JSON.stringify({
        input,
        source_language_code: sourceLang,
        target_language_code: targetLang,
        speaker_gender:       speakerGender,
        mode:                 "formal",           // suitable for clinical text
        enable_preprocessing: true,
      }),
    });

    if (!res.ok) {
      if (res.status === 401)
        return { ok: false, error: "Sarvam API key invalid — update SARVAM_API_KEY in .env.local" };
      const body = await res.text();
      return { ok: false, error: `Sarvam API ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = (await res.json()) as { translated_text: string };
    return {
      ok:             true,
      translatedText: data.translated_text,
      sourceText:     input,
      sourceLang,
      targetLang,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Translation request failed" };
  }
}

// ── ocrDocument ───────────────────────────────────────────────────────────────

export interface OcrResult {
  ok:         true;
  text:       string;
  confidence: number;    // 0–1
  language:   string;    // detected language code
  pageCount:  number;
  structured: {
    docType:  string | null;
    fields:   Record<string, string>;
  };
}

export async function ocrDocument(
  formData: FormData,
): Promise<OcrResult | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "No file provided" };
  if (file.size > 20 * 1024 * 1024)
    return { ok: false, error: "File must be ≤ 20 MB" };

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/tiff", "application/pdf"];
  if (!allowed.includes(file.type))
    return { ok: false, error: "Accepted formats: JPEG, PNG, WebP, TIFF, PDF" };

  try {
    const body = new FormData();
    body.append("file",          file);
    body.append("language_code", "auto"); // auto-detect script/language

    // Sarvam parse-document endpoint — verify exact path at docs.sarvam.ai
    const res = await fetch(`${SARVAM_BASE}/parse-document`, {
      method:  "POST",
      headers: { "api-subscription-key": getSarvamKey() },
      body,
    });

    if (!res.ok) {
      if (res.status === 401)
        return { ok: false, error: "Sarvam API key invalid — update SARVAM_API_KEY in .env.local" };
      if (res.status === 404)
        return { ok: false, error: "OCR endpoint not found — check docs.sarvam.ai for current path" };
      const errBody = await res.text();
      return { ok: false, error: `Sarvam OCR ${res.status}: ${errBody.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      text:               string;
      confidence?:        number;
      detected_language?: string;
      page_count?:        number;
      structured?:        { doc_type?: string; fields?: Record<string, string> };
    };

    return {
      ok:         true,
      text:       data.text ?? "",
      confidence: data.confidence ?? 0.85,
      language:   data.detected_language ?? "en-IN",
      pageCount:  data.page_count ?? 1,
      structured: {
        docType: data.structured?.doc_type ?? null,
        fields:  data.structured?.fields   ?? {},
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "OCR request failed" };
  }
}

// ── saveOcrResult ─────────────────────────────────────────────────────────────
// Persists OCR output back to patient_documents row.

export async function saveOcrResult(
  documentId: string,
  correctedText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!documentId)   return { ok: false, error: "documentId required" };
  if (!correctedText.trim()) return { ok: false, error: "correctedText required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_documents")
    .update({ ocr_text: correctedText, ocr_reviewed: true })
    .eq("id", documentId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── saveTranslation ───────────────────────────────────────────────────────────
// Stores a translation in the document_translations table.

export async function saveTranslation(payload: {
  documentId?:     string;
  sourceText:      string;
  translatedText:  string;
  sourceLang:      string;
  targetLang:      string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_translations")
    .insert({
      document_id:     payload.documentId ?? null,
      source_text:     payload.sourceText,
      translated_text: payload.translatedText,
      source_lang:     payload.sourceLang,
      target_lang:     payload.targetLang,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}
