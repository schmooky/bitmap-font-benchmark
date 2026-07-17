import { PRESETS_BY_CATEGORY, type Preset } from "@/lib/presets";
import { cn } from "@/lib/utils";

export function PresetLibrary({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (p: Preset) => void;
}) {
  return (
    <div className="space-y-4 p-3">
      {PRESETS_BY_CATEGORY.map(({ category, items }) => (
        <div key={category}>
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {items.length}
            </span>
          </div>
          <div className="space-y-1">
            {items.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={cn(
                    "group w-full rounded-md border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-primary/40 bg-secondary"
                      : "border-transparent hover:border-border hover:bg-secondary/40"
                  )}
                >
                  <span className="block truncate text-xs font-medium">
                    {p.name}
                  </span>
                  <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-snug text-muted-foreground">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
