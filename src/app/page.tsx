"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { createPlayer, isSupabaseEnabled } from "../lib/supabase";
import {
  buildReport,
  metricLabels,
  MetricKey,
  PlayerMetrics,
  PlayerReport,
} from "../lib/report";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type NewPlayerInput = {
  name: string;
  age: number;
  position: "FW" | "MF" | "DF";
  team: string;
  note: string;
};

const initialForm: NewPlayerInput = {
  name: "",
  age: 20,
  position: "FW",
  team: "",
  note: "",
};

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [metrics, setMetrics] = useState<PlayerMetrics>({
    sprint10m: 1.9,
    sprint30m: 4.6,
    standingLongJump: 210,
    sideStep: 40,
    pushUp: 30,
    sitAndReach: 10,
    powerDribble10m: 2.5,
    passingAccuracy: 24,
    blazePodReaction: 410,
  });
  const [report, setReport] = useState<PlayerReport | null>(null);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const metricInputConfig: Record<MetricKey, { min: number; max: number; step: number }> = {
    sprint10m: { min: 1, max: 4, step: 0.01 },
    sprint30m: { min: 3, max: 7, step: 0.01 },
    standingLongJump: { min: 100, max: 320, step: 1 },
    sideStep: { min: 10, max: 80, step: 1 },
    pushUp: { min: 0, max: 120, step: 1 },
    sitAndReach: { min: -20, max: 40, step: 1 },
    powerDribble10m: { min: 1, max: 6, step: 0.01 },
    passingAccuracy: { min: 0, max: 60, step: 1 },
    blazePodReaction: { min: 150, max: 900, step: 1 },
  };

  const updateField = (
    field: keyof NewPlayerInput,
    value: NewPlayerInput[keyof NewPlayerInput]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const stepTitle = useMemo(() => {
    return [
      "1) 선수 정보 입력",
      "2) 나이/포지션 선택",
      "3) 9개 측정값 입력",
      "4) 리포트 생성",
      "5) 저장",
      "6) 공유 링크 생성",
    ][step - 1];
  }, [step]);

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    setStatus("");

    try {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`;
      await createPlayer({
        id,
        name: form.name.trim(),
        age: form.age,
        position: form.position,
        team: form.team.trim(),
        note: form.note.trim() || null,
        metrics,
        report,
      });
      setSavedId(id);
      const origin =
        typeof window === "undefined" ? "" : window.location.origin;
      setShareUrl(`${origin}/share/${id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setStatus(`저장 실패: ${message}`);
      setSaving(false);
      return;
    }

    setStatus(
      isSupabaseEnabled
        ? "Supabase에 저장되었습니다."
        : "로컬 저장소에 저장되었습니다."
    );
    setStep(6);
    setSaving(false);
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setStatus("공유 링크를 복사했습니다.");
  };

  return (
    <main className="stack">
      <h1>ScoutLink</h1>
      <div className="card stack">
        <h2>{stepTitle}</h2>

        {step === 1 ? (
          <div className="stack">
            <input
              required
              placeholder="선수 이름"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
            <input
              required
              placeholder="소속 팀"
              value={form.team}
              onChange={(event) => updateField("team", event.target.value)}
            />
            <textarea
              rows={4}
              placeholder="메모"
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!form.name.trim() || !form.team.trim()}
            >
              다음: 나이/포지션 선택
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="stack">
            <label className="stack">
              <span>나이</span>
              <input
                type="number"
                min={10}
                max={50}
                value={form.age}
                onChange={(event) => updateField("age", Number(event.target.value))}
              />
            </label>
            <label className="stack">
              <span>포지션</span>
              <select
                value={form.position}
                onChange={(event) =>
                  updateField("position", event.target.value as NewPlayerInput["position"])
                }
              >
                <option value="FW">FW</option>
                <option value="MF">MF</option>
                <option value="DF">DF</option>
              </select>
            </label>
            <button type="button" className="secondary" onClick={() => setStep(1)}>
              이전
            </button>
            <button type="button" onClick={() => setStep(3)}>
              다음: 9개 측정값 입력
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="stack">
            {(Object.keys(metricLabels) as (keyof PlayerMetrics)[]).map((key) => (
              <label key={key} className="stack">
                <span>
                  {metricLabels[key]}: {metrics[key]}
                </span>
                <input
                  type="number"
                  min={metricInputConfig[key].min}
                  max={metricInputConfig[key].max}
                  step={metricInputConfig[key].step}
                  value={metrics[key]}
                  onChange={(event) =>
                    setMetrics((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ))}
            <button type="button" className="secondary" onClick={() => setStep(1)}>
              이전
            </button>
            <button
              type="button"
              onClick={() => {
                setReport(buildReport(metrics, form.age, form.position));
                setStep(4);
              }}
            >
              다음: 리포트 생성
            </button>
          </div>
        ) : null}

        {step === 4 && report ? (
          <div className="stack">
            <div style={{ maxWidth: "520px" }}>
              <Radar
                data={{
                  labels: Object.values(metricLabels),
                  datasets: [
                    {
                      label: "선수 역량",
                      data: (Object.keys(metricLabels) as (keyof PlayerMetrics)[]).map(
                        (key) => report.scores[key]
                      ),
                      borderColor: "#2563eb",
                      backgroundColor: "rgba(37, 99, 235, 0.2)",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
                }}
              />
            </div>
            <p>종합 점수: {report.overallScore}</p>
            <p>종합 평가: {report.overallEvaluation}</p>
            {(Object.keys(metricLabels) as (keyof PlayerMetrics)[]).map((key) => (
              <span key={key}>
                {metricLabels[key]}: {metrics[key]}점 / {report.grades[key]}등급
              </span>
            ))}
            <button type="button" className="secondary" onClick={() => setStep(3)}>
              이전
            </button>
            <button type="button" onClick={() => setStep(5)}>
              다음: 저장
            </button>
          </div>
        ) : null}

        {step === 5 && report ? (
          <div className="stack">
            <p>리포트를 저장합니다.</p>
            <button type="button" className="secondary" onClick={() => setStep(4)}>
              이전
            </button>
            <button disabled={saving} type="button" onClick={handleSave}>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="stack">
            <p>저장이 완료되었습니다. 공유 링크를 생성했습니다.</p>
            <input readOnly value={shareUrl} />
            <button type="button" onClick={copyShareLink}>
              공유 링크 복사
            </button>
            <Link href={`/share/${savedId}`}>
              <button type="button" className="secondary">
                공유 페이지 열기
              </button>
            </Link>
          </div>
        ) : null}

        {status ? <p>{status}</p> : null}
      </div>
    </main>
  );
}
