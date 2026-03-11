import { Box, Flex, Text } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { exportCanvas } from '../../utils/export';
import { exportSvg } from '../../utils/exportSvg';
import { exportPdf } from '../../utils/exportPdf';
import { saveProjectToFile } from '../../utils/projectFile';

type ExportFormat = 'project' | 'png' | 'jpeg' | 'svg' | 'pdf';

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'project', label: 'Project (.ieproj)' },
  { value: 'png', label: 'PNG Image' },
  { value: 'jpeg', label: 'JPEG Image' },
  { value: 'svg', label: 'SVG Vector' },
  { value: 'pdf', label: 'PDF Document' },
];

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#1a202c',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
};

export const SaveExportDialog = () => {
  const open = useEditorStore((s) => s.saveDialogOpen);
  const setSaveDialogOpen = useEditorStore((s) => s.setSaveDialogOpen);

  const [filename, setFilename] = useState('artboard');
  const [format, setFormat] = useState<ExportFormat>('png');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFilename('artboard');
      setFormat('png');
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    setSaveDialogOpen(false);
    const name = filename.trim() || 'artboard';
    switch (format) {
      case 'project':
        await saveProjectToFile();
        break;
      case 'png':
        exportCanvas('png', 1, name);
        break;
      case 'jpeg':
        exportCanvas('jpeg', 0.9, name);
        break;
      case 'svg':
        exportSvg(name);
        break;
      case 'pdf':
        exportPdf(name);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') setSaveDialogOpen(false);
  };

  return (
    /* Backdrop */
    <Box
      position="fixed"
      inset="0"
      bg="rgba(0,0,0,0.4)"
      zIndex={2000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSaveDialogOpen(false);
      }}
    >
      {/* Panel */}
      <Box
        bg="white"
        borderRadius="12px"
        boxShadow="0 8px 32px rgba(0,0,0,0.18)"
        p={6}
        w="340px"
        onKeyDown={handleKeyDown}
      >
        <Text fontWeight="600" fontSize="md" color="#1a202c" mb={5}>
          Export
        </Text>

        {/* Filename */}
        <Box mb={4}>
          <Text fontSize="xs" fontWeight="500" color="#4a5568" mb={1}>
            File name
          </Text>
          <input
            ref={inputRef}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            style={fieldStyle}
          />
        </Box>

        {/* Format */}
        <Box mb={6}>
          <Text fontSize="xs" fontWeight="500" color="#4a5568" mb={1}>
            Format
          </Text>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            style={{ ...fieldStyle, cursor: 'pointer' }}
          >
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Box>

        {/* Actions */}
        <Flex gap={2} justifyContent="flex-end">
          <Box
            as="button"
            px={4}
            py={2}
            borderRadius="6px"
            fontSize="sm"
            fontWeight="500"
            color="#4a5568"
            bg="transparent"
            border="1px solid #e2e8f0"
            cursor="pointer"
            _hover={{ bg: '#f7fafc' }}
            onClick={() => setSaveDialogOpen(false)}
          >
            Cancel
          </Box>
          <Box
            as="button"
            px={4}
            py={2}
            borderRadius="6px"
            fontSize="sm"
            fontWeight="500"
            color="white"
            bg="#7c3aed"
            cursor="pointer"
            _hover={{ bg: '#6d28d9' }}
            onClick={handleConfirm}
          >
            Export
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};
