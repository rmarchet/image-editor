import {
  type ExportFormat,
  type ExportPayload,
  type ProjectPayload,
  getOnSaveCallback,
  getOnSaveProjectCallback,
} from './config';
import { captureArtboardBlob } from '../utils/export';
import { generateSvgBlob } from '../utils/exportSvg';
import { generatePdfBlob } from '../utils/exportPdf';
import { serializeProject } from '../utils/projectFile';
import { reportError } from './errorReporter';

const FORMAT_MIME_TYPES: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

const FORMAT_QUALITY: Record<ExportFormat, number> = {
  png: 1,
  jpeg: 0.9,
  svg: 1,
  pdf: 1,
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJson(data: unknown, filename: string) {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  downloadBlob(blob, filename);
}

async function generateExportBlob(format: ExportFormat): Promise<Blob | null> {
  switch (format) {
    case 'png':
      return await captureArtboardBlob('png', FORMAT_QUALITY.png);
    case 'jpeg':
      return await captureArtboardBlob('jpeg', FORMAT_QUALITY.jpeg);
    case 'svg':
      return generateSvgBlob();
    case 'pdf':
      return generatePdfBlob();
    default:
      return null;
  }
}

export async function dispatchSave(
  format: ExportFormat,
  filename: string
): Promise<void> {
  const blob = await generateExportBlob(format);

  if (!blob) {
    reportError('EXPORT_FAILED', `Failed to generate ${format.toUpperCase()} export`);
    return;
  }

  const fullFilename = `${filename}.${format}`;
  const payload: ExportPayload = {
    format,
    data: blob,
    filename: fullFilename,
    mimeType: FORMAT_MIME_TYPES[format],
  };

  const onSave = getOnSaveCallback();

  if (onSave) {
    try {
      const result = await onSave(payload);
      if (result === false) {
        downloadBlob(blob, fullFilename);
      }
    } catch (error) {
      reportError('CALLBACK_ERROR', 'onSave callback threw an error', {
        error: error instanceof Error ? error.message : String(error),
      });
      downloadBlob(blob, fullFilename);
    }
  } else {
    downloadBlob(blob, fullFilename);
  }
}

export async function dispatchSaveProject(filename: string): Promise<void> {
  let projectData;

  try {
    projectData = await serializeProject();
  } catch (error) {
    reportError('PROJECT_SERIALIZE_FAILED', 'Failed to serialize project', {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const fullFilename = filename.endsWith('.ieproj') ? filename : `${filename}.ieproj`;
  const payload: ProjectPayload = {
    data: projectData,
    filename: fullFilename,
  };

  const onSaveProject = getOnSaveProjectCallback();

  if (onSaveProject) {
    try {
      const result = await onSaveProject(payload);
      if (result === false) {
        downloadJson(projectData, fullFilename);
      }
    } catch (error) {
      reportError('CALLBACK_ERROR', 'onSaveProject callback threw an error', {
        error: error instanceof Error ? error.message : String(error),
      });
      downloadJson(projectData, fullFilename);
    }
  } else {
    downloadJson(projectData, fullFilename);
  }
}
