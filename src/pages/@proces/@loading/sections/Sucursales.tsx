import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Map, Marker } from "pigeon-maps";

interface Sucursal {
  nombre: string;
  precio: string;
  direccion: string;
  coordenadas: [number, number];
}

interface Filtros {
  sucursalVista: string;
}

const Sucursales: React.FC<Filtros> = ({ sucursalVista }) => {
  const sucursales = useMemo<Sucursal[]>(
    () => [
      { nombre: "Mayoreo", precio: "(Precio Lista)", direccion: "Calle Principal 123", coordenadas: [32.099733119103604, -116.5656031728404] },
      { nombre: "Valle de guadalupe", precio: "(Precio 2)", direccion: "Avenida Norte 456", coordenadas: [32.0947939, -116.5735554] },
      { nombre: "Valle de las palmas", precio: "(Precio 4)", direccion: "Boulevard Sur 789", coordenadas: [32.36670812592066, -116.61484440041006] },
      { nombre: "Testerazo", precio: "(Precio 3)", direccion: "Boulevard Sur 789", coordenadas: [32.295697914465485, -116.53331677806355] },
    ],
    []
  );

  const sucursalInicial = useMemo(
    () => sucursales.find(s => s.precio === sucursalVista) || sucursales[0],
    [sucursalVista, sucursales]
  );

  const [center, setCenter] = useState<[number, number]>(sucursalInicial.coordenadas);
  const [zoom, setZoom] = useState(16);

  useEffect(() => {
    const nuevaSucursal = sucursales.find(s => s.precio === sucursalVista);
    if (nuevaSucursal) {
      setCenter(nuevaSucursal.coordenadas);
    }
  }, [sucursalVista, sucursales]);

  const sucursalesFiltradas = useMemo(
    () => sucursales.filter(s => s.precio === sucursalVista),
    [sucursalVista, sucursales]
  );

  return (
    <section className="p-6 h-full flex flex-col gap-6">
      <div className="w-full md:h-auto rounded-lg overflow-hidden shadow-lg">
        <Map
          height={300}
          center={center}
          zoom={zoom}
          onBoundsChanged={({ center, zoom }) => {
            setCenter(center);
            setZoom(zoom);
          }}
        >
          {sucursalesFiltradas.map((sucursal, index) => (
            <Marker
              key={index}
              width={50}
              anchor={sucursal.coordenadas}
              color={
                center[0] === sucursal.coordenadas[0] &&
                  center[1] === sucursal.coordenadas[1]
                  ? "purple"
                  : "purple"
              }
            />
          ))}
        </Map>
      </div>
    </section>
  );
};

export default Sucursales;