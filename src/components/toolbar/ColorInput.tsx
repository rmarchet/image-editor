import { Flex, Text } from '@chakra-ui/react';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export const ColorInput = ({ label, value, onChange }: ColorInputProps) => (
  <Flex alignItems="center" gap={1}>
    <Text fontSize="10px" color="gray.400" fontWeight="600">
      {label}
    </Text>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 26,
        height: 20,
        padding: 0,
        background: 'transparent',
        appearance: 'none',
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
      }}
    />
  </Flex>
);
