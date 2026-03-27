import type { ImageEditorWebFontConfig } from './config';

export interface WebFontLoadFailure extends ImageEditorWebFontConfig {
  error: string;
}

export interface WebFontLoadResult {
  loaded: string[];
  failed: WebFontLoadFailure[];
}

function buildFontFaceSource(url: string) {
  // JSON.stringify safely quotes URLs containing spaces/special characters.
  return `url(${JSON.stringify(url)})`;
}

export async function loadWebFonts(
  targetDocument: Document,
  webFonts: ImageEditorWebFontConfig[]
): Promise<WebFontLoadResult> {
  const loaded: string[] = [];
  const failed: WebFontLoadFailure[] = [];

  if (webFonts.length === 0) {
    return { loaded, failed };
  }

  if (typeof FontFace === 'undefined' || !targetDocument.fonts) {
    for (const font of webFonts) {
      failed.push({
        ...font,
        error: 'Font Loading API is not supported in this browser.',
      });
    }
    return { loaded, failed };
  }

  for (const font of webFonts) {
    try {
      const face = new FontFace(font.fontFamily, buildFontFaceSource(font.url));
      const loadedFace = await face.load();
      targetDocument.fonts.add(loadedFace);
      await targetDocument.fonts.load(`16px "${font.fontFamily}"`);
      loaded.push(font.fontFamily);
    } catch (error) {
      failed.push({
        ...font,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { loaded, failed };
}
