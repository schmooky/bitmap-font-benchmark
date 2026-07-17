import {
  Assets,
  BitmapFont,
  Cache,
  bitmapFontTextParser,
  bitmapFontXMLStringParser,
  type BitmapFontData,
} from "pixi.js";

export interface FontEntry {
  id: string;
  label: string;
  /** The fontFamily string to pass to BitmapText style. */
  fontFamily: string;
  description: string;
}

/**
 * No fonts ship with the app. A bitmap font (Angel-Code .fnt / .xml + page
 * image) is only ever provided by the user via drag-and-drop.
 */

/** Look up the resolved (installed) BitmapFont by the family used in a style. */
export function getInstalledFont(fontFamily: string): BitmapFont | undefined {
  return Cache.get<BitmapFont>(`${fontFamily}-bitmap`);
}

function readText(file: File): Promise<string> {
  return file.text();
}

/**
 * Parse a dragged Angel-Code bitmap font (.fnt / .xml) plus its page image(s)
 * and register it so BitmapText can use it by fontFamily.
 */
export async function parseDroppedFont(files: File[]): Promise<FontEntry> {
  const descriptor = files.find((f) => /\.(fnt|xml)$/i.test(f.name));
  const images = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name));
  if (!descriptor) throw new Error("Drop a .fnt or .xml descriptor together with its page image(s).");
  if (images.length === 0) throw new Error("Missing the font page image (.png/.webp).");

  const raw = await readText(descriptor);
  let data: BitmapFontData;
  if (bitmapFontTextParser.test(raw)) {
    data = bitmapFontTextParser.parse(raw);
  } else if (bitmapFontXMLStringParser.test(raw)) {
    data = bitmapFontXMLStringParser.parse(raw);
  } else {
    throw new Error("Unrecognised bitmap-font descriptor format.");
  }

  const byName = new Map(images.map((f) => [f.name, f] as const));
  const textures = [];
  for (const page of data.pages) {
    const base = page.file.split(/[\\/]/).pop() || page.file;
    const file = byName.get(base) || byName.get(page.file) || images[0];
    const url = URL.createObjectURL(file);
    const tex = await Assets.load({ src: url, loadParser: "loadTextures", format: base.split(".").pop() });
    textures.push(tex);
  }

  const family = data.fontFamily || descriptor.name.replace(/\.(fnt|xml)$/i, "");
  const font = new BitmapFont({ data, textures }, descriptor.name);
  Cache.set(`${family}-bitmap`, font);

  return {
    id: `dropped-${family}-${Date.now()}`,
    label: family,
    fontFamily: family,
    description: `Loaded from ${descriptor.name} + ${images.length} page image(s).`,
  };
}
