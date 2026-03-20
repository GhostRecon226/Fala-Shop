import { useState, useEffect, useCallback } from 'react';
import { ImageIcon, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

type GalleryImage = {
  id: string;
  image_url: string;
  display_order: number;
};

interface ProductImageGalleryProps {
  mainImage: string | null;
  additionalImages: GalleryImage[];
  productName: string;
}

const ProductImageGallery = ({ mainImage, additionalImages, productName }: ProductImageGalleryProps) => {
  const allImages = [
    ...(mainImage ? [{ id: 'main', image_url: mainImage, display_order: -1 }] : []),
    ...additionalImages.sort((a, b) => a.display_order - b.display_order),
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const goNext = useCallback(() => {
    setSelectedIndex(i => (i + 1) % allImages.length);
  }, [allImages.length]);

  const goPrev = useCallback(() => {
    setSelectedIndex(i => (i - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, goNext, goPrev]);

  if (allImages.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center card-shadow">
        <ImageIcon size={48} className="text-muted-foreground" />
      </div>
    );
  }

  const currentImage = allImages[selectedIndex] || allImages[0];

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <button
          onClick={() => openLightbox(selectedIndex)}
          className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted card-shadow group cursor-zoom-in"
        >
          <img
            src={currentImage.image_url}
            alt={`${productName} — image ${selectedIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm rounded-full p-2.5">
              <ZoomIn size={20} className="text-foreground" />
            </div>
          </div>
        </button>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-150 active:scale-[0.96] ${
                  index === selectedIndex
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <img
                  src={img.image_url}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-[0.95]"
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>

          {/* Counter */}
          {allImages.length > 1 && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
              {selectedIndex + 1} / {allImages.length}
            </span>
          )}

          {/* Previous */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-[0.95]"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Image */}
          <img
            src={currentImage.image_url}
            alt={`${productName} — image ${selectedIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-[0.95]"
              aria-label="Next image"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Thumbnail strip in lightbox */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1 px-2">
              {allImages.map((img, index) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedIndex(index); }}
                  className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all duration-150 active:scale-[0.95] ${
                    index === selectedIndex
                      ? 'border-white ring-1 ring-white/40'
                      : 'border-white/20 hover:border-white/50 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ProductImageGallery;
