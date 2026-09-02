import { Box, VStack, Text } from '@chakra-ui/react';
import { BiText } from 'react-icons/bi';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { TextElement } from '../../../engine/elements/TextElement';
import { useEditorStore } from '../../../stores/editorStore';
import { useHistoryStore } from '../../../stores/historyStore';
import { AddElementCommand } from '../../../engine/history/commands';
import { getDefaultFontFamily, isToolEnabled } from '../../../embed/config';

const presets = [
  { label: 'Add Heading', placeholder: 'Heading', fontSize: 48, fontWeight: 'bold' as const },
  { label: 'Add Subheading', placeholder: 'Subheading', fontSize: 32, fontWeight: 'bold' as const },
  { label: 'Add Paragraph', placeholder: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas elit odio, tristique vel nulla sed, venenatis rutrum tortor. Maecenas nec ante pulvinar neque eleifend suscipit a non massa.', fontSize: 18, fontWeight: 'normal' as const },
];

export const TextPanel = () => {
  if (!isToolEnabled('text')) {
    return null;
  }

  const addText = (preset: (typeof presets)[number]) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    const element = new TextElement({
      text: preset.placeholder,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fontFamily: getDefaultFontFamily(),
    });

    element.x = canvasWidth / 2;
    element.y = canvasHeight / 2;
    useHistoryStore.getState().push(new AddElementCommand(element));
  };

  return (
    <VStack gap={2} alignItems="stretch">
      {presets.map((preset) => (
        <Box
          key={preset.label}
          as="button"
          display="flex"
          alignItems="center"
          gap={3}
          w="100%"
          px={3}
          py={3}
          borderRadius="8px"
          bg="#2a2a3e"
          color="#cdd6f4"
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ bg: '#3a3a5e' }}
          onClick={() => addText(preset)}
          textAlign="left"
        >
          <BiText size={16} />
          <Box>
            <Text
              fontSize={preset.fontSize > 32 ? 'md' : preset.fontSize > 20 ? 'sm' : 'xs'}
              fontWeight={preset.fontWeight}
            >
              {preset.label}
            </Text>
          </Box>
        </Box>
      ))}
    </VStack>
  );
};
