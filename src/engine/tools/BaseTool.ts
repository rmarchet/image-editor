import type { EditorEngine } from '../core/EditorEngine';

export interface BaseTool {
  readonly name: string;
  engine: EditorEngine;

  activate(): void;
  deactivate(): void;
  onPointerDown?(worldX: number, worldY: number, event: PointerEvent): void;
  onPointerMove?(worldX: number, worldY: number, event: PointerEvent): void;
  onPointerUp?(worldX: number, worldY: number, event: PointerEvent): void;
  onDoubleClick?(worldX: number, worldY: number, event: MouseEvent): void;
  onKeyDown?(event: KeyboardEvent): void;
  onKeyUp?(event: KeyboardEvent): void;
}
