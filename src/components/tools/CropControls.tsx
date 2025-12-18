import React, { useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useEditor } from '../../context/EditorContext';
import { fabric } from 'fabric';

// Add interface for extended Fabric.js Image type
interface FabricImage extends fabric.Image {
  _element: HTMLImageElement;
}

// Add interface for bounding rectangle
interface BoundingRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const CropContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
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

  &.cancel {
    background-color: #dc3545;
    
    &:hover {
      background-color: #c82333;
    }
  }
`;

export const CropControls: React.FC = () => {
  const { canvas, setSelectedTool } = useEditor();
  const [cropRect, setCropRect] = React.useState<fabric.Rect | null>(null);
  const overlayRef = useRef<fabric.Object | null>(null);
  const imageRef = useRef<FabricImage | null>(null);
  const updateHandlersRef = useRef<{ moving: any; scaling: any } | null>(null);

  const cleanup = useCallback(() => {
    if (!canvas) return;
    
    // Remove event listeners if they exist
    if (cropRect && updateHandlersRef.current) {
      cropRect.off('moving', updateHandlersRef.current.moving);
      cropRect.off('scaling', updateHandlersRef.current.scaling);
    }

    if (imageRef.current) {
      imageRef.current.set({
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false
      });
    }

    if (cropRect) {
      canvas.remove(cropRect);
    }
    if (overlayRef.current) {
      canvas.remove(overlayRef.current);
    }
    canvas.renderAll();
  }, [canvas]);

  const constrainCropRect = useCallback((rect: fabric.Rect, imgBounds: BoundingRect) => {
    let left = rect.left!;
    let top = rect.top!;
    let width = rect.getScaledWidth();
    let height = rect.getScaledHeight();

    // Constrain position
    if (left < imgBounds.left) left = imgBounds.left;
    if (top < imgBounds.top) top = imgBounds.top;
    if (left + width > imgBounds.left + imgBounds.width) {
      left = imgBounds.left + imgBounds.width - width;
    }
    if (top + height > imgBounds.top + imgBounds.height) {
      top = imgBounds.top + imgBounds.height - height;
    }

    // Constrain size
    if (width > imgBounds.width) width = imgBounds.width;
    if (height > imgBounds.height) height = imgBounds.height;

    // Minimum size
    const minSize = 20;
    if (width < minSize) width = minSize;
    if (height < minSize) height = minSize;

    return { left, top, width, height };
  }, []);

  const initCrop = useCallback(() => {
    if (!canvas) return;

    cleanup();

    const image = canvas.getObjects()[0] as FabricImage;
    if (!image) return;

    imageRef.current = image;

    image.set({
      selectable: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true
    });

    const imgBounds = image.getBoundingRect();

    const rect = new fabric.Rect({
      left: imgBounds.left,
      top: imgBounds.top,
      width: imgBounds.width,
      height: imgBounds.height,
      fill: 'rgba(0,0,0,0.3)',
      stroke: '#2196F3',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
      lockRotation: true,
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#2196F3',
      cornerStyle: 'circle',
      cornerSize: 12,
      borderColor: '#2196F3',
      borderScaleFactor: 2,
      padding: 10,
      borderOpacityWhenMoving: 1,
    });

    // Create event handlers
    const onMoving = () => {
      if (!image || !rect) return;
      const imgBounds = image.getBoundingRect();
      const constrained = constrainCropRect(rect, imgBounds);
      rect.set(constrained);
    };

    const onScaling = () => {
      if (!image || !rect) return;
      const imgBounds = image.getBoundingRect();
      const constrained = constrainCropRect(rect, imgBounds);
      rect.set(constrained);
    };

    // Store handlers for cleanup
    updateHandlersRef.current = {
      moving: onMoving,
      scaling: onScaling
    };

    // Attach event listeners
    rect.on('moving', onMoving);
    rect.on('scaling', onScaling);

    canvas.add(rect);
    canvas.setActiveObject(rect);
    setCropRect(rect);
    canvas.renderAll();
  }, [canvas, cleanup, constrainCropRect]);

  const applyCrop = useCallback(() => {
    if (!canvas || !cropRect || !imageRef.current) return;

    const image = imageRef.current;
    const imgElement = image._element;
    if (!imgElement) return;

    const imgBounds = image.getBoundingRect();
    const rectBounds = cropRect.getBoundingRect();

    const zoom = image.scaleX || 1;
    const originalWidth = imgElement.naturalWidth;
    const originalHeight = imgElement.naturalHeight;

    const cropX = Math.round((rectBounds.left - imgBounds.left) / zoom);
    const cropY = Math.round((rectBounds.top - imgBounds.top) / zoom);
    const cropWidth = Math.round(rectBounds.width / zoom);
    const cropHeight = Math.round(rectBounds.height / zoom);

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;

    try {
      ctx.drawImage(
        imgElement,
        cropX * (originalWidth / imgBounds.width),
        cropY * (originalHeight / imgBounds.height),
        cropWidth * (originalWidth / imgBounds.width),
        cropHeight * (originalHeight / imgBounds.height),
        0,
        0,
        cropWidth,
        cropHeight
      );

      fabric.Image.fromURL(tempCanvas.toDataURL(), (croppedImg) => {
        canvas.clear();
        
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        const scale = Math.min(
          (canvasWidth * 0.9) / cropWidth,
          (canvasHeight * 0.9) / cropHeight
        );

        croppedImg.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          selectable: true,
          hasControls: true,
          centeredRotation: true
        });

        canvas.add(croppedImg);
        canvas.renderAll();
        setCropRect(null);
        setSelectedTool(null);

        if (typeof window !== 'undefined') {
          const dataUrl = canvas.toDataURL({
            format: 'png',
            quality: 1
          });
          localStorage.setItem('imageEditor_lastImage', dataUrl);
        }
      });
    } catch (error) {
      console.error('Error during crop operation:', error);
      cleanup();
      setSelectedTool(null);
    }
  }, [canvas, cropRect, cleanup, setSelectedTool]);

  useEffect(() => {
    initCrop();
    return cleanup;
  }, [initCrop, cleanup]);

  return (
    <CropContainer>
      <Button onClick={applyCrop}>Apply Crop</Button>
      <Button className="cancel" onClick={() => {
        cleanup();
        setSelectedTool(null);
      }}>Cancel</Button>
    </CropContainer>
  );
}; 