import { jsPDF } from 'jspdf';
import { captureArtboardCanvas } from './export';
import { useEditorStore } from '../stores/editorStore';

/**
 * Generates the PDF content as a Blob.
 */
export function generatePdfBlob(): Blob | null {
  const canvas = captureArtboardCanvas();
  if (!canvas) return null;

  const { canvasWidth, canvasHeight } = useEditorStore.getState();
  const orientation = canvasWidth >= canvasHeight ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    unit: 'px',
    format: [canvasWidth, canvasHeight],
    orientation,
  });

  const dataUrl = canvas.toDataURL('image/png');
  pdf.addImage(dataUrl, 'PNG', 0, 0, canvasWidth, canvasHeight);

  return pdf.output('blob');
}

export function exportPdf(filename = 'artboard') {
  const blob = generatePdfBlob();
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.pdf`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
