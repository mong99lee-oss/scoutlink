"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { getPlayerById, PlayerRecord } from "../../../lib/supabase";
import { metricLabels } from "../../../lib/report";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type SharePageProps = {
  params: {
    id: string;
  };
};

export default function SharePage({ params }: SharePageProps) {
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayer = async () => {
      const data = await getPlayerById(params.id);
      setPlayer(data);
      setLoading(false);
    };

    void loadPlayer();
  }, [params.id]);

  if (loading) {
    return (
      <main className="stack">
        <h1>공유 페이지</h1>
        <p>불러오는 중...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="stack">
        <h1>공유 페이지</h1>
        <p>해당 선수를 찾을 수 없습니다.</p>
        <Link href="/players">선수 목록으로 이동</Link>
      </main>
    );
  }

  const labels = Object.values(metricLabels);
  const values = player.report
    ? [
        player.report.scores.sprint10m,
        player.report.scores.sprint30m,
        player.report.scores.standingLongJump,
        player.report.scores.sideStep,
        player.report.scores.pushUp,
        player.report.scores.sitAndReach,
        player.report.scores.powerDribble10m,
        player.report.scores.passingAccuracy,
        player.report.scores.blazePodReaction,
      ]
    : [0, 0, 0, 0, 0, 0, 0, 0, 0];

  return (
    <main className="stack">
      <h1>공유된 선수 정보</h1>
      <article className="card stack">
        <strong>{player.name}</strong>
        <span>나이: {player.age}</span>
        <span>포지션: {player.position}</span>
        <span>팀: {player.team}</span>
        <span>메모: {player.note ?? "-"}</span>
        <div style={{ maxWidth: "520px" }}>
          <Radar
            data={{
              labels,
              datasets: [
                {
                  label: "선수 역량",
                  data: values,
                  borderColor: "#2563eb",
                  backgroundColor: "rgba(37, 99, 235, 0.2)",
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              scales: {
                r: {
                  min: 0,
                  max: 100,
                  ticks: {
                    stepSize: 20,
                  },
                },
              },
            }}
          />
        </div>
        <h3>항목별 등급</h3>
        {player.report ? (
          <>
            <span>10m 스프린트: {player.report.grades.sprint10m}</span>
            <span>30m 스프린트: {player.report.grades.sprint30m}</span>
            <span>제자리멀리뛰기: {player.report.grades.standingLongJump}</span>
            <span>사이드스텝: {player.report.grades.sideStep}</span>
            <span>팔굽혀펴기: {player.report.grades.pushUp}</span>
            <span>장좌체전굴: {player.report.grades.sitAndReach}</span>
            <span>파워드리블 10m: {player.report.grades.powerDribble10m}</span>
            <span>패싱 정확도: {player.report.grades.passingAccuracy}</span>
            <span>BlazePod 반응속도: {player.report.grades.blazePodReaction}</span>
            <h3>종합 평가</h3>
            <span>종합 점수: {player.report.overallScore}</span>
            <span>{player.report.overallEvaluation}</span>
          </>
        ) : (
          <span>등급 데이터가 없습니다.</span>
        )}
      </article>
      <Link href="/players">선수 목록으로 이동</Link>
    </main>
  );
}
