import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import createCache from '@emotion/cache';
import { EditorRoot } from '../app/EditorRoot';
import type { ImageEditorConfig, NormalizedImageEditorConfig } from './config';
import {
  resetImageEditorConfig,
  setImageEditorConfig,
  getImageEditorConfig,
  getWebFonts,
} from './config';
import { clearEditorDomEnvironment, focusEditorMountRoot, queryEditorElement, setEditorDomEnvironment } from './domEnvironment';
import { resetEditorRuntimeState } from '../stores/resetStores';
import { EditorEngine } from '../engine/core/EditorEngine';
import { serializeProject, deserializeProject, loadImageToEditor } from '../utils/projectFile';
import { ErrorCodes, reportError, reportWarning } from './errorReporter';
import type { ProjectFileV1 } from '../types';
import { TextElement } from '../engine/elements/TextElement';
import { loadWebFonts } from './webFontLoader';

export interface ImageEditorHandle {
  destroy: () => void;
  focus: () => void;
  getConfig: () => NormalizedImageEditorConfig;
  loadProject: (project: ProjectFileV1 | string) => Promise<void>;
  loadImage: (source: string | Blob) => Promise<void>;
  getProjectData: () => Promise<ProjectFileV1>;
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

function parseProjectInput(input: ProjectFileV1 | string): ProjectFileV1 {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as ProjectFileV1;
    } catch {
      throw new Error('Invalid project JSON string');
    }
  }
  return input;
}

function waitForEngineReady(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const engine = EditorEngine.getInstance();
      if (engine.initialized) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  });
}

async function applyInitialContent(): Promise<void> {
  const config = getImageEditorConfig();

  await waitForEngineReady();

  if (config.initialProject) {
    try {
      await deserializeProject(config.initialProject);
    } catch (error) {
      reportError('PROJECT_LOAD_FAILED', 'Failed to load initial project', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (config.initialImage) {
    try {
      await loadImageToEditor(config.initialImage);
    } catch (error) {
      reportError('IMAGE_LOAD_FAILED', 'Failed to load initial image', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function refreshTextElements() {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) {
    return;
  }

  const textElements = engine
    .getElements()
    .filter((element): element is TextElement => element instanceof TextElement);

  if (textElements.length === 0) {
    return;
  }

  for (const element of textElements) {
    element.updateConfig(element.config);
  }

  engine.syncElementsToStore();
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

  void (async () => {
    const result = await loadWebFonts(hostElement.ownerDocument, getWebFonts());

    if (!mountedEditor || mountedEditor.hostElement !== hostElement) {
      return;
    }

    if (result.failed.length > 0) {
      reportWarning(
        ErrorCodes.WEB_FONT_LOAD_FAILED,
        'One or more configured web fonts failed to load.',
        {
          failedFonts: result.failed,
        }
      );
    }

    if (result.loaded.length > 0) {
      refreshTextElements();
    }
  })();

  applyInitialContent();

  const handle: ImageEditorHandle = {
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
    async loadProject(project: ProjectFileV1 | string) {
      if (!mountedEditor) {
        throw new Error('Editor has been destroyed');
      }

      await waitForEngineReady();
      const data = parseProjectInput(project);
      await deserializeProject(data);
    },
    async loadImage(source: string | Blob) {
      if (!mountedEditor) {
        throw new Error('Editor has been destroyed');
      }

      await waitForEngineReady();
      await loadImageToEditor(source);
    },
    async getProjectData() {
      if (!mountedEditor) {
        throw new Error('Editor has been destroyed');
      }

      await waitForEngineReady();
      return await serializeProject();
    },
  };

  return handle;
}