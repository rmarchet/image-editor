import { Flex, Box, Text } from '@chakra-ui/react';
import { Tooltip } from '../Tooltip';
import {
  BiPointer,
  BiCrop,
  BiUndo,
  BiRedo,
  BiSave,
  BiTrash,
  BiCopy,
  BiMoveHorizontal,
  BiMoveVertical,
  BiAlignLeft,
  BiAlignMiddle,
  BiAlignRight,
} from 'react-icons/bi';
import { useToolStore } from '../../stores/toolStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useElementStore } from '../../stores/elementStore';
import { EditorEngine } from '../../engine/core/EditorEngine';
import type { ShapeElement } from '../../engine/elements/ShapeElement';
import type { ShapeConfig } from '../../engine/elements/ShapeElement';
import type { TextElement } from '../../engine/elements/TextElement';
import type { TextConfig } from '../../engine/elements/TextElement';
import { UpdateTextConfigCommand } from '../../engine/history/commands';
import { exportCanvas } from '../../utils/export';
import { saveProjectToFile } from '../../utils/projectFile';
import type { ToolType } from '../../types';

const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
  { id: 'select', icon: <BiPointer size={16} />, label: 'Select' },
  { id: 'crop', icon: <BiCrop size={16} />, label: 'Crop' },
];

export const Toolbar = () => {
  const activeTool = useToolStore((s) => s.activeTool);
  const setActiveTool = useToolStore((s) => s.setActiveTool);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const selectedIds = useElementStore((s) => s.selectedIds);
  const elements = useElementStore((s) => s.elements);

  const selectedElement = selectedIds.length === 1
    ? elements.find((el) => el.id === selectedIds[0])
    : null;

  const selectedShape = (() => {
    if (selectedIds.length !== 1) return null;
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return null;
    const element = engine.getElement(selectedIds[0]);
    if (!element || element.type !== 'shape') return null;
    return element as ShapeElement;
  })();

  const selectedText = (() => {
    if (selectedIds.length !== 1) return null;
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return null;
    const element = engine.getElement(selectedIds[0]);
    if (!element || element.type !== 'text') return null;
    return element as TextElement;
  })();

  const selectedShapeConfig = selectedShape?.config;
  const selectedTextConfig = selectedText?.config;

  const handleFlipH = () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    for (const id of selectedIds) {
      const el = engine.getElement(id);
      if (el) el.container.scale.x *= -1;
    }
  };

  const handleFlipV = () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    for (const id of selectedIds) {
      const el = engine.getElement(id);
      if (el) el.container.scale.y *= -1;
    }
  };

  const handleDuplicate = () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    engine.duplicateSelected();
  };

  const handleDelete = () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    for (const id of selectedIds) {
      engine.removeElement(id);
    }
  };

  const handleUpdateShapeConfig = (updates: Partial<ShapeConfig>) => {
    if (selectedIds.length !== 1) return;
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const element = engine.getElement(selectedIds[0]);
    if (!element || element.type !== 'shape') return;

    (element as ShapeElement).updateConfig(updates);
    engine.syncElementsToStore();
  };

  const handleUpdateTextConfig = (updates: Partial<TextConfig>) => {
    if (selectedIds.length !== 1) return;
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const element = engine.getElement(selectedIds[0]);
    if (!element || element.type !== 'text') return;

    const textElement = element as TextElement;
    const before = textElement.config;

    const hasChanged = Object.entries(updates).some(([key, value]) => {
      const k = key as keyof TextConfig;
      return before[k] !== value;
    });

    if (!hasChanged) return;

    const after: TextConfig = { ...before, ...updates };
    useHistoryStore
      .getState()
      .push(new UpdateTextConfigCommand(textElement.id, before, after));
  };

  const handleSave = () => {
    exportCanvas();
  };

  const handleSaveProject = async () => {
    await saveProjectToFile();
  };

  return (
    <Flex
      h="48px"
      bg="white"
      borderBottom="1px solid"
      borderColor="#e2e8f0"
      px={3}
      alignItems="center"
      gap={1}
      flexShrink={0}
    >
      {/* Tool buttons */}
      <Flex gap={1} mr={2}>
        {tools.map((tool) => (
          <Tooltip key={tool.id} content={tool.label}>
            <span>
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                showLabel={false}
                active={activeTool === tool.id}
                onClick={() => setActiveTool(tool.id)}
              />
            </span>
          </Tooltip>
        ))}
      </Flex>

      <Divider />

      {/* Undo / Redo */}
      <Flex gap={1} mx={1}>
        <Tooltip content="Undo">
          <span>
            <ToolButton
              icon={<BiUndo size={16} />}
              onClick={undo}
              disabled={!canUndo}
            />
          </span>
        </Tooltip>
        <Tooltip content="Redo">
          <span>
            <ToolButton
              icon={<BiRedo size={16} />}
              onClick={redo}
              disabled={!canRedo}
            />
          </span>
        </Tooltip>
      </Flex>

      <Divider />

      {/* Context-sensitive controls */}
      {selectedElement && (
        <Flex gap={1} mx={1} alignItems="center">

          <Tooltip content="Flip Horizontal">
            <span>
              <ToolButton
                icon={<BiMoveHorizontal size={16} />}
                label="Flip H"
                showLabel={false}
                onClick={handleFlipH}
              />
            </span>
          </Tooltip>
          <Tooltip content="Flip Vertical">
            <span>
              <ToolButton
                icon={<BiMoveVertical size={16} />}
                label="Flip V"
                showLabel={false}
                onClick={handleFlipV}
              />
            </span>
          </Tooltip>
          <Tooltip content="Duplicate">
            <span>
              <ToolButton
                icon={<BiCopy size={16} />}
                label="Duplicate"
                showLabel={false}
                onClick={handleDuplicate}
              />
            </span>
          </Tooltip>
          <Tooltip content="Delete">
            <span>
              <ToolButton
                icon={<BiTrash size={16} />}
                label="Delete"
                showLabel={false}
                onClick={handleDelete}
              />
            </span>
          </Tooltip>

          {selectedShapeConfig && (
            <>
              <Divider />
              <Flex alignItems="center" gap={2} ml={1}>
                <ColorInput
                  label="Fill"
                  value={selectedShapeConfig.fillColor}
                  onChange={(v) => handleUpdateShapeConfig({ fillColor: v })}
                />
                <ColorInput
                  label="Border"
                  value={selectedShapeConfig.strokeColor}
                  onChange={(v) => handleUpdateShapeConfig({ strokeColor: v })}
                />
                <TinyNumberInput
                  label="Stroke"
                  value={selectedShapeConfig.strokeWidth}
                  min={0}
                  onChange={(v) => handleUpdateShapeConfig({ strokeWidth: v })}
                />
              </Flex>
            </>
          )}

          {selectedTextConfig && (
            <>
              <Divider />
              <Flex alignItems="center" gap={1} ml={1}>
                <TinyToggleButton
                  label="B"
                  active={selectedTextConfig.fontWeight === 'bold'}
                  onClick={() =>
                    handleUpdateTextConfig({
                      fontWeight:
                        selectedTextConfig.fontWeight === 'bold'
                          ? 'normal'
                          : 'bold',
                    })
                  }
                />
                <TinyToggleButton
                  label="I"
                  active={selectedTextConfig.fontStyle === 'italic'}
                  style={{ fontStyle: 'italic', fontFamily: 'serif', fontWeight: 100 }}
                  onClick={() =>
                    handleUpdateTextConfig({
                      fontStyle:
                        selectedTextConfig.fontStyle === 'italic'
                          ? 'normal'
                          : 'italic',
                    })
                  }
                />
                <TinyToggleButton
                  label="S"
                  style={{ textDecoration: 'line-through' }}
                  active={selectedTextConfig.strikethrough}
                  onClick={() =>
                    handleUpdateTextConfig({
                      strikethrough: !selectedTextConfig.strikethrough,
                    })
                  }
                />
                <TinyNumberInput
                  label="Size"
                  value={selectedTextConfig.fontSize}
                  min={6}
                  onChange={(v) =>
                    handleUpdateTextConfig({
                      fontSize: Math.max(6, Math.round(v)),
                    })
                  }
                />
                <Flex alignItems="center" gap={1}>
                  <TinyToggleButton
                    label={<BiAlignLeft size={12} />}
                    active={selectedTextConfig.align === 'left'}
                    onClick={() => handleUpdateTextConfig({ align: 'left' })}
                  />
                  <TinyToggleButton
                    label={<BiAlignMiddle size={12} />}
                    active={selectedTextConfig.align === 'center'}
                    onClick={() => handleUpdateTextConfig({ align: 'center' })}
                  />
                  <TinyToggleButton
                    label={<BiAlignRight size={12} />}
                    active={selectedTextConfig.align === 'right'}
                    onClick={() => handleUpdateTextConfig({ align: 'right' })}
                  />
                </Flex>
              </Flex>
            </>
          )}

          <Divider />

          <Flex alignItems="center" gap={2} ml={1}>
            <PropInput label="X" value={Math.round(selectedElement.x)} onChange={(v) => {
              const engine = EditorEngine.getInstance();
              const el = engine.getElement(selectedElement.id);
              if (el) { el.x = v; engine.syncElementsToStore(); }
            }} />
            <PropInput label="Y" value={Math.round(selectedElement.y)} onChange={(v) => {
              const engine = EditorEngine.getInstance();
              const el = engine.getElement(selectedElement.id);
              if (el) { el.y = v; engine.syncElementsToStore(); }
            }} />
            <PropInput label="W" value={Math.round(selectedElement.width)} onChange={(v) => {
              const engine = EditorEngine.getInstance();
              const el = engine.getElement(selectedElement.id);
              if (el) { el.width = v; engine.syncElementsToStore(); }
            }} />
            <PropInput label="H" value={Math.round(selectedElement.height)} onChange={(v) => {
              const engine = EditorEngine.getInstance();
              const el = engine.getElement(selectedElement.id);
              if (el) { el.height = v; engine.syncElementsToStore(); }
            }} />
            <PropInput label="°" value={Math.round(selectedElement.rotation)} onChange={(v) => {
              const engine = EditorEngine.getInstance();
              const el = engine.getElement(selectedElement.id);
              if (el) { el.rotation = v; engine.syncElementsToStore(); }
            }} />
          </Flex>
        </Flex>
      )}

      <Box flex="1" />

      {/* Save */}
      <Flex gap={1}>
        <ToolButton icon={<BiSave size={16} />} label="Save Project" onClick={handleSaveProject} />
        <ToolButton icon={<BiSave size={16} />} label="Save" onClick={handleSave} accent />
      </Flex>
    </Flex>
  );
};

const ToolButton = ({
  icon,
  label,
  active,
  disabled,
  accent,
  showLabel = true,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  accent?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}) => (
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
    bg={active ? '#7c3aed' : accent ? '#7c3aed' : 'transparent'}
    color={active || accent ? 'white' : disabled ? '#a0aec0' : '#4a5568'}
    cursor={disabled ? 'not-allowed' : 'pointer'}
    opacity={disabled ? 0.5 : 1}
    transition="all 0.1s"
    _hover={disabled ? {} : { bg: active || accent ? '#6d28d9' : '#f7fafc' }}
    onClick={disabled ? undefined : onClick}
    aria-label={label}
  >
    {icon}
    {showLabel && <Text display={{ base: 'none', md: 'inline' }}>{label}</Text>}
  </Box>
);

const PropInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <Flex alignItems="center" gap={1}>
    <Text fontSize="10px" color="gray.400" fontWeight="600" w="12px">
      {label}
    </Text>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
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

const ColorInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
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
        border: '1px solid #e2e8f0',
        borderRadius: 4,
        background: '#f7fafc',
        cursor: 'pointer',
      }}
    />
  </Flex>
);

const TinyNumberInput = ({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
}) => (
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

const TinyToggleButton = ({
  label,
  active,
  onClick,
  style,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) => (
  <Box
    as="button"
    onClick={onClick}
    minW="24px"
    style={style}
    h="22px"
    px={1.5}
    borderRadius="4px"
    border="1px solid"
    borderColor={active ? '#7c3aed' : '#e2e8f0'}
    bg={active ? '#ede9fe' : '#f7fafc'}
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

const Divider = () => (
  <Box w="1px" h="24px" bg="#e2e8f0" mx={1} flexShrink={0} />
);
