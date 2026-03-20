import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

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

  if (allImages.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center card-shadow">
        <ImageIcon size={48} className="text-muted-foreground" />
      </div>
    );
  }

  const currentImage = allImages[selectedIndex] || allImages[0];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-muted card-shadow">
        <img
          src={currentImage.image_url}
          alt={`${productName} — image ${selectedIndex + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
        />
      </div>

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
  );
};

export default ProductImageGallery;
