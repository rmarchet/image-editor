import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import type { NormalizedImageEditorConfig } from '../embed/config';

const CSS_VAR_ROOT = ':host';

const DEFAULT_THEME = {
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  accentLight: '#9d87ff',
  accentDark: '#6b21a8',
};

export function createEditorSystem(imageEditorConfig?: Partial<NormalizedImageEditorConfig>) {
  const theme = imageEditorConfig?.theme ?? DEFAULT_THEME;

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
      [`${CSS_VAR_ROOT} textarea[data-text-edit-overlay="true"]::selection`]: {
        background: 'rgba(124, 58, 237, 0.35)',
        color: '#111827',
      },
      [`${CSS_VAR_ROOT} textarea[data-text-edit-overlay="true"]::-moz-selection`]: {
        background: 'rgba(124, 58, 237, 0.35)',
        color: '#111827',
      },
      [`${CSS_VAR_ROOT} [role="menu"]::-webkit-scrollbar`]: {
        width: '8px',
      },
      [`${CSS_VAR_ROOT} [role="menu"]::-webkit-scrollbar-track`]: {
        background: 'transparent',
      },
      [`${CSS_VAR_ROOT} [role="menu"]::-webkit-scrollbar-thumb`]: {
        background: '#d1d5db',
        borderRadius: '4px',
      },
      [`${CSS_VAR_ROOT} [role="menu"]::-webkit-scrollbar-thumb:hover`]: {
        background: '#9ca3af',
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
            DEFAULT: { value: theme.accent ?? DEFAULT_THEME.accent },
            hover: { value: theme.accentHover ?? DEFAULT_THEME.accentHover },
            light: { value: theme.accentLight ?? DEFAULT_THEME.accentLight },
            dark: { value: theme.accentDark ?? DEFAULT_THEME.accentDark },
          },
        },
      },
    },
  });

  return createSystem(defaultConfig, chakraConfig);
}

export const system = createEditorSystem();
