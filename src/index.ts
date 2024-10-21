import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

class BitmapPreviewer {
    private app: PIXI.Application;
    private bitmapText: PIXI.BitmapText | null = null;
    private editableText: HTMLTextAreaElement;
    private currentFontName: string | null = null;
    
    constructor() {
        // Create PixiJS application
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x1099bb,            
            view: document.getElementById('pixiCanvas')! as HTMLCanvasElement,
        });
        
        // Create editable text area
        this.editableText = document.createElement('textarea');
        this.editableText.style.position = 'absolute';
        this.editableText.style.top = '10px';
        this.editableText.style.left = '10px';
        this.editableText.style.width = '300px';
        this.editableText.style.height = '100px';
        this.editableText.value = '';
        document.body.appendChild(this.editableText);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        // File drop event
        document.getElementById('dropArea')!.addEventListener('dragover', (e) => e.preventDefault());
        document.getElementById('dropArea')!.addEventListener('drop', this.handleFileDrop.bind(this));
        
        // Text edit event
        this.editableText.addEventListener('input', this.updateBitmapText.bind(this));
    }
    
    private async handleFileDrop(e: DragEvent): Promise<void> {
        e.preventDefault();
        const files = Array.from(e.dataTransfer?.files || []);
        
        const fntFile = files.find(file => file.name.endsWith('.fnt'));
        const imageFiles = files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file.name));
        
        if (fntFile && imageFiles.length > 0) {
            await this.loadBitmapFont(fntFile, imageFiles);
        }
    }
    
    private async loadBitmapFont(fntFile: File, imageFiles: File[]): Promise<void> {
        const fntData = await this.readFileAsText(fntFile);
        const textures: Record<string, PIXI.Texture> = {};
        
        for (const imageFile of imageFiles) {
            const imageData = await this.readFileAsDataURL(imageFile);
            textures[imageFile.name] = PIXI.Texture.from(imageData);
        }
        
        const font = PIXI.BitmapFont.install(fntData, textures, false);
        console.log('FONT', font);
        this.currentFontName = font.font;
        
        console.log(listBitmapFontGlyphs(this.currentFontName).join(' '))
        this.updateBitmapText();
    }
    
    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    
    private readFileAsDataURL(file: File): Promise<string> {
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
            this.bitmapText = new PIXI.BitmapText(this.editableText.value, {
                fontName: this.currentFontName,
                fontSize: 40,
            });
            this.bitmapText.anchor.set(0.5)
            this.bitmapText.position.set(this.app.renderer.width/2, this.app.renderer.height/2);
            this.app.stage.addChild(this.bitmapText);
            console.log('NEW TEXTY PBJKECT',this.bitmapText)
        }
    }
}

// Usage
const previewer = new BitmapPreviewer();

function listBitmapFontGlyphs(fontName: string): string[] {
    const bitmapFont = PIXI.BitmapFont.available[fontName];
    
    if (!bitmapFont) {
        console.error(`Bitmap font '${fontName}' not found.`);
        return [];
    }
    
    const glyphs: string[] = [];
    
    // Iterate through the character map
    for (const charCode in bitmapFont.chars) {
        const char = String.fromCharCode(parseInt(charCode));
        glyphs.push(char);
    }
    
    return glyphs;
}