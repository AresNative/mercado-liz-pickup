import { Product } from "@/utils/data/example-data";

export interface ApiProduct {
  ID: number;
  Cuenta: string;
  Unidad: string;
  Factor: number;
  Codigo: string;
  Grupo: string;
  Nombre: string;
  PrecioRegular: number;
  PrecioOferta: number;
  TieneOferta: boolean;
  TotalInventario: number;
}

export const mapApiProductToAppProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct.Codigo.toString(),
  articulo: apiProduct.Cuenta.toString(),
  categoria: apiProduct.Grupo,
  nombre: apiProduct.Nombre.trim(),
  precio: apiProduct.PrecioRegular,
  precioRegular: apiProduct.TieneOferta
    ? apiProduct.PrecioOferta
    : apiProduct.PrecioOferta,
  unidad: apiProduct.Unidad,
  cantidad: apiProduct.TotalInventario,
  descuento: apiProduct.TieneOferta ? 10 : undefined,
  factor: apiProduct.Factor,
});

export const mapApiProductLoadingPage = (apiProduct: any): Product => ({
  id: apiProduct.id,
  articulo: apiProduct.Cuenta,
  categoria: apiProduct.categoria,
  nombre: apiProduct.nombre.trim(),
  precio: apiProduct.precio,
  unidad: apiProduct.unidad,
  descuento: apiProduct.TieneOferta ? 10 : undefined,
  cantidad: apiProduct.TotalInventario,
  factor: apiProduct.quantity,
});
