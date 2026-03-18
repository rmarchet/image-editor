import { type EditorErrorEvent, getOnErrorCallback } from './config';

export function reportError(
  code: string,
  message: string,
  context?: Record<string, unknown>
): void {
  const event: EditorErrorEvent = {
    type: 'error',
    code,
    message,
    context,
  };

  console.error(`[ImageEditor] ${code}: ${message}`, context ?? '');

  const onError = getOnErrorCallback();
  if (onError) {
    try {
      onError(event);
    } catch (callbackError) {
      console.error('[ImageEditor] onError callback threw an error:', callbackError);
    }
  }
}

export function reportWarning(
  code: string,
  message: string,
  context?: Record<string, unknown>
): void {
  const event: EditorErrorEvent = {
    type: 'warning',
    code,
    message,
    context,
  };

  console.warn(`[ImageEditor] ${code}: ${message}`, context ?? '');

  const onError = getOnErrorCallback();
  if (onError) {
    try {
      onError(event);
    } catch (callbackError) {
      console.error('[ImageEditor] onError callback threw an error:', callbackError);
    }
  }
}

export const ErrorCodes = {
  // Project
  PROJECT_LOAD_FAILED: 'PROJECT_LOAD_FAILED',
  PROJECT_SERIALIZE_FAILED: 'PROJECT_SERIALIZE_FAILED',
  PROJECT_INVALID_FORMAT: 'PROJECT_INVALID_FORMAT',

  // Image
  IMAGE_LOAD_FAILED: 'IMAGE_LOAD_FAILED',

  // Export
  EXPORT_FAILED: 'EXPORT_FAILED',

  // Callbacks
  CALLBACK_ERROR: 'CALLBACK_ERROR',

  // Config
  CONFIG_INVALID: 'CONFIG_INVALID',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
