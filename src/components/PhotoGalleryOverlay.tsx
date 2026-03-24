import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { BookingPhoto } from '../types';

interface PhotoGalleryOverlayProps {
  title: string;
  photos: BookingPhoto[];
  initialIndex?: number;
  onClose: () => void;
}

export const PhotoGalleryOverlay: React.FC<PhotoGalleryOverlayProps> = ({
  title,
  photos,
  initialIndex = 0,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => (current - 1 + photos.length) % photos.length);
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => (current + 1) % photos.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, photos.length]);

  if (photos.length === 0) return null;

  const activePhoto = photos[activeIndex];

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-xl px-4 py-6 md:px-8" onClick={onClose}>
      <div className="mx-auto flex h-full max-w-5xl flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-teal">{title}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-white">
              {activeIndex + 1} of {photos.length}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-3 text-white hover:border-teal hover:text-teal transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black/40">
          <img src={activePhoto.url} alt={title} className="h-full w-full object-contain" />
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((current) => (current - 1 + photos.length) % photos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white hover:border-teal hover:text-teal transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((current) => (current + 1) % photos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white hover:border-teal hover:text-teal transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-6">
            {photos.map((photo, index) => (
              <button
                key={photo.path || photo.url}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`overflow-hidden rounded-2xl border ${index === activeIndex ? 'border-teal' : 'border-white/10'} bg-white/5`}
              >
                <img src={photo.url} alt={`${title} ${index + 1}`} className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
