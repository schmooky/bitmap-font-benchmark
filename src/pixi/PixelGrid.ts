import { Graphics } from "pixi.js";

/** Grid metrics ported verbatim from spine-benchmark v4 (GRID_MINOR / GRID_MAJOR). */
export const GRID_MINOR = 20;
export const GRID_MAJOR = 100;
export const STAGE_BG = 0x1e1e1e;

/**
 * The v4 pixel grid: world-spaced 1px lines projected through the camera
 * (here fixed at zoom 1, origin at screen centre). Minor cells every 20px,
 * major every 100px, white lines that fade toward the screen edges, plus a
 * dimmer axis cross on the origin. Redraw whenever the canvas resizes.
 */
export class PixelGrid {
  readonly layer = new Graphics();

  draw(width: number, height: number): void {
    const g = this.layer;
    g.clear();

    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.hypot(width, height) / 2;
    const ox = cx;
    const oy = cy;
    const step = GRID_MINOR; // zoom == 1
    const majorEvery = GRID_MAJOR / GRID_MINOR;
    const drawMinor = step >= 6;

    const color = 0xffffff;
    const axisColor = 0xd8d8d8;
    const falloff = (d: number) => Math.pow(1 - Math.min(d / maxDist, 1), 1.6);

    const kx0 = Math.floor((0 - ox) / step);
    const kx1 = Math.ceil((width - ox) / step);
    for (let k = kx0; k <= kx1; k++) {
      const isMajor = k % majorEvery === 0;
      if (!isMajor && !drawMinor) continue;
      const x = ox + k * step;
      const alpha = (isMajor ? 0.16 : 0.06) * falloff(Math.abs(x - cx));
      g.moveTo(x, 0).lineTo(x, height).stroke({ width: 1, color, alpha });
    }

    const ky0 = Math.floor((0 - oy) / step);
    const ky1 = Math.ceil((height - oy) / step);
    for (let k = ky0; k <= ky1; k++) {
      const isMajor = k % majorEvery === 0;
      if (!isMajor && !drawMinor) continue;
      const y = oy + k * step;
      const alpha = (isMajor ? 0.16 : 0.06) * falloff(Math.abs(y - cy));
      g.moveTo(0, y).lineTo(width, y).stroke({ width: 1, color, alpha });
    }

    // axis cross on the world origin (where the win box sits)
    g.moveTo(ox, 0).lineTo(ox, height).stroke({ width: 1, color: axisColor, alpha: 0.4 });
    g.moveTo(0, oy).lineTo(width, oy).stroke({ width: 1, color: axisColor, alpha: 0.4 });
  }
}
