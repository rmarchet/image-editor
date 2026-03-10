import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
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
          DEFAULT: { value: '#7c3aed' },
          hover: { value: '#6d28d9' },
          light: { value: '#ede9fe' },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
