"use client";

import { useState } from "react";

import WeeklyBoard from "../WeeklyBoard/WeeklyBoard";
import HomeWeeklyTurns from "../HomeWeeklyTurns/HomeWeeklyTurns";

export default function HomePage() {
  const [semanaRef, setSemanaRef] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  });

  return (
    <div>
      <WeeklyBoard semanaRef={semanaRef} setSemanaRef={setSemanaRef} />
      <HomeWeeklyTurns semanaRef={semanaRef} />
    </div>
  );
}
