import {
  Check,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Ban,
} from "lucide-react";
import type { FontReport, GlyphCheck } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function GlyphChip({ g }: { g: GlyphCheck }) {
  const display = g.char === " " ? "SP" : g.char;
  return (
    <div
      title={`${g.label}${g.advance != null ? ` | adv ${g.advance}` : ""}`}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
        g.present
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-destructive/40 bg-destructive/10 text-red-400"
      )}
    >
      {g.present ? <Check className="size-3" /> : <X className="size-3" />}
      <span className="font-semibold tabular-nums">{display}</span>
      {g.advance != null && (
        <span className="text-[10px] opacity-60">{g.advance}</span>
      )}
    </div>
  );
}

export function ValidationPanel({
  report,
  missing,
}: {
  report: FontReport | null;
  missing: string[];
}) {
  if (!report || !report.found) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        No font resolved yet.
      </p>
    );
  }

  const missingReal = missing.filter((c) => c !== " ");
  const jump = report.jump;

  return (
    <div className="space-y-4 p-4">
      {/* summary row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={report.canTick ? "success" : "destructive"}>
          {report.canTick ? (
            <Check className="mr-1 size-3" />
          ) : (
            <Ban className="mr-1 size-3" />
          )}
          {report.canTick ? "0-9 complete" : "digits missing"}
        </Badge>
        <Badge variant="outline">{report.glyphCount} glyphs</Badge>
        <Badge variant="outline">line {report.lineHeight}</Badge>
      </div>

      {!report.canTick && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-red-300">
          <Ban className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Missing digit(s){" "}
            <span className="font-semibold">
              {report.missingDigits.map((c) => `"${c}"`).join(", ")}
            </span>{" "}
            - this font cannot render a counter.
          </span>
        </div>
      )}

      {/* ── the headline: will the tick-up jump? ─────────────── */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Tick-up jump test
        </p>
        <div
          className={cn(
            "rounded-md border p-3",
            jump.willJump
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-emerald-500/30 bg-emerald-500/10"
          )}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {jump.willJump ? (
              <ArrowLeftRight className="size-4 text-amber-400" />
            ) : (
              <Check className="size-4 text-emerald-400" />
            )}
            <span className={jump.willJump ? "text-amber-300" : "text-emerald-300"}>
              {jump.willJump
                ? `Will jump +/-${(jump.jumpPx / 2).toFixed(1)}px`
                : "Stable - no digit jitter"}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
            {jump.willJump ? (
              <>
                Digit advances differ by up to{" "}
                <span className="font-semibold text-amber-300">
                  {jump.jumpPx}px
                </span>
                {jump.widestPair ? ` (${jump.widestPair})` : ""}. As the counter
                cycles digits, the number's width changes and it shimmies
                horizontally. Use a tabular/mono figure set for win counters.
              </>
            ) : (
              <>
                All digits share one advance ({jump.minAdvance}px), so swapping
                any digit for another keeps the width identical - the counter
                stays rock-steady while ticking.
              </>
            )}
          </p>
          <div className="mt-2 border-t border-border/50 pt-2 text-[10.5px] leading-snug text-muted-foreground">
            <span>
              Note: a centre-anchored counter still re-centres when the digit{" "}
              <em>count</em> changes (e.g. 999 to 1,000 or when a comma appears).
              That is anchor behaviour, not the font.
            </span>
          </div>
        </div>
      </div>

      {missingReal.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-red-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Current preset needs{" "}
            <span className="font-semibold">
              {missingReal.map((c) => `"${c}"`).join(", ")}
            </span>{" "}
            - missing from this font. Those characters will not render.
          </span>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Digit advances
        </p>
        <div className="rounded-md border border-border bg-secondary/30 p-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">min / max</span>
            <span className="tabular-nums">
              {jump.minAdvance} / {jump.maxAdvance}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">spread</span>
            <span
              className={cn(
                "tabular-nums",
                jump.willJump ? "text-amber-400" : "text-emerald-400"
              )}
            >
              {jump.spread}px
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Digits 0–9
        </p>
        <div className="flex flex-wrap gap-1.5">
          {report.digits.map((g) => (
            <GlyphChip key={g.char} g={g} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Separators & symbols
        </p>
        <div className="flex flex-wrap gap-1.5">
          {report.separators.map((g) => (
            <GlyphChip key={g.char} g={g} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Letters (WIN | K/M/B)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {report.letters.map((g) => (
            <GlyphChip key={g.char} g={g} />
          ))}
        </div>
      </div>
    </div>
  );
}
