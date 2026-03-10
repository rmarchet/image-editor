import { useEffect } from 'react';
import { ChakraProvider, Flex } from '@chakra-ui/react';
import { system } from './theme';
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
    <ChakraProvider value={system}>
      <Flex h="100vh" w="100vw" overflow="hidden">
        <Sidebar />
        <Flex direction="column" flex="1" minW="0">
          <Toolbar />
          <CanvasHost />
          <BottomBar />
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};
