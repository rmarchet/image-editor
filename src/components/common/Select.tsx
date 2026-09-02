import { Box, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import { BiCheck, BiChevronDown } from 'react-icons/bi';
import { useEditorEnvironment } from '../../app/EditorEnvironment';

export interface SelectOption {
  value: string;
  label: string;
  previewFontFamily?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  width?: string;
  title?: string;
}

export const Select = ({
  value,
  options,
  onChange,
  width = '130px',
  title = 'Select option',
}: SelectProps) => {
  const environment = useEditorEnvironment();
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const selectedLabel = selectedOption?.label ?? value;

  return (
    <Menu.Root positioning={{ placement: 'bottom-start', sameWidth: true }}>
      <Menu.Trigger asChild>
        <Box
          as="button"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          w={width}
          h="28px"
          px={2}
          borderRadius="6px"
          border="1px solid"
          borderColor="#d1d5db"
          bg="white"
          cursor="pointer"
          transition="all 0.1s"
          _hover={{ borderColor: '#9ca3af' }}
          aria-label={title}
          title={title}
        >
          <Text
            flex="1"
            textAlign="left"
            fontSize="12px"
            color="#374151"
            lineHeight="1"
            fontFamily={selectedOption?.previewFontFamily}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {selectedLabel}
          </Text>
          <BiChevronDown size={14} color="#6b7280" />
        </Box>
      </Menu.Trigger>

      <Portal container={environment?.portalRef}>
        <Menu.Positioner 
          bg="white"
          border="1px solid #e2e8f0"
          borderRadius="8px"
          padding={1}
          minW={`calc(${width} + 2rem)`}
          boxShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
        >
          <Menu.Content
            overflowY="auto"
            p={1}
            maxH="260px"
            minW={width}
            zIndex={1000}
            bg="transparent"
            boxShadow="none"
          >
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                value={option.value}
                borderRadius="6px"
                px={2}
                py={1.5}
                color="#1f2937"
                onSelect={() => onChange(option.value)}
              >
                <Flex alignItems="center" justifyContent="space-between" gap={2} w="100%">
                  <Text
                    flex="1"
                    fontSize="12px"
                    lineHeight="1"
                    fontFamily={option.previewFontFamily}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {option.label}
                  </Text>
                  {option.value === value ? <BiCheck size={14} /> : null}
                </Flex>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
