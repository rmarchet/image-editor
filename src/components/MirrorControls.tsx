import React from 'react';
import styled from 'styled-components';
import { BiReflectHorizontal, BiReflectVertical } from 'react-icons/bi';
import { useEditor } from '../context/EditorContext';

const ControlsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  color: #333;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }

  svg {
    font-size: 0.85rem;
  }
`;

export const MirrorControls: React.FC = () => {
  const { flipHorizontal, flipVertical } = useEditor();

  return (
    <ControlsContainer>
      <ActionButton onClick={flipHorizontal}>
        <BiReflectHorizontal />
        Flip H
      </ActionButton>
      <ActionButton onClick={flipVertical}>
        <BiReflectVertical />
        Flip V
      </ActionButton>
    </ControlsContainer>
  );
}; 