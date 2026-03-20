export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export const SNEAKER_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45', '46'] as const;
export type Size = typeof SIZES[number];

const SIZE_CATEGORIES = ['Clothing', 'Sneakers', 'Bags'];

export const requiresSize = (category: string) => SIZE_CATEGORIES.includes(category);

export const getSizesForCategory = (category: string): readonly string[] =>
  category === 'Sneakers' ? SNEAKER_SIZES : SIZES;
