import { useEffect } from 'react';
import { Flex } from '@chakra-ui/react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { CanvasHost } from '../components/canvas/CanvasHost';
import { Toolbar } from '../components/toolbar/Toolbar';
import { BottomBar } from '../components/common/BottomBar';
import { setupKeyboardShortcuts } from '../utils/shortcuts';

export const App = () => {
  useEffect(() => {
    return setupKeyboardShortcuts();
  }, []);

  return (
    <Flex h="100%" w="100%" overflow="hidden">
      <Sidebar />
      <Flex direction="column" flex="1" minW="0" position="relative">
        <Toolbar />
        <CanvasHost />
        <BottomBar />
      </Flex>
    </Flex>
  );
};
