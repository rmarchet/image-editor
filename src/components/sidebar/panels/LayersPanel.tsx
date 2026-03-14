import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { BiShow, BiHide, BiSolidLockAlt, BiLockOpenAlt, BiTrash,
  BiText, BiShapeSquare, BiPaint, BiImage, BiChevronUp, BiChevronDown,
} from 'react-icons/bi';
import { useElementStore } from '../../../stores/elementStore';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { ReorderCommand, RemoveElementCommand } from '../../../engine/history/commands';
import { useHistoryStore } from '../../../stores/historyStore';

export const LayersPanel = () => {
  const elements = useElementStore((s) => s.elements);
  const selectedIds = useElementStore((s) => s.selectedIds);

  const handleSelect = (id: string) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    engine.selection.selectById(id);
  };

  const handleToggleVisibility = (id: string, currentVisible: boolean) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    const el = engine.getElement(id);
    if (el) {
      el.visible = !currentVisible;
      engine.syncElementsToStore();
    }
  };

  const handleToggleLock = (id: string, currentLocked: boolean) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    const el = engine.getElement(id);
    if (el) {
      el.locked = !currentLocked;
      engine.syncElementsToStore();
    }
  };

  const handleDelete = (id: string) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    const el = engine.getElement(id);
    if (!el) return;
    useHistoryStore.getState().push(new RemoveElementCommand(el));
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const fromIndex = elements.findIndex((el) => el.id === id);
    if (fromIndex === -1) return;

    const toIndex = direction === 'up'
      ? Math.min(elements.length - 1, fromIndex + 1)
      : Math.max(0, fromIndex - 1);

    if (toIndex === fromIndex) return;

    useHistoryStore.getState().push(new ReorderCommand(id, fromIndex, toIndex));
  };

  const reversedElements = [...elements].reverse();

  const layerTypes = {
    'text': { label: 'Txt', icon: <BiText size={12} />, color: '#7c3aed', textColor: '#cdd6f4' },
    'shape': { label: 'Shp', icon: <BiShapeSquare size={12} />, color: '#65a30d', textColor: '#cdd6f4' },
    'drawing': { label: 'Drw', icon: <BiPaint size={12} />, color: '#eaa30d', textColor: '#ffff00' },
    'image': { label: 'Img', icon: <BiImage size={12} />, color: '#16a3fa', textColor: '#cdd6f4' },
  };

  const defaultLayerType = { icon: <BiImage size={12} />, color: '#6c7086', textColor: '#cdd6f4' };
  const actionIconSize = 16;
  const actionButtonSize = 18;

  return (
    <VStack gap={1} alignItems="stretch" className='layers-panel'>
      {reversedElements.length === 0 && (
        <Text fontSize="xs" color="#6c7086" textAlign="center" py={4}>
          No elements yet
        </Text>
      )}
      {reversedElements.map((el, reversedIndex) => {
        const isSelected = selectedIds.includes(el.id);
        const layerIndex = elements.length - 1 - reversedIndex;
        const canMoveUp = layerIndex < elements.length - 1;
        const canMoveDown = layerIndex > 0;
        const layerType = layerTypes[el.type as keyof typeof layerTypes] ?? defaultLayerType;

        return (
          <Flex
            key={el.id}
            alignItems="center"
            gap={1}
            px={1}
            py={1}
            borderRadius="6px"
            bg={isSelected ? '#3a3a5e' : '#2a2a3e'}
            border={isSelected ? '1px solid #7c3aed' : '1px solid transparent'}
            cursor="pointer"
            transition="all 0.1s"
            _hover={{ bg: isSelected ? '#3a3a5e' : '#313244' }}
            onClick={() => handleSelect(el.id)}
          >
            <Box
              w="24px"
              h="24px"
              borderRadius="4px"
              bg={layerType.color}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text fontSize="8px" color={layerType.textColor} textTransform="uppercase">
                {layerType.icon}
              </Text>
            </Box>

            <Text
              flex="1"
              fontSize="xs"
              color="#cdd6f4"
              truncate
              opacity={el.visible ? 1 : 0.4}
            >
              {el.name}
            </Text>

            <Flex gap={1}>
              <Box
                as="button"
                w={`${actionButtonSize}px`}
                h={`${actionButtonSize}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="4px"
                color="#a6adc8"
                aria-disabled={!canMoveUp}
                opacity={canMoveUp ? 1 : 0.4}
                cursor={canMoveUp ? 'pointer' : 'not-allowed'}
                _hover={{ color: canMoveUp ? '#cdd6f4' : '#a6adc8', bg: canMoveUp ? '#313244' : undefined }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!canMoveUp) return;
                  handleMoveLayer(el.id, 'up');
                }}
              >
                <BiChevronUp size={actionIconSize} />
              </Box>
              <Box
                as="button"
                w={`${actionButtonSize}px`}
                h={`${actionButtonSize}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="4px"
                color="#a6adc8"
                aria-disabled={!canMoveDown}
                opacity={canMoveDown ? 1 : 0.4}
                cursor={canMoveDown ? 'pointer' : 'not-allowed'}
                _hover={{ color: canMoveDown ? '#cdd6f4' : '#a6adc8', bg: canMoveDown ? '#313244' : undefined }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!canMoveDown) return;
                  handleMoveLayer(el.id, 'down');
                }}
              >
                <BiChevronDown size={actionIconSize} />
              </Box>
              <Box
                as="button"
                w={`${actionButtonSize}px`}
                h={`${actionButtonSize}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="4px"
                color="#a6adc8"
                _hover={{ color: '#cdd6f4', bg: '#313244' }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleToggleVisibility(el.id, el.visible);
                }}
              >
                {el.visible ? <BiShow size={actionIconSize} /> : <BiHide size={actionIconSize} />}
              </Box>
              <Box
                as="button"
                w={`${actionButtonSize}px`}
                h={`${actionButtonSize}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="4px"
                color="#a6adc8"
                _hover={{ color: '#cdd6f4', bg: '#313244' }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleToggleLock(el.id, el.locked);
                }}
              >
                {el.locked ? <BiSolidLockAlt size={actionIconSize} /> : <BiLockOpenAlt size={actionIconSize} />}
              </Box>
              <Box
                as="button"
                w={`${actionButtonSize}px`}
                h={`${actionButtonSize}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="4px"
                color="#a6adc8"
                _hover={{ color: '#ef4444', bg: '#313244' }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleDelete(el.id);
                }}
              >
                <BiTrash size={actionIconSize} />
              </Box>
            </Flex>
          </Flex>
        );
      })}
    </VStack>
  );
};
