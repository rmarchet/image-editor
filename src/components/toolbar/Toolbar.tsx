import { Flex, Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Tooltip } from '../Tooltip';
import { ToolButton } from './ToolButton';
import { PropInput } from './PropInput';
import { ColorInput } from './ColorInput';
import { TinyNumberInput } from './TinyNumberInput';
import { TinyToggleButton } from './TinyToggleButton';
import { Divider } from './Divider';
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
import type { DrawingElement } from '../../engine/elements/DrawingElement';
import { UpdateDrawingStrokesCommand, UpdateTextConfigCommand } from '../../engine/history/commands';
import type { DrawingStrokeData } from '../../types';
import { exportCanvas } from '../../utils/export';
import { saveProjectToFile } from '../../utils/projectFile';
import type { ToolType } from '../../types';

const tools: { id: ToolType; icon: ReactNode; label: string }[] = [
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

  const selectedDrawing = (() => {
    if (selectedIds.length !== 1) return null;
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return null;
    const element = engine.getElement(selectedIds[0]);
    if (!element || element.type !== 'drawing') return null;
    return element as DrawingElement;
  })();

  const selectedShapeConfig = selectedShape?.config;
  const selectedTextConfig = selectedText?.config;
  const selectedDrawingColor = selectedDrawing?.strokes[0]?.color ?? '#000000';

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

  const handleUpdateDrawingColor = (color: string) => {
    if (selectedIds.length !== 1) return;
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const element = engine.getElement(selectedIds[0]);
    if (!element || element.type !== 'drawing') return;

    const drawingElement = element as DrawingElement;
    const before = drawingElement.strokes;
    if (before.length === 0) return;

    const hasChanged = before.some((stroke) => stroke.color !== color);
    if (!hasChanged) return;

    const after: DrawingStrokeData[] = before.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point })),
      color,
    }));

    useHistoryStore
      .getState()
      .push(new UpdateDrawingStrokesCommand(drawingElement.id, before, after));
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
              label="Undo"
              onClick={undo}
              disabled={!canUndo}
              showLabel={false}
            />
          </span>
        </Tooltip>
        <Tooltip content="Redo">
          <span>
            <ToolButton
              icon={<BiRedo size={16} />}
              label="Redo"
              onClick={redo}
              disabled={!canRedo}
              showLabel={false}
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
                <ColorInput
                  label="Text"
                  value={selectedTextConfig.fill}
                  onChange={(v) => handleUpdateTextConfig({ fill: v })}
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

          {selectedDrawing && (
            <>
              <Divider />
              <Flex alignItems="center" gap={2} ml={1}>
                <ColorInput
                  label="Line"
                  value={selectedDrawingColor}
                  onChange={handleUpdateDrawingColor}
                />
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
        <Divider />
        <ToolButton icon={<BiSave size={16} />} label="Save PNG" onClick={handleSave} accent />
      </Flex>
    </Flex>
  );
};
