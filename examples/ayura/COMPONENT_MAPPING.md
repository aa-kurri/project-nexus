# Ayura OS — Component Mapping (Modern Stack)

> Every epic feature → a specific, install-ready component from Shadcn, Aceternity UI, Magic UI, or Tremor.
> For mobile, we prefer primitives from **NativeWind + React Native Reusables**.

## Web — Marketing Landing (ayura.care)

| Section | Source | Component | Install |
|---|---|---|---|
| Hero with animated glow | Aceternity | `Spotlight` + `BackgroundBeams` | copy from [aceternity.com](https://ui.aceternity.com) |
| Product grid (LIMS, HMS) | Aceternity | `HoverEffect` card grid | copy from aceternity |
| Testimonials marquee | Magic UI | `Marquee` | `npx shadcn@latest add "https://magicui.design/r/marquee"` |
| FAQ accordion | Shadcn | `Accordion` | `npx shadcn@latest add accordion` |
| CTA shimmer button | Magic UI | `ShimmerButton` | `npx shadcn@latest add "https://magicui.design/r/shimmer-button"` |
| Channel-partner section | Aceternity | `BentoGrid` | copy from aceternity |
| Footer w/ animated logo cloud | Magic UI | `OrbitingCircles` + `AnimatedBeam` | `npx shadcn@latest add "https://magicui.design/r/orbiting-circles"` |

## Web — App Shell & Navigation

| Feature | Component | Install |
|---|---|---|
| Collapsible sidebar | Shadcn `Sidebar` | `npx shadcn@latest add sidebar` |
| Command palette (Cmd-K) | Shadcn `Command` | `npx shadcn@latest add command` |
| Breadcrumbs | Shadcn `Breadcrumb` | `npx shadcn@latest add breadcrumb` |
| Theme toggle | Shadcn `Dropdown` + next-themes | `npm i next-themes` |
| Toast notifications | Shadcn `Sonner` | `npx shadcn@latest add sonner` |

## E2 · Patient Registry & EMR Core

| Feature | Component | Install / Pattern |
|---|---|---|
| Phone autocomplete w/ dedup | Shadcn `Command` + debounced API | stock |
| Date of birth picker | Shadcn `Calendar` + `Popover` | `npx shadcn@latest add calendar popover` |
| Timeline | **Custom** — vertical timeline with `Framer Motion layoutId`; use Aceternity `TracingBeam` | [aceternity.com/components/tracing-beam](https://ui.aceternity.com/components/tracing-beam) |
| Document vault list | Shadcn `Table` + `ContextMenu` | stock |

## E11 / E12 · AI Clinical Assistant (Scribe & Copilot)

| Feature | Component | Install / Pattern |
|---|---|---|
| Right-Rail Copilot Chat | Shadcn `Sheet` + `ScrollArea` | streaming responses from `ai` SDK |
| Scribe Voice Visualizer | Magic UI `AnimatedBeam` | Custom linked to MediaStream volume |

## E3 · OPD Queue & Booking

| Feature | Component | Install |
|---|---|---|
| Live queue board (TV-wall) | **Custom** Tailwind grid | driven by Supabase Realtime |
| Doctor calendar | `FullCalendar` React or `react-big-calendar` | `npm i @fullcalendar/react` |
| Slot picker | Shadcn `Popover` + `Calendar` | stock |
| Video consult surface | `daily-co/react` with Shadcn `Sheet` | `npm i @daily-co/daily-react` |

## E4 · IPD Bed Board

| Feature | Component | Install |
|---|---|---|
| Drag-drop bed tiles | `@dnd-kit/core` + Shadcn `Card` | `npm i @dnd-kit/core` |
| Nursing notes drawer | Shadcn `Sheet` | `npx shadcn@latest add sheet` |
| Vital-sign charts | Tremor `LineChart` | `npm i @tremor/react` |

## E5 · Pharmacy Maintenance

| Feature | Component | Install |
|---|---|---|
| Multi-store inventory table | Tremor `Table` | `npm i @tremor/react` |
| Expiry alert banner | Shadcn `Alert` + red semantic | stock |
| Stock reconciliation wizard | Shadcn `Stepper` | stock |
| Barcode input | Shadcn `Input` with ref + keyboard handler | stock |
| Batch picker | Shadcn `Select` | `npx shadcn@latest add select` |

## E6 · LIMS

| Feature | Component | Install |
|---|---|---|
| Worklist table | Tremor `Table` | `@tremor/react` |
| Barcode printing | `bwip-js` with server-side PDF render | `npm i bwip-js` |
| Levey–Jennings QC chart | Tremor `LineChart` with custom reference lines | stock |
| HL7 connection status pill | Shadcn `Badge` with pulsing dot | stock |

## E7 · Billing

| Feature | Component | Install |
|---|---|---|
| Itemized bill table | Shadcn `Table` with row-level actions | stock |
| GST breakdown | Shadcn `HoverCard` on tax badge | stock |
| Claim form wizard | Shadcn `Stepper` pattern | stock |
| Payment modal | `Razorpay` hosted w/ Shadcn `Dialog` | stock |

## E8 · Patient Mobile App (React Native)

| Feature | Component | Install |
|---|---|---|
| Login OTP screen | RN Reusables `Input`, NativeWind | `npm i nativewind` |
| Bottom tabs | `expo-router` Tabs | built-in |
| Report viewer w/ PDF | `react-native-pdf` | stock |
| Offline cache | `WatermelonDB` + Supabase sync | `npm i @nozbe/watermelondb` |
| Biometric lock | `expo-local-authentication` | `npx expo install expo-local-authentication` |

## E9 · Analytics Dashboards

| Feature | Component | Install |
|---|---|---|
| Revenue/Pharmacy cards | Tremor `Card` + `Metric` + `Sparkline` | stock |
| Drug consumption funnel | Tremor `FunnelChart` | stock |
| Drill-down table | Tremor `Table` + Shadcn `Sheet` | stock |

## Theme Tokens (applied to both Tailwind + NativeWind)

```ts
// packages/shared-logic/src/theme.ts
export const tokens = {
  colors: {
    primary:     { DEFAULT: "#0F766E", foreground: "#ffffff" }, // Ayura Teal
    primaryDark: "#115E59",
    bg:          { light: "#F8FAFC", dark: "#020617" },
    surface:     { light: "#FFFFFF", dark: "#0F172A" },
    border:      { light: "#E2E8F0", dark: "#1E293B" },
    muted:       { light: "#64748B", dark: "#94A3B8" },
  },
  radii:  { sm: 4, md: 8, lg: 12, pill: 9999 },
  fonts:  { display: "Outfit", body: "Inter" },
};
```
