import { Flex, Box, Text } from '@chakra-ui/react';
import { BiZoomIn, BiZoomOut, BiTargetLock } from 'react-icons/bi';
import { useEditorStore } from '../../stores/editorStore';
import { EditorEngine } from '../../engine/core/EditorEngine';

export const BottomBar = () => {
  const zoom = useEditorStore((s) => s.zoom);

  const handleZoomIn = () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    engine.viewport.setZoom(zoom * 1.2);
  };

  const handleZoomOut = () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    engine.viewport.setZoom(zoom * 0.8);
  };

  const handleFit = () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    engine.fitToScreen();
  };

  return (
    <Flex
      h="32px"
      bg="white"
      borderTop="1px solid"
      borderColor="#e2e8f0"
      px={3}
      alignItems="center"
      justifyContent="flex-end"
      gap={2}
      flexShrink={0}
      className='bottom-bar'
    >
      <ZoomButton icon={<BiZoomOut size={14} />} onClick={handleZoomOut} />
 
        <input
          type="range"
          min="5"
          max="500"
          value={Math.round(zoom * 100)}
          onChange={(e) => {
            const engine = EditorEngine.getInstance();
            if (!engine.initialized) return;
            engine.viewport.setZoom(Number(e.target.value) / 100);
          }}
          style={{ height: 4, width: 80, accentColor: '#7c3aed' }}
        /> 

      <ZoomButton icon={<BiZoomIn size={14} />} onClick={handleZoomIn} />

      <Text fontSize="xs" color="gray.500" w="42px" textAlign="center" fontFamily="mono">
        {Math.round(zoom * 100)}%
      </Text>

      <ZoomButton icon={<BiTargetLock size={14} />} onClick={handleFit} />
    </Flex>
  );
};

const ZoomButton = ({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <Box
    as="button"
    display="flex"
    alignItems="center"
    justifyContent="center"
    w="22px"
    h="22px"
    borderRadius="4px"
    color="gray.500"
    cursor="pointer"
    transition="all 0.1s"
    _hover={{ bg: 'gray.100', color: 'gray.700' }}
    onClick={onClick}
  >
    {icon}
  </Box>
);
