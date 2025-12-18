import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useEditor } from '../../context/EditorContext';

const ResizeContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  width: 100px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #666;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

export const ResizeControls: React.FC = () => {
  const { canvas, setSelectedTool } = useEditor();
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1);

  // Initialize dimensions when tool is selected
  useEffect(() => {
    if (!canvas) return;

    const mainImage = canvas.getObjects()[0];
    if (!mainImage) return;

    // Store original dimensions
    const currentWidth = Math.round(mainImage.getScaledWidth());
    const currentHeight = Math.round(mainImage.getScaledHeight());
    
    setOriginalWidth(currentWidth);
    setOriginalHeight(currentHeight);
    setWidth(currentWidth);
    setHeight(currentHeight);
    setOriginalAspectRatio(currentWidth / currentHeight);

    // Make sure the image is selected
    canvas.setActiveObject(mainImage);
    canvas.renderAll();
  }, [canvas]);

  const applyResize = useCallback((newWidth: number, newHeight: number) => {
    if (!canvas) return;

    const mainImage = canvas.getObjects()[0];
    if (!mainImage) return;

    // Calculate scales based on original dimensions
    const scaleX = newWidth / originalWidth;
    const scaleY = newHeight / originalHeight;

    mainImage.set({
      scaleX: scaleX,
      scaleY: scaleY,
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2
    });

    canvas.renderAll();
  }, [canvas, originalWidth, originalHeight]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Math.max(1, parseInt(e.target.value) || 0);
    setWidth(newWidth);
    
    if (maintainAspectRatio && newWidth > 0) {
      const newHeight = Math.round(newWidth / originalAspectRatio);
      setHeight(newHeight);
      applyResize(newWidth, newHeight);
    } else {
      applyResize(newWidth, height);
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Math.max(1, parseInt(e.target.value) || 0);
    setHeight(newHeight);
    
    if (maintainAspectRatio && newHeight > 0) {
      const newWidth = Math.round(newHeight * originalAspectRatio);
      setWidth(newWidth);
      applyResize(newWidth, newHeight);
    } else {
      applyResize(width, newHeight);
    }
  };

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const shouldMaintain = e.target.checked;
    setMaintainAspectRatio(shouldMaintain);
    
    if (shouldMaintain) {
      // When enabling aspect ratio, adjust height based on current width
      const newHeight = Math.round(width / originalAspectRatio);
      setHeight(newHeight);
      applyResize(width, newHeight);
    }
  };

  const handleApply = useCallback(() => {
    if (!canvas) return;
    
    // Final application of the resize
    applyResize(width, height);
    
    // Save to history and close the tool
    canvas.fire('object:modified');
    setSelectedTool(null);
  }, [canvas, width, height, applyResize, setSelectedTool]);

  return (
    <ResizeContainer>
      <InputGroup>
        <Label>Width:</Label>
        <Input
          type="number"
          min="1"
          value={width}
          onChange={handleWidthChange}
        />
      </InputGroup>
      <InputGroup>
        <Label>Height:</Label>
        <Input
          type="number"
          min="1"
          value={height}
          onChange={handleHeightChange}
        />
      </InputGroup>
      <InputGroup>
        <Checkbox
          type="checkbox"
          checked={maintainAspectRatio}
          onChange={handleAspectRatioChange}
        />
        <Label>Maintain aspect ratio</Label>
      </InputGroup>
      <Button onClick={handleApply}>Apply Resize</Button>
    </ResizeContainer>
  );
}; 