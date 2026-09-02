import { Box } from '@chakra-ui/react';
import type { CSSProperties, ReactNode } from 'react';
import { getTheme } from '../../embed/config';
import { Tooltip } from '../Tooltip';

interface TinyToggleButtonProps {
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  tooltip?: string;
}

export const TinyToggleButton = ({
  label,
  active,
  onClick,
  style,
  tooltip,
}: TinyToggleButtonProps) => {
  const theme = getTheme();
  const accentColor = theme.accent;
  const accentLightColor = theme.accentLight;
  const accentHoverColor = theme.accentHover;

  return (
    <Tooltip content={tooltip}>
      <Box
        as="button"
        onClick={onClick}
        minW="22px"
        style={style}
        h="22px"
        px={1.5}
        borderRadius="4px"
        border="1px solid"
        borderColor={active ? accentColor : 'transparent'}
        bg={active ? accentLightColor : 'transparent'}
        color={active ? 'black' : '#4a5568'}
        fontSize="11px"
        fontWeight="700"
        lineHeight="1"
        cursor="pointer"
        _hover={{ bg: active ? accentLightColor : '#edf2f7', color: active ? 'black' : accentColor }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}
