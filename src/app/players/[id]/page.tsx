"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCcw, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGrade } from "@/lib/report";
import { getPlayerById, type PlayerRecord } from "@/lib/supabase";

type PlayerDetailPageProps = {
  params: {
    id: string;
  };
};

export default function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const data = await getPlayerById(params.id);
      setPlayer(data);
      setLoading(false);
    };
    void run();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl">
          <Card className="bg-white p-5 text-sm font-medium text-slate-500">불러오는 중...</Card>
        </div>
      </main>
    );
  }

  if (!player || !player.report) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="bg-white p-5 text-sm font-medium text-slate-600">
            선수 정보를 찾을 수 없습니다.
          </Card>
          <Link href="/players" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            선수 목록으로 이동
          </Link>
        </div>
      </main>
    );
  }

  const overallGrade = getGrade(player.report.overallScore);
  const measuredDate = new Date(player.created_at).toLocaleDateString("ko-KR");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/players" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          선수 목록
        </Link>
        <Card className="bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{player.name}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {player.age}세 · {player.position} · {player.team}
              </p>
              <p className="mt-1 text-xs text-slate-400">측정일 {measuredDate}</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {player.report.overallScore}점 · {overallGrade}
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href={`/report?id=${player.id}`} className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">리포트 보기</Button>
            </Link>
            <Link href={`/players/${player.id}/remeasure`} className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <RefreshCcw className="mr-1 h-4 w-4" />
                재측정 하기
              </Button>
            </Link>
            <Link href={`/players/${player.id}/growth`} className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <TrendingUp className="mr-1 h-4 w-4" />
                성장 추이 보기
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
