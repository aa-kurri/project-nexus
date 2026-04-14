import type { Page } from "playwright";
import type { z } from "zod";
import { DesignTokensSchema } from "@nexus/shared-logic";

type Tokens = z.infer<typeof DesignTokensSchema>;

export async function extractTokens(page: Page): Promise<Tokens> {
  return page.evaluate(() => {
    const colorBag = new Map<string, number>();
    const fontBag  = new Map<string, number>();
    const sizeBag  = new Map<string, number>();
    const radiusBag = new Map<number, number>();
    const spacingBag = new Map<number, number>();

    const inc = <K,>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) || 0) + 1);
    const toPx = (s: string) => parseFloat(s) || 0;

    for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 1200)) {
      const cs = getComputedStyle(el);
      inc(colorBag, cs.color);
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") inc(colorBag, cs.backgroundColor);
      inc(fontBag,  cs.fontFamily.split(",")[0].trim().replace(/["']/g, ""));
      inc(sizeBag,  cs.fontSize);
      const r = toPx(cs.borderTopLeftRadius); if (r) inc(radiusBag, r);
      const p = toPx(cs.paddingTop); if (p) inc(spacingBag, p);
    }

    const top = <K,>(m: Map<K, number>, n: number) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

    const colors = top(colorBag, 8) as string[];
    const primary = colors.slice(0, 3);
    const neutral = colors.slice(3);

    const fontSizes = top(sizeBag, 6) as string[];
    const scaleNames = ["xs", "sm", "base", "lg", "xl", "2xl"];

    return {
      colors: { primary, neutral, semantic: {} },
      typography: {
        families: top(fontBag, 3) as string[],
        scale: fontSizes.map((size, i) => ({
          name: scaleNames[i] ?? `s${i}`,
          size,
          lineHeight: "1.5",
        })),
      },
      spacing: top(spacingBag, 8) as number[],
      radii: top(radiusBag, 4) as number[],
    };
  });
}
