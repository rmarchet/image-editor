import { create } from 'zustand';

interface TextEditState {
  activeElementId: string | null;
  draftText: string;
  originalText: string;
  sessionVersion: number;

  startSession: (elementId: string, initialText: string) => void;
  setDraftText: (value: string) => void;
  clearSession: () => void;
}

export const useTextEditStore = create<TextEditState>((set) => ({
  activeElementId: null,
  draftText: '',
  originalText: '',
  sessionVersion: 0,

  startSession: (activeElementId, initialText) =>
    set((state) => ({
      activeElementId,
      draftText: initialText,
      originalText: initialText,
      sessionVersion: state.sessionVersion + 1,
    })),

  setDraftText: (draftText) => set({ draftText }),

  clearSession: () =>
    set({
      activeElementId: null,
      draftText: '',
      originalText: '',
    }),
}));
