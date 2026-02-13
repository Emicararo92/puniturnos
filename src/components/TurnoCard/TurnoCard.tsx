/* eslint-disable @typescript-eslint/no-unused-vars */
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

  const ocupacion = cupoMax
    ? Math.round((cadetesLocal.length / cupoMax) * 100)
    : cadetesLocal.length > 0
      ? 100
      : 0;

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
        {/* Header con hora y fecha */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.time}>
              {horaInicio.slice(0, 5)} - {horaFin.slice(0, 5)}
            </span>
            <span className={styles.date}>
              {new Date(fecha).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>

        {/* Barra de ocupación */}
        {cupoMax && (
          <div className={styles.ocupacionBar}>
            <div
              className={`${styles.ocupacionFill} ${
                ocupacion === 0
                  ? styles.ocupacionBaja
                  : ocupacion === 100
                    ? styles.ocupacionCompleta
                    : ocupacion > 66
                      ? styles.ocupacionAlta
                      : ocupacion > 33
                        ? styles.ocupacionMedia
                        : styles.ocupacionBaja
              }`}
              style={{ width: `${ocupacion}%` }}
            />
            <span className={styles.ocupacionText}>
              {cadetesLocal.length}/{cupoMax} cupos
            </span>
          </div>
        )}

        {/* Lista de cadetes */}
        <div className={styles.cadetes}>
          {cadetesLocal.length === 0 ? (
            <div className={styles.empty}>✨ Sin cadetes asignados</div>
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
                  <span className={styles.cadeteNombre}>{c.nombre}</span>

                  <div className={styles.cadeteActions}>
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
                      title="Desasignar cadete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Botón de asignar */}
        <button
          className={styles.assignBtn}
          onClick={() => setOpenAssign(true)}
        >
          + Asignar Cadete
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
