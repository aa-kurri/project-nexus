import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

/**
 * AI Scribe Chain
 * Transcribes transcript into structured SOAP notes using Claude API.
 */
export async function processScribeTranscript(
  transcript: string,
  language: string = "english"
): Promise<{
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  diagnosis_suggestions: string[];
}> {
  const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20240620",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `You are a clinical AI scribe for Ayura OS. 
Your task is to convert a raw doctor-patient consultation transcript into a structured SOAP note.

Input Language: ${language}

Output format must be valid JSON:
{
  "soap": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "diagnosis_suggestions": ["..."]
}

Guidelines:
- Output SOAP note must be in English for clinical record consistency, regardless of input language.
- Subjective: Symptoms, history, patient concerns.
- Objective: Physical exam findings, vitals (if mentioned).
- Assessment: Possible diagnoses or clinical impression.
- Plan: Medications prescribed, tests ordered, follow-up.
- Use professional medical terminology.`;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    humanMessage(transcript),
  ]);

  try {
    const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    return JSON.parse(rawContent);
  } catch (e) {
    console.error("Failed to parse AI Scribe response", response.content);
    throw new Error("Invalid AI response format");
  }
}

function humanMessage(text: string) {
  return new HumanMessage(text);
}
