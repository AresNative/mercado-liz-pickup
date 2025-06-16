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
}

export const mapApiProductToAppProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct.Codigo.toString(),
  categoria: apiProduct.Grupo,
  nombre: apiProduct.Nombre.trim(),
  precio: apiProduct.PrecioRegular,
  precioRegular: apiProduct.TieneOferta
    ? apiProduct.PrecioOferta
    : apiProduct.PrecioOferta,
  unidad: apiProduct.Unidad,
  descuento: apiProduct.TieneOferta ? 10 : undefined,
  factor: apiProduct.Factor,
});
