import { create } from 'zustand';
import type { ElementSnapshot } from '../types';

interface ElementState {
  elements: ElementSnapshot[];
  selectedIds: string[];

  setElements: (elements: ElementSnapshot[]) => void;
  addElement: (element: ElementSnapshot) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<ElementSnapshot>) => void;
  selectElement: (id: string, additive?: boolean) => void;
  deselectAll: () => void;
  setSelectedIds: (ids: string[]) => void;
  reorderElement: (id: string, newIndex: number) => void;
}

function getElementStoreDefaults() {
  return {
    elements: [] as ElementSnapshot[],
    selectedIds: [] as string[],
  };
}

export const useElementStore = create<ElementState>((set) => ({
  ...getElementStoreDefaults(),

  setElements: (elements) => set({ elements }),

  addElement: (element) =>
    set((state) => ({ elements: [...state.elements, element] })),

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),

  selectElement: (id, additive = false) =>
    set((state) => ({
      selectedIds: additive
        ? state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id]
        : [id],
    })),

  deselectAll: () => set({ selectedIds: [] }),

  setSelectedIds: (selectedIds) => set({ selectedIds }),

  reorderElement: (id, newIndex) =>
    set((state) => {
      const elements = [...state.elements];
      const oldIndex = elements.findIndex((el) => el.id === id);
      if (oldIndex === -1 || oldIndex === newIndex) return state;
      const [moved] = elements.splice(oldIndex, 1);
      elements.splice(newIndex, 0, moved);
      return { elements };
    }),
}));

export function resetElementStore() {
  useElementStore.setState(getElementStoreDefaults());
}
