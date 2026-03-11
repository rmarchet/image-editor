import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { BiRectangle, BiCircle, BiRightArrowAlt, BiStar, BiHeart, BiMoon, BiSquareRounded, BiPlus } from 'react-icons/bi';
import { TbTriangle, TbPentagon, TbHexagon, TbCloud } from 'react-icons/tb';
import { PiDiamond, PiRadioButton } from "react-icons/pi";
import { ShapeElement } from '../../../engine/elements/ShapeElement';
import { useEditorStore } from '../../../stores/editorStore';
import type { ShapeType } from '../../../types';

const shapes: { type: ShapeType; label: string; preview: React.ReactNode }[] = [
  {
    type: 'rectangle',
    label: 'Rectangle',
    preview: (<BiRectangle size={32} color="#7c3aed" />),
  },
  {
    type: 'ellipse',
    label: 'Ellipse',
    preview: (<BiCircle size={32} color="#7c3aed" />),
  },
  {
    type: 'diamond',
    label: 'Diamond',
    preview: (<PiDiamond size={32} color="#7c3aed" />),
  },
  {
    type: 'roundedRectangle',
    label: 'Rounded',
    preview: (<BiSquareRounded size={32} color="#7c3aed" />),
  },
  {
    type: 'line',
    label: 'Line',
    preview: (<Box m={3.5} w="32px" h="3px" bg="#7c3aed" transform="rotate(-45deg)" />),
  },
  {
    type: 'arrow',
    label: 'Arrow',
    preview: (<BiRightArrowAlt size={32} color="#7c3aed" />),
  },
  {
    type: 'triangle',
    label: 'Triangle',
    preview: (<TbTriangle size={32} color="#7c3aed" />),
  },
  {
    type: 'star',
    label: 'Star',
    preview: (<BiStar size={32} color="#7c3aed" />),
  },
  {
    type: 'heart',
    label: 'Heart',
    preview: (<BiHeart size={32} color="#7c3aed" />),
  },
  {
    type: 'pentagon',
    label: 'Pentagon',
    preview: (<TbPentagon size={32} color="#7c3aed" />),
  },
  {
    type: 'hexagon',
    label: 'Hexagon',
    preview: (<TbHexagon size={32} color="#7c3aed" />),
  },
  {
    type: 'cloud',
    label: 'Cloud',
    preview: (<TbCloud size={32} color="#7c3aed" />),
  },
  {
    type: 'crescent',
    label: 'Crescent',
    preview: (<BiMoon size={32} color="#7c3aed" />),
  },
  {
    type: 'ring',
    label: 'Ring',
    preview: (<PiRadioButton size={32} color="#7c3aed" />),
  },
  {
    type: 'plus',
    label: 'Plus',
    preview: (<BiPlus size={32} color="#7c3aed" />),
  },
];

export const ShapesPanel = () => {
  const addShape = (type: ShapeType) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    const element = new ShapeElement({ shapeType: type });
    element.x = canvasWidth / 2;
    element.y = canvasHeight / 2;
    engine.addElement(element);
  };

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
          color="#cdd6f4"
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ bg: '#3a3a5e' }}
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
