import React from 'react';
import styled from 'styled-components';
import { useEditor } from '../context/EditorContext';
import { ResizeControls } from './tools/ResizeControls';
import { CropControls } from './tools/CropControls';
import { RotateControls } from './tools/RotateControls';
import { MirrorControls } from './MirrorControls';
import '../styles/Footer.css';

const FooterContainer = styled.footer`
  padding: 1rem;
  background-color: #ffffff;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
`;

const ToolOptions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
`;

export const Footer: React.FC = () => {
  const { selectedTool, selectedEffect, setSelectedEffect } = useEditor();

  const renderToolOptions = () => {
    switch (selectedTool) {
      case 'resize':
        return <ResizeControls />;
      case 'crop':
        return <CropControls />;
      case 'rotate':
        return <RotateControls />;
      case 'effects':
        return (
          <ToolOptions>
            <button onClick={() => setSelectedEffect('sepia')}>Sepia</button>
            <button onClick={() => setSelectedEffect('grayscale')}>B&W</button>
            <button onClick={() => setSelectedEffect('invert')}>Invert</button>
          </ToolOptions>
        );
      case 'mirror':
        return <MirrorControls />;
      default:
        return null;
    }
  };

  if (!selectedTool) return null;

  return (
    <FooterContainer>
      {renderToolOptions()}
    </FooterContainer>
  );
}; 