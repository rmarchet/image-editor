import React, { useRef } from 'react';
import styled from 'styled-components';
import { useEditor } from '../context/EditorContext';
import '../styles/Header.css';
import type { Tool } from '../context/EditorContext';
import { 
  BiExpand,
  BiCrop,
  BiRotateRight,
  BiMoveHorizontal,
  BiPaint,
  BiText,
  BiAdjust,
  BiSave,
  BiReset,
  BiUpload,
  BiUndo,
  BiRedo,
  BiReflectHorizontal,
  BiReflectVertical,
  BiMagnet
} from 'react-icons/bi';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ToolbarGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f0f0f0;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:hover {
    background-color: #e0e0e0;
    transform: translateY(-1px);
  }
  
  &.active {
    background-color: #007bff;
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #e0e0e0;
    
    &:hover {
      transform: none;
      background-color: #e0e0e0;
    }
  }

  svg {
    font-size: 1rem;
  }
`;

const ActionButton = styled(Button)`
  &.save {
    background-color: #28a745;
    color: white;
    
    &:hover {
      background-color: #218838;
    }
  }
  
  &.cancel {
    background-color: #dc3545;
    color: white;
    
    &:hover {
      background-color: #c82333;
    }
  }
`;

const ButtonText = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    font-size: 1rem;
    transition: transform 0.2s ease;
  }
  
  .active & svg {
    transform: scale(1.1);
  }
`;

const UploadInput = styled.input`
  display: none;
`;

export const Header: React.FC = () => {
  const { 
    selectedTool, 
    setSelectedTool,
    hasImage,
    canUndo,
    canRedo,
    undo,
    redo,
    saveImage,
    resetImage,
    handleNewImage,
  } = useEditor();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (toolId: Tool) => {
    setSelectedTool(selectedTool === toolId ? null : toolId);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleNewImage(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const tools = [
    { id: 'resize', label: 'Resize', icon: <BiExpand /> },
    { id: 'crop', label: 'Crop', icon: <BiCrop /> },
    { id: 'rotate', label: 'Rotate', icon: <BiRotateRight /> },
    { id: 'mirror', label: 'Mirror', icon: <BiMagnet /> },
    { id: 'paint', label: 'Paint', icon: <BiPaint /> },
    { id: 'text', label: 'Text', icon: <BiText /> },
    { id: 'effects', label: 'Effects', icon: <BiAdjust /> },
  ] as const;

  return (
    <HeaderContainer>
      <ToolbarGroup>
        <Button
          onClick={() => fileInputRef.current?.click()}
          title="Upload New Image"
        >
          <ButtonIcon><BiUpload /></ButtonIcon>
          <ButtonText>Upload New</ButtonText>
        </Button>

        {hasImage && (
          <>
            <Button
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <ButtonIcon><BiUndo /></ButtonIcon>
              <ButtonText>Undo</ButtonText>
            </Button>
            <Button
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <ButtonIcon><BiRedo /></ButtonIcon>
              <ButtonText>Redo</ButtonText>
            </Button>
            
            {tools.map((tool) => (
              <Button
                key={tool.id}
                onClick={() => handleToolClick(tool.id as Tool)}
                title={tool.label}
                className={selectedTool === tool.id ? 'active' : ''}
              >
                <ButtonIcon>{tool.icon}</ButtonIcon>
                <ButtonText>{tool.label}</ButtonText>
              </Button>
            ))}
          </>
        )}
      </ToolbarGroup>

      {hasImage && (
        <ToolbarGroup>
          <ActionButton className="save" onClick={saveImage} title="Save Image">
            <ButtonIcon><BiSave /></ButtonIcon>
            <ButtonText>Save</ButtonText>
          </ActionButton>
          <ActionButton className="cancel" onClick={resetImage} title="Cancel Changes">
            <ButtonIcon><BiReset /></ButtonIcon>
            <ButtonText>Cancel</ButtonText>
          </ActionButton>
        </ToolbarGroup>
      )}

      <UploadInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </HeaderContainer>
  );
}; 