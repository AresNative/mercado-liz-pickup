export interface Product {
  id: string;
  articulo: string;
  image?: string;
  nombre: string;
  descuento?: number;
  categoria: string;
  unidad: string;
  precio: number;
  cantidad: number;
  precioRegular?: number;
  factor?: number;
}
