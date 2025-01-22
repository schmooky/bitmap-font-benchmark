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

        this.performDigitTesting();

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
          this.drawBoundingBox();
  
          this.updateDisplayedText(); // Update text based on format
      }
  }
  
  private updateDisplayedText(): void {
      if (this.bitmapText) {
          this.bitmapText.text = this.formatNumber(this.options.value);
  
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
        max: 30,
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
          console.log(this.bitmapText?.getBounds().width)
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
  
    // Maximum xAdvance is calculated for future use
    let maxAdvance = 0;
    for (let charCode in fontData.chars) {
      maxAdvance = Math.max(maxAdvance, fontData.chars[charCode].xAdvance);
    }
    console.log("Max xAdvance:", maxAdvance);
  
    // Container for glyph adjustments
    let kerningAdjusted = false;
  
    // Iterate through digit pairs from "10" to "99"
    for (let number = 10; number < 100; number++) {
      const testString = number.toString();
      const [digit1, digit2] = testString.split("").map((c) => c.charCodeAt(0)); // Get char codes for each digit
  
      // Render the string and calculate bounds
      this.bitmapText.text = testString;
      this.drawBoundingBox();
      this.app.renderer.render(this.app.stage);
  
      await this.sleep(24); // Pause for visualization (adjust duration as needed)
  
      const bounds = this.bitmapText.getBounds();
  
      console.log(
        `%cString: '${testString}'`,
        "color: lightblue; font-weight: bold;"
      );
      console.log(`    Bounds: ${JSON.stringify(bounds)}`);
  
      // Calculate expected width based on maximum advance
      const expectedWidth = testString.length * maxAdvance;
      console.log(`    Expected Width: ${expectedWidth}`);
  
      // Check the kerning between the two digits
      const glyph1 = fontData.chars[digit1];
      const glyph2 = fontData.chars[digit2];
  
      if (glyph1 && glyph2) {
        const kerningValue = glyph1.kerning[digit2] || 0; // Get the current kerning value between digit1 and digit2
        const renderedWidth = bounds.width;
        const spacingBetweenDigits = Math.abs(renderedWidth - maxAdvance * 2);
  
        console.log(
          `    Current Kerning (${testString}): ${kerningValue}, Spacing: ${spacingBetweenDigits}`
        );
  
        // Adjust kerning if needed to reduce spacing inconsistency
        if (spacingBetweenDigits > 1 || Math.abs(renderedWidth - expectedWidth) > 1) {
          const newKerningValue = kerningValue + (expectedWidth - renderedWidth) / 2;
  
          // Set kerning so that digit pairs are visually balanced
          glyph1.kerning[digit2] = newKerningValue;
  
          console.log(
            `%cAdjusted kerning for pair '${testString}' (${digit1} -> ${
              digit2
            }) to: ${newKerningValue}`,
            "color: yellow; font-weight: bold;"
          );
  
          kerningAdjusted = true;
        } else {
          console.log(
            `%cNo kerning adjustment needed for '${testString}'.`,
            "color: green;"
          );
        }
      } else {
        console.warn(
          `%cGlyph(s) missing for pair '${testString}'.`,
          "color: red; font-weight: bold;"
        );
      }
    }
  
    console.groupEnd();
  
    // Apply adjustments to the font data
    if (kerningAdjusted) {
      console.group("%cApplying Adjustments to Font Data", "color: orange;");
      console.log(
        "%cAdjustments have been made to kerning values between digit pairs.",
        "color: orange; font-weight: bold;"
      );
      console.groupEnd();
    }
  
    // Reset the text after testing
    this.bitmapText.text = "";
    this.updateBitmapText();
    this.app.renderer.render(this.app.stage); // Clear the stage
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize the Bitmap Previewer incremental
const preview = new BitmapPreviewer();
