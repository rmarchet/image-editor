import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { BiRectangle, BiCircleHalf, BiCircle, BiRightArrowAlt, BiStar, BiHeart, BiMoon, BiSquareRounded, BiPlus } from 'react-icons/bi';
import { TbTriangle, TbArrowBigRight, TbPentagon, TbHexagon, TbCloud } from 'react-icons/tb';
import { PiDiamond, PiRadioButton } from 'react-icons/pi';
import { ShapeElement } from '../../../engine/elements/ShapeElement';
import { useEditorStore } from '../../../stores/editorStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { AddElementCommand } from '../../../engine/history/commands';
import type { ShapeType } from '../../../types';
import { getAccentColor, getAccentLightColor, isShapeEnabled, isToolEnabled } from '../../../embed/config';

function previewStarPoints(pointCount: number, outerRadius: number, innerRadius: number) {
  const center = 16;
  const startAngle = -Math.PI / 2;
  const points: string[] = [];

  for (let index = 0; index < pointCount * 2; index++) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = startAngle + (index * Math.PI) / pointCount;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    points.push(`${x},${y}`);
  }

  return points.join(' ');
}

function getShapes(previewColor: string): { type: ShapeType; label: string; preview: React.ReactNode }[] {
  return [
    {
      type: 'rectangle',
      label: 'Rectangle',
      preview: (<BiRectangle size={32} color={previewColor} />),
    },
    {
      type: 'ellipse',
      label: 'Ellipse',
      preview: (<BiCircle size={32} color={previewColor} />),
    },
    {
      type: 'diamond',
      label: 'Diamond',
      preview: (<PiDiamond size={32} color={previewColor} />),
    },
    {
      type: 'roundedRectangle',
      label: 'Rounded',
      preview: (<BiSquareRounded size={32} color={previewColor} />),
    },
    {
      type: 'line',
      label: 'Line',
      preview: (<Box m={3.5} w="32px" h="3px" bg={previewColor} transform="rotate(-45deg)" />),
    },
    {
      type: 'arrow',
      label: 'Arrow',
      preview: (<BiRightArrowAlt size={32} color={previewColor} />),
    },
    {
      type: 'thickArrow',
      label: 'Arrow 2',
      preview: (<TbArrowBigRight size={32} color={previewColor} />),
    },
    {
      type: 'semicircle',
      label: 'Semicircle',
      preview: (
        <BiCircleHalf size={32} color={previewColor} style={{ transform: 'rotate(90deg)' }} />
      ),
    },
    {
      type: 'triangle',
      label: 'Triangle',
      preview: (<TbTriangle size={32} color={previewColor} />),
    },
    {
      type: 'trapezoid',
      label: 'Trapezoid',
      preview: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <polygon
            points="9,7 23,7 28,25 4,25"
            fill="none"
            stroke={previewColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      type: 'star',
      label: 'Star',
      preview: (<BiStar size={32} color={previewColor} />),
    },
    {
      type: 'dodecagonStar',
      label: 'Star 12',
      preview: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <polygon
            points={previewStarPoints(12, 13, 8)}
            fill="none"
            stroke={previewColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      type: 'heart',
      label: 'Heart',
      preview: (<BiHeart size={32} color={previewColor} />),
    },
    {
      type: 'pentagon',
      label: 'Pentagon',
      preview: (<TbPentagon size={32} color={previewColor} />),
    },
    {
      type: 'hexagon',
      label: 'Hexagon',
      preview: (<TbHexagon size={32} color={previewColor} />),
    },
    {
      type: 'cloud',
      label: 'Cloud',
      preview: (<TbCloud size={32} color={previewColor} />),
    },
    {
      type: 'crescent',
      label: 'Crescent',
      preview: (<BiMoon size={32} color={previewColor} />),
    },
    {
      type: 'ring',
      label: 'Ring',
      preview: (<PiRadioButton size={32} color={previewColor} />),
    },
    {
      type: 'plus',
      label: 'Plus',
      preview: (<BiPlus size={32} color={previewColor} />),
    },
  ];
}

export const ShapesPanel = () => {
  if (!isToolEnabled('shape')) {
    return null;
  }

  const previewColor = getAccentColor();
  const accentLightColor = getAccentLightColor();
  const shapes = getShapes(previewColor).filter((shape) => isShapeEnabled(shape.type));

  const addShape = (type: ShapeType) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    const element = new ShapeElement({ shapeType: type });
    element.x = canvasWidth / 2;
    element.y = canvasHeight / 2;
    useHistoryStore.getState().push(new AddElementCommand(element));
  };

  if (shapes.length === 0) {
    return (
      <Text fontSize="xs" color="#6c7086" textAlign="center" py={4}>
        No shapes are enabled in the current editor configuration
      </Text>
    );
  }

  return (
    <SimpleGrid columns={3} gap={2}>
      {shapes.map((shape) => (
        <Box
          key={shape.type}
          as="button"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
          p={3}
          borderRadius="8px"
          bg="#2a2a3e"
          border="1px solid transparent"
          color="#cdd6f4"
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ bg: '#3a3a5e', borderColor: accentLightColor }}
          onClick={() => addShape(shape.type)}
          aspectRatio="1"
        >
          {shape.preview}
          <Text fontSize="xs">{shape.label}</Text>
        </Box>
      ))}
    </SimpleGrid>
  );
};
