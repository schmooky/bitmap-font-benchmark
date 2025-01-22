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
      const fntFile = files.find((file) => file.name.endsWith(".fnt"));
      const imageFiles = files.filter((file) =>
        /\.(png|jpg|jpeg|webp)$/i.test(file.name)
      );

      if (fntFile && imageFiles.length > 0) {
        await this.loadBitmapFont(fntFile, imageFiles);

        // Hide the drop area
        dropArea.style.opacity = "0";
        setTimeout(() => {
          dropArea.style.display = "none";
        }, 300);

        // Initialize Tweakpane after font is loaded
        this.initTweakpane();
        // Perform digit testing
        this.performDigitTesting();
      }
    });

    window.addEventListener("resize", () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this.updateBitmapText(); // Update position on window resize
    });
  }

  private async loadBitmapFont(
    fntFile: File,
    imageFiles: File[]
  ): Promise<void> {
    const fntData = await this.readFileAsText(fntFile);
    const textures: Record<string, PIXI.Texture> = {};

    // Parse the fnt file to extract the size attribute
    const sizeMatch = fntData.match(/size=(\d+)/);
    if (sizeMatch) {
      // Set the extracted font size as the default value for options.fontSize
      this.options.fontSize = parseInt(sizeMatch[1], 10);
    }

    for (const imageFile of imageFiles) {
      const imageData = await this.readFileAsDataURL(imageFile);
      textures[imageFile.name] = PIXI.Texture.from(imageData);
    }

    const font = PIXI.BitmapFont.install(fntData, textures, false);
    this.currentFontName = font.font;

    this.updateBitmapText();
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

  private updateBitmapText(): void {
    if (this.bitmapText) {
      this.app.stage.removeChild(this.bitmapText);
    }

    if (this.currentFontName) {
      this.bitmapText = new PIXI.BitmapText("0", {
        fontName: this.currentFontName,
        fontSize: this.options.fontSize,
      });
      this.bitmapText.anchor.set(0.5);
      this.bitmapText.position.set(
        Math.floor(this.app.renderer.width / 2),
        Math.floor(this.app.renderer.height / 2)
      );
      this.app.stage.addChild(this.bitmapText);
      this.updateDisplayedText(); // Update text based on format
    }
  }

  private updateDisplayedText(): void {
    if (this.bitmapText) {
      this.bitmapText.text = this.formatNumber(this.options.value);
    }
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
        this.updateDisplayedText(); // Update text dynamically
      });

    this.pane.addBinding(PARAMS, "end", {
      min: 0,
      max: 1_000_000,
      step: 1,
    });

    this.pane
      .addBinding(PARAMS, "fontSize", {
        min: 10,
        max: 200,
        step: 1,
      })
      .on("change", () => {
        this.updateBitmapText(); // Update font size dynamically
      });

    this.pane
      .addBinding(PARAMS, "format") // Add USD formatting toggle
      .on("change", () => {
        this.updateDisplayedText(); // Update text when toggled
      });

    this.pane
      .addBinding(PARAMS, "duration", {
        min: 0.2,
        max: 5,
        step: 0.1,
      })
      .on("change", () => {
        this.updateBitmapText(); // Update font size dynamically
      });

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
          this.updateDisplayedText(); // Update the number during tick
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

  private async performDigitTesting(): Promise<void> {
    if (!this.bitmapText || !this.currentFontName) return;

    console.group("Arabic Digit Testing");

    const fontData = PIXI.BitmapFont.available[this.currentFontName];
    if (!fontData) {
      console.warn("Font data not found for the current loaded font.");
      return;
    }

    console.log("Font Data", fontData);

    // Calculate the maximum advance for consistent spacing
    let maxAdvance = 0;
    for (let charCode in fontData.chars) {
      maxAdvance = Math.max(maxAdvance, fontData.chars[charCode].xAdvance);
    }

    // Iterate through number combinations from 10 to 99
    for (let number = 10; number < 100; number++) {
      const testString = number.toString();

      // Render the string and calculate bounds
      this.bitmapText.text = testString;
      this.app.renderer.render(this.app.stage);
      await this.sleep(500); // Adjust delay as needed for visualization

      const bounds = this.bitmapText.getBounds();

      console.log(
        `%cString: '${testString}'`,
        "color: lightblue; font-weight: bold;"
      );
      console.log(`    Bounds: ${JSON.stringify(bounds)}`);

      // Calculate expected width based on maximum advance
      const expectedWidth = testString.length * maxAdvance; 

      console.log(`    Expected Width: ${expectedWidth}`);

      // Test for width discrepancies
      if (Math.abs(bounds.width - expectedWidth) > 1) {
        // Allow small deviations
        console.warn(
          `%cPotential width mismatch detected for '${testString}':`,
          "color: yellow; font-weight: bold;"
        );
        console.log(
          `    ➡ The rendered width (${bounds.width}) does not match the expected width (${expectedWidth}) based on maximum glyph 'xAdvance' value.`
        );
      } else {
        console.log(
          `%cNo width mismatch detected for '${testString}'.`,
          "color: green;"
        );
      }
    }

    console.groupEnd();

    // Reset the text after testing
    this.bitmapText.text = "";
    this.app.renderer.render(this.app.stage); // Clear the stage
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize the Bitmap Previewer incremental
const preview = new BitmapPreviewer();
