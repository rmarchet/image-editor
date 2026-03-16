import { Flex, Box, Text } from '@chakra-ui/react';
import {
  BiUpload,
  BiText,
  BiShapeSquare,
  BiPaint,
  BiLayer,
  BiPalette,
  BiAdjust,
  BiCog,
} from 'react-icons/bi';
import { useEditorStore } from '../../stores/editorStore';
import type { SidebarPanel } from '../../types';
import {
  isPanelEnabled,
  getTheme,
} from '../../embed/config';

interface PanelItem {
  id: Exclude<SidebarPanel, null>;
  icon: React.ReactNode;
  label: string;
}

const panels: PanelItem[] = [
  { id: 'upload', icon: <BiUpload size={22} />, label: 'Upload' },
  { id: 'text', icon: <BiText size={22} />, label: 'Text' },
  { id: 'shapes', icon: <BiShapeSquare size={22} />, label: 'Shapes' },
  { id: 'draw', icon: <BiPaint size={22} />, label: 'Draw' },
  { id: 'layers', icon: <BiLayer size={22} />, label: 'Layers' },
  { id: 'background', icon: <BiPalette size={22} />, label: 'Background' },
  { id: 'filters', icon: <BiAdjust size={22} />, label: 'Filters' },
  { id: 'settings', icon: <BiCog size={22} />, label: 'Settings' },
];

export const IconBar = () => {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const theme = getTheme();
  const visiblePanels = panels.filter((panel) => isPanelEnabled(panel.id));

  return (
    <Flex
      direction="column"
      w="66px"
      bg={theme.sidebarBackground}
      borderRight="1px solid"
      borderColor="#313244"
      py={0}
      gap={0}
      alignItems="center"
      overflowY="auto"
      className='icon-bar'
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        w="100%"
        h="48px"
        bg={theme.accent}
        className='logo'
      >
        <img
          src="./favicon.svg"
          alt="ImageEditor"
          width={32}
          height={32}
        />
      </Box>
      {visiblePanels.map((panel) => (
        <Box
          key={panel.id}
          as="button"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          w="100%"
          h="54px"
          bg={activePanel === panel.id ? theme.accentDark : 'transparent'}
          color={activePanel === panel.id ? theme.sidebarActiveColor : theme.sidebarColor}
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ bg: theme.accentHover, color: theme.sidebarActiveColor }}
          onClick={() => setActivePanel(panel.id)}
          className='icon-button'
        >
          {panel.icon}
          <Text fontSize="12px" mt="2px" lineHeight="1" letterSpacing="-0.75px">
            {panel.label}
          </Text>
        </Box>
      ))}
    </Flex>
  );
};
