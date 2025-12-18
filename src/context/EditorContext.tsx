import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fabric } from 'fabric';
import { HistoryManager } from '../utils/history';

// Export the Tool type
export type Tool = 'crop' | 'resize' | 'rotate' | 'mirror' | 'text' | 'effects' | null;

type Effect = 'sepia' | 'grayscale' | 'invert' | null;

interface EditorContextType {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas | null) => void;
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  selectedEffect: Effect;
  setSelectedEffect: (effect: Effect) => void;
  hasImage: boolean;
  setHasImage: (has: boolean) => void;
  applyEffect: (effect: Effect) => void;
  saveImage: () => void;
  resetImage: () => void;
  cleanupCurrentTool: () => void;
  saveToLocalStorage: () => void;
  handleNewImage: (file: File) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
}

const STORAGE_KEY = 'imageEditor_lastImage';

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [historyManager] = useState(() => new HistoryManager());
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [selectedEffect, setSelectedEffect] = useState<Effect>(null);
  const [hasImage, setHasImage] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveToLocalStorage = useCallback(() => {
    if (!canvas) return;
    
    try {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      localStorage.setItem(STORAGE_KEY, dataUrl);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [canvas]);

  useEffect(() => {
    if (canvas) {
      const savedImage = localStorage.getItem(STORAGE_KEY);
      if (savedImage) {
        fabric.Image.fromURL(savedImage, (img) => {
          canvas.clear();

          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          const scale = Math.min(
            canvasWidth / img.width!,
            canvasHeight / img.height!
          ) * 0.9;

          img.scale(scale);
          img.set({
            left: (canvasWidth - img.width! * scale) / 2,
            top: (canvasHeight - img.height! * scale) / 2,
            selectable: true,
            hasControls: true,
          });

          canvas.add(img);
          canvas.renderAll();
          setHasImage(true);
        });
      }
    }
  }, [canvas]);

  useEffect(() => {
    if (hasImage) {
      saveToLocalStorage();
    }
  }, [hasImage, saveToLocalStorage]);

  const cleanupCurrentTool = useCallback(() => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const mainImage = objects[0];
    
    canvas.clear();
    if (mainImage) {
      canvas.add(mainImage);
      canvas.renderAll();
      saveToLocalStorage();
    }
  }, [canvas, saveToLocalStorage]);

  const handleToolChange = useCallback((tool: Tool) => {
    cleanupCurrentTool();
    setSelectedTool(tool);
  }, [cleanupCurrentTool]);

  const saveImage = useCallback(() => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1
    });
    saveToLocalStorage();
    
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = dataUrl;
    link.click();
  }, [canvas, saveToLocalStorage]);

  const resetImage = useCallback(() => {
    if (!canvas) return;
    localStorage.removeItem(STORAGE_KEY);
    canvas.clear();
    canvas.renderAll();
    setHasImage(false);
    setSelectedTool(null);
  }, [canvas, setHasImage, setSelectedTool]);

  const applyEffect = useCallback((effect: Effect) => {
    if (!canvas) return;
    // Effect implementation will go here
  }, [canvas]);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyManager.canUndo());
    setCanRedo(historyManager.canRedo());
  }, [historyManager]);

  const handleCanvasChange = useCallback(() => {
    historyManager.saveState();
    updateHistoryButtons();
  }, [historyManager, updateHistoryButtons]);

  const undo = useCallback(() => {
    if (historyManager.undo()) {
      updateHistoryButtons();
    }
  }, [historyManager, updateHistoryButtons]);

  const redo = useCallback(() => {
    if (historyManager.redo()) {
      updateHistoryButtons();
    }
  }, [historyManager, updateHistoryButtons]);

  const handleSetCanvas = useCallback((newCanvas: fabric.Canvas | null) => {
    setCanvas(newCanvas);
    if (newCanvas) {
      historyManager.setCanvas(newCanvas);
      newCanvas.on('object:modified', handleCanvasChange);
    }
  }, [historyManager, handleCanvasChange]);

  const handleNewImage = useCallback((file: File) => {
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgData = e.target?.result as string;
      fabric.Image.fromURL(imgData, (img) => {
        canvas.clear();
        historyManager.clear();

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const scale = Math.min(
          canvasWidth / img.width!,
          canvasHeight / img.height!
        ) * 0.9;

        img.scale(scale);
        img.set({
          originX: 'center',
          originY: 'center',
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          selectable: true,
          hasControls: true,
          centeredRotation: true
        });

        canvas.add(img);
        canvas.renderAll();
        setHasImage(true);
        setSelectedTool(null);
        historyManager.saveState();
      });
    };
    reader.readAsDataURL(file);
  }, [canvas, historyManager, setHasImage, setSelectedTool]);

  const flipHorizontal = useCallback(() => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      // Flip the selected object
      activeObject.set('flipX', !activeObject.flipX);
    } else {
      // If no object is selected, flip the entire canvas
      const objects = canvas.getObjects();
      const mainImage = objects[0]; // Assuming the main image is the first object
      if (mainImage) {
        mainImage.set('flipX', !mainImage.flipX);
      }
    }
    
    canvas.renderAll();
    historyManager.saveState();
  }, [canvas, historyManager]);

  const flipVertical = useCallback(() => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      // Flip the selected object
      activeObject.set('flipY', !activeObject.flipY);
    } else {
      // If no object is selected, flip the entire canvas
      const objects = canvas.getObjects();
      const mainImage = objects[0]; // Assuming the main image is the first object
      if (mainImage) {
        mainImage.set('flipY', !mainImage.flipY);
      }
    }
    
    canvas.renderAll();
    historyManager.saveState();
  }, [canvas, historyManager]);

  return (
    <EditorContext.Provider
      value={{
        canvas,
        setCanvas: handleSetCanvas,
        selectedTool,
        setSelectedTool: handleToolChange,
        selectedEffect,
        setSelectedEffect,
        hasImage,
        setHasImage,
        applyEffect,
        saveImage,
        resetImage,
        cleanupCurrentTool,
        saveToLocalStorage,
        handleNewImage,
        canUndo,
        canRedo,
        undo,
        redo,
        flipHorizontal,
        flipVertical,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}; 