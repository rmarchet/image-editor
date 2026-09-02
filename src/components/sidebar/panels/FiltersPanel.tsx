import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { BiBlock, BiAdjust, BiBrightnessHalf } from 'react-icons/bi';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { useElementStore } from '../../../stores/elementStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { UpdateFilterCommand, BatchCommand } from '../../../engine/history/commands';

interface FilterPreset {
  id: string;
  name: string;
  icon?: React.ReactNode;
  apply: () => void;
}

const getFilters = (): FilterPreset[] => [
  {
    id: 'none',
    name: 'None',
    icon: <BiBlock size={12} />,
    apply: () => applyFilter(null),
  },
  { id: 'grayscale', name: 'Grayscale', apply: () => applyFilter('grayscale') },
  { id: 'sepia', name: 'Sepia', apply: () => applyFilter('sepia') },
  {
    id: 'brightness',
    name: 'Brighten',
    icon: <BiBrightnessHalf size={12} />,
    apply: () => applyFilter('brightness'),
  },
  {
    id: 'contrast',
    name: 'Contrast',
    icon: <BiAdjust size={12} />,
    apply: () => applyFilter('contrast'),
  },
  { id: 'saturate', name: 'Saturate', apply: () => applyFilter('saturate') },
  { id: 'desaturate', name: 'Desaturate', apply: () => applyFilter('desaturate') },
  { id: 'invert', name: 'Invert', apply: () => applyFilter('invert') },
  { id: 'blur', name: 'Blur', apply: () => applyFilter('blur') },
  { id: 'hueRotate', name: 'Hue Shift', apply: () => applyFilter('hueRotate') },
];

function applyFilter(filterId: string | null) {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;

  const selectedIds = useElementStore.getState().selectedIds;
  if (selectedIds.length === 0) return;

  const commands = selectedIds
    .map((id) => {
      const el = engine.getElement(id);
      if (!el) return null;
      return new UpdateFilterCommand(id, el.appliedFilterId, filterId);
    })
    .filter((c): c is UpdateFilterCommand => c !== null);

  if (commands.length === 0) return;
  const cmd = commands.length === 1 ? commands[0] : new BatchCommand(commands, 'Apply filter');
  useHistoryStore.getState().push(cmd);
}

export const FiltersPanel = () => {
  const selectedIds = useElementStore((s) => s.selectedIds);
  const elements = useElementStore((s) => s.elements);
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

  const selectedFilterIds = selectedIds.map((id) => {
    const snapshot = elements.find((element) => element.id === id);
    return snapshot?.appliedFilterId ?? null;
  });

  const normalizedFilterIds = selectedFilterIds.map((id) => id ?? 'none');
  const uniqueFilterIds = new Set(normalizedFilterIds);
  const isMixed = uniqueFilterIds.size > 1;
  const activeFilterId = isMixed
    ? null
    : normalizedFilterIds[0] ?? 'none';

  return (
    <VStack alignItems="stretch" gap={2}>
      {isMixed && (
        <Text fontSize="xs" color="#a78bfa" fontWeight="600">
          Mixed
        </Text>
      )}
      <SimpleGrid columns={2} gap={2}>
        {filters.map((filter) => {
          const isActive = !isMixed && activeFilterId === filter.id;

          return (
            <Box
              key={filter.id}
              as="button"
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={3}
              borderRadius="8px"
              border="1px solid"
              borderColor={isActive ? '#a78bfa' : 'transparent'}
              bg={isActive ? '#7c3aed' : '#2a2a3e'}
              gap={1}
              color="#cdd6f4"
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ bg: isActive ? '#6d28d9' : '#3a3a5e' }}
              onClick={filter.apply}
              fontSize="xs"
            >
              {filter.icon && filter.icon}
              {filter.name}
            </Box>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
};
