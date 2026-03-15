import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import createCache from '@emotion/cache';
import { EditorRoot } from '../app/EditorRoot';
import type { ImageEditorConfig, NormalizedImageEditorConfig } from './config';
import { resetImageEditorConfig, setImageEditorConfig, getImageEditorConfig } from './config';
import { clearEditorDomEnvironment, focusEditorMountRoot, queryEditorElement, setEditorDomEnvironment } from './domEnvironment';
import { resetEditorRuntimeState } from '../stores/resetStores';
import { EditorEngine } from '../engine/core/EditorEngine';

export interface ImageEditorHandle {
  destroy: () => void;
  focus: () => void;
  getConfig: () => NormalizedImageEditorConfig;
}

interface MountedEditor {
  root: Root;
  hostElement: HTMLElement;
  shadowRoot: ShadowRoot;
}

let mountedEditor: MountedEditor | null = null;

function createShadowMount(hostElement: HTMLElement) {
  const shadowRoot = hostElement.shadowRoot ?? hostElement.attachShadow({ mode: 'open' });
  shadowRoot.replaceChildren();

  const appHost = hostElement.ownerDocument.createElement('div');
  appHost.setAttribute('data-image-editor-root', 'true');
  appHost.tabIndex = -1;
  appHost.style.width = '100%';
  appHost.style.height = '100%';
  appHost.style.display = 'block';
  appHost.style.position = 'relative';
  appHost.style.outline = 'none';

  const portalHost = hostElement.ownerDocument.createElement('div');
  portalHost.setAttribute('data-image-editor-portals', 'true');
  portalHost.style.position = 'relative';

  shadowRoot.append(appHost, portalHost);

  return { shadowRoot, appHost, portalHost };
}

export function mount(
  hostElement: HTMLElement,
  config?: ImageEditorConfig
): ImageEditorHandle {
  if (mountedEditor) {
    throw new Error('Only one image editor instance can be mounted at a time.');
  }

  setImageEditorConfig(config);
  resetEditorRuntimeState();

  const { shadowRoot, appHost, portalHost } = createShadowMount(hostElement);
  const cache = createCache({
    key: 'image-editor',
    container: shadowRoot,
  });

  setEditorDomEnvironment({
    hostElement,
    mountRoot: appHost,
    shadowRoot,
  });

  const root = createRoot(appHost);
  root.render(
    <StrictMode>
      <EditorRoot cache={cache} shadowRoot={shadowRoot} portalHost={portalHost} />
    </StrictMode>
  );

  mountedEditor = {
    root,
    hostElement,
    shadowRoot,
  };

  return {
    destroy() {
      if (!mountedEditor || mountedEditor.hostElement !== hostElement) {
        return;
      }

      try {
        mountedEditor.root.unmount();
      } finally {
        EditorEngine.destroyInstance();
        resetEditorRuntimeState();
        clearEditorDomEnvironment();
        resetImageEditorConfig();
        mountedEditor.shadowRoot.replaceChildren();
        mountedEditor = null;
      }
    },
    focus() {
      const canvas = queryEditorElement<HTMLCanvasElement>('[data-image-editor-canvas="true"]');
      if (canvas) {
        canvas.focus({ preventScroll: true });
        return;
      }

      focusEditorMountRoot();
    },
    getConfig() {
      return getImageEditorConfig();
    },
  };
}