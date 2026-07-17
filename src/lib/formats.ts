export type FormatKind =
  | "int"
  | "comma"
  | "currency"
  | "currencySign"
  | "decimals2"
  | "multiplier"
  | "multiplierInt"
  | "abbrev"
  | "suffixWin"
  | "spaced"
  | "euro"
  | "credits";

export interface FormatMeta {
  label: string;
  /** Characters (beyond 0-9) that the format can emit - used by validation. */
  extraChars: string[];
  sample: string;
}

export const FORMAT_META: Record<FormatKind, FormatMeta> = {
  int: { label: "Integer", extraChars: [], sample: "12345" },
  comma: { label: "Comma grouped", extraChars: [","], sample: "12,345" },
  currency: { label: "Currency (2dp)", extraChars: [",", "."], sample: "12,345.00" },
  currencySign: { label: "USD $ prefix", extraChars: ["$", ",", "."], sample: "$12,345.00" },
  decimals2: { label: "2 decimals", extraChars: ["."], sample: "12345.00" },
  multiplier: { label: "Multiplier x (2dp)", extraChars: [".", "x"], sample: "12.50x" },
  multiplierInt: { label: "Multiplier x (int)", extraChars: ["x"], sample: "125x" },
  abbrev: { label: "Abbreviated K/M/B", extraChars: [".", "K", "M", "B"], sample: "1.2M" },
  suffixWin: { label: "WIN suffix", extraChars: [",", " ", "W", "I", "N"], sample: "12,345 WIN" },
  spaced: { label: "Thin-space grouped", extraChars: [" "], sample: "12 345" },
  euro: { label: "EUR € suffix", extraChars: ["€", ",", "."], sample: "12.345,00€" },
  credits: { label: "CREDITS suffix", extraChars: [",", " ", "C", "R", "E", "D", "I", "T", "S"], sample: "12,345 CREDITS" },
};

function grp(intPart: string, sep: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function formatValue(value: number, kind: FormatKind): string {
  const v = Math.max(0, value);
  switch (kind) {
    case "int":
      return Math.floor(v).toString();
    case "comma":
      return grp(Math.floor(v).toString(), ",");
    case "spaced":
      return grp(Math.floor(v).toString(), " ");
    case "decimals2":
      return v.toFixed(2);
    case "currency": {
      const [i, d] = v.toFixed(2).split(".");
      return `${grp(i, ",")}.${d}`;
    }
    case "currencySign": {
      const [i, d] = v.toFixed(2).split(".");
      return `$${grp(i, ",")}.${d}`;
    }
    case "euro": {
      // European convention: '.' thousands, ',' decimals, '€' suffix
      const [i, d] = v.toFixed(2).split(".");
      return `${grp(i, ".")},${d}€`;
    }
    case "multiplier":
      return `${v.toFixed(2)}x`;
    case "multiplierInt":
      return `${Math.floor(v)}x`;
    case "suffixWin":
      return `${grp(Math.floor(v).toString(), ",")} WIN`;
    case "credits":
      return `${grp(Math.floor(v).toString(), ",")} CREDITS`;
    case "abbrev": {
      if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
      if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
      if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
      return Math.floor(v).toString();
    }
  }
}

/** Every distinct glyph a format+range could ever render (for validation). */
export function charsForFormat(kind: FormatKind): string[] {
  const digits = "0123456789".split("");
  return Array.from(new Set([...digits, ...FORMAT_META[kind].extraChars]));
}
