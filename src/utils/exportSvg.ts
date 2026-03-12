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

    case 'thickArrow':
      inner = `<polygon points="${thickArrowPoints(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'semicircle':
      inner = `<path d="${semicirclePath(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'trapezoid':
      inner = `<polygon points="${trapezoidPoints(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

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
      inner = `<polygon points="${starPoints(5, shapeWidth, shapeHeight, 0.45)}" ${fill} ${stroke}/>`;
      break;

    case 'dodecagonStar':
      inner = `<polygon points="${starPoints(12, shapeWidth, shapeHeight, 0.62)}" ${fill} ${stroke}/>`;
      break;

    case 'heart':
      inner = `<path d="${heartPath(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'diamond':
      inner = `<polygon points="${diamondPoints(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'roundedRectangle': {
      const radius = Math.min(shapeWidth, shapeHeight) * 0.15;
      inner = `<rect x="0" y="0" width="${shapeWidth}" height="${shapeHeight}" rx="${radius}" ry="${radius}" ${fill} ${stroke}/>`;
      break;
    }

    case 'plus':
      inner = `<polygon points="${plusPoints(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'cloud':
      inner = `<path d="${cloudPath(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'crescent':
      inner = `<path d="${crescentPath(shapeWidth, shapeHeight)}" ${fill} ${stroke}/>`;
      break;

    case 'ring':
      inner = `<path d="${ringPath(shapeWidth, shapeHeight)}" ${fill} ${stroke} fill-rule="evenodd"/>`;
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

function starPoints(pointCount: number, width: number, height: number, innerScale: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const outerRx = width / 2;
  const outerRy = height / 2;
  const innerRx = outerRx * innerScale;
  const innerRy = outerRy * innerScale;
  const startAngle = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < pointCount * 2; i++) {
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;
    const angle = startAngle + (i * Math.PI) / pointCount;
    pts.push(`${cx + Math.cos(angle) * rx},${cy + Math.sin(angle) * ry}`);
  }
  return pts.join(' ');
}

function diamondPoints(width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  return `${cx},0 ${width},${cy} ${cx},${height} 0,${cy}`;
}

function thickArrowPoints(width: number, height: number): string {
  const shaftHeight = height * 0.42;
  const shaftTop = (height - shaftHeight) / 2;
  const shaftBottom = shaftTop + shaftHeight;
  const headWidth = width * 0.34;
  const neckX = width - headWidth;
  const centerY = height / 2;

  return [
    `0,${shaftTop}`,
    `${neckX},${shaftTop}`,
    `${neckX},0`,
    `${width},${centerY}`,
    `${neckX},${height}`,
    `${neckX},${shaftBottom}`,
    `0,${shaftBottom}`,
  ].join(' ');
}

function semicirclePath(width: number, height: number): string {
  const cx = width / 2;
  const cy = height;
  const rx = width / 2;
  const ry = height;
  const pointCount = 48;
  const commands = [`M 0 ${height}`];

  for (let index = 0; index <= pointCount; index++) {
    const angle = Math.PI - (index * Math.PI) / pointCount;
    const x = cx + Math.cos(angle) * rx;
    const y = cy - Math.sin(angle) * ry;
    commands.push(`L ${x} ${y}`);
  }

  commands.push(`L ${width} ${height}`);
  commands.push('Z');
  return commands.join(' ');
}

function trapezoidPoints(width: number, height: number): string {
  const topInset = width * 0.18;
  return `${topInset},0 ${width - topInset},0 ${width},${height} 0,${height}`;
}

function plusPoints(width: number, height: number): string {
  const centerX = width / 2;
  const centerY = height / 2;
  const baseSize = Math.min(width, height);
  const armWidth = baseSize * 0.3;
  const armLength = baseSize * 0.65;

  return [
    `${centerX - armWidth / 2},${centerY - armLength / 2}`,
    `${centerX + armWidth / 2},${centerY - armLength / 2}`,
    `${centerX + armWidth / 2},${centerY - armWidth / 2}`,
    `${centerX + armLength / 2},${centerY - armWidth / 2}`,
    `${centerX + armLength / 2},${centerY + armWidth / 2}`,
    `${centerX + armWidth / 2},${centerY + armWidth / 2}`,
    `${centerX + armWidth / 2},${centerY + armLength / 2}`,
    `${centerX - armWidth / 2},${centerY + armLength / 2}`,
    `${centerX - armWidth / 2},${centerY + armWidth / 2}`,
    `${centerX - armLength / 2},${centerY + armWidth / 2}`,
    `${centerX - armLength / 2},${centerY - armWidth / 2}`,
    `${centerX - armWidth / 2},${centerY - armWidth / 2}`,
  ].join(' ');
}

function cloudPath(width: number, height: number): string {
  const baseY = height * 0.6;
  const left = { cx: width * 0.18, cy: baseY - 5, r: width * 0.18 };
  const center = { cx: width * 0.45, cy: height * 0.34, r: width * 0.23 };
  const right = { cx: width * 0.75, cy: baseY - 5, r: width * 0.25 };
  const steps = 400;
  const commands = [`M 0 ${baseY}`];

  for (let index = 0; index <= steps; index++) {
    const x = (index / steps) * width;
    let minY = baseY;

    for (const point of [left, center, right]) {
      const dx = x - point.cx;
      if (Math.abs(dx) < point.r) {
        const arcY = point.cy - Math.sqrt(point.r * point.r - dx * dx);
        minY = Math.min(minY, arcY);
      }
    }

    commands.push(`L ${x} ${minY}`);
  }

  commands.push(`L ${width} ${baseY}`);
  commands.push(`L 0 ${baseY}`);
  commands.push('Z');
  return commands.join(' ');
}

function crescentPath(width: number, height: number): string {
  const radius = Math.min(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const distance = radius * 0.55;
  const pointCount = 100;
  const h = Math.sqrt(radius * radius - (distance * distance) / 4);
  const aTop = Math.atan2(-h, distance / 2);
  const aBottom = Math.atan2(h, distance / 2);
  const bBottom = Math.atan2(h, -distance / 2);
  const bTop = Math.atan2(-h, -distance / 2);
  const sweepA = 2 * Math.PI - (aBottom - aTop);
  const target = bTop + 2 * Math.PI;
  const sweepB = target - bBottom;

  const commands = [`M ${cx + Math.cos(aTop) * radius} ${cy + Math.sin(aTop) * radius}`];

  for (let index = 1; index <= pointCount; index++) {
    const angle = aTop - (sweepA * index) / pointCount;
    commands.push(`L ${cx + Math.cos(angle) * radius} ${cy + Math.sin(angle) * radius}`);
  }

  for (let index = 1; index <= pointCount; index++) {
    const angle = bBottom + (sweepB * index) / pointCount;
    commands.push(
      `L ${cx + distance + Math.cos(angle) * radius} ${cy + Math.sin(angle) * radius}`
    );
  }

  commands.push('Z');
  return commands.join(' ');
}

function ringPath(width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = width / 2;
  const innerRadius = outerRadius * 0.6;
  return [
    circlePath(cx, cy, outerRadius),
    circlePath(cx, cy, innerRadius),
  ].join(' ');
}

function circlePath(cx: number, cy: number, radius: number): string {
  return [
    `M ${cx + radius} ${cy}`,
    `A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`,
    `A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy}`,
    'Z',
  ].join(' ');
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
