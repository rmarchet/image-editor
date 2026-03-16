import { CacheProvider } from '@emotion/react';
import { ChakraProvider, EnvironmentProvider } from '@chakra-ui/react';
import type { EmotionCache } from '@emotion/cache';
import { App } from './App';
import { createEditorSystem } from './theme';
import { EditorEnvironmentProvider } from './EditorEnvironment';
import { getImageEditorConfig } from '../embed/config';

interface EditorRootProps {
  cache: EmotionCache;
  shadowRoot: ShadowRoot;
  portalHost: HTMLElement;
}

export const EditorRoot = ({ cache, shadowRoot, portalHost }: EditorRootProps) => {
  const system = createEditorSystem(getImageEditorConfig());

  return (
    <EnvironmentProvider value={() => shadowRoot}>
      <CacheProvider value={cache}>
        <ChakraProvider value={system}>
          <EditorEnvironmentProvider portalHost={portalHost}>
            <App />
          </EditorEnvironmentProvider>
        </ChakraProvider>
      </CacheProvider>
    </EnvironmentProvider>
  );
};