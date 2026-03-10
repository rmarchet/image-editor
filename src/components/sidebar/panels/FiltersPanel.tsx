import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { BiBlock, BiAdjust, BiBrightnessHalf } from 'react-icons/bi';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { useElementStore } from '../../../stores/elementStore';
import { ColorMatrixFilter, BlurFilter } from 'pixi.js';

interface FilterPreset {
  id: string;
  name: string;
  apply: () => void;
}

const getFilters = (): FilterPreset[] => [
  {
    id: 'none',
    name: ' None',
    icon: <BiBlock size={12} />,
    apply: () => applyFilter(null, null),
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    apply: () => {
      const f = new ColorMatrixFilter();
      f.grayscale(0.5, false);
      applyFilter(f, 'grayscale');
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    apply: () => {
      const f = new ColorMatrixFilter();
      f.sepia(false);
      applyFilter(f, 'sepia');
    },
  },
  {
    id: 'brightness',
    name: 'Brighten',
    icon: <BiBrightnessHalf size={12} />,
    apply: () => {
      const f = new ColorMatrixFilter();
      f.brightness(1.4, false);
      applyFilter(f, 'brightness');
    },
  },
  {
    id: 'contrast',
    name: 'Contrast',
    icon: <BiAdjust size={12} />,
    apply: () => {
      const f = new ColorMatrixFilter();
      f.contrast(0.4, false);
      applyFilter(f, 'contrast');
    },
  },
  {
    id: 'saturate',
    name: 'Saturate',
    apply: () => {
      const f = new ColorMatrixFilter();
      f.saturate(1.5, false);
      applyFilter(f, 'saturate');
    },
  },
  {
    id: 'desaturate',
    name: 'Desaturate',
    apply: () => {
      const f = new ColorMatrixFilter();
      f.desaturate();
      applyFilter(f, 'desaturate');
    },
  },
  {
    id: 'invert',
    name: 'Invert',
    apply: () => {
      const f = new ColorMatrixFilter();
      f.negative(false);
      applyFilter(f, 'invert');
    },
  },
  {
    id: 'blur',
    name: 'Blur',
    apply: () => {
      const f = new BlurFilter({ strength: 4 });
      applyFilter(f, 'blur');
    },
  },
  {
    id: 'hueRotate',
    name: 'Hue Shift',
    apply: () => {
      const f = new ColorMatrixFilter();
      f.hue(90, false);
      applyFilter(f, 'hueRotate');
    },
  },
];

function applyFilter(filter: ColorMatrixFilter | BlurFilter | null, filterId: string | null) {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;

  const selectedIds = useElementStore.getState().selectedIds;
  if (selectedIds.length === 0) return;

  for (const id of selectedIds) {
    const el = engine.getElement(id);
    if (el) {
      el.container.filters = filter ? [filter] : [];
      el.appliedFilterId = filterId;
    }
  }
}

export const FiltersPanel = () => {
  const selectedIds = useElementStore((s) => s.selectedIds);
  const filters = getFilters();

  if (selectedIds.length === 0) {
    return (
      <VStack py={4}>
        <Text fontSize="xs" color="#6c7086" textAlign="center">
          Select an element to apply filters
        </Text>
      </VStack>
    );
  }

  return (
    <SimpleGrid columns={2} gap={2}>
      {filters.map((filter) => (
        <Box
          key={filter.id}
          as="button"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={3}
          borderRadius="8px"
          bg="#2a2a3e"
          gap={1}
          color="#cdd6f4"
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ bg: '#3a3a5e' }}
          onClick={filter.apply}
          fontSize="xs"
        >
          {filter.icon && filter.icon}
          {filter.name}
        </Box>
      ))}
    </SimpleGrid>
  );
};
