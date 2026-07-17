import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Compass, Type, Loader2, PanelLeft } from "lucide-react";

/** GitHub "Octocat" mark (lucide dropped its brand icons). */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

import { Stage } from "@/pixi/stage";
import { PRESETS, type Preset } from "@/lib/presets";
import { charsForFormat } from "@/lib/formats";
import { parseDroppedFont, type FontEntry } from "@/lib/fonts";
import { analyzeFont, missingChars, type FontReport } from "@/lib/validation";
import { runTour, runTourOnce } from "@/lib/tour";

import { PresetLibrary } from "@/components/PresetLibrary";
import { ControlsPanel } from "@/components/ControlsPanel";
import { ValidationPanel } from "@/components/ValidationPanel";
import { DropOverlay } from "@/components/DropOverlay";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DEFAULT_PRESET = PRESETS.find((p) => p.id === "big-pop") ?? PRESETS[0];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const pendingPlay = useRef(false);

  const [ready, setReady] = useState(false);
  const [activeFont, setActiveFont] = useState<FontEntry | null>(null);
  const [active, setActive] = useState<Preset>({ ...DEFAULT_PRESET });
  const [playing, setPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [showBounds, setShowBounds] = useState(false);
  const [started, setStarted] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [report, setReport] = useState<FontReport | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null
  );

  const fontFamily = activeFont?.fontFamily ?? "";

  // ── stage lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    const stage = new Stage();
    stageRef.current = stage;
    let disposed = false;

    (async () => {
      await stage.init(canvasRef.current!, parentRef.current!);
      if (disposed) return;
      stage.winBox.onValue = (t) => setCurrentText(t);
      stage.winBox.onStateChange = (p) => setPlaying(p);
      setReady(true);
      runTourOnce({ setPresets: setPresetsOpen });
    })();

    return () => {
      disposed = true;
      stageRef.current = null;
      stage.destroy();
    };
  }, []);

  // ── font selection -> wire font, compute report ──────────────────
  useEffect(() => {
    if (!ready) return;
    stageRef.current?.winBox.setFont(fontFamily);
    setReport(fontFamily ? analyzeFont(fontFamily) : null);
  }, [ready, fontFamily]);

  // ── active preset -> load into the win box (+ optional autoplay) ──
  useEffect(() => {
    if (!ready) return;
    const wb = stageRef.current?.winBox;
    if (!wb) return;
    wb.load(active);
    if (pendingPlay.current) {
      pendingPlay.current = false;
      wb.play();
    }
  }, [ready, active, fontFamily]);

  // ── glyph bounds toggle ─────────────────────────────────────────
  useEffect(() => {
    stageRef.current?.winBox.setShowBounds(showBounds);
  }, [showBounds]);

  // ── auto-dismiss toast ──────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const missing = useMemo(() => {
    if (!fontFamily) return [];
    return missingChars(fontFamily, charsForFormat(active.format));
  }, [fontFamily, active.format, report]);

  const selectPreset = useCallback((p: Preset) => {
    pendingPlay.current = true;
    setStarted(true);
    setActive({ ...p });
  }, []);

  const play = useCallback(() => {
    setStarted(true);
    stageRef.current?.winBox.play();
  }, []);

  const onChange = useCallback((patch: Partial<Preset>) => {
    setActive((prev) => ({ ...prev, ...patch }));
  }, []);

  const onFiles = useCallback(async (files: File[]) => {
    try {
      const entry = await parseDroppedFont(files);
      setActiveFont(entry);
      setToast({ kind: "ok", msg: `Loaded ${entry.label}` });
    } catch (e) {
      setToast({ kind: "err", msg: (e as Error).message });
    }
  }, []);

  const startTour = useCallback(
    () => runTour({ setPresets: setPresetsOpen }),
    []
  );

  const wb = () => stageRef.current?.winBox;

  return (
    <TooltipProvider delayDuration={200}>
      <DropOverlay onFiles={onFiles} />

      <div className="flex h-full flex-col">
        {/* ── header ─────────────────────────────────────────────── */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Type className="size-4" />
            <span className="text-sm font-semibold">Bitmap Font Benchmark</span>
          </div>
          <div className="flex items-center gap-2">
            <Button id="tour-guide-btn" variant="outline" size="sm" onClick={startTour}>
              <Compass className="size-4" /> Guide
            </Button>
            <a
              href="https://github.com/schmooky/bitmap-font-benchmark"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" title="GitHub">
                <GithubMark className="size-4" /> GitHub
              </Button>
            </a>
          </div>
        </header>

        {/* ── body ───────────────────────────────────────────────── */}
        <div className="relative flex min-h-0 flex-1">
          {/* center: stage */}
          <main
            id="tour-stage"
            ref={parentRef}
            className="relative min-w-0 flex-1 overflow-hidden bg-[#1e1e1e]"
          >
            <canvas ref={canvasRef} className="block size-full" />
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1e1e1e] text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <p className="text-xs">Booting stage...</p>
              </div>
            )}
            {ready && !fontFamily && (
              <div className="pointer-events-none absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center">
                <p className="text-base font-medium text-foreground/85">
                  Drop a .fnt / .xml + its page image here to begin.
                </p>
                <p className="text-xs text-muted-foreground">
                  No fonts are bundled. This bench validates the bitmap font you
                  drop in.
                </p>
              </div>
            )}
            {ready && fontFamily && !started && (
              <div className="pointer-events-none absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center">
                <p className="text-base font-medium text-foreground/85">
                  Hover the left edge to pick a win-box preset.
                </p>
                <p className="text-xs text-muted-foreground">
                  Or drop another font anywhere to swap.
                </p>
              </div>
            )}
          </main>

          {/* right: controls + validation */}
          <aside className="flex w-80 shrink-0 flex-col border-l border-border">
            <ScrollArea className="min-h-0 flex-1">
              <div id="tour-controls">
                <ControlsPanel
                  preset={active}
                  onChange={onChange}
                  playing={playing}
                  onPlay={play}
                  onStop={() => wb()?.stop()}
                  onReset={() => wb()?.reset()}
                  showBounds={showBounds}
                  onToggleBounds={setShowBounds}
                  currentText={currentText}
                />
              </div>
              <Separator />
              <div id="tour-validation">
                <div className="px-4 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Validation
                </div>
                <ValidationPanel report={report} missing={missing} />
              </div>
            </ScrollArea>
          </aside>

          {/* left hover rail (always visible) */}
          <div
            className="absolute inset-y-0 left-0 z-20 flex w-7 cursor-pointer items-center justify-center gap-2 border-r border-border bg-card/60 backdrop-blur transition-colors hover:bg-card"
            onMouseEnter={() => setPresetsOpen(true)}
          >
            <PanelLeft className="absolute top-3 size-3.5 text-muted-foreground" />
            <span className="rotate-180 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground [writing-mode:vertical-rl]">
              Presets
            </span>
          </div>

          {/* left preset drawer (opens on hover / via the tour) */}
          <aside
            id="tour-presets"
            onMouseLeave={() => setPresetsOpen(false)}
            className={cn(
              "absolute inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ease-out",
              presetsOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
            )}
          >
            <div className="space-y-1 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Font
              </span>
              {activeFont ? (
                <>
                  <p className="truncate text-xs font-medium">{activeFont.label}</p>
                  <p className="text-[9.5px] leading-snug text-muted-foreground">
                    {activeFont.description}
                  </p>
                </>
              ) : (
                <p className="text-[9.5px] leading-snug text-muted-foreground">
                  No font loaded. Drop a .fnt / .xml + its page image anywhere.
                </p>
              )}
            </div>
            <Separator />
            <ScrollArea className="min-h-0 flex-1">
              <PresetLibrary selectedId={active.id} onSelect={selectPreset} />
            </ScrollArea>
          </aside>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 max-w-xs rounded-md border px-3 py-2 text-xs shadow-lg animate-fade-in",
            toast.kind === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-destructive/50 bg-destructive/10 text-red-300"
          )}
        >
          {toast.msg}
        </div>
      )}
    </TooltipProvider>
  );
}
