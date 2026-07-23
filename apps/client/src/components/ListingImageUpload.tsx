import { useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

export type UploadedImage = {
  id: string;
  previewUrl: string;
  serverUrl?: string;
  uploading: boolean;
  error?: string;
};

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export function ListingImageUpload({
  images,
  onChange,
  onError,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      onError?.(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    const next = [...images];

    for (const file of files) {
      if (!ACCEPT.includes(file.type)) {
        onError?.('Use JPG, PNG, or WebP images only.');
        continue;
      }
      if (file.size > MAX_BYTES) {
        onError?.('Each image must be 5 MB or smaller.');
        continue;
      }

      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const entry: UploadedImage = { id, previewUrl, uploading: true };
      next.push(entry);
      onChange([...next]);

      try {
        const data = await readAsBase64(file);
        const result = await api.uploadListingImage({
          mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          data,
          fileName: file.name,
        });
        onChange(
          next.map((img) =>
            img.id === id
              ? { ...img, uploading: false, serverUrl: result.file.url, error: undefined }
              : img,
          ),
        );
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Upload failed';
        onChange(
          next.map((img) => (img.id === id ? { ...img, uploading: false, error: message } : img)),
        );
        onError?.(message);
      }
    }
  }

  function removeImage(id: string) {
    const target = images.find((img) => img.id === id);
    if (target?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(images.filter((img) => img.id !== id));
  }

  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Cover images</p>
          <p className="text-xs text-mute">First image is the cover. JPG, PNG, or WebP · max 5 MB each.</p>
        </div>
        {images.length > 0 ? (
          <span className="text-xs font-bold text-mute">
            {images.length}/{MAX_IMAGES}
          </span>
        ) : null}
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, index) => (
            <li key={img.id} className="sv-listing-upload-thumb">
              <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
              {index === 0 ? <span className="sv-listing-upload-cover">Cover</span> : null}
              {img.uploading ? <span className="sv-listing-upload-status">Uploading…</span> : null}
              {img.error ? (
                <span className="sv-listing-upload-status sv-listing-upload-status--error">{img.error}</span>
              ) : null}
              <button
                type="button"
                className="sv-listing-upload-remove"
                aria-label="Remove image"
                onClick={() => removeImage(img.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {canAddMore ? (
        <div
          className={dragOver ? 'sv-listing-upload-drop is-dragover' : 'sv-listing-upload-drop'}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void addFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT.join(',')}
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <p className="font-display text-sm font-bold">Drop images here</p>
          <p className="mt-1 text-xs text-mute">or browse from your device</p>
          <button
            type="button"
            className="sv-btn-ghost mt-3 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            Choose files
          </button>
        </div>
      ) : null}
    </div>
  );
}
