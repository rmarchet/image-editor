import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { useEditorStore } from '../../../stores/editorStore';
import { EditorEngine } from '../../../engine/core/EditorEngine';

const presetSizes = [
  { label: 'HD (1280 × 720)', w: 1280, h: 720 },
  { label: 'Full HD (1920 × 1080)', w: 1920, h: 1080 },
  { label: 'Instagram Post (1080 × 1080)', w: 1080, h: 1080 },
  { label: 'Instagram Story (1080 × 1920)', w: 1080, h: 1920 },
  { label: 'A4 (2480 × 3508)', w: 2480, h: 3508 },
  { label: 'Presentation (1920 × 1080)', w: 1920, h: 1080 },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: '#2a2a3e',
  border: '1px solid #313244',
  borderRadius: 6,
  color: '#cdd6f4',
  fontSize: 13,
};

export const SettingsPanel = () => {
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);

  const handleSizeChange = (width: number, height: number) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    engine.setCanvasSize(width, height);
  };

  return (
    <VStack gap={4} alignItems="stretch">
      <Box>
        <Text fontSize="xs" color="#6c7086" mb={2} fontWeight="600">
          Artboard Size
        </Text>
        <Flex gap={2}>
          <Box flex="1">
            <Text fontSize="10px" color="#6c7086" mb={1}>
              Width (px)
            </Text>
            <input
              type="number"
              value={canvasWidth}
              min={1}
              onChange={(e) => {
                const w = Number(e.target.value);
                if (w > 0) handleSizeChange(w, canvasHeight);
              }}
              style={inputStyle}
            />
          </Box>
          <Box flex="1">
            <Text fontSize="10px" color="#6c7086" mb={1}>
              Height (px)
            </Text>
            <input
              type="number"
              value={canvasHeight}
              min={1}
              onChange={(e) => {
                const h = Number(e.target.value);
                if (h > 0) handleSizeChange(canvasWidth, h);
              }}
              style={inputStyle}
            />
          </Box>
        </Flex>
      </Box>

      <Box>
        <Text fontSize="xs" color="#6c7086" mb={2} fontWeight="600">
          Presets
        </Text>
        <VStack gap={1} alignItems="stretch">
          {presetSizes.map((preset) => (
            <Box
              key={preset.label}
              as="button"
              px={3}
              py={2}
              borderRadius="6px"
              bg={
                canvasWidth === preset.w && canvasHeight === preset.h
                  ? '#3a3a5e'
                  : '#2a2a3e'
              }
              color="#cdd6f4"
              fontSize="12px"
              textAlign="left"
              cursor="pointer"
              transition="all 0.1s"
              _hover={{ bg: '#3a3a5e' }}
              onClick={() => handleSizeChange(preset.w, preset.h)}
            >
              {preset.label}
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};
