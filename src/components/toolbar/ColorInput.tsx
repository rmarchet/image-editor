import { Flex, Text, Box } from '@chakra-ui/react';
import { Tooltip } from '../Tooltip';

interface ColorInputProps {
  customIcon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export const ColorInput = ({ customIcon, label, value, onChange }: ColorInputProps) => (
  <Flex alignItems="center" gap={1} flexDirection={customIcon ? 'column' : 'row' }>
    <label htmlFor={`color-input-${label}`}>
      {!customIcon && <Text fontSize="10px" color="gray.400" fontWeight="600">
        {label}
      </Text>}
      {customIcon && (
        <Tooltip content={label}>
          <Box mb={-2} cursor="pointer">{customIcon}</Box>
        </Tooltip>
      )}
    </label>
    <input
      id={`color-input-${label}`}
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 26,
        height: customIcon ? 13 : 20,
        padding: 0,
        background: 'transparent',
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
      }}
    />
  </Flex>
);
