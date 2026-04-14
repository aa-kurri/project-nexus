import type { Page } from "playwright";
import type { DomNode } from "@nexus/shared-logic";

export async function extractDom(page: Page): Promise<DomNode> {
  return page.evaluate(() => {
    const classify = (el: Element): DomNode["kind"] => {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role")?.toLowerCase();
      const cls = (el.className || "").toString().toLowerCase();
      if (tag === "nav" || role === "navigation") return "nav";
      if (tag === "footer") return "footer";
      if (tag === "form") return "form";
      if (tag === "section" && /hero|banner|jumbotron/.test(cls)) return "hero";
      if (/card/.test(cls)) return "card";
      if (tag === "ul" || tag === "ol") return "list";
      if (tag === "a" && /btn|cta|button/.test(cls)) return "cta";
      if (/feature/.test(cls)) return "feature";
      return "unknown";
    };

    const walk = (el: Element, depth = 0): DomNode | null => {
      if (depth > 4) return null;
      const kind = classify(el);
      if (kind === "unknown" && depth === 0) {
        const children: DomNode[] = [];
        for (const child of Array.from(el.children)) {
          const c = walk(child, depth + 1);
          if (c) children.push(c);
        }
        return { kind: "unknown", children };
      }
      const children: DomNode[] = [];
      for (const child of Array.from(el.children).slice(0, 12)) {
        const c = walk(child, depth + 1);
        if (c && c.kind !== "unknown") children.push(c);
      }
      return {
        kind,
        text: (el.textContent || "").trim().slice(0, 140) || undefined,
        href: (el as HTMLAnchorElement).href || undefined,
        children,
      };
    };

    return walk(document.body) || { kind: "unknown", children: [] };
  });
}
