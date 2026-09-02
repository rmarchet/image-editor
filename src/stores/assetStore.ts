import { create } from 'zustand';
import type { UploadedAsset } from '../types';

let assetCounter = 0;

function revokeIfObjectUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

interface AssetState {
  assets: UploadedAsset[];
  addAsset: (asset: UploadedAsset) => void;
  removeAsset: (id: string) => void;
  setAssets: (assets: UploadedAsset[]) => void;
}

export const useAssetStore = create<AssetState>((set) => ({
  assets: [],

  addAsset: (asset) =>
    set((state) => ({ assets: [...state.assets, asset] })),

  removeAsset: (id) =>
    set((state) => {
      const asset = state.assets.find((a) => a.id === id);
      if (asset) {
        revokeIfObjectUrl(asset.blobUrl);
      }
      return { assets: state.assets.filter((a) => a.id !== id) };
    }),

  setAssets: (assets) =>
    set((state) => {
      for (const asset of state.assets) {
        revokeIfObjectUrl(asset.blobUrl);
      }

      return { assets };
    }),
}));

export function resetAssetStore() {
  useAssetStore.setState((state) => {
    for (const asset of state.assets) {
      revokeIfObjectUrl(asset.blobUrl);
    }

    return { assets: [] };
  });

  assetCounter = 0;
}

export function generateAssetId(): string {
  return `asset-${++assetCounter}-${Date.now()}`;
}
