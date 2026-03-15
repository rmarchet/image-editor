import { create } from 'zustand';
import type { ToolType, ShapeType } from '../types';
import { getDefaultShapeType, getDrawSwatches, isToolEnabled, isShapeEnabled } from '../embed/config';

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

function getToolStoreDefaults() {
  const drawSwatches = getDrawSwatches();

  return {
    activeTool: 'select' as ToolType,
    drawConfig: {
      brushSize: 4,
      brushColor: drawSwatches[0] ?? '#000000',
      brushOpacity: 1,
    },
    shapeConfig: {
      shapeType: getDefaultShapeType(),
      fillColor: '#3b82f6',
      strokeColor: '#1e40af',
      strokeWidth: 2,
    },
    isCropping: false,
  };
}

export const useToolStore = create<ToolState>((set) => ({
  ...getToolStoreDefaults(),

  setActiveTool: (activeTool) =>
    set({ activeTool: isToolEnabled(activeTool) ? activeTool : 'select', isCropping: false }),
  setDrawConfig: (config) =>
    set((state) => ({ drawConfig: { ...state.drawConfig, ...config } })),
  setShapeConfig: (config) =>
    set((state) => {
      const nextShapeType =
        config.shapeType && isShapeEnabled(config.shapeType)
          ? config.shapeType
          : config.shapeType
            ? getDefaultShapeType()
            : state.shapeConfig.shapeType;

      return {
        shapeConfig: {
          ...state.shapeConfig,
          ...config,
          shapeType: nextShapeType,
        },
      };
    }),
  setIsCropping: (isCropping) => set({ isCropping }),
}));

export function resetToolStore() {
  useToolStore.setState(getToolStoreDefaults());
}
