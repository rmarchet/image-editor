import { Box, Flex, Text } from '@chakra-ui/react';
import { useRef, useState, useEffect, type ReactNode } from 'react';
import { BiSave, BiChevronDown, BiImage, BiFile, BiCode } from 'react-icons/bi';
import { useEditorStore } from '../../stores/editorStore';

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

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const menuItems: MenuItem[] = [
    { label: 'Export PNG', icon: <BiImage size={14} />, onClick: () => { setOpen(false); onExportPng(); } },
    { label: 'Export JPEG', icon: <BiImage size={14} />, onClick: () => { setOpen(false); onExportJpeg(); } },
    { label: 'Export SVG', icon: <BiCode size={14} />, onClick: () => { setOpen(false); onExportSvg(); } },
    { label: 'Export PDF', icon: <BiFile size={14} />, onClick: () => { setOpen(false); onExportPdf(); } },
    { label: 'Export As…', icon: <BiSave size={14} />, onClick: () => { setOpen(false); setSaveDialogOpen(true); } },
  ];

  return (
    <Box ref={ref} position="relative" display="inline-flex">
      {/* Main save button */}
      <Box
        as="button"
        display="flex"
        alignItems="center"
        gap={1.5}
        pl={1.5}
        pr={1}
        py={1.5}
        borderRadius="6px 0 0 6px"
        fontSize="xs"
        fontWeight="500"
        bg="#7c3aed"
        color="white"
        cursor="pointer"
        transition="all 0.1s"
        _hover={{ bg: '#6d28d9' }}
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
        bg="#7c3aed"
        color="white"
        cursor="pointer"
        transition="all 0.1s"
        borderLeft="1px solid rgba(255,255,255,0.25)"
        _hover={{ bg: '#6d28d9' }}
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
          {menuItems.map((item, i) => (
            <Box key={item.label}>
              {i === 4 && (
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
          ))}
        </Box>
      )}
    </Box>
  );
};
