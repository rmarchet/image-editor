import type { ProjectFileV1, ShapeType, SidebarPanel, ToolType } from '../types';

export const ALL_EDITOR_TOOLS: ToolType[] = ['select', 'crop', 'draw', 'text', 'shape'];

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';

export interface ExportPayload {
  format: ExportFormat;
  data: Blob;
  filename: string;
  mimeType: string;
}

export interface ProjectPayload {
  data: ProjectFileV1;
  filename: string;
}

export interface EditorErrorEvent {
  type: 'error' | 'warning';
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export type OnSaveCallback = (payload: ExportPayload) => void | boolean | Promise<void | boolean>;
export type OnSaveProjectCallback = (payload: ProjectPayload) => void | boolean | Promise<void | boolean>;
export type OnErrorCallback = (event: EditorErrorEvent) => void;

export const ALL_EDITOR_SHAPES: ShapeType[] = [
  'rectangle',
  'ellipse',
  'line',
  'arrow',
  'thickArrow',
  'star',
  'dodecagonStar',
  'triangle',
  'pentagon',
  'hexagon',
  'trapezoid',
  'heart',
  'cloud',
  'diamond',
  'crescent',
  'semicircle',
  'ring',
  'roundedRectangle',
  'plus',
];

export const DEFAULT_BACKGROUND_SWATCHS = [
  '#ffffff',
  '#f8f9fa',
  '#e9ecef',
  '#000000',
  '#1e1e2e',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#6366f1',
  '#d946ef',
];

export const DEFAULT_DRAW_SWATCHES = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#ec4899',
];

export interface ImageEditorFontsConfig {
  defaultFamily?: string;
  families?: string[];
}

export interface ImageEditorThemeConfig {
  accent?: string;
  accentHover?: string;
  accentLight?: string;
  accentDark?: string;
  sidebarColor?: string;
  sidebarActiveColor?: string;
  sidebarBackground?: string;
}

export interface ImageEditorColorPaletteConfig {
  backgroundSwatches?: string[];
  drawSwatches?: string[];
}

export interface ImageEditorCanvasConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export type SaveFormat = 'png' | 'jpeg' | 'svg' | 'pdf' | 'ieproj';

export const ALL_SAVE_FORMATS: SaveFormat[] = ['png', 'jpeg', 'svg', 'pdf', 'ieproj'];

export interface ImageEditorExportConfig {
  /** Allowed export formats. Defaults to all formats. */
  allowFormats?: SaveFormat[];
  /** Show the "Export As..." modal. Defaults to true. */
  allowExportAs?: boolean;
  /** Show the Save/Export button in toolbar. Defaults to true. */
  allowSave?: boolean;
}

export interface ImageEditorConfig {
  fonts?: ImageEditorFontsConfig;
  theme?: ImageEditorThemeConfig;
  colorPalette?: ImageEditorColorPaletteConfig;
  enabledTools?: ToolType[];
  enabledShapes?: ShapeType[];
  canvas?: ImageEditorCanvasConfig;
  export?: ImageEditorExportConfig;
  initialProject?: ProjectFileV1 | string;
  initialImage?: string | Blob;
  onSave?: OnSaveCallback;
  onSaveProject?: OnSaveProjectCallback;
  onError?: OnErrorCallback;
}

export interface NormalizedImageEditorConfig {
  fonts: {
    defaultFamily: string;
    families: string[];
  };
  theme: {
    accent: string;
    accentHover: string;
    accentLight: string;
    accentDark: string;
    sidebarColor?: string;
    sidebarActiveColor?: string;
    sidebarBackground?: string;
  };
  colorPalette: {
    backgroundSwatches: string[];
    drawSwatches: string[];
  };
  enabledTools: ToolType[];
  enabledShapes: ShapeType[];
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  initialProject: ProjectFileV1 | null;
  initialImage: string | Blob | null;
  export: {
    allowFormats: SaveFormat[];
    allowExportAs: boolean;
    allowSave: boolean;
  };
}

const DEFAULT_CONFIG: NormalizedImageEditorConfig = {
  fonts: {
    defaultFamily: 'Arial',
    families: ['Arial'],
  },
  theme: {
    accent: '#7c3aed',
    accentHover: '#5419b2',
    accentLight: '#dccfff',
    accentDark: '#5419b2',
    sidebarColor: '#aba3c5cc',
    sidebarActiveColor: '#ffffff',
    sidebarBackground: '#1e1e2e',
  },
  colorPalette: {
    backgroundSwatches: [...DEFAULT_BACKGROUND_SWATCHS],
    drawSwatches: [...DEFAULT_DRAW_SWATCHES],
  },
  enabledTools: [...ALL_EDITOR_TOOLS],
  enabledShapes: [...ALL_EDITOR_SHAPES],
  canvas: {
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
  },
  initialProject: null,
  initialImage: null,
  export: {
    allowFormats: [...ALL_SAVE_FORMATS],
    allowExportAs: true,
    allowSave: true,
  },
};

let currentConfig: NormalizedImageEditorConfig = { ...DEFAULT_CONFIG };

interface EditorCallbacks {
  onSave: OnSaveCallback | null;
  onSaveProject: OnSaveProjectCallback | null;
  onError: OnErrorCallback | null;
}

let currentCallbacks: EditorCallbacks = {
  onSave: null,
  onSaveProject: null,
  onError: null,
};

function uniqueItems<T>(values: T[]) {
  return Array.from(new Set(values));
}

function normalizeFonts(config?: ImageEditorFontsConfig) {
  const families = uniqueItems(
    (config?.families ?? []).map((family) => family.trim()).filter(Boolean)
  );
  const defaultFamily = config?.defaultFamily?.trim() || families[0] || DEFAULT_CONFIG.fonts.defaultFamily;

  return {
    defaultFamily,
    families: families.includes(defaultFamily) ? families : [defaultFamily, ...families],
  };
}

function normalizeTools(enabledTools?: ToolType[]) {
  if (!enabledTools || enabledTools.length === 0) {
    return [...DEFAULT_CONFIG.enabledTools];
  }

  const requested = new Set(enabledTools);
  const next = ALL_EDITOR_TOOLS.filter((tool) => requested.has(tool));

  if (!next.includes('select')) {
    next.unshift('select');
  }

  return uniqueItems(next);
}

function normalizeShapes(enabledShapes?: ShapeType[]) {
  if (!enabledShapes || enabledShapes.length === 0) {
    return [...DEFAULT_CONFIG.enabledShapes];
  }

  const requested = new Set(enabledShapes);
  const next = ALL_EDITOR_SHAPES.filter((shape) => requested.has(shape));
  return next.length > 0 ? next : [...DEFAULT_CONFIG.enabledShapes];
}

function normalizeColorList(values: string[] | undefined, fallback: string[]) {
  if (!values || values.length === 0) {
    return [...fallback];
  }

  const normalized = uniqueItems(values.map((value) => value.trim()).filter(Boolean));
  return normalized.length > 0 ? normalized : [...fallback];
}

function isValidProjectFileV1(value: unknown): value is ProjectFileV1 {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.version === 1 &&
    typeof obj.canvasWidth === 'number' &&
    typeof obj.canvasHeight === 'number' &&
    typeof obj.backgroundColor === 'string' &&
    Array.isArray(obj.elements)
  );
}

function normalizeInitialProject(
  value: ProjectFileV1 | string | undefined
): ProjectFileV1 | null {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return isValidProjectFileV1(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isValidProjectFileV1(value) ? value : null;
}

function normalizeInitialImage(value: string | Blob | undefined): string | Blob | null {
  if (!value) return null;
  if (value instanceof Blob) return value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function normalizeExportConfig(config?: ImageEditorExportConfig) {
  const allowFormats = config?.allowFormats;
  let formats: SaveFormat[];

  if (!allowFormats || allowFormats.length === 0) {
    formats = [...DEFAULT_CONFIG.export.allowFormats];
  } else {
    // Filter to valid formats only, preserving order
    formats = ALL_SAVE_FORMATS.filter((f) => allowFormats.includes(f));
    if (formats.length === 0) {
      formats = [...DEFAULT_CONFIG.export.allowFormats];
    }
  }

  return {
    allowFormats: formats,
    allowExportAs: config?.allowExportAs ?? DEFAULT_CONFIG.export.allowExportAs,
    allowSave: config?.allowSave ?? DEFAULT_CONFIG.export.allowSave,
  };
}

export function normalizeImageEditorConfig(
  config?: ImageEditorConfig
): NormalizedImageEditorConfig {
  return {
    fonts: normalizeFonts(config?.fonts),
    theme: {
      accent: config?.theme?.accent?.trim() || DEFAULT_CONFIG.theme.accent,
      accentHover: config?.theme?.accentHover?.trim() || DEFAULT_CONFIG.theme.accentHover,
      accentLight: config?.theme?.accentLight?.trim() || DEFAULT_CONFIG.theme.accentLight,
      accentDark: config?.theme?.accentDark?.trim() || DEFAULT_CONFIG.theme.accentDark,
      sidebarColor: config?.theme?.sidebarColor?.trim() || DEFAULT_CONFIG.theme.sidebarColor,
      sidebarActiveColor: config?.theme?.sidebarActiveColor?.trim() || DEFAULT_CONFIG.theme.sidebarActiveColor,
      sidebarBackground: config?.theme?.sidebarBackground?.trim() || DEFAULT_CONFIG.theme.sidebarBackground,
    },
    colorPalette: {
      backgroundSwatches: normalizeColorList(
        config?.colorPalette?.backgroundSwatches,
        DEFAULT_CONFIG.colorPalette.backgroundSwatches
      ),
      drawSwatches: normalizeColorList(
        config?.colorPalette?.drawSwatches,
        DEFAULT_CONFIG.colorPalette.drawSwatches
      ),
    },
    enabledTools: normalizeTools(config?.enabledTools),
    enabledShapes: normalizeShapes(config?.enabledShapes),
    canvas: {
      width: config?.canvas?.width ?? DEFAULT_CONFIG.canvas.width,
      height: config?.canvas?.height ?? DEFAULT_CONFIG.canvas.height,
      backgroundColor:
        config?.canvas?.backgroundColor?.trim() || DEFAULT_CONFIG.canvas.backgroundColor,
    },
    initialProject: normalizeInitialProject(config?.initialProject),
    initialImage: normalizeInitialImage(config?.initialImage),
    export: normalizeExportConfig(config?.export),
  };
}

export function setImageEditorConfig(config?: ImageEditorConfig) {
  currentConfig = normalizeImageEditorConfig(config);
  currentCallbacks = {
    onSave: config?.onSave ?? null,
    onSaveProject: config?.onSaveProject ?? null,
    onError: config?.onError ?? null,
  };
}

export function resetImageEditorConfig() {
  currentConfig = normalizeImageEditorConfig();
  currentCallbacks = {
    onSave: null,
    onSaveProject: null,
    onError: null,
  };
}

export function getImageEditorConfig() {
  return currentConfig;
}

export function isToolEnabled(tool: ToolType) {
  return currentConfig.enabledTools.includes(tool);
}

export function isShapeEnabled(shape: ShapeType) {
  return currentConfig.enabledShapes.includes(shape);
}

export function isPanelEnabled(panel: Exclude<SidebarPanel, null>) {
  switch (panel) {
    case 'text':
      return isToolEnabled('text');
    case 'shapes':
      return isToolEnabled('shape') && currentConfig.enabledShapes.length > 0;
    case 'draw':
      return isToolEnabled('draw');
    default:
      return true;
  }
}

export function getDefaultShapeType(): ShapeType {
  return currentConfig.enabledShapes[0] ?? DEFAULT_CONFIG.enabledShapes[0];
}

export function getDefaultFontFamily() {
  return currentConfig.fonts.defaultFamily;
}

export function getBackgroundSwatches() {
  return currentConfig.colorPalette.backgroundSwatches;
}

export function getDrawSwatches() {
  return currentConfig.colorPalette.drawSwatches;
}

export function getSidebarColor() {
  return currentConfig.theme.sidebarColor;
}

export function getSidebarActiveColor() {
  return currentConfig.theme.sidebarActiveColor;
}

export function getTheme() {
  return currentConfig.theme;
}

// ---------------------------------------------------------------------------
// Callback Getters
// ---------------------------------------------------------------------------

export function getOnSaveCallback() {
  return currentCallbacks.onSave;
}

export function getOnSaveProjectCallback() {
  return currentCallbacks.onSaveProject;
}

export function getOnErrorCallback() {
  return currentCallbacks.onError;
}

// ---------------------------------------------------------------------------
// Export Config Getters
// ---------------------------------------------------------------------------

export function getExportConfig() {
  return currentConfig.export;
}

export function isFormatAllowed(format: SaveFormat) {
  return currentConfig.export.allowFormats.includes(format);
}

export function isExportAsAllowed() {
  return currentConfig.export.allowExportAs;
}

export function isSaveAllowed() {
  return currentConfig.export.allowSave;
}
