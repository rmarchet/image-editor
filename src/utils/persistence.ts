import { get, set, del, keys } from 'idb-keyval';
import { useEditorStore } from '../stores/editorStore';
import { useElementStore } from '../stores/elementStore';

const PROJECT_KEY = 'imageEditor_project';
const IMAGES_PREFIX = 'imageEditor_img_';

interface SavedProject {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  elements: ReturnType<typeof useElementStore.getState>['elements'];
  savedAt: number;
}

export async function saveProject() {
  const { canvasWidth, canvasHeight, backgroundColor } = useEditorStore.getState();
  const { elements } = useElementStore.getState();

  const project: SavedProject = {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    elements,
    savedAt: Date.now(),
  };

  await set(PROJECT_KEY, project);
}

export async function loadProject(): Promise<SavedProject | null> {
  return (await get<SavedProject>(PROJECT_KEY)) ?? null;
}

export async function deleteProject() {
  await del(PROJECT_KEY);

  const allKeys = await keys();
  for (const key of allKeys) {
    if (String(key).startsWith(IMAGES_PREFIX)) {
      await del(key);
    }
  }
}

export async function saveImageBlob(id: string, blob: Blob) {
  await set(`${IMAGES_PREFIX}${id}`, blob);
}

export async function loadImageBlob(id: string): Promise<Blob | null> {
  return (await get<Blob>(`${IMAGES_PREFIX}${id}`)) ?? null;
}
