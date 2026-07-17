import { BitmapText, Container, Graphics } from "pixi.js";
import { gsap } from "gsap";
import type { Preset } from "@/lib/presets";
import { formatValue } from "@/lib/formats";

/**
 * A slot-style "win box": an optional rounded panel with a BitmapText value
 * inside, driven by GSAP for both the entrance animation and the count-up.
 * The panel is redrawn every frame to hug the (changing-width) text.
 */
export class WinBox {
  readonly view = new Container();
  private inner = new Container();
  private glow = new Graphics();
  private panel = new Graphics();
  private boundsBox = new Graphics();
  private text: BitmapText;

  private fontFamily = "";
  private preset: Preset | null = null;
  private state = { value: 0 };
  private entranceTween: gsap.core.Tween | null = null;
  private counterTween: gsap.core.Timeline | null = null;
  private showBounds = false;

  onValue: ((text: string) => void) | null = null;
  onStateChange: ((playing: boolean) => void) | null = null;

  constructor() {
    this.text = new BitmapText({ text: "0", style: { fontFamily: "", fontSize: 96, fill: 0xffffff } });
    this.text.anchor.set(0.5);
    this.inner.addChild(this.glow, this.panel, this.text, this.boundsBox);
    this.view.addChild(this.inner);
  }

  setFont(fontFamily: string): void {
    this.fontFamily = fontFamily;
    this.redrawText();
  }

  setShowBounds(v: boolean): void {
    this.showBounds = v;
    this.drawDecorations();
  }

  /** Load a preset (does not start it). */
  load(preset: Preset): void {
    this.stop();
    this.preset = preset;
    this.state.value = preset.from;
    this.inner.alpha = 1;
    this.inner.scale.set(1);
    this.inner.position.set(0, 0);
    this.redrawText();
  }

  /** Run the preset: entrance (if any) then the counter. */
  play(): void {
    if (!this.preset) return;
    this.stop();
    const p = this.preset;
    this.state.value = p.from;
    this.redrawText();

    const startCounter = () => this.runCounter();

    switch (p.entrance) {
      case "pop":
        this.inner.scale.set(0);
        this.inner.alpha = 1;
        this.entranceTween = gsap.to(this.inner.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(2)", onComplete: startCounter });
        break;
      case "fade":
        this.inner.alpha = 0;
        this.entranceTween = gsap.to(this.inner, { alpha: 1, duration: 0.4, ease: "power2.out", onComplete: startCounter });
        break;
      case "slam":
        this.inner.position.set(0, -320);
        this.inner.scale.set(1.15, 0.85);
        gsap.to(this.inner.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(3)" });
        this.entranceTween = gsap.to(this.inner.position, { y: 0, duration: 0.42, ease: "power4.out", onComplete: startCounter });
        break;
      case "flip":
        this.inner.scale.set(0, 1);
        this.entranceTween = gsap.to(this.inner.scale, { x: 1, duration: 0.45, ease: "back.out(1.7)", onComplete: startCounter });
        break;
      default:
        startCounter();
    }
    this.onStateChange?.(true);
  }

  private runCounter(): void {
    const p = this.preset!;
    const hasTopUp = !!p.topUp && p.topUp > 0;

    if (p.counter === "instant" || p.duration <= 0) {
      this.state.value = hasTopUp ? p.to + p.topUp! : p.to;
      this.redrawText();
      this.onStateChange?.(false);
      return;
    }

    const ease =
      p.counter === "linear" ? "none" : p.ease === "none" ? "power2.out" : p.ease;

    const tl = gsap.timeline({
      onUpdate: () => this.redrawText(),
      onComplete: () => {
        this.state.value = hasTopUp ? p.to + p.topUp! : p.to;
        this.redrawText();
        this.onStateChange?.(false);
      },
    });

    // Phase 1: 0 -> the base win.
    tl.to(this.state, { value: p.to, duration: p.duration, ease });

    // Phase 2: extra winlines land and bump the total higher.
    if (hasTopUp) {
      const delay = p.topUpDelay ?? 0.5;
      const bumpDur = Math.max(0.4, p.duration * 0.45);
      tl.to(this.state, {
        value: p.to + p.topUp!,
        duration: bumpDur,
        ease: "back.out(1.4)",
        delay,
      });
      // a little scale punch when the extra win arrives
      tl.fromTo(
        this.inner.scale,
        { x: 1, y: 1 },
        { x: 1.12, y: 1.12, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" },
        `-=${bumpDur}`
      );
    }

    this.counterTween = tl;
  }

  stop(): void {
    this.entranceTween?.kill();
    this.counterTween?.kill();
    this.entranceTween = null;
    this.counterTween = null;
    this.inner.alpha = 1;
    this.inner.scale.set(1);
    this.inner.position.set(0, 0);
    this.onStateChange?.(false);
  }

  reset(): void {
    this.stop();
    if (this.preset) this.state.value = this.preset.from;
    this.redrawText();
  }

  private redrawText(): void {
    const p = this.preset;
    // With no bitmap font loaded, render nothing (avoid Pixi's system-font
    // fallback that would otherwise draw a stray glyph).
    const str = p && this.fontFamily ? formatValue(this.state.value, p.format) : "";
    this.text.text = str;
    if (this.fontFamily) this.text.style.fontFamily = this.fontFamily;
    if (p) {
      this.text.style.fontSize = p.fontSize;
      this.text.style.letterSpacing = p.letterSpacing;
    }
    this.onValue?.(str);
    this.drawDecorations();
  }

  private drawDecorations(): void {
    // The framing panel/glow was removed — the bitmap text renders bare on the
    // grid. Only the optional debug bounds box is drawn.
    const b = this.text.getLocalBounds();
    this.panel.clear();
    this.glow.clear();
    this.boundsBox.clear();

    if (this.showBounds) {
      this.boundsBox
        .rect(b.x, b.y, b.width, b.height)
        .stroke({ width: 1, color: 0xff3b3b, alpha: 0.9 });
    }
  }

  destroy(): void {
    this.stop();
    this.view.destroy({ children: true });
  }
}
