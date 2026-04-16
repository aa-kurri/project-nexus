import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

/**
 * WhatsApp AI Concierge Chain
 * Handles patient queries, scheduling requests, and general info.
 */
export async function processWhatsAppMessage(
  patientId: string,
  message: string,
  tenantContext: string
): Promise<{
  reply: string;
  actions: {
    type: "BOOK_APPOINTMENT" | "VIEW_REPORTS" | "NONE";
    data?: any;
  }[];
}> {
  const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20240620",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `You are the AI Concierge for Ayura OS at ${tenantContext}.
Your goal is to assist patients via WhatsApp.

Tone: Helpful, professional, and empathetic. Language: English and Hindi (if patient writes in Hindi).

Current Patient ID: ${patientId}

Capabilities:
1. Answer hospital info (hours, location).
2. Help with appointment scheduling (suggesting booking link).
3. Directing to view reports.

Output format must be valid JSON:
{
  "reply": "...",
  "actions": [
    { "type": "...", "data": {} }
  ]
}

If a patient wants to book, use action "BOOK_APPOINTMENT".`;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(message),
  ]);

  try {
    const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    return JSON.parse(rawContent);
  } catch (e) {
    return {
      reply: "I'm sorry, I'm having trouble processing that right now. How else can I help you?",
      actions: []
    };
  }
}
