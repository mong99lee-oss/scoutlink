"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { getPlayerById, PlayerRecord } from "../../lib/supabase";
import {
  getBenchmarks,
  getGrade,
  metricLabels,
  MetricKey,
  type PlayerMetrics,
  type PlayerReport,
} from "../../lib/report";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const gradeColor: Record<string, string> = {
  엘리트: "#FFD700",
  우수: "#22C55E",
  평균이상: "#3B82F6",
  평균이하: "#F97316",
  기초: "#EF4444",
};

const gradeTextColor = () => "#0b1220";

export default function ReportPage() {
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const parsed = new URLSearchParams(search);
    setId(parsed.get("id") ?? "");
  }, []);

  useEffect(() => {
    if (!id) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const run = async () => {
      const data = await getPlayerById(id);
      setPlayer(data);
      setLoading(false);
    };

    void run();
  }, [id]);

  const metricKeys = useMemo(() => Object.keys(metricLabels) as MetricKey[], []);

  const radarLabels = useMemo(() => metricKeys.map((k) => metricLabels[k]), [metricKeys]);

  const radarValues = useMemo(() => {
    if (!player?.report) return metricKeys.map(() => 0);
    return metricKeys.map((k) => player.report!.scores[k]);
  }, [metricKeys, player]);

  const overallGrade = useMemo(() => {
    if (!player?.report) return "기초";
    return getGrade(player.report.overallScore);
  }, [player]);

  const benchmarks = useMemo<PlayerMetrics | null>(() => {
    if (!player) return null;
    try {
      return getBenchmarks(player.position, player.age);
    } catch {
      return null;
    }
  }, [player]);

  const handleCopyShare = async () => {
    if (!player) return;
    const url = `${window.location.origin}/share/${player.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 권한 이슈는 무시
    }
  };

  if (loading) {
    return (
      <main className="stack">
        <h1>리포트</h1>
        <p>불러오는 중...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="stack">
        <h1>리포트</h1>
        <p>해당 선수를 찾을 수 없습니다.</p>
        <Link href="/">홈으로</Link>
      </main>
    );
  }

  const report: PlayerReport | null = player.report ?? null;
  const overallBg = gradeColor[overallGrade] ?? "#94a3b8";

  return (
    <main className="stack">
      {/* 1) 상단 선수 프로필 카드 */}
      <section className="card stack" style={{ padding: "1.15rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: "-0.03em", color: "#0f172a" }}>
              {player.name}
            </div>
            <div style={{ marginTop: 8, color: "#334155", display: "grid", gap: 6 }}>
              <div>
                나이: <strong style={{ color: "#0f172a" }}>{player.age}</strong>
              </div>
              <div>
                포지션: <strong style={{ color: "#0f172a" }}>{player.position}</strong>
              </div>
              <div>
                팀: <strong style={{ color: "#0f172a" }}>{player.team}</strong>
              </div>
              <div style={{ fontSize: 13 }}>
                측정일:{" "}
                <strong style={{ color: "#0f172a" }}>
                  {player.created_at ? new Date(player.created_at).toLocaleDateString() : "-"}
                </strong>
              </div>
            </div>
          </div>

          {/* 2) 종합 등급 크게 표시 */}
          <div style={{ minWidth: 260, textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
              <div style={{ fontSize: 44, fontWeight: 1000, lineHeight: 1, letterSpacing: "-0.04em", color: "#0f172a" }}>
                {report?.overallScore ?? "-"}
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 999,
                  background: overallBg,
                  color: gradeTextColor(),
                  fontWeight: 1000,
                  whiteSpace: "nowrap",
                }}
              >
                {overallGrade}
              </span>
            </div>
            <div style={{ marginTop: 10, fontWeight: 900, color: "#475569" }}>
              {report?.overallEvaluation ?? "등급 데이터가 없습니다."}
            </div>
          </div>
        </div>
      </section>

      {/* 3) 레이더차트 크게/선명하게 */}
      <section className="card" style={{ padding: "1.15rem" }}>
        <div style={{ fontSize: 18, fontWeight: 1000, color: "#0f172a" }}>레이더차트</div>
        <div style={{ marginTop: 10, height: 460 }}>
          <Radar
            data={{
              labels: radarLabels,
              datasets: [
                {
                  label: "선수 역량",
                  data: radarValues,
                  borderColor: "#2563eb",
                  backgroundColor: "rgba(37, 99, 235, 0.22)",
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
            }}
          />
        </div>
      </section>

      {/* 4) 9개 항목 카드형 그리드 */}
      <section className="card" style={{ padding: "1.15rem" }}>
        <div style={{ fontSize: 18, fontWeight: 1000, color: "#0f172a" }}>항목별 등급</div>
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {metricKeys.map((key) => {
            const grade = report?.grades[key] ?? "기초";
            const badgeBg = gradeColor[grade] ?? "#94a3b8";
            const value = player.metrics?.[key];
            const baseline = benchmarks?.[key];
            return (
              <div
                key={key}
                style={{
                  borderRadius: 14,
                  padding: "0.95rem",
                  border: "1px solid rgba(219, 227, 239, 1)",
                  background: "white",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 1000, color: "#0f172a" }}>{metricLabels[key]}</div>
                  <span
                    style={{
                      background: badgeBg,
                      padding: "0.25rem 0.55rem",
                      borderRadius: 999,
                      color: gradeTextColor(),
                      fontWeight: 1000,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {grade}
                  </span>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 6, color: "#334155" }}>
                  <div>
                    측정값:{" "}
                    <strong style={{ color: "#0f172a" }}>{typeof value === "number" ? value : "-"}</strong>
                  </div>
                  <div>
                    기준치:{" "}
                    <strong style={{ color: "#0f172a" }}>
                      {typeof baseline === "number" ? baseline : "-"}
                    </strong>
                  </div>
                  <div>
                    평가점수:{" "}
                    <strong style={{ color: "#0f172a" }}>
                      {report?.scores[key] ?? 0}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5) 하단 공유 링크 버튼 */}
      <section className="card" style={{ padding: "1.15rem" }}>
        <div style={{ fontSize: 18, fontWeight: 1000, color: "#0f172a" }}>공유 링크</div>
        <div style={{ marginTop: 10, color: "#475569", fontWeight: 800 }}>
          아래 버튼으로 공유 링크를 복사할 수 있습니다.
        </div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <button type="button" className="secondary" onClick={handleCopyShare}>
            공유 링크 복사
          </button>
        </div>
      </section>
    </main>
  );
}
