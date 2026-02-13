/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import styles from "./TurnSummaryModal.module.css";

export default function TurnSummaryModal({ day, onClose }: any) {
  if (!day) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{day.label}</h2>

        <div className={styles.turnList}>
          {Object.values(day.stats.turnos || {}).length === 0 && (
            <p>No hay turnos cargados</p>
          )}

          {Object.values(day.stats.turnos || {}).map((t: any, i: number) => (
            <div key={i} className={styles.turnItem}>
              <span>
                {t.hora_inicio.slice(0, 5)} - {t.hora_fin.slice(0, 5)}
              </span>

              <strong>{t.asignados} cadetes</strong>
            </div>
          ))}
        </div>

        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
