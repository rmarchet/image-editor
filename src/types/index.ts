export type ToolType = 'select' | 'crop' | 'draw' | 'text' | 'shape';

export type ShapeType =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'star'
  | 'triangle'
  | 'pentagon'
  | 'hexagon'
  | 'heart'
  | 'cloud'
  | 'diamond'
  | 'crescent'
  | 'ring'
  | 'roundedRectangle'
  | 'plus';

export type SidebarPanel =
  | 'upload'
  | 'text'
  | 'shapes'
  | 'draw'
  | 'layers'
  | 'background'
  | 'filters'
  | 'settings'
  | null;

export interface FilterConfig {
  id: string;
  name: string;
  enabled: boolean;
  params: Record<string, number>;
}

export interface ElementSnapshot {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  name: string;
  locked: boolean;
  visible: boolean;
  appliedFilterId: string | null;
}

export interface UploadedAsset {
  id: string;
  name: string;
  blobUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface ProjectData {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  elements: ElementSnapshot[];
  imageBlobs: Record<string, Blob>;
}

export interface DrawingPointData {
  x: number;
  y: number;
}

export interface DrawingStrokeData {
  points: DrawingPointData[];
  color: string;
  size: number;
  opacity: number;
}

export interface ProjectElementBase {
  type: 'image' | 'text' | 'shape' | 'drawing';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  scaleX: number;
  scaleY: number;
  filterId: string | null;
}

export interface ProjectImageElement extends ProjectElementBase {
  type: 'image';
  source: string;
}

export interface ProjectTextElement extends ProjectElementBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  align: 'left' | 'center' | 'right';
  strikethrough: boolean;
}

export interface ProjectShapeElement extends ProjectElementBase {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface ProjectDrawingElement extends ProjectElementBase {
  type: 'drawing';
  strokes: DrawingStrokeData[];
}

export type ProjectElement =
  | ProjectImageElement
  | ProjectTextElement
  | ProjectShapeElement
  | ProjectDrawingElement;

export interface ProjectFileV1 {
  version: 1;
  savedAt: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  elements: ProjectElement[];
}
