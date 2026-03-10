import { Flex } from '@chakra-ui/react';
import { IconBar } from './IconBar';
import { SidePanel } from './SidePanel';
import { useEditorStore } from '../../stores/editorStore';

export const Sidebar = () => {
  const activePanel = useEditorStore((s) => s.activePanel);

  return (
    <Flex h="100%" flexShrink={0}>
      <IconBar />
      {activePanel && <SidePanel panel={activePanel} />}
    </Flex>
  );
};
