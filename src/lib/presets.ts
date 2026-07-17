import type { FormatKind } from "./formats";

export type EntranceKind = "none" | "pop" | "fade" | "slam" | "flip";
export type CounterKind = "instant" | "linear" | "ease" | "elastic";
export type EaseName =
  | "none"
  | "power1.out"
  | "power2.out"
  | "power3.out"
  | "power4.out"
  | "expo.out"
  | "back.out(1.7)"
  | "elastic.out(1,0.5)";

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  from: number;
  to: number;
  duration: number;
  fontSize: number;
  letterSpacing: number;
  format: FormatKind;
  entrance: EntranceKind;
  counter: CounterKind;
  ease: EaseName;
  box: boolean;
  glow: boolean;
  /**
   * Extra winlines top-up: after the counter reaches `to`, pause, then add this
   * much more (to -> to + topUp) in a second, punchier tick. Simulates "extra
   * winlines resolved" bumping an already-shown win.
   */
  topUp?: number;
  /** seconds to hold on `to` before the top-up runs (default 0.5). */
  topUpDelay?: number;
}

export type PresetCategory =
  | "Basic tick-ups"
  | "Currency & money"
  | "Multipliers"
  | "Big-win rollups"
  | "Formatting edge cases"
  | "Entrance animations"
  | "Stress & validation";

export const CATEGORIES: PresetCategory[] = [
  "Basic tick-ups",
  "Currency & money",
  "Multipliers",
  "Big-win rollups",
  "Formatting edge cases",
  "Entrance animations",
  "Stress & validation",
];

const base = {
  from: 0,
  fontSize: 96,
  letterSpacing: 0,
  entrance: "none" as EntranceKind,
  counter: "linear" as CounterKind,
  ease: "none" as EaseName,
  box: false,
  glow: false,
};

export const PRESETS: Preset[] = [
  // ── Basic tick-ups ──────────────────────────────────────────────
  { ...base, id: "tick-instant", name: "Instant set", category: "Basic tick-ups", description: "No animation - set the final value immediately. Baseline for glyph rendering.", to: 12345, duration: 0, format: "int", counter: "instant" },
  { ...base, id: "tick-linear", name: "Linear tick-up", category: "Basic tick-ups", description: "Classic count-up from 0 at constant speed.", to: 9999, duration: 2, format: "int", counter: "linear" },
  { ...base, id: "tick-ease", name: "Eased tick-up", category: "Basic tick-ups", description: "Count-up that decelerates toward the final value (power3.out).", to: 25000, duration: 2.5, format: "int", counter: "ease", ease: "power3.out" },
  { ...base, id: "tick-fast", name: "Fast tick (0.6s)", category: "Basic tick-ups", description: "Snappy short count-up - stresses per-frame text rebuilds.", to: 4820, duration: 0.6, format: "comma", counter: "linear" },
  { ...base, id: "tick-slow", name: "Slow tick (8s)", category: "Basic tick-ups", description: "Long, slow rollup - watch for jitter or glyph baseline drift.", to: 100000, duration: 8, format: "comma", counter: "ease", ease: "expo.out" },
  { ...base, id: "tick-frommid", name: "From non-zero", category: "Basic tick-ups", description: "Counts up from an existing balance (5,000 -> 12,500).", from: 5000, to: 12500, duration: 2, format: "comma", counter: "linear" },
  { ...base, id: "tick-comma", name: "Comma grouped", category: "Basic tick-ups", description: "Thousands separator every frame - validates the ',' glyph.", to: 876543, duration: 2.5, format: "comma", counter: "ease", ease: "power2.out" },
  { ...base, id: "tick-topup", name: "Extra winlines top-up", category: "Basic tick-ups", description: "Ticks 0 -> 5,000, holds, then extra winlines add +2,500 in a second punchy bump (0 -> 5,000 -> 7,500).", to: 5000, topUp: 2500, topUpDelay: 0.5, duration: 1.6, format: "comma", counter: "ease", ease: "power3.out" },

  // ── Currency & money ────────────────────────────────────────────
  { ...base, id: "cur-cents", name: "Cents rollup", category: "Currency & money", description: "Two-decimal money value - needs '.' and even digit widths.", to: 1234.56, duration: 2, format: "currency", counter: "ease", ease: "power2.out", box: true },
  { ...base, id: "cur-usd", name: "USD $ prefix", category: "Currency & money", description: "Leading '$' plus grouped cents. Validates '$', ',', '.'.", to: 24999.99, duration: 2.5, format: "currencySign", counter: "ease", ease: "power3.out", box: true },
  { ...base, id: "cur-euro", name: "EUR € suffix", category: "Currency & money", description: "European grouping ('.' thousands, ',' decimals) + '€' suffix.", to: 12345.0, duration: 2.5, format: "euro", counter: "ease", ease: "power2.out", box: true },
  { ...base, id: "cur-credits", name: "CREDITS suffix", category: "Currency & money", description: "Balance styled as CREDITS - needs letter glyphs C R E D I T S.", to: 500000, duration: 3, format: "credits", counter: "ease", ease: "expo.out", box: true },
  { ...base, id: "cur-small", name: "Sub-dollar", category: "Currency & money", description: "Small win under $1.00 - leading-zero + decimals.", to: 0.85, duration: 1.2, format: "currencySign", counter: "linear", box: true },

  // ── Multipliers ─────────────────────────────────────────────────
  { ...base, id: "mult-x", name: "Multiplier x2.50", category: "Multipliers", description: "Decimal multiplier with 'x' suffix - validates the 'x' glyph.", to: 2.5, duration: 1, format: "multiplier", counter: "ease", ease: "back.out(1.7)", box: true, fontSize: 120 },
  { ...base, id: "mult-int", name: "Integer x125", category: "Multipliers", description: "Whole-number multiplier, big and bold.", to: 125, duration: 1.4, format: "multiplierInt", counter: "ease", ease: "power4.out", box: true, glow: true, fontSize: 130 },
  { ...base, id: "mult-climb", name: "Climbing multiplier", category: "Multipliers", description: "Slow climb 1.00x -> 50.00x, tumble-style.", from: 1, to: 50, duration: 4, format: "multiplier", counter: "linear", box: true, fontSize: 110 },
  { ...base, id: "mult-mega", name: "Mega x1000", category: "Multipliers", description: "Huge multiplier with elastic settle + glow.", to: 1000, duration: 1.8, format: "multiplierInt", counter: "elastic", ease: "elastic.out(1,0.5)", box: true, glow: true, fontSize: 150 },

  // ── Big-win rollups ─────────────────────────────────────────────
  { ...base, id: "big-pop", name: "Big win pop", category: "Big-win rollups", description: "Box pops in, then value rolls up with deceleration.", to: 250000, duration: 3, format: "comma", counter: "ease", ease: "expo.out", entrance: "pop", box: true, glow: true, fontSize: 120 },
  { ...base, id: "big-slam", name: "Slam & roll", category: "Big-win rollups", description: "Panel slams down with overshoot, then the number rolls.", to: 1000000, duration: 3.5, format: "comma", counter: "ease", ease: "power4.out", entrance: "slam", box: true, glow: true, fontSize: 110 },
  { ...base, id: "big-abbrev", name: "Abbreviated max", category: "Big-win rollups", description: "Rolls into K/M abbreviation - validates K, M, '.'.", to: 3400000, duration: 3, format: "abbrev", counter: "ease", ease: "expo.out", entrance: "pop", box: true, glow: true, fontSize: 140 },
  { ...base, id: "big-win-suffix", name: "'WIN' rollup", category: "Big-win rollups", description: "Number + ' WIN' label - validates space + W I N glyphs.", to: 88888, duration: 2.8, format: "suffixWin", counter: "ease", ease: "power3.out", entrance: "fade", box: true, glow: true },
  { ...base, id: "big-topup", name: "Big win + extra winlines", category: "Big-win rollups", description: "Rolls 0 -> 100,000, then a second wave of winlines tops it up +65,000 with a scale punch (final 165,000).", to: 100000, topUp: 65000, topUpDelay: 0.6, duration: 3, format: "comma", counter: "ease", ease: "expo.out", entrance: "pop", fontSize: 120 },
  { ...base, id: "cur-topup", name: "Money top-up", category: "Big-win rollups", description: "Currency win $1,200.00 then extra winlines add $480.00 (final $1,680.00). Two-phase cents rollup.", to: 1200, topUp: 480, topUpDelay: 0.5, duration: 2, format: "currencySign", counter: "ease", ease: "power3.out", fontSize: 110 },

  // ── Formatting edge cases ───────────────────────────────────────
  { ...base, id: "edge-spaced", name: "Thin-space groups", category: "Formatting edge cases", description: "Spaces as separators - checks the space advance width.", to: 1234567, duration: 2.5, format: "spaced", counter: "linear" },
  { ...base, id: "edge-decimals", name: "Bare decimals", category: "Formatting edge cases", description: "Plain '.00' with no grouping.", to: 4096.0, duration: 1.5, format: "decimals2", counter: "linear" },
  { ...base, id: "edge-tight", name: "Tight tracking", category: "Formatting edge cases", description: "Negative letter-spacing (-8) - detects glyph overlap/collision.", to: 999999, duration: 2, format: "comma", counter: "linear", letterSpacing: -8 },
  { ...base, id: "edge-loose", name: "Loose tracking", category: "Formatting edge cases", description: "Wide letter-spacing (+24) - detects gaps and mono alignment.", to: 123456, duration: 2, format: "comma", counter: "linear", letterSpacing: 24 },
  { ...base, id: "edge-small", name: "Tiny 24px", category: "Formatting edge cases", description: "Small font size - checks bitmap sharpness / min legibility.", to: 654321, duration: 2, format: "comma", counter: "linear", fontSize: 24 },
  { ...base, id: "edge-huge", name: "Huge 220px", category: "Formatting edge cases", description: "Very large size - checks upscaling blur of the atlas.", to: 7777, duration: 1.6, format: "int", counter: "ease", ease: "power2.out", fontSize: 220 },
  { ...base, id: "edge-allsym", name: "All-symbol probe", category: "Formatting edge cases", description: "Every separator glyph in one string ($ , . x). Pure validation probe.", from: 1234.5, to: 1234.56, duration: 0.4, format: "currencySign", counter: "instant", box: true },

  // ── Entrance animations ─────────────────────────────────────────
  { ...base, id: "ent-pop", name: "Scale pop", category: "Entrance animations", description: "Box scales from 0 with a back-ease overshoot, then ticks.", to: 5000, duration: 1.5, format: "comma", counter: "linear", entrance: "pop", box: true },
  { ...base, id: "ent-fade", name: "Fade in", category: "Entrance animations", description: "Opacity fade then tick - soft reveal.", to: 5000, duration: 1.5, format: "comma", counter: "linear", entrance: "fade", box: true },
  { ...base, id: "ent-slam", name: "Slam down", category: "Entrance animations", description: "Drops from above with a hard landing bounce.", to: 5000, duration: 1.5, format: "comma", counter: "linear", entrance: "slam", box: true },
  { ...base, id: "ent-flip", name: "Flip reveal", category: "Entrance animations", description: "Horizontal flip-in (scaleX 0->1) then tick.", to: 5000, duration: 1.5, format: "comma", counter: "linear", entrance: "flip", box: true },
  { ...base, id: "ent-nobox-tick", name: "Just tick (no box)", category: "Entrance animations", description: "Number only - no panel, no entrance. Just starts ticking.", to: 42000, duration: 2, format: "comma", counter: "linear", box: false },

  // ── Stress & validation ─────────────────────────────────────────
  { ...base, id: "stress-max", name: "Max 7,000,000×", category: "Stress & validation", description: "Long value rolling fast - worst case for per-frame rebuild.", to: 7000000, duration: 1.2, format: "comma", counter: "linear", fontSize: 90 },
  { ...base, id: "stress-elastic", name: "Elastic settle", category: "Stress & validation", description: "Overshoots the target and springs back (elastic ease).", to: 65535, duration: 2.2, format: "comma", counter: "elastic", ease: "elastic.out(1,0.5)", box: true },
  { ...base, id: "stress-repeat", name: "Rapid restart", category: "Stress & validation", description: "Short 0.3s tick - spam Play to test re-entrancy / kill safety.", to: 999, duration: 0.3, format: "int", counter: "linear" },
  { ...base, id: "stress-monoprobe", name: "Mono-width probe", category: "Stress & validation", description: "Cycles 000000 -> 111111 ... values with equal digit count; a non-mono font will shimmy horizontally.", from: 111111, to: 888888, duration: 3, format: "int", counter: "linear", fontSize: 100 },
];

export const PRESETS_BY_CATEGORY = CATEGORIES.map((category) => ({
  category,
  items: PRESETS.filter((p) => p.category === category),
}));
