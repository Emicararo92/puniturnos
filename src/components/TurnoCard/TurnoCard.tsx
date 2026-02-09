"use client";

import { useState } from "react";
import styles from "./TurnoCard.module.css";
import AssignCadeteModal from "../AssignCadeteModal/AssignCadeteModal";
import { createClient } from "@/lib/supabase/client";

type Cadete = {
  id?: string;
  nombre?: string;
};

type Props = {
  turnoId: string;
  horaInicio: string;
  horaFin: string;
  fecha: string;
  cadetes?: Cadete[];
  cupoMax?: number | null;
  refresh: () => void;
};

export default function TurnoCard({
  turnoId,
  horaInicio,
  horaFin,
  fecha,
  cadetes = [],
  cupoMax,
  refresh,
}: Props) {
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const cuposLibres =
    cupoMax != null ? Math.max(cupoMax - cadetes.length, 0) : null;

  async function unassign(cadeteId?: string) {
    if (!cadeteId) return;

    await supabase
      .from("asignaciones_turno")
      .delete()
      .eq("turno_id", turnoId)
      .eq("cadete_id", cadeteId)
      .eq("fecha", fecha);

    refresh();
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <span>
            {horaInicio.slice(0, 5)} - {horaFin.slice(0, 5)}
          </span>
          <small>{new Date(fecha).toLocaleDateString()}</small>
        </div>

        <div className={styles.cadetes}>
          {cadetes.length === 0 ? (
            <div className={styles.empty}>Sin asignar</div>
          ) : (
            cadetes.map((c) => (
              <div key={c.id} className={styles.cadeteRow}>
                <span>{c.nombre}</span>

                <button
                  className={styles.removeBtn}
                  onClick={() => unassign(c.id)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {cuposLibres !== null && (
          <div className={styles.cupo}>Cupos libres: {cuposLibres}</div>
        )}

        <button className={styles.assignBtn} onClick={() => setOpen(true)}>
          Asignar
        </button>
      </div>

      <AssignCadeteModal
        open={open}
        onClose={() => setOpen(false)}
        turnoId={turnoId}
        fecha={fecha}
        onAssigned={refresh}
      />
    </>
  );
}
