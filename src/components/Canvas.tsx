import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEditor } from '../context/EditorContext';
import { ImageUpload } from './ImageUpload';
import '../styles/Canvas.css';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas, hasImage } = useEditor();

  useEffect(() => {
    if (canvasRef.current) {
      // Set default control styles for all objects
      fabric.Object.prototype.set({
        transparentCorners: false,
        borderColor: '#2196F3',
        cornerColor: '#ffffff',
        cornerStrokeColor: '#2196F3',
        cornerSize: 12,
        cornerStyle: 'circle',
        borderScaleFactor: 2,
        padding: 10,
      });

      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
      });
      
      // Make the image selectable by default
      fabricCanvas.on('object:added', (e) => {
        if (e.target) {
          e.target.set({
            selectable: true,
            hasControls: true,
            hasBorders: true,
            borderOpacityWhenMoving: 1,
          });
        }
      });

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
        setCanvas(null);
      };
    }
  }, []);

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} />
        {!hasImage && <ImageUpload />}
      </div>
    </div>
  );
}; 