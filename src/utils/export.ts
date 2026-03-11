import { RenderTexture } from 'pixi.js';
import { EditorEngine } from '../engine/core/EditorEngine';
import { useEditorStore } from '../stores/editorStore';

/**
 * Renders the artboard at 1:1 scale and returns the raw HTMLCanvasElement.
 * Returns null if the engine is not initialized.
 */
export function captureArtboardCanvas(): HTMLCanvasElement | null {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return null;

  const { canvasWidth, canvasHeight } = useEditorStore.getState();

  const renderer = engine.app.renderer;
  const stage = engine.viewport.container;
  const exportWidth = Math.max(1, Math.round(canvasWidth));
  const exportHeight = Math.max(1, Math.round(canvasHeight));

  const prevScale = { x: stage.scale.x, y: stage.scale.y };
  const prevPos = { x: stage.position.x, y: stage.position.y };

  const exportTexture = RenderTexture.create({
    width: exportWidth,
    height: exportHeight,
    resolution: renderer.resolution,
  });

  let canvas: HTMLCanvasElement | null = null;

  try {
    stage.scale.set(1);
    stage.position.set(0, 0);

    renderer.render({
      container: stage,
      target: exportTexture,
      clear: true,
    });

    canvas = renderer.extract.canvas(exportTexture) as HTMLCanvasElement;
  } finally {
    stage.scale.set(prevScale.x, prevScale.y);
    stage.position.set(prevPos.x, prevPos.y);
    exportTexture.destroy();
  }

  return canvas;
}

export function exportCanvas(
  format: 'png' | 'jpeg' = 'png',
  quality = 1,
  filename = 'artboard',
) {
  const canvas = captureArtboardCanvas();
  if (!canvas) return;

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  link.click();
}
