import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useEditor } from '../../context/EditorContext';
import { BiRotateLeft, BiRotateRight } from 'react-icons/bi';

const RotateContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Label = styled.label`
  font-size: 14px;
  color: #666;
`;

const Input = styled.input`
  width: 200px;
  padding: 0.5rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #0056b3;
  }

  svg {
    font-size: 1.2em;
  }
`;

const QuickRotateButton = styled(Button)`
  background-color: #6c757d;
  
  &:hover {
    background-color: #5a6268;
  }
`;

const Value = styled.span`
  min-width: 3rem;
  text-align: center;
  font-size: 14px;
  color: #666;
`;

export const RotateControls: React.FC = () => {
  const { canvas } = useEditor();
  const [angle, setAngle] = useState(0);

  // Initialize rotation center when component mounts
  useEffect(() => {
    if (!canvas) return;

    const activeObject = canvas.getObjects()[0];
    if (!activeObject) return;

    // Set the rotation point to the center of the image
    activeObject.setCoords();
    activeObject.set({
      originX: 'center',
      originY: 'center',
      centeredRotation: true,
    });

    // Center the image on the canvas
    const canvasCenter = canvas.getCenter();
    activeObject.set({
      left: canvasCenter.left,
      top: canvasCenter.top
    });

    canvas.renderAll();
  }, [canvas]);

  const rotateImage = useCallback((newAngle: number) => {
    if (!canvas) return;

    const activeObject = canvas.getObjects()[0];
    if (!activeObject) return;

    // Keep angle between 0 and 360
    const normalizedAngle = ((newAngle % 360) + 360) % 360;
    
    // Ensure rotation happens around center
    activeObject.set({
      angle: normalizedAngle,
      originX: 'center',
      originY: 'center',
      centeredRotation: true
    });

    // Maintain center position
    const canvasCenter = canvas.getCenter();
    activeObject.set({
      left: canvasCenter.left,
      top: canvasCenter.top
    });

    canvas.renderAll();
    setAngle(normalizedAngle);
  }, [canvas]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAngle = parseInt(e.target.value, 10);
    rotateImage(newAngle);
  };

  const handleQuickRotate = (direction: 'left' | 'right') => {
    const increment = direction === 'left' ? -90 : 90;
    rotateImage(angle + increment);
  };

  return (
    <RotateContainer>
      <QuickRotateButton 
        onClick={() => handleQuickRotate('left')}
        title="Rotate 90° Left"
      >
        <BiRotateLeft />
        <span>90° Left</span>
      </QuickRotateButton>

      <InputGroup>
        <Label>Angle:</Label>
        <Input
          type="range"
          min="0"
          max="360"
          value={angle}
          onChange={handleSliderChange}
        />
        <Value>{angle}°</Value>
      </InputGroup>

      <QuickRotateButton 
        onClick={() => handleQuickRotate('right')}
        title="Rotate 90° Right"
      >
        <BiRotateRight />
        <span>90° Right</span>
      </QuickRotateButton>
    </RotateContainer>
  );
}; 