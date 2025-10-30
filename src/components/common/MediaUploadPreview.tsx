import React from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number; // default 5
  className?: string;
};

function useObjectUrls(files: File[]) {
  const [urls, setUrls] = React.useState<string[]>([]);
  React.useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  return urls;
}

const MediaUploadPreview: React.FC<Props> = ({
  files,
  onChange,
  max = 5,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const urls = useObjectUrls(files);
  const [isDragOver, setDragOver] = React.useState(false);

  const remaining = Math.max(0, max - files.length);
  const pickFiles = () => inputRef.current?.click();

  const handleAdd = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list);
    const key = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;
    const map = new Map(files.map((f) => [key(f), f]));
    for (const f of incoming) {
      if (map.size >= max) break;
      const k = key(f);
      if (!map.has(k)) map.set(k, f);
    }
    onChange(Array.from(map.values()).slice(0, max));
  };

  const handleRemove = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleAdd(e.dataTransfer.files);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        hidden
        onChange={(e) => handleAdd(e.target.files)}
      />

      {/* Drop Zone */}
      <div
        onClick={pickFiles}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-200',
          'bg-white hover:border-primary-300',
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
        role='button'
        aria-label='Upload product images'
      >
        <div className='flex flex-col items-center justify-center text-gray-600'>
          <Upload className='h-6 w-6 text-primary-500 mb-2' />
          <div className='font-medium text-sm text-gray-900'>
            Drop images here or click to upload
          </div>
          <div className='text-xs text-gray-500 mt-1'>
            {files.length}/{max} selected{' '}
            {remaining > 0 ? `• ${remaining} remaining` : ''}
          </div>
        </div>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${f.size}-${f.lastModified}`}
              className='relative rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all'
            >
              {urls[i] ? (
                <img
                  src={urls[i]}
                  alt={f.name}
                  className='h-28 w-full object-cover transition-opacity duration-200'
                  loading='lazy'
                />
              ) : (
                <div className='h-28 flex items-center justify-center text-gray-400 bg-gray-50'>
                  <ImageIcon className='h-5 w-5' />
                </div>
              )}

              {/* Overlay remove button */}
              <button
                type='button'
                onClick={() => handleRemove(i)}
                className='absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-white/90 p-1.5 text-gray-700 shadow-sm hover:bg-white focus:outline-none'
                title='Remove'
              >
                <Trash2 className='h-4 w-4 text-primary-600' />
              </button>

              <div className='p-2 text-xs text-gray-700 truncate border-t border-gray-100 bg-gray-50'>
                {f.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploadPreview;
