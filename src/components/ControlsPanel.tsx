import { Play, Square, RotateCcw } from "lucide-react";
import type { Preset } from "@/lib/presets";
import { FORMAT_META, type FormatKind } from "@/lib/formats";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FORMAT_KEYS = Object.keys(FORMAT_META) as FormatKind[];

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs tabular-nums text-foreground/80">{value}</span>
      </div>
      {children}
    </div>
  );
}

export function ControlsPanel({
  preset,
  onChange,
  playing,
  onPlay,
  onStop,
  onReset,
  showBounds,
  onToggleBounds,
  currentText,
}: {
  preset: Preset;
  onChange: (patch: Partial<Preset>) => void;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  showBounds: boolean;
  onToggleBounds: (v: boolean) => void;
  currentText: string;
}) {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">{preset.name}</h3>
        <p className="mt-0.5 text-[9.5px] leading-snug text-muted-foreground">
          {preset.description}
        </p>
      </div>

      {/* live readout */}
      <div className="rounded-md border border-border bg-black/40 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          On screen
        </div>
        <div className="truncate font-mono text-lg tabular-nums text-foreground">
          {currentText || "-"}
        </div>
      </div>

      <div className="flex gap-2">
        {playing ? (
          <Button onClick={onStop} variant="destructive" className="flex-1">
            <Square className="size-4" /> Stop
          </Button>
        ) : (
          <Button onClick={onPlay} className="flex-1">
            <Play className="size-4" /> Play
          </Button>
        )}
        <Button onClick={onReset} variant="outline" size="icon" title="Reset">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <Row label="Format" value={FORMAT_META[preset.format].sample}>
        <Select
          value={preset.format}
          onValueChange={(v) => onChange({ format: v as FormatKind })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {FORMAT_META[k].label} | {FORMAT_META[k].sample}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row label="Target value" value={preset.to.toLocaleString()}>
        <Slider
          min={0}
          max={1_000_000}
          step={1}
          value={[preset.to]}
          onValueChange={([v]) => onChange({ to: v })}
        />
      </Row>

      <Row label="Font size" value={`${preset.fontSize}px`}>
        <Slider
          min={16}
          max={240}
          step={1}
          value={[preset.fontSize]}
          onValueChange={([v]) => onChange({ fontSize: v })}
        />
      </Row>

      <Row label="Letter spacing" value={`${preset.letterSpacing}px`}>
        <Slider
          min={-30}
          max={40}
          step={1}
          value={[preset.letterSpacing]}
          onValueChange={([v]) => onChange({ letterSpacing: v })}
        />
      </Row>

      <Row label="Duration" value={`${preset.duration.toFixed(1)}s`}>
        <Slider
          min={0}
          max={10}
          step={0.1}
          value={[preset.duration]}
          onValueChange={([v]) => onChange({ duration: v })}
        />
      </Row>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <Label className="cursor-pointer">Show glyph bounds</Label>
        <Switch checked={showBounds} onCheckedChange={onToggleBounds} />
      </div>
    </div>
  );
}
