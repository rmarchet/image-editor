import { Box, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { getAccentColor, getAccentHoverColor } from '../../embed/config';

interface ToolButtonProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  accent?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}

export const ToolButton = ({
  icon,
  label,
  active,
  disabled,
  accent,
  showLabel = true,
  onClick,
}: ToolButtonProps) => {
  const accentColor = getAccentColor();
  const accentHoverColor = getAccentHoverColor();

  return (
    <Box
      as="button"
      display="flex"
      alignItems="center"
      gap={1.5}
      px={1.5}
      py={1.5}
      borderRadius="6px"
      fontSize="xs"
      fontWeight="500"
      bg={active ? accentColor : accent ? accentColor : 'transparent'}
      color={active || accent ? 'white' : disabled ? '#a0aec0' : '#4a5568'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      transition="all 0.1s"
      _hover={disabled ? {} : { bg: active || accent ? accentHoverColor : '#f7fafc' }}
      onClick={disabled ? undefined : onClick}
      aria-label={label}
    >
      {icon}
      {showLabel && <Text display={{ base: 'none', md: 'inline' }}>{label}</Text>}
    </Box>
  );
}