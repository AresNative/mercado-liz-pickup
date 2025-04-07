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
  TieneOferta: boolean;
}

export const mapApiProductToAppProduct = (apiProduct: ApiProduct): Product => ({
  id: apiProduct.ID.toString(),
  category: apiProduct.Grupo,
  title: apiProduct.Nombre.trim(),
  price: apiProduct.PrecioRegular,
  originalPrice: apiProduct.TieneOferta ? apiProduct.PrecioRegular : undefined,
  unidad: apiProduct.Unidad,
  discount: apiProduct.TieneOferta ? 10 : undefined,
});
