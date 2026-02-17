/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ZonaContext = createContext<any>(null);

export function ZonaProvider({ children }: any) {
  const supabase = createClient();

  const [zonas, setZonas] = useState<any[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZonas();
  }, []);

  async function loadZonas() {
    const { data } = await supabase
      .from("zonas")
      .select("*")
      .eq("activa", true)
      .order("nombre");

    if (!data || data.length === 0) {
      setZonas([]);
      setLoading(false);
      return;
    }

    setZonas(data);

    const savedZona = localStorage.getItem("zonaSeleccionada");

    if (savedZona && data.find((z) => z.id === savedZona)) {
      setZonaSeleccionada(savedZona);
    } else {
      setZonaSeleccionada(data[0].id);
      localStorage.setItem("zonaSeleccionada", data[0].id);
    }

    setLoading(false);
  }

  function cambiarZona(id: string) {
    setZonaSeleccionada(id);
    localStorage.setItem("zonaSeleccionada", id);
  }

  if (loading) return null;

  if (zonas.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <h2>No hay zonas configuradas</h2>
      </div>
    );
  }

  return (
    <ZonaContext.Provider value={{ zonas, zonaSeleccionada, cambiarZona }}>
      {children}
    </ZonaContext.Provider>
  );
}

export function useZona() {
  return useContext(ZonaContext);
}
