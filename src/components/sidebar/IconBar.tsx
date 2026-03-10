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

interface PanelItem {
  id: SidebarPanel;
  icon: React.ReactNode;
  label: string;
}

const panels: PanelItem[] = [
  { id: 'upload', icon: <BiUpload size={20} />, label: 'Upload' },
  { id: 'text', icon: <BiText size={20} />, label: 'Text' },
  { id: 'shapes', icon: <BiShapeSquare size={20} />, label: 'Shapes' },
  { id: 'draw', icon: <BiPaint size={20} />, label: 'Draw' },
  { id: 'layers', icon: <BiLayer size={20} />, label: 'Layers' },
  { id: 'background', icon: <BiPalette size={20} />, label: 'Background' },
  { id: 'filters', icon: <BiAdjust size={20} />, label: 'Filters' },
  { id: 'settings', icon: <BiCog size={20} />, label: 'Settings' },
];

export const IconBar = () => {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  return (
    <Flex
      direction="column"
      w="56px"
      bg="#1e1e2e"
      borderRight="1px solid"
      borderColor="#313244"
      py={0}
      gap={1}
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
        bg="#7c3aed"
        className='logo'
      >
        <img
          src="/favicon.svg"
          alt="ImageEditor"
          width={26}
          height={26}
        />
      </Box>
      {panels.map((panel) => (
        <Box
          key={panel.id}
          as="button"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          w="48px"
          h="48px"
          borderRadius="8px"
          bg={activePanel === panel.id ? '#3a3a5e' : 'transparent'}
          color={activePanel === panel.id ? '#cdd6f4' : '#6c7086'}
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ bg: '#2a2a3e', color: '#cdd6f4' }}
          onClick={() => setActivePanel(panel.id)}
        >
          {panel.icon}
          <Text fontSize="9px" mt="2px" lineHeight="1">
            {panel.label}
          </Text>
        </Box>
      ))}
    </Flex>
  );
};
