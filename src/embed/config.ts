import type { ShapeType, SidebarPanel, ToolType } from '../types';

export const ALL_EDITOR_TOOLS: ToolType[] = ['select', 'crop', 'draw', 'text', 'shape'];

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

export interface ImageEditorConfig {
  fonts?: ImageEditorFontsConfig;
  theme?: ImageEditorThemeConfig;
  colorPalette?: ImageEditorColorPaletteConfig;
  enabledTools?: ToolType[];
  enabledShapes?: ShapeType[];
  canvas?: ImageEditorCanvasConfig;
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
};

let currentConfig: NormalizedImageEditorConfig = { ...DEFAULT_CONFIG };

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
  };
}

export function setImageEditorConfig(config?: ImageEditorConfig) {
  currentConfig = normalizeImageEditorConfig(config);
}

export function resetImageEditorConfig() {
  currentConfig = normalizeImageEditorConfig();
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

export function getAccentColor() {
  return currentConfig.theme.accent;
}

export function getAccentHoverColor() {
  return currentConfig.theme.accentHover;
}

export function getAccentLightColor() {
  return currentConfig.theme.accentLight;
}

export function getAccentDarkColor() {
  return currentConfig.theme.accentDark;
}

export function getBackgroundSwatches() {
  return currentConfig.colorPalette.backgroundSwatches;
}

export function getDrawSwatches() {
  return currentConfig.colorPalette.drawSwatches;
}