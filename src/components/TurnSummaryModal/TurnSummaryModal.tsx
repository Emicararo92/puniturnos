  /* eslint-disable @typescript-eslint/no-explicit-any */

  "use client";

  import styles from "./TurnSummaryModal.module.css";

  export default function TurnSummaryModal({ day, onClose }: any) {
    if (!day) return null;

    const totalTurnos = Object.values(day.stats.turnos || {}).length;

    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>{day.label}</h2>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className={styles.turnList}>
            {totalTurnos === 0 ? (
              <div className={styles.empty}>
                <p>📅 No hay turnos cargados para este día</p>
              </div>
            ) : (
              Object.values(day.stats.turnos || {}).map((t: any, i: number) => {
                const cupo = t.cupo_max || day.stats.cupoMax || 4;

                console.log("Turn modal:", t);

                return (
                  <div key={i} className={styles.turnItem}>
                    <div className={styles.turnTime}>
                      <span className={styles.timeIcon}>⏰</span>
                      <span>
                        {t.hora_inicio.slice(0, 5)} - {t.hora_fin.slice(0, 5)}
                      </span>
                    </div>

                    <div className={styles.turnStats}>
                      <div className={styles.cadeteCount}>
                        <span className={styles.cadeteIcon}>👤</span>
                        <strong className={styles.cadeteNumber}>
                          {t.asignados}
                        </strong>
                      </div>

                      <div className={styles.ocupacionBar}>
                        <div
                          className={`${styles.ocupacionFill} ${
                            t.asignados === 0
                              ? styles.vacio
                              : t.asignados >= cupo
                                ? styles.completo
                                : t.asignados > cupo / 2
                                  ? styles.medio
                                  : styles.bajo
                          }`}
                          style={{
                            width: `${Math.min((t.asignados / cupo) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.footer}>
            <button className={styles.closeButton} onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }
