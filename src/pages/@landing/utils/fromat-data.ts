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

export const mapApiProductToAppProduct = (apiProduct: any): Product => {
  // Calcular si tiene oferta basado en la comparación de precios
  const precioLista = apiProduct.PrecioLista || 0;
  const precioRegular = apiProduct.Precio || 0;
  const tieneOferta =
    precioLista > 0 && precioRegular > 0 && precioRegular < precioLista;

  // Calcular porcentaje de descuento si hay oferta
  const descuento = tieneOferta
    ? Math.round(((precioLista - precioRegular) / precioLista) * 100)
    : undefined;

  return {
    id: apiProduct.Codigo?.toString() || "",
    articulo: apiProduct.Articulo?.toString() || "",
    categoria: apiProduct.Grupo || "",
    nombre: apiProduct.Descripcion1?.trim() || "",
    precio: precioRegular, // Precio actual (puede ser de oferta)
    precioRegular: tieneOferta ? precioLista : precioRegular, // Precio regular sin descuento
    unidad: apiProduct.Unidad || "",
    cantidad: apiProduct.TotalInventario || 0,
    descuento: descuento,
    factor: apiProduct.Factor || 1,
    image: undefined, // Agregado ya que parece necesario según el uso en otros componentes
  };
};

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
