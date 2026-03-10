import { useCallback, useRef } from 'react';
import { Box, Text, VStack, SimpleGrid } from '@chakra-ui/react';
import { BiUpload, BiX } from 'react-icons/bi';
import { EditorEngine } from '../../../engine/core/EditorEngine';
import { ImageElement } from '../../../engine/elements/ImageElement';
import { useEditorStore } from '../../../stores/editorStore';
import { useAssetStore, generateAssetId } from '../../../stores/assetStore';
import { loadProjectFromFile } from '../../../utils/projectFile';
import type { ProjectImageElement, UploadedAsset } from '../../../types';

const THUMB_MAX = 80;

function generateThumbnail(
  img: HTMLImageElement
): Promise<string> {
  return new Promise((resolve) => {
    const scale = Math.min(THUMB_MAX / img.naturalWidth, THUMB_MAX / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    resolve(canvas.toDataURL('image/png'));
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function buildAssetFromProjectImage(image: ProjectImageElement): Promise<UploadedAsset> {
  try {
    const img = await loadImage(image.source);
    const thumbnailUrl = await generateThumbnail(img);

    return {
      id: generateAssetId(),
      name: image.name,
      blobUrl: image.source,
      thumbnailUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  } catch {
    // Fall back to project metadata if the image cannot be decoded in the browser.
    return {
      id: generateAssetId(),
      name: image.name,
      blobUrl: image.source,
      thumbnailUrl: image.source,
      width: image.width,
      height: image.height,
    };
  }
}

export const UploadPanel = () => {
  const assets = useAssetStore((s) => s.assets);
  const addAsset = useAssetStore((s) => s.addAsset);
  const removeAsset = useAssetStore((s) => s.removeAsset);
  const setAssets = useAssetStore((s) => s.setAssets);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;

      const blobUrl = URL.createObjectURL(file);
      const img = await loadImage(blobUrl);
      const thumbnailUrl = await generateThumbnail(img);

      const asset: UploadedAsset = {
        id: generateAssetId(),
        name: file.name.replace(/\.[^.]+$/, ''),
        blobUrl,
        thumbnailUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };

      addAsset(asset);
    },
    [addAsset]
  );

  const placeOnArtboard = useCallback(async (asset: UploadedAsset) => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;

    const element = await ImageElement.fromURL(asset.blobUrl);
    element.name = asset.name;

    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    const maxW = canvasWidth * 0.8;
    const maxH = canvasHeight * 0.8;
    const scale = Math.min(maxW / element.width, maxH / element.height, 1);
    if (scale < 1) {
      element.width = element.width * scale;
      element.height = element.height * scale;
    }

    element.x = canvasWidth / 2;
    element.y = canvasHeight / 2;
    engine.addElement(element);
  }, []);

  const handleProjectFile = useCallback(async (file: File) => {
    try {
      const projectImages = await loadProjectFromFile(file);

      const uniqueProjectImages = Array.from(
        new Map(projectImages.map((image) => [image.source, image])).values()
      );

      const nextAssets = await Promise.all(
        uniqueProjectImages.map((image) => buildAssetFromProjectImage(image))
      );

      setAssets(nextAssets);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load project file';
      window.alert(message);
    }
  }, [setAssets]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (file.name.toLowerCase().endsWith('.ieproj')) {
        handleProjectFile(file);
        return;
      }

      handleFile(file);
    },
    [handleFile, handleProjectFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleFile]
  );

  const handleProjectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleProjectFile(file);
      if (projectInputRef.current) projectInputRef.current.value = '';
    },
    [handleProjectFile]
  );

  return (
    <VStack gap={3} alignItems="stretch">
      {/* Drop zone */}
      <Box
        w="100%"
        border="2px dashed"
        borderColor="#313244"
        borderRadius="8px"
        p={6}
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: '#7c3aed', bg: 'rgba(124, 58, 237, 0.05)' }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <Box color="#6c7086" mb={2}>
          <BiUpload size={28} style={{ margin: '0 auto' }} />
        </Box>
        <Text fontSize="sm" color="#cdd6f4">
          Drop image here
        </Text>
        <Text fontSize="xs" color="#6c7086" mt={1}>
          or click to browse
        </Text>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </Box>

      <Box
        as="button"
        w="100%"
        py={2}
        px={3}
        borderRadius="8px"
        bg="#2a2a3e"
        color="#cdd6f4"
        cursor="pointer"
        transition="all 0.15s"
        _hover={{ bg: '#3a3a5e' }}
        onClick={() => projectInputRef.current?.click()}
        fontSize="sm"
        fontWeight="500"
      >
        Load Project (.ieproj)
      </Box>
      <input
        ref={projectInputRef}
        type="file"
        accept=".ieproj,application/json"
        onChange={handleProjectChange}
        style={{ display: 'none' }}
      />

      {/* Asset library grid */}
      {assets.length > 0 && (
        <SimpleGrid columns={2} gap={2}>
          {assets.map((asset) => (
            <Box
              key={asset.id}
              position="relative"
              borderRadius="6px"
              overflow="hidden"
              bg="#2a2a3e"
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ ring: '2px', ringColor: '#7c3aed' }}
              onClick={() => placeOnArtboard(asset)}
            >
              <img
                src={asset.thumbnailUrl}
                alt={asset.name}
                style={{ width: '100%', height: 70, objectFit: 'contain', padding: 4 }}
              />
              <Text
                fontSize="9px"
                color="#cdd6f4"
                px={1}
                pb={1}
                truncate
                textAlign="center"
              >
                {asset.name}
              </Text>

              {/* Delete button */}
              <Box
                as="button"
                position="absolute"
                top="2px"
                right="2px"
                w="18px"
                h="18px"
                borderRadius="50%"
                bg="rgba(0,0,0,0.6)"
                color="#cdd6f4"
                display="flex"
                alignItems="center"
                justifyContent="center"
                opacity={0}
                transition="opacity 0.15s"
                _groupHover={{ opacity: 1 }}
                css={{ '.group:hover &': { opacity: 1 } }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  removeAsset(asset.id);
                }}
              >
                <BiX size={12} />
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {assets.length === 0 && (
        <Text fontSize="xs" color="#6c7086" textAlign="center" py={2}>
          Uploaded images will appear here
        </Text>
      )}
    </VStack>
  );
};
