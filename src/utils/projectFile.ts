import { EditorEngine } from '../engine/core/EditorEngine';
import { ImageElement } from '../engine/elements/ImageElement';
import { TextElement } from '../engine/elements/TextElement';
import { ShapeElement } from '../engine/elements/ShapeElement';
import { DrawingElement } from '../engine/elements/DrawingElement';
import type { BaseElement } from '../engine/elements/BaseElement';
import { createFilterById } from '../engine/filters/FilterManager';
import { useEditorStore } from '../stores/editorStore';
import type {
  ProjectElement,
  ProjectElementBase,
  ProjectFileV1,
  ProjectImageElement,
  ProjectTextElement,
  ProjectShapeElement,
  ProjectDrawingElement,
} from '../types';

const PROJECT_VERSION = 1;
const PROJECT_FILE_EXTENSION = 'ieproj';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Invalid file data'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

async function normalizeSourceToDataUrl(source: string): Promise<string> {
  if (source.startsWith('data:')) return source;

  try {
    const response = await fetch(source);
    if (!response.ok) return source;
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return source;
  }
}

function downloadTextFile(content: string, fileName: string, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildBaseProjectElement(element: BaseElement): ProjectElementBase {
  return {
    type: element.type as ProjectElementBase['type'],
    name: element.name,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    locked: element.locked,
    visible: element.visible,
    scaleX: element.container.scale.x,
    scaleY: element.container.scale.y,
    filterId: element.appliedFilterId,
  };
}

async function serializeImageElement(
  engine: EditorEngine,
  element: ImageElement
): Promise<ProjectImageElement> {
  const base = buildBaseProjectElement(element);

  let source = element.sourceUrl;
  if (!source) {
    const canvas = engine.app.renderer.extract.canvas(element.container) as HTMLCanvasElement;
    source = canvas.toDataURL('image/png');
  }

  return {
    ...base,
    type: 'image',
    source: await normalizeSourceToDataUrl(source),
  };
}

function serializeTextElement(element: TextElement): ProjectTextElement {
  const base = buildBaseProjectElement(element);
  const config = element.config;

  return {
    ...base,
    type: 'text',
    text: config.text,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    fill: config.fill,
    fontWeight: config.fontWeight,
    fontStyle: config.fontStyle,
    align: config.align,
    strikethrough: config.strikethrough,
  };
}

function serializeShapeElement(element: ShapeElement): ProjectShapeElement {
  const base = buildBaseProjectElement(element);
  const config = element.config;

  return {
    ...base,
    type: 'shape',
    shapeType: config.shapeType,
    fillColor: config.fillColor,
    strokeColor: config.strokeColor,
    strokeWidth: config.strokeWidth,
  };
}

function serializeDrawingElement(element: DrawingElement): ProjectDrawingElement {
  const base = buildBaseProjectElement(element);
  return {
    ...base,
    type: 'drawing',
    strokes: element.strokes,
  };
}

async function serializeElement(engine: EditorEngine, element: BaseElement): Promise<ProjectElement | null> {
  if (element instanceof ImageElement) {
    return await serializeImageElement(engine, element);
  }

  if (element instanceof TextElement) {
    return serializeTextElement(element);
  }

  if (element instanceof ShapeElement) {
    return serializeShapeElement(element);
  }

  if (element instanceof DrawingElement) {
    return serializeDrawingElement(element);
  }

  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProjectFileV1(value: unknown): value is ProjectFileV1 {
  if (!isObject(value)) return false;
  if (value.version !== PROJECT_VERSION) return false;
  if (typeof value.canvasWidth !== 'number') return false;
  if (typeof value.canvasHeight !== 'number') return false;
  if (typeof value.backgroundColor !== 'string') return false;
  if (!Array.isArray(value.elements)) return false;
  return true;
}

function applyCommonElementProps(element: BaseElement, data: ProjectElement) {
  element.name = data.name;
  element.x = data.x;
  element.y = data.y;
  element.width = data.width;
  element.height = data.height;
  element.rotation = data.rotation;
  element.opacity = data.opacity;
  element.locked = data.locked;
  element.visible = data.visible;
  element.container.scale.set(data.scaleX, data.scaleY);

  if (data.filterId) {
    const filter = createFilterById(data.filterId);
    element.container.filters = filter ? [filter] : [];
    element.appliedFilterId = filter ? data.filterId : null;
  } else {
    element.container.filters = [];
    element.appliedFilterId = null;
  }
}

async function deserializeElement(data: ProjectElement): Promise<BaseElement | null> {
  switch (data.type) {
    case 'image':
      return await ImageElement.fromURL(data.source);
    case 'text':
      return new TextElement({
        text: data.text,
        fontFamily: data.fontFamily,
        fontSize: data.fontSize,
        fill: data.fill,
        fontWeight: data.fontWeight,
        fontStyle: data.fontStyle,
        align: data.align,
        strikethrough: data.strikethrough ?? false,
      });
    case 'shape':
      return new ShapeElement({
        shapeType: data.shapeType,
        fillColor: data.fillColor,
        strokeColor: data.strokeColor,
        strokeWidth: data.strokeWidth,
        shapeWidth: data.width,
        shapeHeight: data.height,
      });
    case 'drawing':
      return new DrawingElement(data.strokes);
    default:
      return null;
  }
}

function buildProjectFileName(fileName?: string): string {
  const baseName = fileName?.trim();
  if (!baseName) {
    const datePart = new Date().toISOString().slice(0, 10);
    return `image-editor-${datePart}.${PROJECT_FILE_EXTENSION}`;
  }

  const extension = `.${PROJECT_FILE_EXTENSION}`;
  if (baseName.toLowerCase().endsWith(extension)) {
    return baseName;
  }

  return `${baseName}${extension}`;
}

export async function serializeProject(): Promise<ProjectFileV1> {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) {
    throw new Error('Editor not initialized');
  }

  const { canvasWidth, canvasHeight, backgroundColor } = useEditorStore.getState();
  const elements = engine.getElements();

  const serialized: ProjectElement[] = [];
  for (const element of elements) {
    const item = await serializeElement(engine, element);
    if (item) serialized.push(item);
  }

  return {
    version: PROJECT_VERSION,
    savedAt: Date.now(),
    canvasWidth,
    canvasHeight,
    backgroundColor,
    elements: serialized,
  };
}

export async function deserializeProject(data: ProjectFileV1): Promise<void> {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) {
    throw new Error('Editor not initialized');
  }

  const existingElements = engine.getElements();
  for (const element of existingElements) {
    engine.removeElement(element.id);
  }

  engine.setCanvasSize(data.canvasWidth, data.canvasHeight);
  engine.updateCanvasBackground(data.backgroundColor);

  for (const item of data.elements) {
    const element = await deserializeElement(item);
    if (!element) continue;

    applyCommonElementProps(element, item);
    engine.addElement(element);
  }

  engine.selection.deselectAll();
  engine.syncElementsToStore();
}

export async function saveProjectToFile(fileName?: string) {
  const payload = await serializeProject();
  const nextFileName = buildProjectFileName(fileName);
  downloadTextFile(JSON.stringify(payload, null, 2), nextFileName);
}

export async function loadProjectFromFile(file: File): Promise<ProjectImageElement[]> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid project file format');
  }

  if (!isProjectFileV1(parsed)) {
    throw new Error('Unsupported or invalid project file');
  }

  const projectImages = parsed.elements.filter(
    (item): item is ProjectImageElement => item.type === 'image'
  );

  await deserializeProject(parsed);

  return projectImages;
}

export async function loadImageToEditor(source: string | Blob): Promise<void> {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) {
    throw new Error('Editor not initialized');
  }

  let imageUrl: string;
  if (source instanceof Blob) {
    imageUrl = URL.createObjectURL(source);
  } else {
    imageUrl = source;
  }

  try {
    const imageElement = await ImageElement.fromURL(imageUrl);

    const existingElements = engine.getElements();
    for (const element of existingElements) {
      engine.removeElement(element.id);
    }

    engine.setCanvasSize(imageElement.width, imageElement.height);

    imageElement.x = 0;
    imageElement.y = 0;

    engine.addElement(imageElement);
    engine.selection.deselectAll();
    engine.syncElementsToStore();
  } finally {
    if (source instanceof Blob) {
      URL.revokeObjectURL(imageUrl);
    }
  }
}
