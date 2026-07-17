import { Application, Container } from "pixi.js";
import { PixelGrid, STAGE_BG } from "./PixelGrid";
import { WinBox } from "./WinBox";

/**
 * Owns the PixiJS Application. Back-to-front layering: grid -> world(win box).
 * The win box sits at the world origin (screen centre) so it lands exactly on
 * the grid's axis cross, matching the spine-benchmark v4 stage.
 */
export class Stage {
  readonly app = new Application();
  readonly grid = new PixelGrid();
  readonly winBox = new WinBox();
  private world = new Container();
  private ready = false;

  async init(canvas: HTMLCanvasElement, parent: HTMLElement): Promise<void> {
    await this.app.init({
      canvas,
      background: STAGE_BG,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      resizeTo: parent,
      preference: "webgl",
    });

    this.app.stage.addChild(this.grid.layer);
    this.world.addChild(this.winBox.view);
    this.app.stage.addChild(this.world);

    this.app.renderer.on("resize", () => this.layout());
    this.layout();
    this.ready = true;
  }

  private layout(): void {
    const { width, height } = this.app.screen;
    this.grid.draw(width, height);
    this.world.position.set(Math.floor(width / 2), Math.floor(height / 2));
  }

  destroy(): void {
    if (!this.ready) return;
    this.winBox.destroy();
    this.app.destroy(true, { children: true });
  }
}
