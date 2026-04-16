import axios from "axios";

/**
 * Sarvam AI Service Provider
 * Specialized in Indian regional languages (Telugu, Hindi, etc.)
 */
export class SarvamService {
  private apiKey: string;
  private baseUrl = "https://api.sarvam.ai";

  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY || "";
  }

  /**
   * Translate text between English and Indian languages
   */
  async translate(
    input: string | string[],
    sourceLanguageCode: string = "en-IN",
    targetLanguageCode: string = "te-IN"
  ) {
    const response = await axios.post(
      `${this.baseUrl}/translate`,
      {
        input: Array.isArray(input) ? input : [input],
        source_language_code: sourceLanguageCode,
        target_language_code: targetLanguageCode,
        model: "mayura:v1",
      },
      {
        headers: {
          "api-subscription-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  /**
   * Speech to Text using Sarvam's saaras model
   */
  async speechToText(audioFile: Buffer, languageCode: string = "te-IN") {
    const formData = new FormData();
    const blob = new Blob([audioFile], { type: "audio/wav" });
    formData.append("file", blob, "audio.wav");
    formData.append("model", "saaras:v3");
    formData.append("language_code", languageCode);

    const response = await axios.post(`${this.baseUrl}/speech-to-text`, formData, {
      headers: {
        "api-subscription-key": this.apiKey,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Text to Speech using Sarvam's bulbul model
   */
  async textToSpeech(text: string, targetLanguageCode: string = "te-IN") {
    const response = await axios.post(
      `${this.baseUrl}/text-to-speech`,
      {
        text,
        target_language_code: targetLanguageCode,
        model: "bulbul:v3",
      },
      {
        headers: {
          "api-subscription-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // { audios: [base64_string] }
  }

  /**
   * OpenAI-compatible Chat Completion using Sarvam-105B
   */
  async chat(messages: { role: string; content: string }[], model: string = "sarvam-105b") {
    const response = await axios.post(
      `${this.baseUrl}/v1/chat/completions`,
      {
        model,
        messages,
      },
      {
        headers: {
          "api-subscription-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }
}
