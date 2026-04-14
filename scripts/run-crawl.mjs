// Standalone ghost-crawl runner for Project Nexus.
// Reads creds from .env.local (via node --env-file), logs into the target,
// extracts a CrawlArtifact, and writes it to examples/<host>/crawl.json.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = resolve(HERE, "..", "examples");

const URL_TARGET = process.env.VAIDYO_URL ?? "https://www.vaidyo.in/";
const USERNAME   = process.env.VAIDYO_USER ?? "";
const PASSWORD   = process.env.VAIDYO_PASSWORD ?? "";
const HEADED     = String(process.env.CRAWL_HEADED ?? "true") === "true";
const TIMEOUT    = Number(process.env.CRAWL_TIMEOUT_MS ?? 45000);

if (!USERNAME || !PASSWORD) {
  console.error("❌ VAIDYO_USER / VAIDYO_PASSWORD missing in .env.local");
  process.exit(1);
}

const host = new URL(URL_TARGET).hostname.replace(/^www\./, "");
const outDir = resolve(OUT_ROOT, host.split(".")[0]);
await mkdir(outDir, { recursive: true });

const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

log(`🚀 Launching Chromium (headed=${HEADED})`);
const browser = await chromium.launch({ headless: !HEADED, slowMo: HEADED ? 50 : 0 });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 NexusGhost/1.0",
});
const page = await ctx.newPage();

try {
  log(`🌐 Navigating to ${URL_TARGET}`);
  await page.goto(URL_TARGET, { waitUntil: "networkidle", timeout: TIMEOUT });

  // ── Login attempt (heuristic: find a login link, fill username+password) ──
  log("🔐 Looking for login affordance");
  const loginTrigger = page.locator(
    'a:has-text("Login"), a:has-text("Sign in"), a:has-text("Log in"), button:has-text("Login")'
  ).first();

  if (await loginTrigger.count()) {
    await loginTrigger.click().catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: TIMEOUT }).catch(() => {});
  }

  const userField = page
    .locator('input[type="text"], input[type="email"], input[name*="user" i], input[name*="email" i], input[id*="user" i]')
    .first();
  const passField = page.locator('input[type="password"]').first();

  if (await userField.count() && await passField.count()) {
    log("✍️  Filling credentials");
    await userField.fill(USERNAME);
    await passField.fill(PASSWORD);

    const submit = page
      .locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")')
      .first();
    if (await submit.count()) {
      await Promise.all([
        page.waitForLoadState("networkidle", { timeout: TIMEOUT }).catch(() => {}),
        submit.click(),
      ]);
    } else {
      await passField.press("Enter").catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: TIMEOUT }).catch(() => {});
    }
    log(`✅ Post-login URL: ${page.url()}`);
  } else {
    log("⚠️  No login fields detected — continuing as guest");
  }

  // Small settle delay for SPAs.
  await page.waitForTimeout(1500);

  // ── Extractors (inlined) ──────────────────────────────────────────
  log("📐 Extracting DOM tree");
  const domTree = await page.evaluate(() => {
    const classify = (el) => {
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
    const walk = (el, depth = 0) => {
      if (depth > 4) return null;
      const kind = classify(el);
      const children = [];
      for (const c of Array.from(el.children).slice(0, 14)) {
        const sub = walk(c, depth + 1);
        if (sub && (sub.kind !== "unknown" || sub.children.length)) children.push(sub);
      }
      return {
        kind,
        text: (el.textContent || "").trim().slice(0, 160) || undefined,
        href: el.href || undefined,
        children,
      };
    };
    return walk(document.body) || { kind: "unknown", children: [] };
  });

  log("🎨 Extracting design tokens");
  const designTokens = await page.evaluate(() => {
    const colorBag = new Map(), fontBag = new Map(), sizeBag = new Map(), radiusBag = new Map(), spacingBag = new Map();
    const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);
    const px = (s) => parseFloat(s) || 0;
    for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 1500)) {
      const cs = getComputedStyle(el);
      inc(colorBag, cs.color);
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") inc(colorBag, cs.backgroundColor);
      inc(fontBag, cs.fontFamily.split(",")[0].trim().replace(/["']/g, ""));
      inc(sizeBag, cs.fontSize);
      const r = px(cs.borderTopLeftRadius); if (r) inc(radiusBag, r);
      const p = px(cs.paddingTop); if (p) inc(spacingBag, p);
    }
    const top = (m, n) => [...m.entries()].sort((a,b) => b[1]-a[1]).slice(0, n).map(([k]) => k);
    const colors = top(colorBag, 10);
    const sizes  = top(sizeBag, 6);
    const names  = ["xs","sm","base","lg","xl","2xl"];
    return {
      colors: { primary: colors.slice(0,3), neutral: colors.slice(3), semantic: {} },
      typography: {
        families: top(fontBag, 3),
        scale: sizes.map((size, i) => ({ name: names[i] ?? `s${i}`, size, lineHeight: "1.5" })),
      },
      spacing: top(spacingBag, 8),
      radii:   top(radiusBag, 4),
    };
  });

  log("🔎 Extracting SEO");
  const seo = await page.evaluate(() => {
    const meta = (n) =>
      document.querySelector(`meta[name="${n}"]`)?.getAttribute("content") ||
      document.querySelector(`meta[property="${n}"]`)?.getAttribute("content") ||
      null;
    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(m => {
      og[m.getAttribute("property")] = m.getAttribute("content") || "";
    });
    const jsonLd = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try { jsonLd.push(JSON.parse(s.textContent || "null")); } catch {}
    });
    return {
      title: document.title || null,
      description: meta("description"),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || null,
      og, jsonLd,
    };
  });

  log("📝 Extracting forms");
  const forms = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("form")).slice(0, 10).map(f => {
      const fields = Array.from(f.querySelectorAll("input,select,textarea")).map(el => ({
        name: el.name || el.id || el.type,
        type: el.type || "text",
        required: el.required,
        autocomplete: el.autocomplete || "",
      }));
      const joined = fields.map(x => `${x.name} ${x.autocomplete} ${x.type}`.toLowerCase()).join(" ");
      const purpose =
        /password.*confirm|register|sign.?up|create.?account/.test(joined) ? "auth_signup" :
        /password|sign.?in|login/.test(joined) ? "auth_login" :
        /cc|card|checkout|billing|stripe/.test(joined) ? "checkout" :
        /search|query/.test(joined) ? "search" :
        /newsletter|subscribe/.test(joined) ? "newsletter" :
        /message|contact|email.*subject/.test(joined) ? "contact" : "other";
      return {
        purpose,
        action: f.getAttribute("action"),
        fields: fields.map(({ autocomplete, ...r }) => ({ ...r, validation: autocomplete || undefined })),
      };
    });
  });

  // ── Crawl linked pages (internal only, limited depth) ─────────────
  log("🕸️  Harvesting internal links");
  const origin = new URL(URL_TARGET).origin;
  const internalLinks = Array.from(new Set(await page.evaluate(org =>
    Array.from(document.querySelectorAll("a[href]"))
      .map(a => a.href)
      .filter(h => h.startsWith(org))
      .filter(h => !/\.(png|jpg|jpeg|svg|pdf|gif|zip|webp)$/i.test(h)),
    origin
  ))).slice(0, 12);

  const pagesMap = {};
  for (const href of internalLinks) {
    try {
      log(`  → ${href}`);
      await page.goto(href, { waitUntil: "networkidle", timeout: TIMEOUT });
      pagesMap[href] = {
        title: await page.title(),
        h1: await page.locator("h1").first().textContent().catch(() => null),
        headings: await page.evaluate(() =>
          Array.from(document.querySelectorAll("h1,h2,h3")).slice(0, 25).map(h => ({
            level: h.tagName,
            text: (h.textContent || "").trim().slice(0, 140),
          }))
        ),
      };
    } catch (err) {
      pagesMap[href] = { error: String(err).slice(0, 200) };
    }
  }

  // ── Screenshot homepage after login ───────────────────────────────
  log("📸 Screenshot");
  await page.goto(URL_TARGET, { waitUntil: "networkidle", timeout: TIMEOUT }).catch(() => {});
  await page.screenshot({ path: resolve(outDir, "home.png"), fullPage: true });

  const artifact = {
    url: URL_TARGET,
    fetchedAt: new Date().toISOString(),
    authUsed: true,
    authUser: USERNAME,
    domTree,
    designTokens,
    seo,
    forms,
    pages: pagesMap,
  };

  await writeFile(resolve(outDir, "crawl.json"), JSON.stringify(artifact, null, 2));
  log(`💾 Wrote ${resolve(outDir, "crawl.json")}`);
  log(`✨ Done. Pages crawled: ${Object.keys(pagesMap).length}`);
} catch (err) {
  console.error("❌ Crawl failed:", err);
  await page.screenshot({ path: resolve(outDir, "error.png") }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
