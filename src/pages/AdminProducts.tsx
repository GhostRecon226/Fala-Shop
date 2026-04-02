import { useEffect, useState, useRef } from 'react';
import { formatPrice } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logAdminAction } from '@/hooks/useAdminLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getSizesForCategory, requiresSize, requiresColor, CLOTHING_COLORS, COLOR_SWATCHES } from '@/lib/sizes';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminNav from '@/components/AdminNav';
import AdminProductImages from '@/components/AdminProductImages';

const CATEGORIES = ['Solar Fans', 'Clothing', 'Sneakers', 'Bags'] as const;

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number | null;
  is_featured: boolean | null;
  description: string | null;
  image_url: string | null;
  available_sizes: string[];
  available_colors: string[];
  compare_at_price: number | null;
};

const emptyForm = {
  name: '',
  category: 'Solar Fans' as string,
  price: '',
  stock_quantity: '',
  description: '',
  image_url: '',
  is_featured: false,
  available_sizes: [] as string[],
  available_colors: [] as string[],
  compare_at_price: '',
};

const AdminProducts = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [colorInput, setColorInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk edit state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkComparePrice, setBulkComparePrice] = useState('');
  const [bulkMode, setBulkMode] = useState<'set' | 'clear' | 'markup'>('set');
  const [bulkMarkup, setBulkMarkup] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkSave = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);

    let errorCount = 0;
    for (const id of selectedIds) {
      let newComparePrice: number | null = null;

      if (bulkMode === 'set') {
        newComparePrice = bulkComparePrice ? parseFloat(bulkComparePrice) : null;
      } else if (bulkMode === 'clear') {
        newComparePrice = null;
      } else if (bulkMode === 'markup') {
        const product = products.find(p => p.id === id);
        if (product && bulkMarkup) {
          const pct = parseFloat(bulkMarkup);
          newComparePrice = Math.round(product.price * (1 + pct / 100) * 100) / 100;
        }
      }

      const { error } = await supabase.from('products').update({ compare_at_price: newComparePrice }).eq('id', id);
      if (error) errorCount++;
    }

    if (errorCount > 0) {
      toast({ title: 'Partial error', description: `${errorCount} product(s) failed to update`, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Compare-at-price updated for ${selectedIds.size} product(s)` });
      logAdminAction('bulk_updated_compare_price', 'product', null, { count: selectedIds.size, mode: bulkMode });
    }

    setBulkSaving(false);
    setBulkDialogOpen(false);
    setSelectedIds(new Set());
    setBulkComparePrice('');
    setBulkMarkup('');
    queryClient.invalidateQueries({ queryKey: ['products'] });
    loadProducts();
  };

  useEffect(() => {
    if (isAdmin) loadProducts();
  }, [isAdmin]);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview(null);
    setColorInput('');
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      stock_quantity: String(p.stock_quantity ?? 0),
      description: p.description || '',
      image_url: p.image_url || '',
      is_featured: !!p.is_featured,
      available_sizes: p.available_sizes || [],
      available_colors: p.available_colors || [],
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
    });
    setImagePreview(p.image_url || null);
    setColorInput('');
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 5 MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    setForm(f => ({ ...f, image_url: publicUrl }));
    setImagePreview(publicUrl);
    setUploading(false);
    toast({ title: 'Uploaded', description: 'Image uploaded successfully' });
  };

  const removeImage = () => {
    setForm(f => ({ ...f, image_url: '' }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: 'Validation', description: 'Name and price are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity || '0', 10),
      description: form.description || null,
      image_url: form.image_url || null,
      is_featured: form.is_featured,
      available_sizes: form.available_sizes,
      available_colors: form.available_colors,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Updated', description: 'Product updated successfully' });
        logAdminAction('updated', 'product', editingId, { name: payload.name, price: payload.price });
      }
    } else {
      const { data: inserted, error } = await supabase.from('products').insert(payload).select('id').single();
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Created', description: 'Product created successfully' });
        logAdminAction('created', 'product', inserted?.id, { name: payload.name, price: payload.price });
      }
    }
    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['products'] });
    loadProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const deletedProduct = products.find(p => p.id === deleteId);
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Product deleted' });
      logAdminAction('deleted', 'product', deleteId, { name: deletedProduct?.name });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      loadProducts();
    }
    setDeleteId(null);
  };

  if (authLoading || adminLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to access this page.</p>
        <Link to="/auth" className="text-primary text-sm font-medium">Sign In</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-20 text-center">
        <ShieldAlert size={48} className="mx-auto text-destructive mb-4" />
        <p className="text-lg font-semibold text-foreground mb-2">Access Denied</p>
        <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert size={24} className="text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
      </div>

      <AdminNav />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Products ({products.length})</h2>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setBulkMode('set'); setBulkDialogOpen(true); }}>
              <Tag size={14} className="mr-1" /> Set Sale Price ({selectedIds.size})
            </Button>
          )}
          <Button onClick={openAdd} size="sm">
            <Plus size={16} className="mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading products...</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={products.length > 0 && selectedIds.size === products.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Compare</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id} className={selectedIds.has(p.id) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <ImageIcon size={16} className="text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(Number(p.price))}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.compare_at_price ? (
                      <span className="text-muted-foreground line-through">{formatPrice(Number(p.compare_at_price))}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.stock_quantity ?? 0}</TableCell>
                  <TableCell>{p.is_featured ? '✓' : '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                        <Trash2 size={15} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update product details below.' : 'Fill in the details for the new product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Price *</label>
                <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Compare at Price</label>
                <Input type="number" step="0.01" placeholder="Original price" value={form.compare_at_price} onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Stock</label>
              <Input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} />
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Product Image</label>
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={removeImage}
                    type="button"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload size={24} />
                  <span className="text-sm">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
                  <span className="text-xs">PNG, JPG, WebP · Max 5 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Gallery Images */}
            <AdminProductImages
              productId={editingId}
              currentCoverUrl={form.image_url || null}
              onSetCover={(url) => {
                setForm(f => ({ ...f, image_url: url }));
                setImagePreview(url);
              }}
            />

            {/* Available Sizes */}
            {requiresSize(form.category) && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Available Sizes</label>
                <p className="text-xs text-muted-foreground mb-2">Leave unchecked for all sizes. Check specific sizes to limit availability.</p>
                <div className="flex flex-wrap gap-2">
                  {getSizesForCategory(form.category).map(size => (
                    <label
                      key={size}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                        form.available_sizes.includes(size)
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.available_sizes.includes(size)}
                        onChange={e => {
                          setForm(f => ({
                            ...f,
                            available_sizes: e.target.checked
                              ? [...f.available_sizes, size]
                              : f.available_sizes.filter(s => s !== size),
                          }));
                        }}
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Available Colors */}
            {requiresColor(form.category) && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Available Colors</label>
                {form.available_colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.available_colors.map(color => (
                      <span
                        key={color}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-sm text-foreground"
                      >
                        {COLOR_SWATCHES[color] && (
                          <span className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: COLOR_SWATCHES[color] }} />
                        )}
                        {color}
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, available_colors: f.available_colors.filter(c => c !== color) }))}
                          className="ml-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a color name and press Enter"
                    value={colorInput}
                    onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = colorInput.trim();
                        if (val && !form.available_colors.includes(val)) {
                          setForm(f => ({ ...f, available_colors: [...f.available_colors, val] }));
                        }
                        setColorInput('');
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CLOTHING_COLORS.filter(c => !form.available_colors.includes(c)).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, available_colors: [...f.available_colors, color] }))}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    >
                      {COLOR_SWATCHES[color] && (
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_SWATCHES[color] }} />
                      )}
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                checked={form.is_featured}
                onCheckedChange={v => setForm(f => ({ ...f, is_featured: !!v }))}
              />
              <label htmlFor="featured" className="text-sm font-medium text-foreground cursor-pointer">Featured product</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {/* Delete Confirmation */}
      {!!deleteId && <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {/* Bulk Compare-at-Price Dialog */}
      {bulkDialogOpen && <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bulk Set Compare-at-Price</DialogTitle>
            <DialogDescription>
              Update compare-at-price for {selectedIds.size} selected product(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {(['set', 'markup', 'clear'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setBulkMode(mode)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    bulkMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-muted'
                  }`}
                >
                  {mode === 'set' ? 'Fixed Price' : mode === 'markup' ? '% Markup' : 'Clear'}
                </button>
              ))}
            </div>

            {bulkMode === 'set' && (
              <div>
                <label className="text-sm font-medium text-foreground">Compare-at-Price</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 15000"
                  value={bulkComparePrice}
                  onChange={e => setBulkComparePrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">All selected products will get this same compare-at-price.</p>
              </div>
            )}

            {bulkMode === 'markup' && (
              <div>
                <label className="text-sm font-medium text-foreground">Markup Percentage (%)</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="e.g. 20"
                  value={bulkMarkup}
                  onChange={e => setBulkMarkup(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Compare-at-price = current price + {bulkMarkup || '0'}%. Each product's price is used individually.
                </p>
              </div>
            )}

            {bulkMode === 'clear' && (
              <p className="text-sm text-muted-foreground">
                This will remove the compare-at-price from all {selectedIds.size} selected product(s), removing sale badges.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkSave}
              disabled={bulkSaving || (bulkMode === 'set' && !bulkComparePrice) || (bulkMode === 'markup' && !bulkMarkup)}
            >
              {bulkSaving ? 'Updating...' : `Update ${selectedIds.size} Product(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div>
  );
};

export default AdminProducts;
