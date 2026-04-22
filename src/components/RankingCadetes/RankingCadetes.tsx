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

  const exportSemanaRef = useRef<HTMLDivElement>(null);
  const exportTotalRef = useRef<HTMLDivElement>(null);

  const [rankingSemana, setRankingSemana] = useState<CadeteRanking[]>([]);
  const [rankingTotal, setRankingTotal] = useState<CadeteRanking[]>([]);
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

    const { data: total } = await supabase.rpc("ranking_cadetes_zona", {
      semana_ref: null,
      zona: zonaSeleccionada,
      tipo: "total",
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
      .lte("semana", semanaRef)
      .order("semana", { ascending: false })
      .limit(1)
      .maybeSingle();

    setRankingSemana(semana || []);
    setRankingTotal(total || []);
    setPenalMap(map);
    setMaxTurnosBase(config?.max_turnos ?? 0);

    setLoading(false);
  }

  useEffect(() => {
    loadRankings();
  }, [semanaRef, zonaSeleccionada]);

  async function exportar(ref: any, nombre: string) {
    if (!ref.current) return;

    const canvas = await html2canvas(ref.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      allowTaint: true,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement("a");
    link.download = nombre;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.weekNav}>
        <button onClick={() => changeWeek(-1)} className={styles.navBtn}>
          ←
        </button>

        <div className={styles.weekInfo}>
          <span className={styles.weekLabel}>Semana</span>
          <strong className={styles.weekDate}>
            {new Date(semanaRef).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            })}
          </strong>
        </div>

        <button onClick={() => changeWeek(1)} className={styles.navBtn}>
          →
        </button>

        <button
          onClick={() => setSemanaRef(getMonday(new Date()))}
          className={styles.todayBtn}
        >
          Hoy
        </button>
      </div>

      <div className={styles.exportButtons}>
        <button
          onClick={() =>
            exportar(exportSemanaRef, `ranking-${zonaSeleccionada}-semana.png`)
          }
          className={styles.exportBtn}
        >
          📸 Semana
        </button>

        <button
          onClick={() =>
            exportar(exportTotalRef, `ranking-${zonaSeleccionada}-total.png`)
          }
          className={styles.exportBtn}
        >
          📸 Histórico
        </button>
      </div>

      <div className={styles.rankingGrid}>
        <RankingBlock
          title="Esta Semana"
          icon="📅"
          data={rankingSemana}
          loading={loading}
          showTurnos
          maxTurnosBase={maxTurnosBase}
          penalMap={penalMap}
        />

        <RankingBlock
          title="Histórico"
          icon="🏆"
          data={rankingTotal}
          loading={loading}
          maxTurnosBase={maxTurnosBase}
          penalMap={penalMap}
        />
      </div>

      <ExportBlock
        refProp={exportSemanaRef}
        title="Ranking Semanal"
        extra={`Semana: ${semanaRef}`}
        data={rankingSemana}
        showTurnos
        maxTurnosBase={maxTurnosBase}
        penalMap={penalMap}
      />

      <ExportBlock
        refProp={exportTotalRef}
        title="Ranking Histórico"
        data={rankingTotal}
        maxTurnosBase={maxTurnosBase}
        penalMap={penalMap}
      />
    </div>
  );
}

/* ===== CÁLCULO ===== */

function calcularTurnos(cadete: any, base: number) {
  const penalizacion =
    (cadete.faltas ?? cadete.falta ?? 0) * 3 +
    (cadete.llegadas_tarde ?? 0) +
    (cadete.tardanza_pedido ?? 0) +
    (cadete.activacion_tardia ?? 0);

  return Math.max(0, base - penalizacion);
}

/* ===== COMPONENTES ===== */

function RankingBlock({
  title,
  icon,
  data,
  loading,
  showTurnos,
  maxTurnosBase,
  penalMap,
}: any) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>

      {loading ? (
        <p>Cargando ranking…</p>
      ) : (
        <div>
          {[...data]
            .sort((a: any, b: any) => {
              const penalA = penalMap.get(a.cadete_id) || {};
              const penalB = penalMap.get(b.cadete_id) || {};

              const turnosA = calcularTurnos(penalA, maxTurnosBase);
              const turnosB = calcularTurnos(penalB, maxTurnosBase);

              return turnosB - turnosA; // 🔥 mayor a menor
            })
            .map((c: any, i: number) => (
              <RankingRow
                key={c.id || c.cadete_id || i}
                cadete={c}
                pos={i + 1}
                showTurnos={showTurnos}
                maxTurnosBase={maxTurnosBase}
                penalMap={penalMap}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function RankingRow({ cadete, pos, showTurnos, maxTurnosBase, penalMap }: any) {
  const penal = penalMap.get(cadete.cadete_id) || {};
  const maxTurnos = calcularTurnos(penal, maxTurnosBase);

  const totalTurnos = cadete.total_turnos ?? cadete.turnos ?? 0;

  return (
    <div className={styles.row}>
      <span>#{pos}</span>
      <span>{cadete.nombre}</span>
      <span>{cadete.efectividad}%</span>
      <span>{totalTurnos}</span>

      {showTurnos && (
        <span className={styles.turnosPermitidos}>
          Puede pedir: <strong>{maxTurnos}</strong>
        </span>
      )}
    </div>
  );
}

function ExportBlock({
  refProp,
  title,
  extra,
  data,
  showTurnos,
  maxTurnosBase,
  penalMap,
}: any) {
  return (
    <div ref={refProp} className={styles.exportHidden}>
      <h2>{title}</h2>
      {extra && <p>{extra}</p>}

      {data.map((c: any, i: number) => {
        const penal = penalMap.get(c.cadete_id) || {};
        const maxTurnos = calcularTurnos(penal, maxTurnosBase);
        const totalTurnos = c.total_turnos ?? c.turnos ?? 0;

        return (
          <div key={`${c.id || c.cadete_id}-${i}`}>
            {i + 1}. {c.nombre} - {c.efectividad}% ({totalTurnos})
            {showTurnos && ` | Máx: ${maxTurnos}`}
          </div>
        );
      })}
    </div>
  );
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
