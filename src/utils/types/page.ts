export interface PageProps {
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  mobileScreen?: boolean;
  onClick?: () => void;
  onScroll?: (isScrolled: boolean) => void;
}
export interface Producto {
  id: string;
  image?: string;
  nombre: string;
  descuento?: number;
  categoria: string;
  unidad: string;
  precio: number;
  cantidad: number;
  precioRegular?: number;
  factor?: number;
  oferta?: {
    precio: number;
    fechaHasta: string;
  };
}
