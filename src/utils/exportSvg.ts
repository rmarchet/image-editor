import { EditorEngine } from '../engine/core/EditorEngine';
import { useEditorStore } from '../stores/editorStore';
import type { ShapeElement } from '../engine/elements/ShapeElement';
import type { TextElement } from '../engine/elements/TextElement';
import type { ImageElement } from '../engine/elements/ImageElement';
import type { DrawingElement } from '../engine/elements/DrawingElement';
import type { BaseElement } from '../engine/elements/BaseElement';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build the SVG `transform` attribute that maps a PixiJS container to SVG
 * coordinate space.
 *
 * PixiJS containers have:
 *   - position (x, y): world-space origin of the pivot point
 *   - pivot (px, py): local-space point that acts as the rotation center
 *   - rotation (degrees)
 *   - scale (sx, sy): used for flips
 *
 * Equivalent SVG chain:
 *   translate(x, y) rotate(deg) scale(sx, sy) translate(-px, -py)
 */
function containerTransform(el: BaseElement): string {
  const { x, y, rotation } = el;
  const { x: px, y: py } = el.container.pivot;
  const sx = el.container.scale.x;
  const sy = el.container.scale.y;

  const parts: string[] = [];
  parts.push(`translate(${x} ${y})`);
  if (rotation !== 0) parts.push(`rotate(${rotation})`);
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx} ${sy})`);
  if (px !== 0 || py !== 0) parts.push(`translate(${-px} ${-py})`);

  return parts.join(' ');
}

function wrapGroup(el: BaseElement, inner: string): string {
  const transform = containerTransform(el);
  const opacity = el.opacity !== 1 ? ` opacity="${el.opacity}"` : '';
  const visibility = !el.visible ? ` visibility="hidden"` : '';
  return `<g transform="${transform}"${opacity}${visibility}>\n${inner}\n</g>`;
}

// ---------------------------------------------------------------------------
// Per-element serializers
// ---------------------------------------------------------------------------

function serializeShape(el: ShapeElement): string {
  const { shapeType, fillColor, strokeColor, strokeWidth, shapeWidth, shapeHeight } = el.config;
  const fill = `fill="${esc(fillColor)}"`;
  const stroke = `stroke="${esc(strokeColor)}" stroke-width="${strokeWidth}"`;

  let inner: string;

  switch (shapeType) {
    case 'rectangle':
      inner = `<rect x="0" y="0" width="${shapeWidth}" height="${shapeHeight}" ${fill} ${stroke}/>`;
      break;

    case 'ellipse':
      inner = `<ellipse cx="${shapeWidth / 2}" cy="${shapeHeight / 2}" rx="${shapeWidth / 2}" ry="${shapeHeight / 2}" ${fill} ${stroke}/>`;
      break;

    case 'line':
      inner = `<line x1="0" y1="0" x2="${shapeWidth}" y2="${shapeHeight}" ${stroke}/>`;
      break;

    case 'arrow': {
      const headSize = 12;
      const lineEnd = shapeWidth - 15;
      const cy = shapeHeight / 2;
      inner = [
        `<line x1="0" y1="${cy}" x2="${lineEnd}" y2="${cy}" ${stroke}/>`,
        `<polygon points="${shapeWidth},${cy} ${shapeWidth - headSize},${cy - headSize / 2} ${shapeWidth - headSize},${cy + headSize / 2}" fill="${esc(strokeColor)}"/>`,
      ].join('\n');
      break;
    }

    case 'triangle':
      inner = `<polygon points="${polygonPoints(3, shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'pentagon':
      inner = `<polygon points="${polygonPoints(5, shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'hexagon':
      inner = `<polygon points="${polygonPoints(6, shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'star':
      inner = `<polygon points="${starPoints(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'heart':
      inner = `<path d="${heartPath(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    default:
      inner = '';
  }

  return wrapGroup(el, inner);
}

function polygonPoints(sides: number, width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;
  const startAngle = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i * Math.PI * 2) / sides;
    pts.push(`${cx + Math.cos(angle) * rx},${cy + Math.sin(angle) * ry}`);
  }
  return pts.join(' ');
}

function starPoints(width: number, height: number): string {
  const points = 5;
  const cx = width / 2;
  const cy = height / 2;
  const outerRx = width / 2;
  const outerRy = height / 2;
  const innerRx = outerRx * 0.45;
  const innerRy = outerRy * 0.45;
  const startAngle = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;
    const angle = startAngle + (i * Math.PI) / points;
    pts.push(`${cx + Math.cos(angle) * rx},${cy + Math.sin(angle) * ry}`);
  }
  return pts.join(' ');
}

function heartPath(width: number, height: number): string {
  const pointCount = 80;
  const rawPts: { x: number; y: number }[] = [];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i <= pointCount; i++) {
    const t = (i / pointCount) * Math.PI * 2;
    const rx = 16 * Math.pow(Math.sin(t), 3);
    const ry =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    rawPts.push({ x: rx, y: ry });
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }

  const scaleX = width / Math.max(1, maxX - minX);
  const scaleY = height / Math.max(1, maxY - minY);

  const d: string[] = rawPts.map((p, i) => {
    const x = (p.x - minX) * scaleX;
    const y = (maxY - p.y) * scaleY;
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  });
  d.push('Z');
  return d.join(' ');
}

function serializeText(el: TextElement): string {
  const { text, fontFamily, fontSize, fill, fontWeight, fontStyle, align } = el.config;
  const textAnchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const dominantBaseline = 'hanging';
  const inner = `<text
    x="0"
    y="0"
    font-family="${esc(fontFamily)}"
    font-size="${fontSize}"
    font-weight="${fontWeight}"
    font-style="${fontStyle}"
    fill="${esc(fill)}"
    text-anchor="${textAnchor}"
    dominant-baseline="${dominantBaseline}"
  >${esc(text)}</text>`;
  return wrapGroup(el, inner);
}

function serializeImage(el: ImageElement): string {
  const engine = EditorEngine.getInstance();
  const renderer = engine.app.renderer;

  // Extract element pixels as base64 PNG for embedding
  const extracted = renderer.extract.canvas(el.container) as HTMLCanvasElement;
  const dataUrl = extracted.toDataURL('image/png');

  const inner = `<image href="${dataUrl}" x="0" y="0" width="${el.width}" height="${el.height}" preserveAspectRatio="none"/>`;
  return wrapGroup(el, inner);
}

function serializeDrawing(el: DrawingElement): string {
  const paths: string[] = [];

  for (const stroke of el.strokes) {
    if (stroke.points.length === 0) continue;

    const d: string[] = stroke.points.map((p, i) =>
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`,
    );
    paths.push(
      `<path d="${d.join(' ')}" fill="none" stroke="${esc(stroke.color)}" stroke-width="${stroke.size}" stroke-opacity="${stroke.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  }

  return wrapGroup(el, paths.join('\n'));
}

function serializeElement(el: BaseElement): string {
  if (!el.visible) return '';

  switch (el.type) {
    case 'shape':
      return serializeShape(el as ShapeElement);
    case 'text':
      return serializeText(el as TextElement);
    case 'image':
      return serializeImage(el as ImageElement);
    case 'drawing':
      return serializeDrawing(el as DrawingElement);
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export function exportSvg(filename = 'artboard') {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;

  const { canvasWidth, canvasHeight, backgroundColor } = useEditorStore.getState();
  const elements = engine.getElements();

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">`,
    `<rect width="${canvasWidth}" height="${canvasHeight}" fill="${esc(backgroundColor)}"/>`,
  ];

  for (const el of elements) {
    const svg = serializeElement(el);
    if (svg) parts.push(svg);
  }

  parts.push('</svg>');

  const svgContent = parts.join('\n');
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
