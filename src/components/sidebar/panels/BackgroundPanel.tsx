import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { useRef, type ChangeEvent } from 'react';
import { useEditorStore } from '../../../stores/editorStore';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { useHistoryStore } from '../../../stores/historyStore';
import { UpdateCanvasBackgroundCommand } from '../../../engine/history/commands';

const presetColors = [
  '#ffffff',
  '#f8f9fa',
  '#e9ecef',
  '#000000',
  '#1e1e2e',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#6366f1',
  '#d946ef',
];

export const BackgroundPanel = () => {
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const colorPickerSnapshotRef = useRef<string | null>(null);

  const setColor = (color: string) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    const before = useEditorStore.getState().backgroundColor;
    if (before === color) return;
    useHistoryStore.getState().push(new UpdateCanvasBackgroundCommand(before, color));
  };

  const handleColorPickerMouseDown = () => {
    colorPickerSnapshotRef.current = useEditorStore.getState().backgroundColor;
  };

  const handleColorPickerFocus = () => {
    if (colorPickerSnapshotRef.current === null) {
      colorPickerSnapshotRef.current = useEditorStore.getState().backgroundColor;
    }
  };

  const handleColorPickerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    engine.updateCanvasBackground(e.target.value);
  };

  const handleColorPickerBlur = () => {
    const snap = colorPickerSnapshotRef.current;
    colorPickerSnapshotRef.current = null;
    if (snap === null) return;
    const after = useEditorStore.getState().backgroundColor;
    if (snap !== after) {
      useHistoryStore.getState().record(new UpdateCanvasBackgroundCommand(snap, after));
    }
  };

  return (
    <VStack gap={4} alignItems="stretch">
      <Box>
        <Text fontSize="xs" color="#6c7086" mb={2}>
          Canvas Color
        </Text>
        <Flex gap={2} flexWrap="wrap">
          {presetColors.map((color) => (
            <Box
              key={color}
              as="button"
              w="28px"
              h="28px"
              borderRadius="6px"
              bg={color}
              border="2px solid"
              borderColor={backgroundColor === color ? '#7c3aed' : '#313244'}
              cursor="pointer"
              transition="all 0.1s"
              onClick={() => setColor(color)}
            />
          ))}
        </Flex>
        <Flex mt={2} gap={2} alignItems="center">
          <Text fontSize="xs" color="#6c7086">
            Custom:
          </Text>
          <input
            type="color"
            value={backgroundColor}
            onMouseDown={handleColorPickerMouseDown}
            onFocus={handleColorPickerFocus}
            onChange={handleColorPickerChange}
            onBlur={handleColorPickerBlur}
            style={{ width: 32, height: 28, border: 'none', cursor: 'pointer', background: 'transparent' }}
          />
        </Flex>
      </Box>
    </VStack>
  );
};
