import { jsPDF } from 'jspdf';
import { captureArtboardCanvas } from './export';
import { useEditorStore } from '../stores/editorStore';

export function exportPdf(filename = 'artboard') {
  const canvas = captureArtboardCanvas();
  if (!canvas) return;

  const { canvasWidth, canvasHeight } = useEditorStore.getState();
  const orientation = canvasWidth >= canvasHeight ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    unit: 'px',
    format: [canvasWidth, canvasHeight],
    orientation,
  });

  const dataUrl = canvas.toDataURL('image/png');
  pdf.addImage(dataUrl, 'PNG', 0, 0, canvasWidth, canvasHeight);
  pdf.save(`${filename}.pdf`);
}
