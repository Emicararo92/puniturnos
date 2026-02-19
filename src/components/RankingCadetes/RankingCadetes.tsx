/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./RankingCadetes.module.css";

type CadeteRanking = {
  id: string;
  nombre: string;
  efectividad: number;
  total_turnos: number;
};

export default function RankingCadetes() {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const exportSemanaRef = useRef<HTMLDivElement>(null);
  const exportTotalRef = useRef<HTMLDivElement>(null);

  const [rankingSemana, setRankingSemana] = useState<CadeteRanking[]>([]);
  const [rankingTotal, setRankingTotal] = useState<CadeteRanking[]>([]);
  const [loading, setLoading] = useState(false);

  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));

  function changeWeek(offset: number) {
    const [y, m, d] = semanaRef.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset * 7);
    setSemanaRef(getMonday(date));
  }

  async function loadRankings() {
    if (!zonaSeleccionada) return;

    setLoading(true);

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

    setRankingSemana(semana || []);
    setRankingTotal(total || []);
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
          zonaId={zonaSeleccionada}
        />

        <RankingBlock
          title="Histórico"
          icon="🏆"
          data={rankingTotal}
          loading={loading}
          zonaId={zonaSeleccionada}
        />
      </div>

      <ExportBlock
        refProp={exportSemanaRef}
        title="Ranking Semanal"
        extra={`Semana: ${semanaRef}`}
        data={rankingSemana}
        showTurnos
        zonaId={zonaSeleccionada}
      />

      <ExportBlock
        refProp={exportTotalRef}
        title="Ranking Histórico"
        data={rankingTotal}
        zonaId={zonaSeleccionada}
      />
    </div>
  );
}

/* ===== LÓGICA TURNOS POR ZONA ===== */

function getMaxTurnos(pos: number, zonaId?: string) {
  const reglas =
    zonaId === "3c8d4d22-b17e-4c40-b180-361c2117bc47"
      ? [10, 8, 6] // Santo Tomé
      : [12, 10, 8]; // La Falda default

  if (pos <= 4) return reglas[0];
  if (pos <= 9) return reglas[1];
  return reglas[2];
}

/* ===== COMPONENTES ===== */

function RankingBlock({ title, icon, data, loading, showTurnos, zonaId }: any) {
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
          {data.map((c: any, i: number) => (
            <RankingRow
              key={c.id || i}
              cadete={c}
              pos={i + 1}
              showTurnos={showTurnos}
              zonaId={zonaId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RankingRow({ cadete, pos, showTurnos, zonaId }: any) {
  const maxTurnos = getMaxTurnos(pos, zonaId);

  return (
    <div className={styles.row}>
      <span>#{pos}</span>
      <span>{cadete.nombre}</span>
      <span>{cadete.efectividad}%</span>
      <span>{cadete.total_turnos}</span>

      {showTurnos && (
        <span className={styles.turnosPermitidos}>
          Puede pedir: <strong>{maxTurnos}</strong>
        </span>
      )}
    </div>
  );
}

function ExportBlock({ refProp, title, extra, data, showTurnos, zonaId }: any) {
  return (
    <div ref={refProp} className={styles.exportHidden}>
      <h2>{title}</h2>
      {extra && <p>{extra}</p>}

      {data.map((c: any, i: number) => {
        const maxTurnos = getMaxTurnos(i + 1, zonaId);

        return (
          <div key={`${c.id}-${i}`}>
            {i + 1}. {c.nombre} - {c.efectividad}% ({c.total_turnos})
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
