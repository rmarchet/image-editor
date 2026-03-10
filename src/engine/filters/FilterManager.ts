import { ColorMatrixFilter, BlurFilter, NoiseFilter, type Filter } from 'pixi.js';
import { EditorEngine } from '../core/EditorEngine';
import { useElementStore } from '../../stores/elementStore';

export interface FilterPreset {
  id: string;
  name: string;
  create: () => Filter;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'grayscale',
    name: 'Grayscale',
    create: () => {
      const f = new ColorMatrixFilter();
      f.grayscale(0.5, false);
      return f;
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    create: () => {
      const f = new ColorMatrixFilter();
      f.sepia(false);
      return f;
    },
  },
  {
    id: 'brightness',
    name: 'Brighten',
    create: () => {
      const f = new ColorMatrixFilter();
      f.brightness(1.4, false);
      return f;
    },
  },
  {
    id: 'contrast',
    name: 'Contrast',
    create: () => {
      const f = new ColorMatrixFilter();
      f.contrast(0.4, false);
      return f;
    },
  },
  {
    id: 'saturate',
    name: 'Saturate',
    create: () => {
      const f = new ColorMatrixFilter();
      f.saturate(1.5, false);
      return f;
    },
  },
  {
    id: 'desaturate',
    name: 'Desaturate',
    create: () => {
      const f = new ColorMatrixFilter();
      f.desaturate();
      return f;
    },
  },
  {
    id: 'invert',
    name: 'Invert',
    create: () => {
      const f = new ColorMatrixFilter();
      f.negative(false);
      return f;
    },
  },
  {
    id: 'blur',
    name: 'Blur',
    create: () => new BlurFilter({ strength: 4 }),
  },
  {
    id: 'noise',
    name: 'Noise',
    create: () => new NoiseFilter({ noise: 0.3 }),
  },
  {
    id: 'hueRotate',
    name: 'Hue Shift',
    create: () => {
      const f = new ColorMatrixFilter();
      f.hue(90, false);
      return f;
    },
  },
];

export function createFilterById(filterId: string): Filter | null {
  const preset = FILTER_PRESETS.find((p) => p.id === filterId);
  return preset ? preset.create() : null;
}

export class FilterManager {
  applyPreset(filterId: string) {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const selectedIds = useElementStore.getState().selectedIds;
    const preset = FILTER_PRESETS.find((p) => p.id === filterId);

    for (const id of selectedIds) {
      const el = engine.getElement(id);
      if (el) {
        if (!preset) {
          el.container.filters = [];
          el.appliedFilterId = null;
        } else {
          el.container.filters = [preset.create()];
          el.appliedFilterId = filterId;
        }
      }
    }

    engine.syncElementsToStore();
  }

  clearFilters() {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const selectedIds = useElementStore.getState().selectedIds;
    for (const id of selectedIds) {
      const el = engine.getElement(id);
      if (el) {
        el.container.filters = [];
        el.appliedFilterId = null;
      }
    }

    engine.syncElementsToStore();
  }
}
