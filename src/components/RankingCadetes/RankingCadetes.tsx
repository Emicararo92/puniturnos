/* eslint-disable @typescript-eslint/no-unused-vars */
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

export default function RankingCadetes() {
  const supabase = createClient();

  const exportSemanaRef = useRef<HTMLDivElement>(null);
  const exportTotalRef = useRef<HTMLDivElement>(null);

  const [rankingSemana, setRankingSemana] = useState<CadeteRanking[]>([]);
  const [rankingTotal, setRankingTotal] = useState<CadeteRanking[]>([]);
  const [loading, setLoading] = useState(false);

  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));

  /* ---------- SEMANA ---------- */

  function changeWeek(offset: number) {
    const [y, m, d] = semanaRef.split("-").map(Number);
    const date = new Date(y, m - 1, d);

    date.setDate(date.getDate() + offset * 7);

    setSemanaRef(getMonday(date));
  }

  /* ---------- LOAD ---------- */

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

  /* ---------- EXPORT ---------- */

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

  /* ---------- RENDER ---------- */

  return (
    <div className={styles.pageContainer}>
      {/* NAV SEMANA */}
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

      {/* EXPORT */}
      <div className={styles.exportButtons}>
        <button
          onClick={() =>
            exportar(exportSemanaRef, `ranking-semana-${semanaRef}.png`)
          }
          className={styles.exportBtn}
        >
          <span className={styles.btnIcon}>📸</span>
          <span className={styles.btnText}>Semana</span>
        </button>

        <button
          onClick={() => exportar(exportTotalRef, "ranking-historico.png")}
          className={styles.exportBtn}
        >
          <span className={styles.btnIcon}>📸</span>
          <span className={styles.btnText}>Histórico</span>
        </button>
      </div>

      {/* GRID */}
      <div className={styles.rankingGrid}>
        {/* SEMANA */}
        <RankingBlock
          title="Esta Semana"
          icon="📅"
          data={rankingSemana}
          loading={loading}
        />

        {/* HISTÓRICO */}
        <RankingBlock
          title="Histórico"
          icon="🏆"
          data={rankingTotal}
          loading={loading}
        />
      </div>

      {/* EXPORT SEMANA - VERSIÓN MEJORADA CON COLORES */}
      <ExportBlock
        refProp={exportSemanaRef}
        title="Ranking Semanal"
        extra={`Semana: ${semanaRef}`}
        data={rankingSemana}
        isSemana={true}
      />

      {/* EXPORT TOTAL - VERSIÓN MEJORADA CON COLORES */}
      <ExportBlock
        refProp={exportTotalRef}
        title="Ranking Histórico"
        data={rankingTotal}
        isSemana={false}
      />
    </div>
  );
}

/* ---------- COMPONENTES AUX ---------- */

function RankingBlock({ title, icon, data, loading }: any) {
  const t1 = data.slice(0, 4);
  const t2 = data.slice(4, 8);
  const resto = data.slice(8);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>{icon}</span>
          <h3 className={styles.headerTitle}>{title}</h3>
        </div>
        {!loading && (
          <span className={styles.headerCount}>{data.length} cadetes</span>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando ranking…</p>
        </div>
      ) : (
        <div className={styles.list}>
          {/* T1 */}
          {t1.length > 0 && (
            <>
              <div className={`${styles.tierHeader} ${styles.tier1Header}`}>
                ⭐ PRIORIDAD T1
              </div>
              {t1.map((cadete: any, i: number) => (
                <RankingRow
                  key={cadete.id}
                  cadete={cadete}
                  pos={i + 1}
                  tier={1}
                />
              ))}
            </>
          )}

          {/* T2 */}
          {t2.length > 0 && (
            <>
              <div className={`${styles.tierHeader} ${styles.tier2Header}`}>
                🥈 PRIORIDAD T2
              </div>
              {t2.map((cadete: any, i: number) => (
                <RankingRow
                  key={cadete.id}
                  cadete={cadete}
                  pos={i + 5}
                  tier={2}
                />
              ))}
            </>
          )}

          {/* RESTO */}
          {resto.length > 0 && (
            <>
              <div className={`${styles.tierHeader} ${styles.tier3Header}`}>
                📋 OTROS
              </div>
              {resto.map((cadete: any, i: number) => (
                <RankingRow
                  key={cadete.id}
                  cadete={cadete}
                  pos={i + 9}
                  tier={3}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ExportBlock({ refProp, title, extra, data, isSemana }: any) {
  const t1 = data.slice(0, 4);
  const t2 = data.slice(4, 8);
  const resto = data.slice(8);

  return (
    <div ref={refProp} className={styles.exportHidden}>
      <div className={styles.exportContainer}>
        <div className={styles.exportHeader}>
          <h1 className={styles.exportTitle}>{title}</h1>
          {extra && <p className={styles.exportSubtitle}>{extra}</p>}
        </div>

        {/* T1 */}
        {t1.length > 0 && (
          <>
            <div className={`${styles.exportTierHeader} ${styles.exportTier1}`}>
              ⭐ PRIORIDAD T1
            </div>
            {t1.map((c: any, i: number) => (
              <ExportRow key={c.id} cadete={c} pos={i + 1} tier={1} />
            ))}
          </>
        )}

        {/* T2 */}
        {t2.length > 0 && (
          <>
            <div className={`${styles.exportTierHeader} ${styles.exportTier2}`}>
              🥈 PRIORIDAD T2
            </div>
            {t2.map((c: any, i: number) => (
              <ExportRow key={c.id} cadete={c} pos={i + 5} tier={2} />
            ))}
          </>
        )}

        {/* RESTO */}
        {resto.length > 0 && (
          <>
            <div className={`${styles.exportTierHeader} ${styles.exportTier3}`}>
              📋 OTROS
            </div>
            {resto.map((c: any, i: number) => (
              <ExportRow key={c.id} cadete={c} pos={i + 9} tier={3} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ExportRow({ cadete, pos, tier }: any) {
  return (
    <div className={`${styles.exportRow} ${styles[`exportRowTier${tier}`]}`}>
      <span
        className={`${styles.exportPos} ${pos <= 3 ? styles.exportTopThree : ""}`}
      >
        {pos === 1 && "🥇"}
        {pos === 2 && "🥈"}
        {pos === 3 && "🥉"}
        {pos > 3 && pos}
      </span>
      <span className={styles.exportName}>{cadete.nombre}</span>
      <span
        className={`${styles.exportValue} ${
          cadete.efectividad >= 95
            ? styles.exportAlta
            : cadete.efectividad >= 85
              ? styles.exportMedia
              : styles.exportBaja
        }`}
      >
        {cadete.efectividad}%
      </span>
      <span className={styles.exportTotal}>({cadete.total_turnos} turnos)</span>
    </div>
  );
}

function RankingRow({ cadete, pos, tier }: any) {
  return (
    <div className={`${styles.row} ${styles[`rowTier${tier}`]}`}>
      <span className={`${styles.pos} ${pos <= 3 ? styles.topThree : ""}`}>
        {pos === 1 && "🥇"}
        {pos === 2 && "🥈"}
        {pos === 3 && "🥉"}
        {pos > 3 && pos}
      </span>
      <span className={styles.nombre}>{cadete.nombre}</span>
      <span
        className={`${styles.efectividad} ${
          cadete.efectividad >= 95
            ? styles.efectividadAlta
            : cadete.efectividad >= 85
              ? styles.efectividadMedia
              : styles.efectividadBaja
        }`}
      >
        {cadete.efectividad}%
      </span>
      <span className={styles.turnos}>{cadete.total_turnos}</span>
    </div>
  );
}

/* ---------- UTILS ---------- */

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
