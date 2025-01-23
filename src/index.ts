import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { Pane } from "tweakpane";

class BitmapPreviewer {
  private app: PIXI.Application;
  private bitmapText: PIXI.BitmapText | null = null;
  private currentFontName: string | null = null;
  private pane: Pane | null = null; // Tweakpane instance
  private options = {
    start: 0,
    value: 0,
    end: 100,
    fontSize: 40,
    letterSpacing: 0, // Default letterSpacing
    format: false, // Toggle for USD formatting
    duration: 2,
  };
  private ticker: gsap.core.Tween | null = null;

  constructor() {
    // Create PixiJS application with Discord's grey background
    this.app = new PIXI.Application({
      backgroundColor: 0x2c2f33, // Discord grey color
      resizeTo: window, // Automatically resize to fit the window
      view: document.getElementById("pixiCanvas")! as HTMLCanvasElement,
    });

    // Restore saved options from localStorage
    this.loadOptionsFromLocalStorage();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const dropArea = document.getElementById("dropArea")!;

    // Handle Drag & Drop functionality
    dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropArea.classList.add("highlight");
    });

    dropArea.addEventListener("dragleave", () => {
      dropArea.classList.remove("highlight");
    });

    dropArea.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropArea.classList.remove("highlight");
      document.getElementById("dropArea")!.remove();
      const files = Array.from(e.dataTransfer?.files || []);
      const fontFile = files.find((file) => /\.(fnt|xml)$/i.test(file.name));
      const imageFiles = files.filter((file) =>
        /\.(png|jpg|jpeg|webp)$/i.test(file.name)
      );

      if (fontFile && imageFiles.length > 0) {
        await this.loadBitmapFont(fontFile, imageFiles);

        // Hide the drop area
        dropArea.style.opacity = "0";
        setTimeout(() => {
          dropArea.style.display = "none";
        }, 300);

        // Initialize Tweakpane after font is loaded
        this.initTweakpane();
      }
    });

    window.addEventListener("resize", () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this.updateBitmapText(); // Update position on window resize
    });
  }

  private async loadBitmapFont(
    fontFile: File,
    imageFiles: File[]
  ): Promise<void> {
    const textures: Record<string, PIXI.Texture> = {};
    let fntData: string = await this.readFileAsText(fontFile);

    for (const imageFile of imageFiles) {
      const imageData = await this.readFileAsDataURL(imageFile);
      textures[imageFile.name] = PIXI.Texture.from(imageData);
    }

    const font = PIXI.BitmapFont.install(fntData, textures, false);
    this.currentFontName = font.font;

    this.updateBitmapText();

    setTimeout(() => {
      this.updateDisplayedText(); // Update text based on format
    }, 0);
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private async readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private formatNumber(value: number): string {
    if (this.options.format) {
      return value.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
    }
    return value.toString();
  }

  private boundingBox: PIXI.Graphics | null = null;

  private updateBitmapText(): void {
    if (this.bitmapText) {
      this.app.stage.removeChild(this.bitmapText);
    }
    // Remove the previous bounding box
    if (this.boundingBox) {
      this.app.stage.removeChild(this.boundingBox);
    }

    if (this.currentFontName) {
      this.bitmapText = new PIXI.BitmapText("0", {
        fontName: this.currentFontName,
        fontSize: this.options.fontSize,
        letterSpacing: this.options.letterSpacing, // Apply letterSpacing option
      });
      this.bitmapText.anchor.set(0.5);
      this.bitmapText.position.set(
        Math.floor(this.app.renderer.width / 2),
        Math.floor(this.app.renderer.height / 2)
      );

      // Add the bitmap text to the stage
      this.app.stage.addChild(this.bitmapText);

      // Create and add the bounding box
      this.boundingBox = new PIXI.Graphics();
      this.app.stage.addChild(this.boundingBox);

      // Draw the bounding box around the updated text

      this.updateDisplayedText(); // Update text based on format
      this.drawBoundingBox();
    }
  }

  private updateDisplayedText(): void {
    if (this.bitmapText) {
      this.bitmapText.text = this.formatNumber(this.options.value);

      // Update letter spacing dynamically
      this.bitmapText.letterSpacing = this.options.letterSpacing;

      // Redraw the bounding box after the text is updated
      this.drawBoundingBox();
    }
  }

  private drawBoundingBox(): void {
    if (!this.bitmapText || !this.boundingBox) return;

    // Retrieve the bounding box of the BitmapText
    const bounds = this.bitmapText.getBounds();

    // Clear previous bounding box graphics
    this.boundingBox.clear();

    // Draw the bounding box as a rectangle
    this.boundingBox.lineStyle(2, 0xff0000, 1); // Red outline, 2px width
    this.boundingBox.beginFill(0x000000, 0); // Transparent fill
    this.boundingBox.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.boundingBox.endFill();
  }

  private initTweakpane(): void {
    if (this.pane) {
      this.pane.dispose();
      this.pane = null;
    }

    this.pane = new Pane();
    const PARAMS = this.options;

    this.pane
      .addBinding(PARAMS, "start", {
        min: 0,
        max: 1_000_000,
        step: 1,
      })
      .on("change", () => {
        this.options.value = this.options.start;
        this.updateDisplayedText();
        this.saveOptionsToLocalStorage();
      });

    this.pane
      .addBinding(PARAMS, "end", {
        min: 0,
        max: 1_000_000,
        step: 1,
      })
      .on("change", () => this.saveOptionsToLocalStorage());

    this.pane
      .addBinding(PARAMS, "fontSize", {
        min: 10,
        max: 200,
        step: 1,
      })
      .on("change", () => {
        this.updateBitmapText();
        this.saveOptionsToLocalStorage();
      });

    this.pane
      .addBinding(PARAMS, "letterSpacing", {
        min: -120,
        max: 120,
        step: 1,
      })
      .on("change", () => {
        this.updateDisplayedText(); // Update letter spacing dynamically
        this.saveOptionsToLocalStorage();
      });

    this.pane
      .addBinding(PARAMS, "format") // Add USD formatting toggle
      .on("change", () => {
        this.updateDisplayedText();
        this.saveOptionsToLocalStorage();
      });

    this.pane
      .addBinding(PARAMS, "duration", {
        min: 0.2,
        max: 30,
        step: 0.1,
      })
      .on("change", () => this.saveOptionsToLocalStorage());

    // Add start and stop buttons
    this.pane.addButton({ title: "Start Tickup" }).on("click", () => {
      this.startTickup();
    });

    this.pane.addButton({ title: "Stop Tickup" }).on("click", () => {
      this.stopTicker();
    });
  }

  private startTickup(): void {
    this.stopTicker(); // Ensure no previous ticker is running

    if (this.bitmapText && this.currentFontName) {
      this.ticker = gsap.to(this.options, {
        value: this.options.end,
        duration: this.options.duration,
        ease: "linear",
        onUpdate: () => {
          this.updateDisplayedText();
        },
      });
    }
  }

  private stopTicker(): void {
    if (this.ticker) {
      this.ticker.kill();
      this.ticker = null;
      this.options.value = this.options.start;
    }
  }

  private saveOptionsToLocalStorage(): void {
    localStorage.setItem(
      "tweakpane-options",
      JSON.stringify(this.options, (key, value) => {
        // Exclude _gsap properties
        if (key === "_gsap") {
          return undefined;
        }
        return value; // Keep everything else
      })
    );
  }

  private loadOptionsFromLocalStorage(): void {
    const options = localStorage.getItem("tweakpane-options");
    if (options) {
      this.options = JSON.parse(options);
    }
  }
}

// Initialize the Bitmap Previewer
const preview = new BitmapPreviewer();
