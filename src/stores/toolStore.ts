import { create } from 'zustand';
import type { ToolType, ShapeType } from '../types';

interface DrawConfig {
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
}

interface ShapeConfig {
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

interface ToolState {
  activeTool: ToolType;
  drawConfig: DrawConfig;
  shapeConfig: ShapeConfig;
  isCropping: boolean;

  setActiveTool: (tool: ToolType) => void;
  setDrawConfig: (config: Partial<DrawConfig>) => void;
  setShapeConfig: (config: Partial<ShapeConfig>) => void;
  setIsCropping: (cropping: boolean) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  drawConfig: {
    brushSize: 4,
    brushColor: '#000000',
    brushOpacity: 1,
  },
  shapeConfig: {
    shapeType: 'rectangle',
    fillColor: '#3b82f6',
    strokeColor: '#1e40af',
    strokeWidth: 2,
  },
  isCropping: false,

  setActiveTool: (activeTool) => set({ activeTool, isCropping: false }),
  setDrawConfig: (config) =>
    set((state) => ({ drawConfig: { ...state.drawConfig, ...config } })),
  setShapeConfig: (config) =>
    set((state) => ({ shapeConfig: { ...state.shapeConfig, ...config } })),
  setIsCropping: (isCropping) => set({ isCropping }),
}));
