"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listPlayers, PlayerRecord } from "../../lib/supabase";

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [status, setStatus] = useState("불러오는 중...");

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await listPlayers();
        setPlayers(data);
        setStatus("");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        setStatus(`목록 조회 실패: ${message}`);
        return;
      }
    };

    void loadPlayers();
  }, []);

  const origin = useMemo(
    () => (typeof window === "undefined" ? "" : window.location.origin),
    []
  );

  const copyShareLink = async (playerId: string) => {
    const url = `${origin}/share/${playerId}`;
    await navigator.clipboard.writeText(url);
    alert("공유 링크를 복사했습니다.");
  };

  return (
    <main className="stack">
      <h1>2) 선수 목록 페이지</h1>
      <Link href="/">← 저장 페이지로 돌아가기</Link>
      {status ? <p>{status}</p> : null}

      {players.map((player) => (
        <article key={player.id} className="card stack">
          <strong>{player.name}</strong>
          <span>포지션: {player.position}</span>
          <span>팀: {player.team}</span>
          <span>종합 점수: {player.report?.overallScore ?? "-"}</span>
          <span>메모: {player.note ?? "-"}</span>
          <button type="button" onClick={() => copyShareLink(player.id)}>
            3) 공유 링크 생성/복사
          </button>
        </article>
      ))}
    </main>
  );
}
