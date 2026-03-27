import { mount, type ImageEditorHandle } from './embed/mountImageEditor';
export { mount, type ImageEditorHandle };
export type {
  ImageEditorCanvasConfig,
  ImageEditorColorPaletteConfig,
  ImageEditorConfig,
  ImageEditorFontsConfig,
  ImageEditorWebFontConfig,
  ImageEditorThemeConfig,
  NormalizedImageEditorConfig,
  ExportFormat,
  ExportPayload,
  ProjectPayload,
  EditorErrorEvent,
  OnSaveCallback,
  OnSaveProjectCallback,
  OnErrorCallback,
} from './embed/config';
export type { ProjectFileV1 } from './types';

export default {
  mount,
};
