import { Box } from '@chakra-ui/react';
import type { CSSProperties, ReactNode } from 'react';

interface TinyToggleButtonProps {
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export const TinyToggleButton = ({
  label,
  active,
  onClick,
  style,
}: TinyToggleButtonProps) => (
  <Box
    as="button"
    onClick={onClick}
    minW="24px"
    style={style}
    h="22px"
    px={1.5}
    borderRadius="4px"
    border="1px solid"
    borderColor={active ? '#7c3aed' : 'transparent'}
    bg={active ? '#ede9fe' : 'transparent'}
    color={active ? '#5b21b6' : '#4a5568'}
    fontSize="11px"
    fontWeight="700"
    lineHeight="1"
    cursor="pointer"
    _hover={{ bg: active ? '#e9d5ff' : '#edf2f7' }}
  >
    {label}
  </Box>
);
