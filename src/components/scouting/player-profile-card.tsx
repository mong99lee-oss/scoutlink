import { Card } from "@/components/ui/card"
import { User, Calendar } from "lucide-react"

interface PlayerProfileCardProps {
  name: string
  age: number
  position: string
  team: string
  measurementDate: string
}

const positionColors: Record<string, { bg: string; text: string }> = {
  FW: { bg: "bg-red-500", text: "text-white" },
  MF: { bg: "bg-emerald-500", text: "text-white" },
  DF: { bg: "bg-blue-500", text: "text-white" },
  GK: { bg: "bg-amber-500", text: "text-white" },
}

export function PlayerProfileCard({
  name,
  age,
  position,
  team,
  measurementDate,
}: PlayerProfileCardProps) {
  const positionStyle = positionColors[position] || { bg: "bg-slate-500", text: "text-white" }

  return (
    <Card className="relative overflow-hidden bg-white p-5">
      {/* 포지션 배지 - 우측 상단 */}
      <div className="absolute right-4 top-4">
        <span
          className={`${positionStyle.bg} ${positionStyle.text} rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm`}
        >
          {position}
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* 프로필 아이콘 */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100">
          <User className="h-8 w-8 text-slate-400" />
        </div>

        {/* 선수 정보 */}
        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">{name}</h1>
            <span className="text-lg font-semibold text-slate-500">{age}세</span>
          </div>
          <p className="text-base font-semibold text-slate-600">{team}</p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>측정일: {measurementDate}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
