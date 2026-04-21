"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listPlayerHistoryById, type PlayerRecord } from "@/lib/supabase";
import type { MetricKey } from "@/lib/report";

type GrowthPageProps = {
  params: {
    id: string;
  };
};

const metricRows: Array<{ key: MetricKey; label: string; unit: string; lowerIsBetter: boolean }> = [
  { key: "sprint10m", label: "10m 스프린트", unit: "초", lowerIsBetter: true },
  { key: "sprint30m", label: "30m 스프린트", unit: "초", lowerIsBetter: true },
  { key: "standingLongJump", label: "제자리멀리뛰기", unit: "cm", lowerIsBetter: false },
  { key: "sideStep", label: "사이드스텝", unit: "회", lowerIsBetter: false },
  { key: "pushUp", label: "팔굽혀펴기", unit: "회", lowerIsBetter: false },
  { key: "sitAndReach", label: "장좌체전굴", unit: "cm", lowerIsBetter: false },
  { key: "powerDribble10m", label: "파워드리블", unit: "초", lowerIsBetter: true },
  { key: "passingAccuracy", label: "패싱정확도", unit: "개", lowerIsBetter: false },
  { key: "blazePodReaction", label: "BlazePod반응속도", unit: "ms", lowerIsBetter: true },
];

const metricRanges: Record<MetricKey, { min: number; max: number }> = {
  sprint10m: { min: 1.5, max: 3.0 },
  sprint30m: { min: 3.5, max: 6.5 },
  standingLongJump: { min: 80, max: 280 },
  sideStep: { min: 10, max: 60 },
  pushUp: { min: 5, max: 80 },
  sitAndReach: { min: -20, max: 30 },
  powerDribble10m: { min: 2.0, max: 6.0 },
  passingAccuracy: { min: 0, max: 45 },
  blazePodReaction: { min: 200, max: 800 },
};

const formatMetric = (value: number | undefined, unit: string) => {
  if (value === undefined || !Number.isFinite(value)) return "-";
  if (unit === "초") return `${value.toFixed(2)}${unit}`;
  return `${Math.round(value)}${unit}`;
};

const normalizeMetricToRadar = (key: MetricKey, value: number | undefined, lowerIsBetter: boolean) => {
  if (value === undefined || !Number.isFinite(value)) return 0;
  const range = metricRanges[key];
  const clamped = Math.max(range.min, Math.min(range.max, value));
  const ratio = (clamped - range.min) / (range.max - range.min);
  const score = lowerIsBetter ? (1 - ratio) * 100 : ratio * 100;
  return Number(score.toFixed(1));
};

const formatMetricDetail = (value: number | undefined, unit: string) => {
  if (value === undefined || !Number.isFinite(value)) return "-";
  if (unit === "초") return `${value.toFixed(2)}${unit}`;
  return `${Math.round(value)}${unit}`;
};

export default function PlayerGrowthPage({ params }: GrowthPageProps) {
  const [history, setHistory] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const data = await listPlayerHistoryById(params.id);
        setHistory(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        setErrorMessage(`성장 추이 조회 실패: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [params.id]);

  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  const lineData = useMemo(
    () =>
      history.map((item) => ({
        date: new Date(item.created_at).toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        }),
        score: item.report?.overallScore ?? 0,
      })),
    [history]
  );

  const radarData = useMemo(() => {
    if (!current?.metrics || !previous?.metrics) return [];
    return metricRows.map((row) => ({
      subject: row.label,
      previous: normalizeMetricToRadar(row.key, previous.metrics?.[row.key], row.lowerIsBetter),
      current: normalizeMetricToRadar(row.key, current.metrics?.[row.key], row.lowerIsBetter),
      fullMark: 100,
    }));
  }, [current, previous]);

  const growthCommentary = useMemo(() => {
    if (!current?.metrics || !previous?.metrics || !current.report || !previous.report) {
      return {
        improved: [] as string[],
        declined: [] as string[],
        overallSummary: "",
      };
    }

    const analyses = metricRows.map((row) => {
      const prevValue = previous.metrics?.[row.key];
      const currValue = current.metrics?.[row.key];
      const rawDelta = (currValue ?? 0) - (prevValue ?? 0);
      const performanceDelta = row.lowerIsBetter ? -rawDelta : rawDelta;
      return {
        row,
        prevValue,
        currValue,
        performanceDelta,
      };
    });

    const improved = analyses
      .filter((item) => item.performanceDelta > 0)
      .sort((a, b) => b.performanceDelta - a.performanceDelta)
      .slice(0, 2)
      .map(
        (item) =>
          `${item.row.label}이 ${formatMetricDetail(item.prevValue, item.row.unit)} → ${formatMetricDetail(item.currValue, item.row.unit)}로 크게 향상됐습니다 ▲`
      );

    const declined = analyses
      .filter((item) => item.performanceDelta < 0)
      .sort((a, b) => a.performanceDelta - b.performanceDelta)
      .slice(0, 2)
      .map(
        (item) =>
          `${item.row.label}이 ${formatMetricDetail(item.prevValue, item.row.unit)} → ${formatMetricDetail(item.currValue, item.row.unit)}로 하락했습니다 ▼`
      );

    const prevOverall = previous.report.overallScore;
    const currOverall = current.report.overallScore;
    const diff = currOverall - prevOverall;
    const overallSummary =
      diff > 0
        ? `종합점수가 ${prevOverall}점 → ${currOverall}점으로 ${diff}점 향상됐습니다`
        : diff < 0
          ? `종합점수가 ${prevOverall}점 → ${currOverall}점으로 ${Math.abs(diff)}점 하락했습니다`
          : `종합점수가 ${prevOverall}점 → ${currOverall}점으로 동일합니다`;

    return { improved, declined, overallSummary };
  }, [current, previous]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl">
          <Card className="bg-white p-5 text-sm font-medium text-slate-500">불러오는 중...</Card>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Card className="border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{errorMessage}</Card>
          <Link href="/players" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            선수 목록으로 이동
          </Link>
        </div>
      </main>
    );
  }

  if (!current || history.length < 2 || !previous || !current.report || !current.metrics) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Link href={`/players/${params.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            선수 상세로 이동
          </Link>
          <Card className="bg-white p-6 text-center text-sm font-semibold text-slate-500">
            아직 비교할 데이터가 없습니다.
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <Link href={`/players/${params.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          선수 상세로 이동
        </Link>

        <Card className="bg-white p-5">
          <h1 className="text-xl font-extrabold text-slate-900">{current.name} 성장 추이</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {current.position} · {current.team} · 총 {history.length}회 측정
          </p>
        </Card>

        <Card className="bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-800">종합점수 추이</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-800">항목별 이전 vs 현재</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metricRows.map((row) => {
              const prevValue = previous.metrics?.[row.key];
              const currValue = current.metrics?.[row.key];
              const delta = (currValue ?? 0) - (prevValue ?? 0);
              const improved = row.lowerIsBetter ? delta < 0 : delta > 0;
              const changed = delta !== 0;

              return (
                <div key={row.key} className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-700">{row.label}</p>
                  <p className="mt-2 text-base font-extrabold text-slate-900">
                    {formatMetric(prevValue, row.unit)} → {formatMetric(currValue, row.unit)}
                    {" "}
                    {changed ? (
                      improved ? (
                        <span className="inline-flex items-center text-emerald-600">
                          <TrendingUp className="h-4 w-4" />▲
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600">
                          <TrendingDown className="h-4 w-4" />▼
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-800">레이더 비교 (이전 vs 현재)</h2>
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#334155", fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickCount={5}
                  axisLine={false}
                />
                <Tooltip />
                <Radar name="이전" dataKey="previous" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="현재" dataKey="current" stroke="#10b981" fill="#10b981" fillOpacity={0.22} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-800">성장 분석 코멘트</h2>
          <div className="space-y-2">
            {growthCommentary.improved.length > 0 ? (
              growthCommentary.improved.map((comment) => (
                <p key={comment} className="text-sm font-medium text-emerald-700">
                  {comment}
                </p>
              ))
            ) : (
              <p className="text-sm font-medium text-slate-500">유의미하게 향상된 항목은 아직 없습니다.</p>
            )}

            {growthCommentary.declined.length > 0 ? (
              growthCommentary.declined.map((comment) => (
                <p key={comment} className="text-sm font-medium text-rose-700">
                  {comment}
                </p>
              ))
            ) : (
              <p className="text-sm font-medium text-slate-500">하락한 항목은 없습니다.</p>
            )}

            <p className="pt-1 text-sm font-bold text-slate-700">{growthCommentary.overallSummary}</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
