export interface Product {
  id: string;
  image?: string;
  title: string;
  discount?: number;
  category: string;
  unidad: string;
  price: number;
  originalPrice?: number;
}
