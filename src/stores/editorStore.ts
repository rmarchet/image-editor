import { create } from 'zustand';
import type { SidebarPanel } from '../types';

interface EditorState {
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  activePanel: SidebarPanel;
  isPanning: boolean;

  setZoom: (zoom: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setBackgroundColor: (color: string) => void;
  setActivePanel: (panel: SidebarPanel) => void;
  setIsPanning: (panning: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  zoom: 1,
  canvasWidth: 1200,
  canvasHeight: 800,
  backgroundColor: '#ffffff',
  activePanel: null,
  isPanning: false,

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setCanvasSize: (canvasWidth, canvasHeight) => set({ canvasWidth, canvasHeight }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setActivePanel: (activePanel) =>
    set((state) => ({
      activePanel: state.activePanel === activePanel ? null : activePanel,
    })),
  setIsPanning: (isPanning) => set({ isPanning }),
}));
