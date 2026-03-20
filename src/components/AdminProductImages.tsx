import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, X, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type GalleryImage = {
  id: string;
  image_url: string;
  display_order: number;
};

interface AdminProductImagesProps {
  productId: string | null;
  onImagesChanged?: () => void;
}

const AdminProductImages = ({ productId, onImagesChanged }: AdminProductImagesProps) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productId) loadImages();
    else setImages([]);
  }, [productId]);

  const loadImages = async () => {
    if (!productId) return;
    setLoading(true);
    const { data } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });
    setImages((data || []) as GalleryImage[]);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !productId) return;

    setUploading(true);
    const newImages: { image_url: string; display_order: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 5 MB`, variant: 'destructive' });
        continue;
      }

      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        continue;
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      newImages.push({
        image_url: urlData.publicUrl,
        display_order: images.length + i,
      });
    }

    if (newImages.length > 0) {
      const { error } = await supabase.from('product_images').insert(
        newImages.map(img => ({ ...img, product_id: productId }))
      );
      if (error) {
        toast({ title: 'Error saving images', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Uploaded', description: `${newImages.length} image(s) added` });
        loadImages();
        onImagesChanged?.();
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (imageId: string) => {
    const { error } = await supabase.from('product_images').delete().eq('id', imageId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setImages(prev => prev.filter(img => img.id !== imageId));
      onImagesChanged?.();
    }
  };

  if (!productId) {
    return (
      <p className="text-xs text-muted-foreground italic">Save the product first, then add gallery images.</p>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">Gallery Images</label>

      {loading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">Loading...</div>
      ) : (
        <>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-muted">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(img.id)}
                    type="button"
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload size={18} />
            <span className="text-xs">{uploading ? 'Uploading...' : 'Add gallery images'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </>
      )}
    </div>
  );
};

export default AdminProductImages;
