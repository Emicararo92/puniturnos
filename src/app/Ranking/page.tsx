"use client";

import { useState } from "react";
import RankingCadetes from "../../components/RankingCadetes/RankingCadetes";

export default function RankingPage() {
  const [semanaRef] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  });

  return <RankingCadetes semanaRef={semanaRef} />;
}
