import { Flex, Text } from '@chakra-ui/react';

interface TinyNumberInputProps {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
}

export const TinyNumberInput = ({
  label,
  value,
  min,
  onChange,
}: TinyNumberInputProps) => (
  <Flex alignItems="center" gap={1}>
    <Text fontSize="10px" color="gray.400" fontWeight="600">
      {label}
    </Text>
    <input
      type="number"
      value={Math.round(value)}
      min={min}
      step={1}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isNaN(next)) return;
        onChange(next);
      }}
      style={{
        width: 46,
        padding: '2px 4px',
        fontSize: 11,
        border: '1px solid #e2e8f0',
        borderRadius: 4,
        background: '#f7fafc',
        color: '#2d3748',
      }}
    />
  </Flex>
);
