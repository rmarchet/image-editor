import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { useToolStore } from '../../../stores/toolStore';
import { getTheme, getDrawSwatches, isToolEnabled } from '../../../embed/config';

export const DrawPanel = () => {
  if (!isToolEnabled('draw')) {
    return null;
  }

  const drawConfig = useToolStore((s) => s.drawConfig);
  const setDrawConfig = useToolStore((s) => s.setDrawConfig);
  const activeTool = useToolStore((s) => s.activeTool);
  const setActiveTool = useToolStore((s) => s.setActiveTool);
  const theme = getTheme();
  const accentColor = theme.accent;
  const accentHoverColor = theme.accentHover;
  const drawSwatches = getDrawSwatches();

  const isActive = activeTool === 'draw';

  return (
    <VStack gap={4} alignItems="stretch">
      <Box
        as="button"
        w="100%"
        py={2}
        px={3}
        borderRadius="8px"
        bg={isActive ? accentColor : '#2a2a3e'}
        color="#cdd6f4"
        cursor="pointer"
        transition="all 0.15s"
        _hover={{ bg: isActive ? accentHoverColor : '#3a3a5e' }}
        onClick={() => setActiveTool(isActive ? 'select' : 'draw')}
        fontSize="sm"
        fontWeight="500"
      >
        {isActive ? 'Stop Drawing' : 'Start Drawing'}
      </Box>

      <Box>
        <Text fontSize="xs" color="#6c7086" mb={2}>
          Brush Size
        </Text>
        <input
          type="range"
          min="1"
          max="50"
          value={drawConfig.brushSize}
          onChange={(e) => setDrawConfig({ brushSize: Number(e.target.value) })}
          style={{ width: '100%', accentColor }}
        />
        <Text fontSize="xs" color="#cdd6f4" textAlign="right">
          {drawConfig.brushSize}px
        </Text>
      </Box>

      <Box>
        <Text fontSize="xs" color="#6c7086" mb={2}>
          Color
        </Text>
        <Flex gap={2} flexWrap="wrap">
          {drawSwatches.map((color) => (
              <Box
                key={color}
                as="button"
                w="28px"
                h="28px"
                borderRadius="6px"
                bg={color}
                border="2px solid"
                borderColor={drawConfig.brushColor === color ? accentColor : '#313244'}
                cursor="pointer"
                onClick={() => setDrawConfig({ brushColor: color })}
              />
            ))}
        </Flex>
      </Box>

      <Box>
        <Text fontSize="xs" color="#6c7086" mb={2}>
          Opacity
        </Text>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={drawConfig.brushOpacity}
          onChange={(e) => setDrawConfig({ brushOpacity: Number(e.target.value) })}
          style={{ width: '100%', accentColor }}
        />
        <Text fontSize="xs" color="#cdd6f4" textAlign="right">
          {Math.round(drawConfig.brushOpacity * 100)}%
        </Text>
      </Box>
    </VStack>
  );
};
