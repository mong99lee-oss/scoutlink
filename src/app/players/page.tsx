"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { listPlayers, PlayerRecord } from "../../lib/supabase";
import { getGrade } from "../../lib/report";
import { Card } from "@/components/ui/card";

const positionColor: Record<string, string> = {
  FW: "bg-red-500",
  MF: "bg-emerald-500",
  DF: "bg-blue-500",
  GK: "bg-amber-500",
};

const gradeColor: Record<string, string> = {
  엘리트: "bg-amber-100 text-amber-700 border-amber-300",
  우수: "bg-emerald-100 text-emerald-700 border-emerald-300",
  평균이상: "bg-blue-100 text-blue-700 border-blue-300",
  평균이하: "bg-orange-100 text-orange-700 border-orange-300",
  기초: "bg-red-100 text-red-700 border-red-300",
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await listPlayers();
        setPlayers(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        setErrorMessage(`목록 조회 실패: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    void loadPlayers();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Users className="h-5 w-5 text-emerald-600" />
            선수 목록
          </h1>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            입력 페이지로 돌아가기
          </Link>
        </div>

        {loading ? (
          <Card className="bg-white p-5 text-sm font-medium text-slate-500">불러오는 중...</Card>
        ) : null}

        {errorMessage ? (
          <Card className="border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {errorMessage}
          </Card>
        ) : null}

        {!loading && !errorMessage && players.length === 0 ? (
          <Card className="bg-white p-5 text-sm font-medium text-slate-500">
            저장된 선수가 없습니다. 먼저 리포트를 생성해 주세요.
          </Card>
        ) : null}

        {!loading && !errorMessage
          ? players.map((player) => {
              const overallScore = player.report?.overallScore ?? 0;
              const overallGrade = getGrade(overallScore);
              return (
                <Link key={player.id} href={`/report?id=${player.id}`} className="block">
                  <Card className="relative overflow-hidden bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="absolute right-4 top-4 flex items-center gap-2">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-bold text-white ${
                          positionColor[player.position] || "bg-slate-500"
                        }`}
                      >
                        {player.position}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="space-y-2 pr-16">
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-xl font-extrabold text-slate-900">{player.name}</h2>
                        <span className="text-sm font-semibold text-slate-500">{player.age}세</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">{player.team}</p>
                      <p className="text-xs text-slate-400">
                        측정일 {new Date(player.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                          gradeColor[overallGrade] || "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {overallGrade}
                      </span>
                      <span className="text-sm font-bold text-slate-600">
                        종합 점수 {overallScore}점
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })
          : null}
      </div>
    </main>
  );
}
