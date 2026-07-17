import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";

/** Full-window drag-and-drop catcher for custom .fnt + page images. */
export function DropOverlay({
  onFiles,
}: {
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let depth = 0;
    const onEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      depth++;
      setDragging(true);
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) onFiles(files);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFiles]);

  if (!dragging) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/50 px-16 py-12">
        <UploadCloud className="size-10 text-foreground/80" />
        <p className="text-sm font-medium">Drop a .fnt / .xml + its page image</p>
        <p className="text-xs text-muted-foreground">
          Angel-Code bitmap fonts. The image pages must accompany the descriptor.
        </p>
      </div>
    </div>
  );
}
