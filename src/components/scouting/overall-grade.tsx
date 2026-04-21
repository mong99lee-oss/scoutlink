import { Card } from "@/components/ui/card"
import { Trophy } from "lucide-react"

type Grade = "엘리트" | "우수" | "평균이상" | "평균이하" | "기초"

interface OverallGradeProps {
  grade: Grade
  score: number
}

const gradeConfig: Record<Grade, { color: string; bgColor: string; borderColor: string; icon: string }> = {
  엘리트: {
    color: "text-amber-600",
    bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
    borderColor: "border-amber-300",
    icon: "🏆",
  },
  우수: {
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    borderColor: "border-emerald-300",
    icon: "⭐",
  },
  평균이상: {
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    borderColor: "border-blue-300",
    icon: "👍",
  },
  평균이하: {
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
    borderColor: "border-orange-300",
    icon: "📈",
  },
  기초: {
    color: "text-red-600",
    bgColor: "bg-gradient-to-br from-red-50 to-red-100",
    borderColor: "border-red-300",
    icon: "💪",
  },
}

export function OverallGrade({ grade, score }: OverallGradeProps) {
  const config = gradeConfig[grade]

  return (
    <Card className={`${config.bgColor} border-2 ${config.borderColor} p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className={`h-6 w-6 ${config.color}`} />
          <span className="text-base font-bold text-slate-700">종합 등급</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <span className={`text-3xl font-extrabold ${config.color}`}>{grade}</span>
          <span className={`text-2xl font-bold ${config.color}`}>{score}점</span>
        </div>
      </div>
    </Card>
  )
}
