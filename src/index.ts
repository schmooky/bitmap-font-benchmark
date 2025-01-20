import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Pane } from 'tweakpane';

class BitmapPreviewer {
    private app: PIXI.Application;
    private bitmapText: PIXI.BitmapText | null = null;
    private currentFontName: string | null = null;
    private pane: Pane | null = null; // Tweakpane instance
    private options = {
        start: 0,
        end: 100,
        fontSize: 40, // Font size (newly added!)
    };
    private ticker: gsap.core.Tween | null = null;

    constructor() {
        // Create PixiJS application with Discord's grey background
        this.app = new PIXI.Application({
            backgroundColor: 0x2c2f33, // Discord grey color
            resizeTo: window, // Automatically resize to fit the window
            view: document.getElementById('pixiCanvas')! as HTMLCanvasElement,
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const dropArea = document.getElementById('dropArea')!;

        // Handle Drag & Drop functionality
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('highlight');
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('highlight');
        });

        dropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropArea.classList.remove('highlight');
            document.getElementById('dropArea')!.remove();
            const files = Array.from(e.dataTransfer?.files || []);
            const fntFile = files.find((file) => file.name.endsWith('.fnt'));
            const imageFiles = files.filter((file) =>
                /\.(png|jpg|jpeg|webp)$/i.test(file.name)
            );

            if (fntFile && imageFiles.length > 0) {
                await this.loadBitmapFont(fntFile, imageFiles);

                // Hide the drop area
                dropArea.style.opacity = '0';
                setTimeout(() => {
                    dropArea.style.display = 'none';
                }, 300);

                // Initialize Tweakpane after font is loaded
                this.initTweakpane();
            }
        });

        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
            this.updateBitmapText(); // Update position on window resize
        });
    }

    private async loadBitmapFont(fntFile: File, imageFiles: File[]): Promise<void> {
        const fntData = await this.readFileAsText(fntFile);
        const textures: Record<string, PIXI.Texture> = {};

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

    private updateBitmapText(): void {
        if (this.bitmapText) {
            this.app.stage.removeChild(this.bitmapText);
        }

        if (this.currentFontName) {
            this.bitmapText = new PIXI.BitmapText('0', {
                fontName: this.currentFontName,
                fontSize: this.options.fontSize,
            });
            this.bitmapText.anchor.set(0.5);
            this.bitmapText.position.set(
                this.app.renderer.width / 2,
                this.app.renderer.height / 2
            );
            this.app.stage.addChild(this.bitmapText);
        }
    }

    private initTweakpane(): void {
        if (this.pane) {
            this.pane.dispose();
            this.pane = null;
        }

        this.pane = new Pane();
        const PARAMS = this.options;

        this.pane.addBinding(PARAMS, 'start', {
            min: -100,
            max: 100,
            step: 1,
        });

        this.pane.addBinding(PARAMS, 'end', {
            min: -100,
            max: 100,
            step: 1,
        });

        this.pane
            .addBinding(PARAMS, 'fontSize', {
                min: 10,
                max: 200,
                step: 1,
            })
            .on('change', () => {
                this.updateBitmapText(); // Update font size dynamically
            });

        // Add start and stop buttons
        this.pane.addButton({ title: 'Start Tickup' }).on('click', () => {
            this.startTickup();
        });

        this.pane.addButton({ title: 'Stop Tickup' }).on('click', () => {
            this.stopTicker();
        });
    }

    private startTickup(): void {
        this.stopTicker(); // Ensure no previous ticker is running

        if (this.bitmapText && this.currentFontName) {
            this.ticker = gsap.to(this.options, {
                start: this.options.end,
                duration: 2,
                repeat: -1,
                ease: 'linear',
                onUpdate: () => {
                    if (this.bitmapText) {
                        this.bitmapText.text = Math.floor(this.options.start).toString();
                    }
                },
            });
        }
    }

    private stopTicker(): void {
        if (this.ticker) {
            this.ticker.kill();
            this.ticker = null;
        }
    }
}

// Initialize the application
const previewer = new BitmapPreviewer();