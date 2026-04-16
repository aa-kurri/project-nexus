import { SarvamService } from "../services/sarvam";

/**
 * Regional Assistant Agent
 * Uses Sarvam-105B to provide medical and operational assistance in regional Indian languages.
 */
export class RegionalAssistantAgent {
  private sarvam: SarvamService;

  constructor() {
    this.sarvam = new SarvamService();
  }

  async ask(query: string, language: string = "telugu", context?: string) {
    const systemPrompt = `You are a helpful AI Assistant for Ayura OS, a modern hospital management platform.
You are helping hospital staff and patients in India.

Primary Language: ${language}
Role: Operational Assistant (scheduling, info, help)
Voice: Professional, polite, regional nuance.

Context: ${context || "General hospital operations"}

Guidelines:
- If asked in ${language}, respond primarily in ${language}.
- If the hospital is a regional one in Andhra Pradesh/Telangana, prioritize Telugu.
- Provide clear, actionable help.`;

    const response = await this.sarvam.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ]);

    return {
      reply: response.choices[0].message.content,
      model: response.model,
      language: language
    };
  }
}
