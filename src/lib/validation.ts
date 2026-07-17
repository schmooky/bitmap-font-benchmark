import type { BitmapFont } from "pixi.js";
import { getInstalledFont } from "./fonts";

export interface GlyphCheck {
  char: string;
  label: string;
  present: boolean;
  advance: number | null;
  width: number | null;
}

export interface JumpResult {
  /** true when every present digit shares one advance width. */
  isMono: boolean;
  /** true when digits differ enough in width that a tick-up will jitter. */
  willJump: boolean;
  /** worst-case horizontal shift per digit change, in font px. */
  jumpPx: number;
  advances: { digit: string; advance: number; present: boolean }[];
  minAdvance: number;
  maxAdvance: number;
  spread: number;
  /** the two digits responsible for the widest gap, e.g. "1 vs 0". */
  widestPair: string | null;
}

export interface FontReport {
  fontFamily: string;
  found: boolean;
  glyphCount: number;
  lineHeight: number;
  /** every digit 0-9 present - required to render a counter at all. */
  canTick: boolean;
  missingDigits: string[];
  digits: GlyphCheck[];
  separators: GlyphCheck[];
  letters: GlyphCheck[];
  jump: JumpResult;
}

/** Characters that slot number displays commonly rely on. */
const SEPARATORS: { char: string; label: string }[] = [
  { char: ",", label: "Comma (thousands)" },
  { char: ".", label: "Period (decimal)" },
  { char: "x", label: "Lowercase x (multiplier)" },
  { char: "$", label: "Dollar sign" },
  { char: "€", label: "Euro sign" },
  { char: " ", label: "Space" },
];

const LETTERS: { char: string; label: string }[] = [
  ..."WIN".split("").map((c) => ({ char: c, label: `'${c}' (WIN)` })),
  ..."KMB".split("").map((c) => ({ char: c, label: `'${c}' (abbrev)` })),
];

function checkChar(font: BitmapFont, char: string, label: string): GlyphCheck {
  const data = font.chars[char];
  return {
    char,
    label,
    present: !!data,
    advance: data ? Math.round(data.xAdvance * 100) / 100 : null,
    width: data?.texture ? Math.round(data.texture.width * 100) / 100 : null,
  };
}

export function analyzeFont(fontFamily: string): FontReport {
  const font = getInstalledFont(fontFamily);
  if (!font) {
    return {
      fontFamily,
      found: false,
      glyphCount: 0,
      lineHeight: 0,
      canTick: false,
      missingDigits: "0123456789".split(""),
      digits: [],
      separators: [],
      letters: [],
      jump: {
        isMono: false,
        willJump: false,
        jumpPx: 0,
        advances: [],
        minAdvance: 0,
        maxAdvance: 0,
        spread: 0,
        widestPair: null,
      },
    };
  }

  const digits: GlyphCheck[] = [];
  for (let i = 0; i <= 9; i++) {
    const c = String(i);
    digits.push(checkChar(font, c, `Digit ${c}`));
  }

  const advances = digits.map((d) => ({
    digit: d.char,
    advance: d.advance ?? 0,
    present: d.present,
  }));
  const present = advances.filter((a) => a.present);
  const vals = present.map((a) => a.advance);
  const minAdvance = vals.length ? Math.min(...vals) : 0;
  const maxAdvance = vals.length ? Math.max(...vals) : 0;
  const spread = Math.round((maxAdvance - minAdvance) * 100) / 100;
  // sub-pixel tolerance - rasterised fonts can round by a fraction
  const isMono = present.length > 1 && spread <= 0.5;
  const willJump = present.length > 1 && spread > 0.5;

  let widestPair: string | null = null;
  if (willJump) {
    const widest = present.reduce((a, b) => (b.advance > a.advance ? b : a));
    const narrowest = present.reduce((a, b) => (b.advance < a.advance ? b : a));
    widestPair = `'${narrowest.digit}' (${narrowest.advance}) -> '${widest.digit}' (${widest.advance})`;
  }

  const missingDigits = digits.filter((d) => !d.present).map((d) => d.char);

  return {
    fontFamily,
    found: true,
    glyphCount: Object.keys(font.chars).length,
    lineHeight: Math.round(font.lineHeight * 100) / 100,
    canTick: missingDigits.length === 0,
    missingDigits,
    digits,
    separators: SEPARATORS.map((s) => checkChar(font, s.char, s.label)),
    letters: LETTERS.map((s) => checkChar(font, s.char, s.label)),
    jump: { isMono, willJump, jumpPx: spread, advances, minAdvance, maxAdvance, spread, widestPair },
  };
}

/** Which of a preset's required chars are missing from the font. */
export function missingChars(fontFamily: string, chars: string[]): string[] {
  const font = getInstalledFont(fontFamily);
  if (!font) return chars;
  return chars.filter((c) => c !== " " && !font.chars[c]);
}
