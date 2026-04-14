import type { Page } from "playwright";
import type { z } from "zod";
import { FormPatternSchema } from "@nexus/shared-logic";

type FormPattern = z.infer<typeof FormPatternSchema>;

export async function extractForms(page: Page): Promise<FormPattern[]> {
  const raw = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("form")).slice(0, 8).map(f => ({
      action: f.getAttribute("action"),
      fields: Array.from(f.querySelectorAll("input,select,textarea")).map(el => {
        const i = el as HTMLInputElement;
        return {
          name: i.name || i.id || i.type,
          type: i.type || "text",
          required: i.required,
          autocomplete: i.autocomplete || "",
          placeholder: i.placeholder || "",
        };
      }),
    }));
  });

  return raw.map(r => {
    const names = r.fields.map(f => `${f.name} ${f.autocomplete} ${f.type}`.toLowerCase()).join(" ");
    const purpose: FormPattern["purpose"] =
      /password.*confirm|register|sign.?up|create.?account/.test(names) ? "auth_signup" :
      /password|sign.?in|login/.test(names) ? "auth_login" :
      /cc|card|checkout|billing|stripe/.test(names) ? "checkout" :
      /search|query/.test(names) ? "search" :
      /newsletter|subscribe/.test(names) ? "newsletter" :
      /message|contact|email.*subject/.test(names) ? "contact" :
      "other";

    return {
      purpose,
      action: r.action,
      fields: r.fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required,
        validation: f.autocomplete || undefined,
      })),
    };
  });
}
