export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  discount: string;
  unit: string;
  inStock: boolean;
  description: string;
  /** Customer rating 0–5 (used for tie-breaking in catalog match). */
  rating: number;
}

export interface ProductWithImage extends Product {
  image: string;
}

export interface CartLine {
  cartItemId: string;
  productId: string;
  quantity: number;
}

export interface CartItemResponse {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  /** MRP per unit (for savings vs line total) */
  mrp: number;
  quantity: number;
  image: string;
  lineTotal: number;
  unit: string;
}

export interface CartResponse {
  items: CartItemResponse[];
  subtotal: number;
  itemCount: number;
}
