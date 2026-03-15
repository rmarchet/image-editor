import { resetAssetStore } from './assetStore';
import { resetEditorStore } from './editorStore';
import { resetElementStore } from './elementStore';
import { resetHistoryStore } from './historyStore';
import { resetTextEditStore } from './textEditStore';
import { resetToolStore } from './toolStore';

export function resetEditorRuntimeState() {
  resetHistoryStore();
  resetElementStore();
  resetTextEditStore();
  resetAssetStore();
  resetToolStore();
  resetEditorStore();
}