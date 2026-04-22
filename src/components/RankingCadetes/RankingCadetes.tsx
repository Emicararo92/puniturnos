/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./RankingCadetes.module.css";

type CadeteRanking = {
  id?: string;
  cadete_id?: string;
  nombre: string;
  efectividad: number;
  total_turnos?: number;
  turnos?: number;
  faltas?: number;
  falta?: number;
  llegadas_tarde?: number;
  tardanza_pedido?: number;
  activacion_tardia?: number;
};

export default function RankingCadetes() {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const exportRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);

  const [rankingSemana, setRankingSemana] = useState<CadeteRanking[]>([]);
  const [penalMap, setPenalMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(false);

  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));
  const [maxTurnosBase, setMaxTurnosBase] = useState<number>(0);

  function changeWeek(offset: number) {
    const [y, m, d] = semanaRef.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset * 7);
    setSemanaRef(getMonday(date));
  }

  function getPreviousMonday(fecha: string) {
    const [y, m, d] = fecha.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 7);
    return getMonday(date);
  }

  async function loadRankings() {
    if (!zonaSeleccionada) return;

    setLoading(true);

    const semanaAnterior = getPreviousMonday(semanaRef);

    const { data: semana } = await supabase.rpc("ranking_cadetes_zona", {
      semana_ref: semanaRef,
      zona: zonaSeleccionada,
      tipo: "semana",
    });

    const { data: penalizaciones } = await supabase.rpc(
      "penalizaciones_semana",
      {
        semana_ref: semanaAnterior,
        zona: zonaSeleccionada,
      },
    );

    const map = new Map();
    penalizaciones?.forEach((c: any) => {
      map.set(c.cadete_id, c);
    });

    const { data: config } = await supabase
      .from("turnos_config")
      .select("max_turnos")
      .eq("zona_id", zonaSeleccionada)
      .order("semana", { ascending: false })
      .limit(1)
      .maybeSingle();

    setRankingSemana(semana || []);
    setPenalMap(map);
    setMaxTurnosBase(Number(config?.max_turnos || 0));

    setLoading(false);
  }

  useEffect(() => {
    loadRankings();
  }, [semanaRef, zonaSeleccionada]);

  async function exportar() {
    if (!exportRef.current || exportando) return;

    setExportando(true);

    try {
      const original = exportRef.current;

      // 🔥 CLON REAL
      const clone = original.cloneNode(true) as HTMLElement;

      // 🔥 CONTENEDOR LIMPIO (CLAVE)
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "800px"; // ancho fijo consistente
      container.style.background = "#ffffff";
      container.style.zIndex = "-9999";

      // 🔥 RESET TOTAL (evita cortes)
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.overflow = "visible";
      clone.style.position = "static";

      container.appendChild(clone);
      document.body.appendChild(container);

      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      document.body.removeChild(container);

      const link = document.createElement("a");
      const fecha = new Date(semanaRef)
        .toLocaleDateString("es-AR")
        .replace(/\//g, "-");

      link.download = `ranking-${fecha}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error(error);
      alert("Error exportando");
    } finally {
      setExportando(false);
    }
  }

  const sortedData = [...rankingSemana].sort((a: any, b: any) => {
    const ta = calcularTurnos(penalMap.get(a.cadete_id) || {}, maxTurnosBase);
    const tb = calcularTurnos(penalMap.get(b.cadete_id) || {}, maxTurnosBase);
    return tb - ta;
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.weekNav}>
        <button onClick={() => changeWeek(-1)}>←</button>
        <strong>
          {new Date(semanaRef).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
          })}
        </strong>
        <button onClick={() => changeWeek(1)}>→</button>
      </div>

      <div className={styles.exportButtons}>
        <button onClick={exportar} disabled={exportando}>
          {exportando ? "⏳ Exportando..." : "📸 Exportar"}
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando ranking...</div>
      ) : (
        <div ref={exportRef} className={styles.exportContainer}>
          <div className={styles.rankingTitle}>Ranking de Cadetes</div>
          <div className={styles.rankingSubtitle}>
            Semana del {new Date(semanaRef).toLocaleDateString("es-AR")} |
            Máximo: {maxTurnosBase} turnos
          </div>

          <div className={styles.rankingList}>
            {sortedData.map((c: any, i: number) => {
              const penal = penalMap.get(c.cadete_id) || {};
              const maxTurnos = calcularTurnos(penal, maxTurnosBase);

              const alcanzoMaximo = maxTurnos === maxTurnosBase;
              const claseRendimiento = alcanzoMaximo
                ? styles.perfecto
                : styles.bajo;
              const claseTurnos = alcanzoMaximo ? styles.perfecto : styles.bajo;

              const faltas = penal.faltas ?? penal.falta ?? 0;
              const llegadasTarde = penal.llegadas_tarde ?? 0;
              const tardanzaPedido = penal.tardanza_pedido ?? 0;

              return (
                <div
                  key={c.cadete_id || i}
                  className={`${styles.rankingItem} ${claseRendimiento}`}
                >
                  <div className={styles.position}>
                    {i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `${i + 1}°`}
                  </div>

                  <div className={styles.cadeteInfo}>
                    <div className={styles.cadeteName}>{c.nombre}</div>
                    {(faltas > 0 ||
                      llegadasTarde > 0 ||
                      tardanzaPedido > 0) && (
                      <div className={styles.cadeteMetrics}>
                        {faltas > 0 && (
                          <span className={styles.metric}>
                            ❌{" "}
                            <span className={styles.metricValue}>{faltas}</span>
                          </span>
                        )}
                        {llegadasTarde > 0 && (
                          <span className={styles.metric}>
                            ⏰{" "}
                            <span className={styles.metricValue}>
                              {llegadasTarde}
                            </span>
                          </span>
                        )}
                        {tardanzaPedido > 0 && (
                          <span className={styles.metric}>
                            📦{" "}
                            <span className={styles.metricValue}>
                              {tardanzaPedido}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`${styles.turnosValue} ${claseTurnos}`}>
                    {maxTurnos} / {maxTurnosBase}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== LÓGICA ===== */

function calcularTurnos(cadete: any, base: number) {
  const penalizacion =
    (cadete.faltas ?? cadete.falta ?? 0) * 3 +
    (cadete.llegadas_tarde ?? 0) +
    (cadete.tardanza_pedido ?? 0) +
    (cadete.activacion_tardia ?? 0);

  return Math.max(0, base - penalizacion);
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
