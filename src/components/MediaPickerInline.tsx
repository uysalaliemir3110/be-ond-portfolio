'use client';

import { useRef, useState } from 'react';
import { uploadFile, splitPath } from '@/lib/api';

const VIDEO_EXTS = /\.(mp4|mov|webm)(\?.*)?$/i;

type Props = {
  currentSrc: string;
  targetPath: string;
  accept?: string;
  aspect?: string;
  onPathChange: (path: string) => void;
};

export default function MediaPickerInline({
  currentSrc,
  targetPath,
  accept = 'image/*,video/*',
  aspect = 'aspect-[3/4]',
  onPathChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isVideo, setIsVideo] = useState(() => VIDEO_EXTS.test(currentSrc));
  const [imgFailed, setImgFailed] = useState(false);

  // currentSrc değişince imgFailed sıfırla, video tipini güncelle. Bunu bir
  // effect yerine render sırasında yapıyoruz (React'in "prop değişince state
  // güncelleme" deseni) — böylece ekrana bir kez fazladan çizim yapılmıyor.
  const [prevSrc, setPrevSrc] = useState(currentSrc);
  if (prevSrc !== currentSrc) {
    setPrevSrc(currentSrc);
    setImgFailed(false);
    setIsVideo(VIDEO_EXTS.test(currentSrc));
  }

  const handleFile = async (file: File) => {
    const blob = URL.createObjectURL(file);
    setPreviewUrl(blob);
    setIsVideo(file.type.startsWith('video/'));
    setImgFailed(false);
    setStatus('uploading');
    setError('');
    try {
      const { folder, filename } = splitPath(targetPath);
      const url = await uploadFile(folder, file, filename);
      // Blob URL yerine sunucu URL'sine geç (cache-bust ile) — remount sonrası da görünür kalır
      setPreviewUrl(url + '?v=' + Date.now());
      onPathChange(url);
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Yükleme başarısız');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const displaySrc = previewUrl ?? currentSrc;
  const showMedia = displaySrc && !imgFailed;

  return (
    <div className="space-y-2">
      <div
        className={`relative ${aspect} overflow-hidden border-2 border-dashed border-line cursor-pointer group`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {displaySrc && (
          isVideo ? (
            <video src={displaySrc} className="h-full w-full object-cover" muted />
          ) : (
            <img
              src={displaySrc}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          )
        )}

        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-colors
          ${showMedia ? 'bg-ink/0 group-hover:bg-ink/40' : 'bg-shell'}`}
        >
          <span className={`text-2xl transition-opacity ${showMedia ? 'opacity-0 group-hover:opacity-100 text-paper' : 'opacity-100 text-ash'}`}>
            ↑
          </span>
          <span className={`text-[9px] tracking-widest uppercase mt-1 transition-opacity ${showMedia ? 'opacity-0 group-hover:opacity-100 text-paper' : 'opacity-100 text-ash'}`}>
            {showMedia ? 'Değiştir' : 'Yükle'}
          </span>
        </div>

        {status === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <span className="text-paper text-[10px] tracking-widest uppercase animate-pulse">Yükleniyor…</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>

      <div className="flex items-center gap-2 min-h-[16px]">
        <p className="flex-1 text-[9px] font-mono text-ash truncate">{targetPath}</p>
        {status === 'done' && <span className="eyebrow-sm shrink-0 text-ink">✓ Yüklendi</span>}
        {status === 'error' && <span className="eyebrow-sm shrink-0 text-ember" title={error}>✕ Hata</span>}
      </div>
      {status === 'error' && <p className="text-[9px] text-ember">{error}</p>}
    </div>
  );
}
