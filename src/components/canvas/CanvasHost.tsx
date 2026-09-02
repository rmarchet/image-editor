import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { EditorEngine } from '../../engine/core/EditorEngine';
import { TextElement } from '../../engine/elements/TextElement';
import { UpdateTextConfigCommand } from '../../engine/history/commands';
import { useHistoryStore } from '../../stores/historyStore';
import { useTextEditStore } from '../../stores/textEditStore';

interface TextOverlayStyle {
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  strikethrough: boolean;
}

export const CanvasHost = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipBlurCommitRef = useRef(false);

  const activeElementId = useTextEditStore((state) => state.activeElementId);
  const draftText = useTextEditStore((state) => state.draftText);
  const originalText = useTextEditStore((state) => state.originalText);
  const sessionVersion = useTextEditStore((state) => state.sessionVersion);
  const setDraftText = useTextEditStore((state) => state.setDraftText);
  const clearSession = useTextEditStore((state) => state.clearSession);

  const [overlayStyle, setOverlayStyle] = useState<TextOverlayStyle | null>(null);

  const commitTextEdit = useCallback(() => {
    if (!activeElementId) return;

    const engine = EditorEngine.getInstance();
    if (!engine.initialized) {
      clearSession();
      return;
    }

    const element = engine.getElement(activeElementId);
    if (!(element instanceof TextElement)) {
      clearSession();
      return;
    }

    const before = element.config;
    if (draftText === before.text) {
      clearSession();
      return;
    }

    const after = { ...before, text: draftText };
    useHistoryStore
      .getState()
      .push(new UpdateTextConfigCommand(element.id, before, after));
    clearSession();
  }, [activeElementId, clearSession, draftText]);

  const cancelTextEdit = useCallback(() => {
    setDraftText(originalText);
    clearSession();
  }, [clearSession, originalText, setDraftText]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const engine = EditorEngine.getInstance();
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const setupObserverAndFit = (eng: typeof engine) => {
      if (cancelled) return;
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) eng.resize(width, height);
        }
      });
      observer.observe(host);
      if (eng.initialized) eng.fitToScreen();
    };

    const initPromise = engine.init(host).then(() => {
      if (cancelled) {
        engine.destroy();
        return;
      }
      const current = EditorEngine.getInstance();
      if (!current.initialized) {
        current.init(host).then(() => {
          if (cancelled) return;
          setupObserverAndFit(current);
        });
        return;
      }
      setupObserverAndFit(current);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      initPromise.then(() => {
        engine.destroy();
      });
    };
  }, []);

  useEffect(() => {
    if (!activeElementId) {
      setOverlayStyle(null);
      return;
    }

    let raf = 0;
    const updateOverlay = () => {
      const host = hostRef.current;
      if (!host) return;

      const engine = EditorEngine.getInstance();
      if (!engine.initialized) return;

      const element = engine.getElement(activeElementId);
      if (!(element instanceof TextElement)) {
        clearSession();
        return;
      }

      const bounds = element.container.getBounds(false);
      const config = element.config;

      const next: TextOverlayStyle = {
        left: bounds.x,
        top: bounds.y,
        width: Math.max(bounds.width + 20, Math.max(config.fontSize * 4, 140)),
        height: Math.max(bounds.height + 12, Math.max(config.fontSize * 1.6, 44)),
        fontSize: config.fontSize,
        fontFamily: config.fontFamily,
        fontWeight: config.fontWeight,
        fontStyle: config.fontStyle,
        textAlign: config.align,
        color: config.fill,
        strikethrough: config.strikethrough,
      };

      setOverlayStyle((prev) => {
        if (
          prev &&
          prev.left === next.left &&
          prev.top === next.top &&
          prev.width === next.width &&
          prev.height === next.height &&
          prev.fontSize === next.fontSize &&
          prev.fontFamily === next.fontFamily &&
          prev.fontWeight === next.fontWeight &&
          prev.fontStyle === next.fontStyle &&
          prev.textAlign === next.textAlign &&
          prev.color === next.color &&
          prev.strikethrough === next.strikethrough
        ) {
          return prev;
        }

        return next;
      });
    };

    const tick = () => {
      updateOverlay();
      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [activeElementId, clearSession]);

  useEffect(() => {
    if (!activeElementId) return;

    const raf = requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [activeElementId, sessionVersion]);

  return (
    <Box
      ref={hostRef}
      flex="1"
      bg="#e6e6e6"
      position="relative"
      overflow="hidden"
      cursor="default"
      className='canvas-host'
    >
      {activeElementId && overlayStyle && (
        <textarea
          data-text-edit-overlay="true"
          ref={textareaRef}
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelTextEdit();
              return;
            }

            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              skipBlurCommitRef.current = true;
              commitTextEdit();
            }
          }}
          onBlur={() => {
            if (skipBlurCommitRef.current) {
              skipBlurCommitRef.current = false;
              return;
            }

            commitTextEdit();
          }}
          style={{
            position: 'absolute',
            left: overlayStyle.left,
            top: overlayStyle.top,
            width: overlayStyle.width,
            minHeight: overlayStyle.height,
            padding: '6px 8px',
            border: '1px solid #7c3aed',
            borderRadius: '6px',
            background: '#ffffff',
            color: overlayStyle.color,
            fontFamily: overlayStyle.fontFamily,
            fontSize: `${overlayStyle.fontSize}px`,
            fontWeight: overlayStyle.fontWeight,
            fontStyle: overlayStyle.fontStyle,
            textAlign: overlayStyle.textAlign,
            textDecoration: overlayStyle.strikethrough ? 'line-through' : 'none',
            lineHeight: 1.3,
            resize: 'none',
            outline: 'none',
            zIndex: 20,
            boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.15)',
          }}
        />
      )}
    </Box>
  );
};
