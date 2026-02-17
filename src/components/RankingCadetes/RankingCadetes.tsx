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
        />

        <RankingBlock
          title="Histórico"
          icon="🏆"
          data={rankingTotal}
          loading={loading}
        />
      </div>

      <ExportBlock
        refProp={exportSemanaRef}
        title="Ranking Semanal"
        extra={`Semana: ${semanaRef}`}
        data={rankingSemana}
      />

      <ExportBlock
        refProp={exportTotalRef}
        title="Ranking Histórico"
        data={rankingTotal}
      />
    </div>
  );
}

/* COMPONENTES AUX */

function RankingBlock({ title, icon, data, loading }: any) {
  const t1 = data.slice(0, 4);
  const t2 = data.slice(4, 8);
  const resto = data.slice(8);

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
          {t1.map((c: any, i: number) => (
            <RankingRow
              key={c.id || `t1-${i}`}
              cadete={c}
              pos={i + 1}
              tier={1}
            />
          ))}

          {t2.map((c: any, i: number) => (
            <RankingRow
              key={c.id || `t2-${i}`}
              cadete={c}
              pos={i + 5}
              tier={2}
            />
          ))}

          {resto.map((c: any, i: number) => (
            <RankingRow
              key={c.id || `t3-${i}`}
              cadete={c}
              pos={i + 9}
              tier={3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RankingRow({ cadete, pos }: any) {
  return (
    <div className={styles.row}>
      <span>{pos}</span>
      <span>{cadete.nombre}</span>
      <span>{cadete.efectividad}%</span>
      <span>{cadete.total_turnos}</span>
    </div>
  );
}

function ExportBlock({ refProp, title, extra, data }: any) {
  return (
    <div ref={refProp} className={styles.exportHidden}>
      <h2>{title}</h2>
      {extra && <p>{extra}</p>}

      {data.map((c: any, i: number) => (
        <div key={`${c.id || "cadete"}-${i}`}>
          {i + 1}. {c.nombre} - {c.efectividad}% ({c.total_turnos})
        </div>
      ))}
    </div>
  );
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
