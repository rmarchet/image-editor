import { EditorEngine } from '../engine/core/EditorEngine';
import { useEditorStore } from '../stores/editorStore';

export function exportCanvas(format: 'png' | 'jpeg' = 'png', quality = 1) {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;

  const { canvasWidth, canvasHeight } = useEditorStore.getState();

  const renderer = engine.app.renderer;
  const stage = engine.viewport.container;

  const prevScale = { x: stage.scale.x, y: stage.scale.y };
  const prevPos = { x: stage.position.x, y: stage.position.y };

  stage.scale.set(1);
  stage.position.set(0, 0);

  const originalWidth = renderer.width;
  const originalHeight = renderer.height;
  renderer.resize(canvasWidth, canvasHeight);

  const canvas = renderer.extract.canvas(stage) as HTMLCanvasElement;

  stage.scale.set(prevScale.x, prevScale.y);
  stage.position.set(prevPos.x, prevPos.y);
  renderer.resize(originalWidth, originalHeight);

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const link = document.createElement('a');
  link.download = `image-editor-export.${format}`;
  link.href = dataUrl;
  link.click();
}
