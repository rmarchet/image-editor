import { create } from 'zustand';
import type { SidebarPanel } from '../types';
import { getImageEditorConfig, isPanelEnabled } from '../embed/config';

interface EditorState {
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  activePanel: SidebarPanel;
  isPanning: boolean;
  saveDialogOpen: boolean;

  setZoom: (zoom: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setBackgroundColor: (color: string) => void;
  setActivePanel: (panel: SidebarPanel) => void;
  setIsPanning: (panning: boolean) => void;
  setSaveDialogOpen: (open: boolean) => void;
}

function getEditorStoreDefaults() {
  const { canvas } = getImageEditorConfig();

  return {
    zoom: 1,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    backgroundColor: canvas.backgroundColor,
    activePanel: null as SidebarPanel,
    isPanning: false,
    saveDialogOpen: false,
  };
}

export const useEditorStore = create<EditorState>((set) => ({
  ...getEditorStoreDefaults(),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setCanvasSize: (canvasWidth, canvasHeight) => set({ canvasWidth, canvasHeight }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setActivePanel: (activePanel) =>
    set((state) => {
      if (activePanel && !isPanelEnabled(activePanel)) {
        return { activePanel: null };
      }

      return {
        activePanel: state.activePanel === activePanel ? null : activePanel,
      };
    }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setSaveDialogOpen: (saveDialogOpen) => set({ saveDialogOpen }),
}));

export function resetEditorStore() {
  useEditorStore.setState(getEditorStoreDefaults());
}
