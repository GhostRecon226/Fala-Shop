export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export const SNEAKER_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45', '46'] as const;
export type Size = typeof SIZES[number];

export const CLOTHING_COLORS = ['Black', 'White', 'Navy', 'Red', 'Grey', 'Blue', 'Green', 'Brown', 'Beige', 'Pink'] as const;

const SIZE_CATEGORIES = ['Clothing', 'Sneakers', 'Bags'];
const COLOR_CATEGORIES = ['Clothing'];

export const requiresSize = (category: string) => SIZE_CATEGORIES.includes(category);
export const requiresColor = (category: string) => COLOR_CATEGORIES.includes(category);

export const getSizesForCategory = (category: string): readonly string[] =>
  category === 'Sneakers' ? SNEAKER_SIZES : SIZES;

export const COLOR_SWATCHES: Record<string, string> = {
  Black: '#000000',
  White: '#FFFFFF',
  Navy: '#001F3F',
  Red: '#DC2626',
  Grey: '#6B7280',
  Blue: '#2563EB',
  Green: '#16A34A',
  Brown: '#92400E',
  Beige: '#D2B48C',
  Pink: '#EC4899',
};
