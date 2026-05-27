/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

type Zona = {
  id: string;
  nombre: string;
  activa: boolean;
};

type ZonaContextType = {
  zonas: Zona[];
  zonaSeleccionada: string | null;
  cambiarZona: (id: string) => void;
};

type UserZona = {
  zona_id: string;
};

const ZonaContext = createContext<ZonaContextType | null>(null);

export function ZonaProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [zonas, setZonas] = useState<Zona[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadZonas() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("USER", user);

    if (!user) {
      setLoading(false);
      return;
    }

    // 🔥 TRAER IDS DE ZONAS ASIGNADAS
    const { data: relaciones, error: relError } = await supabase
      .from("user_zonas")
      .select("zona_id")
      .eq("user_id", user.id);

    console.log("RELACIONES", relaciones);

    if (relError || !relaciones) {
      console.error(relError);
      setLoading(false);
      return;
    }

    const ids = (relaciones as UserZona[]).map((r) => r.zona_id);

    console.log("IDS", ids);

    if (ids.length === 0) {
      setZonas([]);
      setLoading(false);
      return;
    }

    // 🔥 TRAER ZONAS
    const { data: zonasData, error: zonasError } = await supabase
      .from("zonas")
      .select("*")
      .in("id", ids)
      .eq("activa", true)
      .order("nombre");

    console.log("ZONAS DATA", zonasData);

    if (zonasError || !zonasData) {
      console.error(zonasError);
      setLoading(false);
      return;
    }

    setZonas(zonasData as Zona[]);

    const savedZona = localStorage.getItem("zonaSeleccionada");

    const existe = (zonasData as Zona[]).find((z) => z.id === savedZona);

    if (existe) {
      setZonaSeleccionada(savedZona);
    } else {
      setZonaSeleccionada(zonasData[0].id);

      localStorage.setItem("zonaSeleccionada", zonasData[0].id);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadZonas();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadZonas();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function cambiarZona(id: string) {
    setZonaSeleccionada(id);

    localStorage.setItem("zonaSeleccionada", id);
  }

  if (loading) return null;

  return (
    <ZonaContext.Provider
      value={{
        zonas,
        zonaSeleccionada,
        cambiarZona,
      }}
    >
      {children}
    </ZonaContext.Provider>
  );
}

export function useZona() {
  const context = useContext(ZonaContext);

  if (!context) {
    throw new Error("useZona debe usarse dentro de ZonaProvider");
  }

  return context;
}
