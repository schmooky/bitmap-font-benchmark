import * as PIXI from 'pixi.js';

class BitmapFontFixer {
    private app: PIXI.Application;
    private bitmapText: PIXI.BitmapText | null = null;
    private currentFontName: string | null = null;
    private originalFontData: string | null = null;
    private fixedFontData: string | null = null;
    private options = {
        fontSize: 40,
    };

    constructor() {
        this.app = new PIXI.Application({
            backgroundColor: 0x2c2f33, // Discord grey color
            resizeTo: window,
            view: document.getElementById('pixiCanvas') as HTMLCanvasElement,
        });

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const dropArea = document.getElementById('dropArea')!;

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
            const files = Array.from(e.dataTransfer?.files || []);
            const fntFile = files.find((file) => file.name.endsWith('.fnt'));
            const imageFiles = files.filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file.name));

            if (fntFile && imageFiles.length > 0) {
                await this.loadBitmapFont(fntFile, imageFiles);
                document.getElementById('dropArea')!.remove();

                // Perform analysis and automatic fixes
                const fixedFont = this.analyzeFontAndFixIssues();
                this.downloadFixedFontFile(fixedFont, fntFile.name.replace('.fnt', '_fixed.fnt'));
            }
        });
    }

    private async loadBitmapFont(fntFile: File, imageFiles: File[]): Promise<void> {
        const fntData = await this.readFileAsText(fntFile);
        this.originalFontData = fntData;

        const textures: Record<string, PIXI.Texture> = {};
        for (const imageFile of imageFiles) {
            const imageData = await this.readFileAsDataURL(imageFile);
            textures[imageFile.name] = PIXI.Texture.from(imageData);
        }

        const font = PIXI.BitmapFont.install(fntData, textures, false);
        this.currentFontName = font.font;

        this.bitmapText = new PIXI.BitmapText('0', {
            fontName: this.currentFontName,
            fontSize: this.options.fontSize,
        });
        this.bitmapText.anchor.set(0.5);
        this.bitmapText.position.set(window.innerWidth / 2, window.innerHeight / 2);
        this.app.stage.addChild(this.bitmapText);
    }

    private analyzeFontAndFixIssues(): string {
        if (!this.originalFontData) {
            console.error("No font data to process.");
            return '';
        }

        const lines = this.originalFontData.split('\n');
        let fixedData = '';
        const issues = [];

        for (const line of lines) {
            if (line.startsWith('char id=')) {
                const glyphData = this.parseCharLine(line);

                const originalX = glyphData.xoffset;
                const originalY = glyphData.yoffset;

                // Perform analysis and fix issues with offsets
                if (glyphData.width > 0 && (glyphData.xoffset < 0 || glyphData.yoffset < 0)) {
                    issues.push(`Glyph ID ${glyphData.id}: xOffset(${originalX}) or yOffset(${originalY}) found negative, fixing to 0.`);
                    glyphData.xoffset = Math.max(0, glyphData.xoffset);
                    glyphData.yoffset = Math.max(0, glyphData.yoffset);
                }

                // Log bounds issues (hypothetical problem solution)
                const boundaryIssue =
                    glyphData.xoffset + glyphData.width > glyphData.xadvance
                        ? `Glyph ID ${glyphData.id}: xOffset + width (${glyphData.xoffset + glyphData.width}) exceeds xAdvance (${glyphData.xadvance}), adjusting xAdvance.`
                        : null;
                if (boundaryIssue) {
                    issues.push(boundaryIssue);
                    glyphData.xadvance = glyphData.xoffset + glyphData.width + 1; // Adjust to fit
                }

                // Append fixed character line to the output
                fixedData += this.createCharLine(glyphData) + '\n';
            } else {
                // Preserve other lines (info, common, page, etc.)
                fixedData += line + '\n';
            }
        }

        // Log issues for developer or artist
        console.group("Detected and Fixed Glyph Issues");
        issues.forEach((issue) => console.log(issue));
        console.groupEnd();

        this.fixedFontData = fixedData;
        return fixedData;
    }

    private parseCharLine(line: string): {
        id: number;
        xoffset: number;
        yoffset: number;
        width: number;
        height: number;
        xadvance: number;
    } {
        const match = line.match(/id=(\d+).*?x=(\d+).*?y=(\d+).*?width=(\d+).*?height=(\d+).*?xoffset=(-?\d+).*?yoffset=(-?\d+).*?xadvance=(\d+)/);
        if (!match) {
            throw new Error(`Malformed char line: ${line}`);
        }
        return {
            id: parseInt(match[1], 10),
            xoffset: parseInt(match[2], 10),
            yoffset: parseInt(match[3], 10),
            width: parseInt(match[4], 10),
            height: parseInt(match[5], 10),
            xadvance: parseInt(match[6], 10),
        };
    }

    private createCharLine(data: {
        id: number;
        xoffset: number;
        yoffset: number;
        width: number;
        height: number;
        xadvance: number;
    }): string {
        return `char id=${data.id} xoffset=${data.xoffset} yoffset=${data.yoffset} width=${data.width} height=${data.height} xadvance=${data.xadvance}`;
    }

    private downloadFixedFontFile(data: string, filename: string): void {
        const blob = new Blob([data], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
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
}

// Initialize the application
const fontFixer = new BitmapFontFixer();