import { Box, Heading } from '@chakra-ui/react';
import type { SidebarPanel } from '../../types';
import { UploadPanel } from './panels/UploadPanel';
import { TextPanel } from './panels/TextPanel';
import { ShapesPanel } from './panels/ShapesPanel';
import { DrawPanel } from './panels/DrawPanel';
import { LayersPanel } from './panels/LayersPanel';
import { BackgroundPanel } from './panels/BackgroundPanel';
import { FiltersPanel } from './panels/FiltersPanel';
import { SettingsPanel } from './panels/SettingsPanel';

const panelTitles: Record<Exclude<SidebarPanel, null>, string> = {
  upload: 'Upload',
  text: 'Text',
  shapes: 'Shapes',
  draw: 'Draw',
  layers: 'Layers',
  background: 'Background',
  filters: 'Filters',
  settings: 'Settings',
};

const panelComponents: Record<Exclude<SidebarPanel, null>, React.FC> = {
  upload: UploadPanel,
  text: TextPanel,
  shapes: ShapesPanel,
  draw: DrawPanel,
  layers: LayersPanel,
  background: BackgroundPanel,
  filters: FiltersPanel,
  settings: SettingsPanel,
};

interface SidePanelProps {
  panel: Exclude<SidebarPanel, null>;
}

export const SidePanel = ({ panel }: SidePanelProps) => {
  const PanelComponent = panelComponents[panel];

  return (
    <Box
      w="250px"
      bg="#1e1e2e"
      borderRight="1px solid"
      borderColor="#313244"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      className='sidebar-panel'
    >
      <Box
        px={4}
        py="14px"
        bg="#7c3aed55"
        borderBottom="1px solid"
        borderColor="#313244"
        className='sidebar-panel-header'
      >
        <Heading size="sm" color="#cdd6f4" fontWeight="600">
          {panelTitles[panel]}
        </Heading>
      </Box>
      <Box
        flex="1"
        overflowY="auto"
        p={3}
        className='sidebar-panel-content'
        css={{
          '&::-webkit-scrollbar': {
            width: '7px',
          },
          '&::-webkit-scrollbar-track': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c689fe6e',
            borderRadius: '24px',
          },
        }}
      >
        <PanelComponent />
      </Box>
    </Box>
  );
};
