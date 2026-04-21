"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getPlayerById, type PlayerRecord } from "../../../lib/supabase";
import { getBenchmarks, getGrade, type MetricKey, type PlayerMetrics } from "../../../lib/report";
import { PlayerProfileCard } from "@/components/scouting/player-profile-card";
import { OverallGrade } from "@/components/scouting/overall-grade";
import { RadarChart } from "@/components/scouting/radar-chart";
import { StatCardGrid } from "@/components/scouting/stat-card-grid";
import { CommentSection } from "@/components/scouting/comment-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SharePageProps = {
  params: {
    id: string;
  };
};

type StatView = {
  name: string;
  value: string;
  score: number;
  grade: "엘리트" | "우수" | "평균이상" | "평균이하" | "기초";
  benchmark: string;
};

const metricRows: Array<{ key: MetricKey; label: string; unit: string }> = [
  { key: "sprint10m", label: "10m스프린트", unit: "초" },
  { key: "sprint30m", label: "30m스프린트", unit: "초" },
  { key: "standingLongJump", label: "제자리멀리뛰기", unit: "cm" },
  { key: "sideStep", label: "사이드스텝", unit: "회" },
  { key: "pushUp", label: "팔굽혀펴기", unit: "회" },
  { key: "sitAndReach", label: "장좌체전굴", unit: "cm" },
  { key: "powerDribble10m", label: "파워드리블", unit: "초" },
  { key: "passingAccuracy", label: "패싱정확도", unit: "개/45초" },
  { key: "blazePodReaction", label: "BlazePod반응속도", unit: "ms" },
];

export default function SharePage({ params }: SharePageProps) {
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPlayer = async () => {
      const data = await getPlayerById(params.id);
      setPlayer(data);
      setLoading(false);
    };

    void loadPlayer();
  }, [params.id]);

  const stats = useMemo<StatView[]>(() => {
    if (!player?.report || !player.metrics) return [];
    let benchmarks: PlayerMetrics | null = null;
    try {
      benchmarks = getBenchmarks(player.position, player.age);
    } catch {
      benchmarks = null;
    }

    return metricRows.map((row) => ({
      name: row.label,
      value: `${player.metrics?.[row.key] ?? "-"}${row.unit}`,
      score: player.report?.scores[row.key] ?? 0,
      grade: (player.report?.grades[row.key] ?? "기초") as StatView["grade"],
      benchmark: `${benchmarks?.[row.key] ?? "-"}${row.unit}`,
    }));
  }, [player]);

  const handleSavePdf = async () => {
    if (!reportRef.current || isSavingPdf || !player) return;

    setIsSavingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`scouting-report-${player.name}.pdf`);
    } catch (err) {
      console.error("Failed to save PDF:", err);
    } finally {
      setIsSavingPdf(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
        <div className="mx-auto max-w-2xl">
          <Card className="bg-white p-5 text-sm font-medium text-slate-500">불러오는 중...</Card>
        </div>
      </main>
    );
  }

  if (!player || !player.report) {
    return (
      <main className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="bg-white p-5 text-sm font-medium text-slate-600">
            해당 선수 리포트를 찾을 수 없습니다.
          </Card>
          <Link href="/players" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            선수 목록으로 이동
          </Link>
        </div>
      </main>
    );
  }

  const measurementDate = player.created_at
    ? new Date(player.created_at).toLocaleDateString("ko-KR").replace(/\.\s?/g, ".")
    : "-";
  const overallGrade = getGrade(player.report.overallScore) as StatView["grade"];

  return (
    <main className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
      <div ref={reportRef} className="mx-auto max-w-2xl space-y-4">
        <PlayerProfileCard
          name={player.name}
          age={player.age}
          position={player.position}
          team={player.team}
          measurementDate={measurementDate}
        />
        <OverallGrade grade={overallGrade} score={player.report.overallScore} />
        <RadarChart stats={stats} />
        <StatCardGrid stats={stats} />
        <CommentSection comment={player.report.overallEvaluation} />

        <div className="pb-4">
          <Button
            onClick={handleSavePdf}
            disabled={isSavingPdf}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {isSavingPdf ? "PDF 저장 중..." : "리포트 PDF 저장"}
          </Button>
        </div>
      </div>
    </main>
  );
}
