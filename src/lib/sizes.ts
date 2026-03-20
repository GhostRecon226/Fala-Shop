export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export type Size = typeof SIZES[number];

const SIZE_CATEGORIES = ['Clothing', 'Sneakers', 'Bags'];

export const requiresSize = (category: string) => SIZE_CATEGORIES.includes(category);
