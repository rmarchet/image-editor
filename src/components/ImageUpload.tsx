import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { fabric } from 'fabric';
import { useEditor } from '../context/EditorContext';

const UploadOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
`;

const UploadArea = styled.div`
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  margin: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  width: 80%;
  max-width: 600px;

  &:hover {
    border-color: #007bff;
    background-color: #e9ecef;
  }

  input {
    display: none;
  }
`;

const UploadText = styled.p`
  color: #666;
  margin: 0;
  font-size: 1.1rem;
`;

export const ImageUpload: React.FC = () => {
  const { handleNewImage } = useEditor();

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleNewImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <UploadOverlay>
      <UploadArea
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleNewImage(file);
            }
          }}
        />
        <UploadText>
          Click or drag and drop an image here to start editing
        </UploadText>
      </UploadArea>
    </UploadOverlay>
  );
}; 