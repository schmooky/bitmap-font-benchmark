import { driver, type Driver } from "driver.js";

const SEEN_KEY = "bfb-tour-seen";

export interface TourHooks {
  /** Open/close the left preset drawer (it is hover-triggered otherwise). */
  setPresets: (open: boolean) => void;
}

export function runTour(hooks: TourHooks): void {
  let repositioned = false;

  const d: Driver = driver({
    showProgress: true,
    animate: true,
    overlayColor: "#000000",
    overlayOpacity: 0.72,
    stagePadding: 6,
    stageRadius: 8,
    popoverClass: "bfb-tour",
    onDestroyed: () => hooks.setPresets(false),
    steps: [
      {
        popover: {
          title: "Bitmap Font Benchmark",
          description:
            "A test bench for slot-style bitmap fonts. There are no bundled fonts - drag-drop your own .fnt / .xml + its page image (.png/.webp) anywhere to load one. Then drive a win-box preset and read the validation. A short guided tour follows.",
        },
      },
      {
        element: "#tour-presets",
        onHighlightStarted: () => {
          repositioned = false;
          hooks.setPresets(true);
        },
        onHighlighted: () => {
          // the drawer slides in on open; reposition the spotlight once it has.
          if (!repositioned) {
            repositioned = true;
            setTimeout(() => d.refresh(), 260);
          }
        },
        onDeselected: () => hooks.setPresets(false),
        popover: {
          title: "Presets live in a drawer",
          description:
            "The preset library is hidden by default and slides out when you HOVER the left edge of the stage (this tour just opened it for you). Dozens of win-box scenarios grouped by category: tick-ups, currency, multipliers, big-win rollups, top-ups, edge cases, and stress probes. Pick one to run it.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-stage",
        popover: {
          title: "The stage",
          description:
            "The win box renders on the pixel grid, centred on the axis cross. Drop a font here to begin; toggle the red bounds box to inspect glyph metrics.",
        },
      },
      {
        element: "#tour-controls",
        popover: {
          title: "Drive it",
          description:
            "Play runs the entrance animation then the count-up; Stop kills it mid-flight (spam it to test re-entrancy). The live readout shows exactly what string is on screen.",
        },
      },
      {
        element: "#tour-validation",
        popover: {
          title: "Validate",
          description:
            "The headline test: WILL THE TICK-UP JUMP? It compares every digit's advance width and tells you if the counter will shimmy. Plus per-glyph presence for digits, separators (, . x $ €) and letters, and any glyph the current preset needs but the font lacks.",
        },
      },
      {
        element: "#tour-guide-btn",
        popover: {
          title: "Replay anytime",
          description: "Hit Guide to run this walkthrough again. Happy benchmarking!",
        },
      },
    ],
  });
  d.drive();
  localStorage.setItem(SEEN_KEY, "1");
}

export function runTourOnce(hooks: TourHooks): void {
  if (!localStorage.getItem(SEEN_KEY)) {
    setTimeout(() => runTour(hooks), 600);
  }
}
