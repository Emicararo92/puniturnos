/* eslint-disable react-hooks/exhaustive-deps */  
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./IncidentModal.module.css";
import { createClient } from "@/lib/supabase/client";

type AsignacionUpdate = {
  cadete_id: string;
  falta?: boolean;
  llegada_tarde?: boolean;
  tardanza_pedido?: boolean;
  activacion_tardia?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  turnoId: string;
  cadeteId: string;
  fecha: string;
  nombre: string;
  refresh: () => void;
  onSavedAsignacion?: (data: AsignacionUpdate) => void;
};

export default function IncidentModal({
  open,
  onClose,
  turnoId,
  cadeteId,
  fecha,
  nombre,
  refresh,
  onSavedAsignacion,
}: Props) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  const [state, setState] = useState({
    falta: false,
    llegada_tarde: false,
    tardanza_pedido: false,
    activacion_tardia: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    async function loadIncident() {
      const { data } = await supabase
        .from("asignaciones_turno")
        .select("falta,llegada_tarde,tardanza_pedido,activacion_tardia")
        .eq("turno_id", turnoId)
        .eq("cadete_id", cadeteId)
        .eq("fecha", fecha)
        .single();

      if (data) {
        setState({
          falta: data.falta ?? false,
          llegada_tarde: data.llegada_tarde ?? false,
          tardanza_pedido: data.tardanza_pedido ?? false,
          activacion_tardia: data.activacion_tardia ?? false,
        });
      }
    }

    loadIncident();
  }, [open, turnoId, cadeteId, fecha]);

  async function save() {
    const { data, error } = await supabase
      .from("asignaciones_turno")
      .upsert(
        {
          turno_id: turnoId,
          cadete_id: cadeteId,
          fecha,
          ...state,
          estado: "asignado",
        },
        {
          onConflict: "cadete_id,turno_id,fecha",
        },
      )
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error guardando incidencia");
      return;
    }

    if (data && onSavedAsignacion) {
      onSavedAsignacion(data);
    }

    refresh();
    onClose();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{nombre}</h3>

        <label>
          <input
            type="checkbox"
            checked={state.falta}
            onChange={(e) => setState({ ...state, falta: e.target.checked })}
          />
          Falta
        </label>

        <label>
          <input
            type="checkbox"
            checked={state.llegada_tarde}
            onChange={(e) =>
              setState({
                ...state,
                llegada_tarde: e.target.checked,
              })
            }
          />
          Llegó tarde
        </label>

        <label>
          <input
            type="checkbox"
            checked={state.tardanza_pedido}
            onChange={(e) =>
              setState({
                ...state,
                tardanza_pedido: e.target.checked,
              })
            }
          />
          Pedido tardío
        </label>

        <label>
          <input
            type="checkbox"
            checked={state.activacion_tardia}
            onChange={(e) =>
              setState({
                ...state,
                activacion_tardia: e.target.checked,
              })
            }
          />
          Activación tardía
        </label>

        <div className={styles.actions}>
          <button onClick={save}>Guardar</button>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
