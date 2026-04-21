"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ruler, Timer, Target, Activity, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildReport, type MetricKey, type PlayerMetrics } from "@/lib/report";
import { createPlayer, getPlayerById, type PlayerRecord } from "@/lib/supabase";

type RemeasurePageProps = {
  params: {
    id: string;
  };
};

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

const fields: Array<{ key: MetricKey; label: string; unit: string; range: string; icon: typeof Zap }> = [
  { key: "sprint10m", label: "10m스프린트", unit: "초", range: "1.5 ~ 3.0", icon: Zap },
  { key: "sprint30m", label: "30m스프린트", unit: "초", range: "3.5 ~ 6.5", icon: Zap },
  { key: "standingLongJump", label: "제자리멀리뛰기", unit: "cm", range: "80 ~ 280", icon: Ruler },
  { key: "sideStep", label: "사이드스텝", unit: "회", range: "10 ~ 60", icon: Activity },
  { key: "pushUp", label: "팔굽혀펴기", unit: "회", range: "5 ~ 80", icon: Activity },
  { key: "sitAndReach", label: "장좌체전굴", unit: "cm", range: "-20 ~ 30", icon: Ruler },
  { key: "powerDribble10m", label: "파워드리블", unit: "초", range: "2.0 ~ 6.0", icon: Timer },
  { key: "passingAccuracy", label: "패싱정확도", unit: "개/45초", range: "0 ~ 45", icon: Target },
  { key: "blazePodReaction", label: "BlazePod반응속도", unit: "ms", range: "200 ~ 800", icon: Zap },
];

const getMetricErrorMessage = (key: MetricKey, value: string) => {
  if (!value.trim()) return "값을 입력해 주세요.";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "숫자로 입력해 주세요.";
  const range = metricRanges[key];
  if (parsed < range.min || parsed > range.max) {
    return `${range.min}~${range.max} 범위로 입력해 주세요.`;
  }
  return "";
};

export default function RemeasurePage({ params }: RemeasurePageProps) {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [measurements, setMeasurements] = useState<Record<MetricKey, string>>({
    sprint10m: "",
    sprint30m: "",
    standingLongJump: "",
    sideStep: "",
    pushUp: "",
    sitAndReach: "",
    powerDribble10m: "",
    passingAccuracy: "",
    blazePodReaction: "",
  });
  const [metricErrors, setMetricErrors] = useState<Record<MetricKey, string>>({
    sprint10m: "",
    sprint30m: "",
    standingLongJump: "",
    sideStep: "",
    pushUp: "",
    sitAndReach: "",
    powerDribble10m: "",
    passingAccuracy: "",
    blazePodReaction: "",
  });

  useEffect(() => {
    const run = async () => {
      const data = await getPlayerById(params.id);
      setPlayer(data);
      setLoading(false);
    };
    void run();
  }, [params.id]);

  const playerInfoText = useMemo(() => {
    if (!player) return "";
    return `${player.name} · ${player.age}세 · ${player.position} · ${player.team}`;
  }, [player]);

  const handleChange = (key: MetricKey, value: string) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
    setMetricErrors((prev) => ({ ...prev, [key]: getMetricErrorMessage(key, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player || isSubmitting) return;

    const nextErrors = { ...metricErrors };
    const metrics = {} as PlayerMetrics;

    for (const key of Object.keys(metricRanges) as MetricKey[]) {
      const error = getMetricErrorMessage(key, measurements[key]);
      nextErrors[key] = error;
      if (!error) {
        metrics[key] = Number(measurements[key]);
      }
    }
    setMetricErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setErrorMessage("입력값을 확인해 주세요.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const report = buildReport(metrics, player.age, player.position);
      await createPlayer({
        name: player.name,
        age: player.age,
        position: player.position,
        team: player.team,
        note: `base_player_id:${params.id}`,
        metrics,
        report,
      });
      router.push(`/players/${params.id}/growth`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setErrorMessage(`재측정 저장 실패: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl">
          <Card className="bg-white p-5 text-sm font-medium text-slate-500">불러오는 중...</Card>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="bg-white p-5 text-sm font-medium text-slate-600">선수 정보를 찾을 수 없습니다.</Card>
          <Link href="/players" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            선수 목록으로 이동
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href={`/players/${params.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          선수 상세로 이동
        </Link>

        <Card className="bg-white p-5">
          <h1 className="text-xl font-extrabold text-slate-900">재측정 입력</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">{playerInfoText}</p>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-slate-800">측정값만 새로 입력해 주세요</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-emerald-600" />
                      <label className="text-sm font-semibold text-slate-700">{field.label}</label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={measurements[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-14 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{field.unit}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">권장 범위: {field.range}</p>
                    {metricErrors[field.key] ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{metricErrors[field.key]}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          {errorMessage ? (
            <Card className="border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{errorMessage}</Card>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
            {isSubmitting ? "저장 중..." : "재측정 저장 후 성장 추이 보기"}
          </Button>
        </form>
      </div>
    </main>
  );
}
