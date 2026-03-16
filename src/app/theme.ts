import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import type { ImageEditorConfig } from '../embed/config';

const CSS_VAR_ROOT = ':host';

export function createEditorSystem(imageEditorConfig: ImageEditorConfig = {}) {
  const chakraConfig = defineConfig({
    cssVarsRoot: CSS_VAR_ROOT,
    conditions: {
      light: `${CSS_VAR_ROOT} &, .light &`,
    },
    preflight: { scope: CSS_VAR_ROOT },
    globalCss: {
      [CSS_VAR_ROOT]: {
        width: '100%',
        height: '100%',
        display: 'block',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      },
      [`${CSS_VAR_ROOT}, ${CSS_VAR_ROOT} *`]: {
        boxSizing: 'border-box',
      },
    },
    theme: {
      tokens: {
        colors: {
          sidebar: {
            bg: { value: '#1e1e2e' },
            hover: { value: '#2a2a3e' },
            active: { value: '#3a3a5e' },
            text: { value: '#cdd6f4' },
            textMuted: { value: '#6c7086' },
            border: { value: '#313244' },
          },
          canvas: {
            bg: { value: '#e6e6e6' },
          },
          toolbar: {
            bg: { value: '#ffffff' },
            border: { value: '#e2e8f0' },
          },
          accent: {
            DEFAULT: { value: imageEditorConfig.theme?.accent ?? '#7c3aed' },
            hover: { value: imageEditorConfig.theme?.accentHover ?? '#6d28d9' },
            light: { value: imageEditorConfig.theme?.accentLight ?? '#9d87ff' },
            dark: { value: imageEditorConfig.theme?.accentDark ?? '#6b21a8' },
          },
        },
      },
    },
  });

  return createSystem(defaultConfig, chakraConfig);
}

export const system = createEditorSystem();
