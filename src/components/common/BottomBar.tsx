import { Flex, Box, Menu, Portal } from '@chakra-ui/react';
import { BiChevronDown, BiZoomIn, BiZoomOut } from 'react-icons/bi';
import { useEditorStore } from '../../stores/editorStore';
import { EditorEngine } from '../../engine/core/EditorEngine';
import { useEditorEnvironment } from '../../app/EditorEnvironment';
import { getTheme } from '../../embed/config';

const ZOOM_PRESETS = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400, 500];

export const BottomBar = () => {
  const zoom = useEditorStore((s) => s.zoom);
  const environment = useEditorEnvironment();
  const theme = getTheme();
  const accentColor = theme.accent;

  const withInitializedEngine = (action: (engine: EditorEngine) => void) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    action(engine);
  };

  const handleZoomIn = () => {
    withInitializedEngine((engine) => {
      engine.viewport.setZoomAtCenter(zoom * 1.2);
    });
  };

  const handleZoomOut = () => {
    withInitializedEngine((engine) => {
      engine.viewport.setZoomAtCenter(zoom * 0.8);
    });
  };

  const handleZoomPreset = (preset: number) => {
    withInitializedEngine((engine) => {
      engine.viewport.setZoomAtCenter(preset / 100);
    });
  };

  const handleReset = () => {
    withInitializedEngine((engine) => {
      engine.fitToScreen();
    });
  };

  return (
    <Flex
      h="32px"
      bg="black"
      borderTop="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
      borderRadius={8}
      px={1}
      alignItems="center"
      justifyContent="flex-end"
      gap={1}
      flexShrink={0}
      bottom="14px"
      right="14px"
      position="absolute"
      className="bottom-bar"
    >
      <ZoomButton
        icon={<BiZoomOut size={18} />}
        onClick={handleZoomOut}
        ariaLabel="Zoom out"
      />

      <Menu.Root positioning={{ placement: 'top-end' }}>
        <Menu.Trigger asChild>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            minW="72px"
            h="24px"
            px={2}
            borderRadius="4px"
            fontSize="xs"
            color="gray.200"
            border="1px solid"
            borderColor="gray.600"
            cursor="pointer"
            _hover={{ bg: 'gray.800', borderColor: 'gray.500' }}
            aria-label="Select zoom level"
          >
            {Math.round(zoom * 100)}%
            <BiChevronDown size={12} />
          </Box>
        </Menu.Trigger>
        <Portal container={environment?.portalRef}>
          <Menu.Positioner>
            <Menu.Content minW="90px" p={1} bg="black">
              {ZOOM_PRESETS.map((preset) => (
                <Menu.Item
                  key={preset}
                  value={`${preset}`}
                  borderRadius="4px"
                  fontSize="xs"
                  color="gray.200"
                  px={2}
                  py={1}
                  bg={Math.round(zoom * 100) === preset ? accentColor : undefined}
                  onSelect={() => handleZoomPreset(preset)}
                >
                  {preset}%
                </Menu.Item>
              ))}
              <Menu.Separator my={1} borderColor="gray.600" />
              <Menu.Item
                value="reset"
                borderRadius="4px"
                fontSize="xs"
                px={2}
                py={1}
                color="gray.200"
                onSelect={handleReset}
              >
                Reset
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <ZoomButton
        icon={<BiZoomIn size={18} />}
        onClick={handleZoomIn}
        ariaLabel="Zoom in"
      />
    </Flex>
  );
};

const ZoomButton = ({
  icon,
  onClick,
  ariaLabel,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) => (
  <Box
    as="button"
    aria-label={ariaLabel}
    display="flex"
    alignItems="center"
    justifyContent="center"
    w="22px"
    h="22px"
    borderRadius="4px"
    color="gray.400"
    cursor="pointer"
    transition="all 0.1s"
    _hover={{ bg: 'gray.600', color: 'gray.200' }}
    onClick={onClick}
  >
    {icon}
  </Box>
);
