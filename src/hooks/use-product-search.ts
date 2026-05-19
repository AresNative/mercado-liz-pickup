// hooks/use-product-search.ts
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { Producto } from "@/utils/types/page";
import { useCallback, useRef, useState } from "react";

const SEARCH_TABLE = "CB AS cb INNER JOIN Art AS art ON cb.Cuenta = art.Articulo INNER JOIN ListaPreciosDUnidad AS lpu ON art.Articulo = lpu.Articulo AND cb.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' AND lpu.Precio > 0 INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND lpu.Unidad = au.Unidad INNER JOIN ArtDisponible AS ad ON ad.Almacen = 'ALMMAYO' AND art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 LEFT JOIN Oferta AS ofr ON ofr.Estatus = 'VIGENTE' AND ofr.Articulo = art.Articulo AND ofr.FechaD < GETDATE() AND ofr.FechaA > GETDATE() LEFT JOIN OfertaD AS ofrd ON ofrd.id = ofr.ID AND ofrd.Articulo = art.Articulo AND ofrd.Unidad = cb.Unidad";
const PAGE_SIZE = 10;


const mapApiItemToProducto = (item: any): Producto => ({
  id: `${item.Articulo}-${item.Unidad}-${item.Factor}`,
  codigo: item.Codigo ?? "0000",
  articulo: item.Articulo ?? "Cuenta",
  nombre: item.Descripcion1 ?? "Sin nombre",
  categoria: item.Grupo ?? "Sin categoría",
  unidad: item.Unidad ?? "Unidad",
  precio: item.Precio ?? 0,
  cantidad: item.Cantidad ?? 1,
  factor: item.Factor ?? 1,
  impuesto1: item.Impuesto1 ?? 0,
  impuesto2: item.Impuesto2 ?? 0,
  tipoImpuesto1: item.TipoImpuesto1 ?? 0,
  tipoImpuesto2: item.TipoImpuesto2 ?? 0,
  descuento: item.Descuento ?? 0,
});
const buildFiltros = (term: string) => ({
  FiltrosAnd: [
    {
      OperadorLogico: "OR",
      Filtros: [
        { key: "art.Descripcion1", operator: "LIKE", value: term },
        { key: "cb.Codigo", operator: "LIKE", value: term },
      ],
    },
  ],
  Selects: [
    { key: "cb.Codigo" },
    { key: "art.Articulo" },
    { key: "art.Grupo" },
    { key: "art.Descripcion1" },
    { key: "art.Impuesto1" },
    { key: "art.Impuesto2" },
    { key: "art.TipoImpuesto1" },
    { key: "art.TipoImpuesto2" },
    { key: "lpu.Unidad" },
    { key: "lpu.Precio" },
    { key: "ofrd.Precio", alias: "Descuento" },
    { key: "au.Unidad", alias: "UnidadFactor" },
    { key: "au.Factor" },
  ],
  Agregaciones: [
    { Key: "ad.DispMenosApartado", Operation: "SUM", Alias: "Cantidad" },
  ],
  Order: [{ Key: "Descripcion1", Direction: "ASC" }],
});

export const useProductSearch = () => {
  const [getData] = useGetWithFiltersGeneralInIntelisisMutation();
  const [results, setResults] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);

    try {
      const result = await getData({
        table: SEARCH_TABLE,
        pageSize: PAGE_SIZE,
        page: 1,
        filtros: buildFiltros(term), // misma función buildFiltros que en search-result
        signal: controller.signal,
      });

      if (!controller.signal.aborted && "data" in result && result.data) {
        const items = result.data.data.map(mapApiItemToProducto);
        setResults(items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [getData]);

  return { results, isLoading, search };
};