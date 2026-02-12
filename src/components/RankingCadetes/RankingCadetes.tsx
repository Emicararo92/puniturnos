/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import { createClient } from "@/lib/supabase/client";
import styles from "./RankingCadetes.module.css";

type CadeteRanking = {
  id: string;
  nombre: string;
  efectividad: number;
  total_turnos: number;
};

export default function RankingCadetes({ semanaRef }: { semanaRef: string }) {
  const supabase = createClient();

  const exportSemanaRef = useRef<HTMLDivElement>(null);
  const exportTotalRef = useRef<HTMLDivElement>(null);

  const [rankingSemana, setRankingSemana] = useState<CadeteRanking[]>([]);
  const [rankingTotal, setRankingTotal] = useState<CadeteRanking[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRankings() {
    setLoading(true);

    const { data: semana } = await supabase.rpc("ranking_cadetes", {
      semana_ref: semanaRef,
      tipo: "semana",
    });

    const { data: total } = await supabase.rpc("ranking_cadetes", {
      semana_ref: null,
      tipo: "total",
    });

    setRankingSemana(semana || []);
    setRankingTotal(total || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRankings();
  }, [semanaRef]);

  async function exportar(ref: any, nombre: string) {
    if (!ref.current) return;

    const canvas = await html2canvas(ref.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = nombre;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      {/* BOTONES EXPORTAR */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          marginBottom: 20,
        }}
      >
        <button
          onClick={() =>
            exportar(exportSemanaRef, `ranking-semana-${semanaRef}.png`)
          }
          className={styles.exportBtn}
        >
          📸 Exportar Semana
        </button>

        <button
          onClick={() => exportar(exportTotalRef, "ranking-historico.png")}
          className={styles.exportBtn}
        >
          📸 Exportar Histórico
        </button>
      </div>

      {/* UI NORMAL */}
      <div className={styles.rankingGrid}>
        {/* Ranking Semana */}
        <div className={styles.container}>
          <div className={styles.header}>
            <h3>📅 Esta Semana</h3>
            {!loading && (
              <span className={styles.count}>
                {rankingSemana.length} cadetes
              </span>
            )}
          </div>

          <div className={styles.list}>
            {rankingSemana.map((cadete, i) => (
              <RankingRow key={cadete.id} cadete={cadete} pos={i + 1} />
            ))}
          </div>
        </div>

        {/* Ranking Histórico */}
        <div className={styles.container}>
          <div className={styles.header}>
            <h3>🏆 Histórico</h3>
            {!loading && (
              <span className={styles.count}>
                {rankingTotal.length} cadetes
              </span>
            )}
          </div>

          <div className={styles.list}>
            {rankingTotal.map((cadete, i) => (
              <RankingRow key={cadete.id} cadete={cadete} pos={i + 1} />
            ))}
          </div>
        </div>
      </div>

      {/* VERSION OCULTA EXPORT SEMANA */}
      <div
        ref={exportSemanaRef}
        style={{
          position: "absolute",
          left: "-9999px",
          background: "white",
          padding: "40px",
          width: "900px",
          fontFamily: "sans-serif",
        }}
      >
        <h1>Ranking Semanal</h1>
        <p>Semana: {semanaRef}</p>

        {rankingSemana.map((c, i) => (
          <p key={c.id}>
            {i + 1}. {c.nombre} — {c.efectividad}% ({c.total_turnos} turnos)
          </p>
        ))}
      </div>

      {/* VERSION OCULTA EXPORT HISTÓRICO */}
      <div
        ref={exportTotalRef}
        style={{
          position: "absolute",
          left: "-9999px",
          background: "white",
          padding: "40px",
          width: "900px",
          fontFamily: "sans-serif",
        }}
      >
        <h1>Ranking Histórico</h1>

        {rankingTotal.map((c, i) => (
          <p key={c.id}>
            {i + 1}. {c.nombre} — {c.efectividad}% ({c.total_turnos} turnos)
          </p>
        ))}
      </div>
    </>
  );
}

function RankingRow({ cadete, pos }: any) {
  return (
    <div className={styles.row}>
      <span className={styles.pos}>{pos}</span>
      <span className={styles.nombre}>{cadete.nombre}</span>
      <span
        className={`${styles.efectividad} ${
          cadete.efectividad >= 95
            ? styles.top
            : cadete.efectividad < 85
              ? styles.bad
              : styles.medium
        }`}
      >
        {cadete.efectividad}%
      </span>
      <span className={styles.turnos}>{cadete.total_turnos}</span>
    </div>
  );
}
