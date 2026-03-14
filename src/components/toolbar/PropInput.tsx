import { Flex, Text } from '@chakra-ui/react';

interface PropInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const PropInput = ({ label, value, onChange, onFocus, onBlur }: PropInputProps) => (
  <Flex alignItems="center" gap={1}>
    <Text fontSize="10px" color="gray.400" fontWeight="600" w="12px">
      {label}
    </Text>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: 52,
        padding: '2px 6px',
        fontSize: 11,
        border: '1px solid #e2e8f0',
        borderRadius: 4,
        background: '#f7fafc',
        color: '#2d3748',
      }}
    />
  </Flex>
);
