import { Card } from "@/components/ui/card"
import {
  Zap,
  PersonStanding,
  ArrowRightLeft,
  Dumbbell,
  StretchHorizontal,
  CircleDot,
  Target,
  Activity,
} from "lucide-react"

type Grade = "엘리트" | "우수" | "평균이상" | "평균이하" | "기초"

interface Stat {
  name: string
  value: string
  score: number
  grade: Grade
  benchmark?: string
}

interface StatCardGridProps {
  stats: Stat[]
}

const gradeConfig: Record<Grade, { bg: string; text: string; border: string }> = {
  엘리트: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  우수: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  평균이상: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  평균이하: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  기초: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
}

const statIcons: Record<string, React.ReactNode> = {
  "10m스프린트": <Zap className="h-5 w-5 text-amber-500" />,
  "30m스프린트": <Activity className="h-5 w-5 text-blue-500" />,
  제자리멀리뛰기: <PersonStanding className="h-5 w-5 text-emerald-500" />,
  사이드스텝: <ArrowRightLeft className="h-5 w-5 text-purple-500" />,
  팔굽혀펴기: <Dumbbell className="h-5 w-5 text-rose-500" />,
  장좌체전굴: <StretchHorizontal className="h-5 w-5 text-cyan-500" />,
  파워드리블: <CircleDot className="h-5 w-5 text-green-500" />,
  패싱정확도: <Target className="h-5 w-5 text-indigo-500" />,
  "BlazePod반응속도": <Zap className="h-5 w-5 text-yellow-500" />,
}

function StatCard({ stat }: { stat: Stat }) {
  const config = gradeConfig[stat.grade]
  const icon = statIcons[stat.name] || <Activity className="h-5 w-5 text-slate-500" />

  return (
    <Card className="relative overflow-hidden bg-white p-4 pb-5">
      {/* 점수 프로그레스 바 - 하단 */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100">
        <div
          className={`h-full transition-all duration-500 ${
            stat.grade === "엘리트"
              ? "bg-amber-400"
              : stat.grade === "우수"
                ? "bg-emerald-400"
                : stat.grade === "평균이상"
                  ? "bg-blue-400"
                  : stat.grade === "평균이하"
                    ? "bg-orange-400"
                    : "bg-red-400"
          }`}
          style={{ width: `${stat.score}%` }}
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            {icon}
            <span className="break-words text-sm font-bold text-slate-700">{stat.name}</span>
          </div>
          <div className="break-all text-2xl font-extrabold leading-tight text-slate-900">{stat.value}</div>
          {stat.benchmark && (
            <div className="mt-1 break-all text-xs font-medium text-slate-400">
              기준치: {stat.benchmark}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.bg} ${config.text} ${config.border} border`}
          >
            {stat.grade}
          </span>
          <div className="mt-1.5 text-sm font-bold text-slate-500">{stat.score}점</div>
        </div>
      </div>
    </Card>
  )
}

export function StatCardGrid({ stats }: StatCardGridProps) {
  return (
    <div className="space-y-3">
      <h2 className="px-1 text-lg font-bold text-slate-800">측정 항목별 결과</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {stats.map((stat) => (
          <StatCard key={stat.name} stat={stat} />
        ))}
      </div>
    </div>
  )
}
