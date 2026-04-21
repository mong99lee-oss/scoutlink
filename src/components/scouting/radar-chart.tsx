"use client"

import { Card } from "@/components/ui/card"
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

type Grade = "엘리트" | "우수" | "평균이상" | "평균이하" | "기초"

interface Stat {
  name: string
  value: string
  score: number
  grade: Grade
}

interface RadarChartProps {
  stats: Stat[]
}

export function RadarChart({ stats }: RadarChartProps) {
  const chartData = stats.map((stat) => ({
    subject: stat.name,
    score: stat.score,
    fullMark: 100,
  }))

  return (
    <Card className="bg-white p-4">
      <h2 className="mb-2 text-center text-lg font-bold text-slate-800">능력치 분석</h2>
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart data={chartData} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#334155", fontSize: 11, fontWeight: 600 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number) => [`${value}점`, "점수"]}
            />
            <Radar
              name="능력치"
              dataKey="score"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "#10b981",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
                fill: "#059669",
                strokeWidth: 0,
              }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
