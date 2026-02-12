/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import styles from "./TurnoCard.module.css";
import AssignCadeteModal from "../AssignCadeteModal/AssignCadeteModal";
import IncidentModal from "../IncidentModal/IncidentModal";
import { createClient } from "@/lib/supabase/client";

type Cadete = {
  id?: string;
  nombre?: string;
  falta?: boolean;
  llegada_tarde?: boolean;
  tardanza_pedido?: boolean;
  activacion_tardia?: boolean;
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
  const [openAssign, setOpenAssign] = useState(false);
  const [incidentCadete, setIncidentCadete] = useState<Cadete | null>(null);
  const [cadetesLocal, setCadetesLocal] = useState<Cadete[]>(cadetes);

  const supabase = createClient();

  useEffect(() => {
    setCadetesLocal(cadetes);
  }, [cadetes]);

  const cuposLibres =
    cupoMax != null ? Math.max(cupoMax - cadetesLocal.length, 0) : null;

  const estadoClase =
    cadetesLocal.length === 0
      ? styles.vacio
      : cupoMax && cadetesLocal.length >= cupoMax
        ? styles.completo
        : styles.parcial;

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
      <div className={`${styles.card} ${estadoClase}`}>
        <div className={styles.header}>
          <span>
            {horaInicio.slice(0, 5)} - {horaFin.slice(0, 5)}
          </span>
          <small>{new Date(fecha).toLocaleDateString()}</small>
        </div>

        <div className={styles.cadetes}>
          {cadetesLocal.length === 0 ? (
            <div className={styles.empty}>Sin asignar</div>
          ) : (
            cadetesLocal.map((c) => {
              const conIncidencia =
                c.falta ||
                c.llegada_tarde ||
                c.tardanza_pedido ||
                c.activacion_tardia;

              return (
                <div
                  key={c.id}
                  className={`${styles.cadeteRow} ${
                    conIncidencia ? styles.cadeteIncidencia : ""
                  }`}
                >
                  <span>{c.nombre}</span>

                  <div className={styles.actions}>
                    <button
                      className={styles.incidentBtn}
                      onClick={() => setIncidentCadete(c)}
                      title="Registrar incidencias"
                    >
                      ⚠️
                    </button>

                    <button
                      className={styles.removeBtn}
                      onClick={() => unassign(c.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cuposLibres !== null && (
          <div className={styles.cupo}>Cupos libres: {cuposLibres}</div>
        )}

        <button
          className={styles.assignBtn}
          onClick={() => setOpenAssign(true)}
        >
          Asignar
        </button>
      </div>

      <AssignCadeteModal
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        turnoId={turnoId}
        fecha={fecha}
        onAssigned={refresh}
      />

      {incidentCadete && (
        <IncidentModal
          open={!!incidentCadete}
          onClose={() => setIncidentCadete(null)}
          turnoId={turnoId}
          cadeteId={incidentCadete.id!}
          nombre={incidentCadete.nombre!}
          fecha={fecha}
          refresh={refresh}
          onSavedAsignacion={(updated: any) => {
            setCadetesLocal((prev) =>
              prev.map((c) =>
                c.id === updated.cadete_id
                  ? {
                      ...c,
                      falta: updated.falta,
                      llegada_tarde: updated.llegada_tarde,
                      tardanza_pedido: updated.tardanza_pedido,
                      activacion_tardia: updated.activacion_tardia,
                    }
                  : c,
              ),
            );
          }}
        />
      )}
    </>
  );
}
