import { Box, Flex, Text } from '@chakra-ui/react';
import { useRef, useState, useEffect, useMemo, type ReactNode } from 'react';
import { BiSave, BiChevronDown, BiImage, BiFile, BiCode } from 'react-icons/bi';
import { useEditorStore } from '../../stores/editorStore';
import { getTheme, isFormatAllowed, isExportAsAllowed } from '../../embed/config';

interface MenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface SplitButtonProps {
  onSave: () => void;
  onExportPng: () => void;
  onExportJpeg: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
}

export const SplitButton = ({
  onSave,
  onExportPng,
  onExportJpeg,
  onExportSvg,
  onExportPdf,
}: SplitButtonProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const setSaveDialogOpen = useEditorStore((s) => s.setSaveDialogOpen);
  const theme = getTheme();
  const accentColor = theme.accent;
  const accentHoverColor = theme.accentHover;

  useEffect(() => {
    if (!open) return;

    const ownerDocument = ref.current?.ownerDocument ?? document;

    const handleClick = (e: MouseEvent) => {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const clickedInside = ref.current
        ? path.length > 0
          ? path.includes(ref.current)
          : ref.current.contains(e.target as Node)
        : false;

      if (!clickedInside) {
        setOpen(false);
      }
    };

    ownerDocument.addEventListener('mousedown', handleClick);
    return () => ownerDocument.removeEventListener('mousedown', handleClick);
  }, [open]);

  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];
    if (isFormatAllowed('png')) {
      items.push({ label: 'Export PNG', icon: <BiImage size={14} />, onClick: () => { setOpen(false); onExportPng(); } });
    }
    if (isFormatAllowed('jpeg')) {
      items.push({ label: 'Export JPEG', icon: <BiImage size={14} />, onClick: () => { setOpen(false); onExportJpeg(); } });
    }
    if (isFormatAllowed('svg')) {
      items.push({ label: 'Export SVG', icon: <BiCode size={14} />, onClick: () => { setOpen(false); onExportSvg(); } });
    }
    if (isFormatAllowed('pdf')) {
      items.push({ label: 'Export PDF', icon: <BiFile size={14} />, onClick: () => { setOpen(false); onExportPdf(); } });
    }
    if (isExportAsAllowed()) {
      items.push({ label: 'Export As…', icon: <BiSave size={14} />, onClick: () => { setOpen(false); setSaveDialogOpen(true); } });
    }
    return items;
  }, [onExportPng, onExportJpeg, onExportSvg, onExportPdf, setSaveDialogOpen]);

  const showExportAsItem = isExportAsAllowed();

  // If no menu items, render a simple button without dropdown
  if (menuItems.length === 0) {
    return (
      <Box
        as="button"
        display="flex"
        alignItems="center"
        gap={1.5}
        px={3}
        py={1.5}
        borderRadius="6px"
        fontSize="xs"
        fontWeight="500"
        bg={accentColor}
        color="white"
        cursor="pointer"
        transition="all 0.1s"
        _hover={{ bg: accentHoverColor }}
        onClick={onSave}
        aria-label="Save Project"
      >
        <BiSave size={16} />
        <Text display={{ base: 'none', md: 'inline' }}>Save</Text>
      </Box>
    );
  }

  return (
    <Box ref={ref} position="relative" display="inline-flex">
      {/* Main save button */}
      <Box
        as="button"
        display="flex"
        alignItems="center"
        gap={1.5}
        px={2}
        py={1.5}
        borderRadius="6px 0 0 6px"
        fontSize="xs"
        fontWeight="500"
        bg={accentColor}
        color="white"
        cursor="pointer"
        transition="all 0.1s"
        _hover={{ bg: accentHoverColor }}
        onClick={onSave}
        aria-label="Save Project"
      >
        <BiSave size={16} />
        <Text display={{ base: 'none', md: 'inline' }}>Save</Text>
      </Box>

      {/* Chevron trigger */}
      <Box
        as="button"
        display="flex"
        alignItems="center"
        px={1}
        py={1.5}
        borderRadius="0 6px 6px 0"
        fontSize="xs"
        bg={accentColor}
        color="white"
        cursor="pointer"
        transition="all 0.1s"
        borderLeft="1px solid rgba(255,255,255,0.25)"
        _hover={{ bg: accentHoverColor }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Export options"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <BiChevronDown size={14} />
      </Box>

      {/* Dropdown menu */}
      {open && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          right="0"
          bg="white"
          border="1px solid #e2e8f0"
          borderRadius="8px"
          boxShadow="0 4px 12px rgba(0,0,0,0.12)"
          zIndex={1000}
          minW="160px"
          py={1}
          role="menu"
        >
          {menuItems.map((item, i) => {
            const isExportAsItem = item.label === 'Export As…';
            const showDivider = showExportAsItem && isExportAsItem && i > 0;
            return (
            <Box key={item.label}>
              {showDivider && (
                <Box h="1px" bg="#e2e8f0" mx={2} my={1} />
              )}
              <Flex
                as="button"
                w="100%"
                alignItems="center"
                gap={2}
                px={3}
                py={1.5}
                fontSize="xs"
                fontWeight="500"
                color="#4a5568"
                cursor="pointer"
                bg="transparent"
                _hover={{ bg: '#f7fafc', color: '#1a202c' }}
                onClick={item.onClick}
                role="menuitem"
              >
                {item.icon}
                {item.label}
              </Flex>
            </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
