"use client"

import { useMemo, useState } from "react"
import { User, Ruler, Zap, Target, Timer, Activity, Check, Link2 } from "lucide-react"
import { PlayerProfileCard } from "@/components/scouting/player-profile-card"
import { OverallGrade } from "@/components/scouting/overall-grade"
import { RadarChart } from "@/components/scouting/radar-chart"
import { StatCardGrid } from "@/components/scouting/stat-card-grid"
import { CommentSection } from "@/components/scouting/comment-section"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buildReport, getBenchmarks, getGrade, type MetricKey, type PlayerMetrics } from "@/lib/report"
import { createPlayer } from "@/lib/supabase"

interface PlayerData {
  name: string
  age: string
  team: string
  position: string
}

interface MeasurementData {
  sprint10m: string
  sprint30m: string
  standingLongJump: string
  sideStep: string
  pushUp: string
  sitAndReach: string
  powerDribble10m: string
  passingAccuracy: string
  blazePodReaction: string
}

type Grade = "엘리트" | "우수" | "평균이상" | "평균이하" | "기초"

type MetricRange = {
  min: number
  max: number
}

const metricRanges: Record<MetricKey, MetricRange> = {
  sprint10m: { min: 1.5, max: 3.0 },
  sprint30m: { min: 3.5, max: 6.5 },
  standingLongJump: { min: 80, max: 280 },
  sideStep: { min: 10, max: 60 },
  pushUp: { min: 5, max: 80 },
  sitAndReach: { min: -20, max: 30 },
  powerDribble10m: { min: 2.0, max: 6.0 },
  passingAccuracy: { min: 0, max: 45 },
  blazePodReaction: { min: 200, max: 800 },
}

const measurementFields = [
  {
    key: "sprint10m",
    label: "10m 스프린트",
    unit: "초",
    icon: Zap,
    range: "1.5 ~ 3.0",
    placeholder: "2.1",
  },
  {
    key: "sprint30m",
    label: "30m 스프린트",
    unit: "초",
    icon: Zap,
    range: "3.5 ~ 6.5",
    placeholder: "5.2",
  },
  {
    key: "standingLongJump",
    label: "제자리멀리뛰기",
    unit: "cm",
    icon: Ruler,
    range: "80 ~ 280",
    placeholder: "185",
  },
  {
    key: "sideStep",
    label: "사이드스텝",
    unit: "회",
    icon: Activity,
    range: "10 ~ 60",
    placeholder: "52",
  },
  {
    key: "pushUp",
    label: "팔굽혀펴기",
    unit: "회",
    icon: Activity,
    range: "5 ~ 80",
    placeholder: "30",
  },
  {
    key: "sitAndReach",
    label: "장좌체전굴",
    unit: "cm",
    icon: Ruler,
    range: "-20 ~ 30",
    placeholder: "12",
  },
  {
    key: "powerDribble10m",
    label: "파워드리블",
    unit: "초",
    icon: Timer,
    range: "2.0 ~ 6.0",
    placeholder: "3.2",
  },
  {
    key: "passingAccuracy",
    label: "패싱정확도",
    unit: "개/45초",
    icon: Target,
    range: "0 ~ 45",
    placeholder: "12",
  },
  {
    key: "blazePodReaction",
    label: "BlazePod반응속도",
    unit: "ms",
    icon: Zap,
    range: "200 ~ 800",
    placeholder: "450",
  },
] as const

const getMetricErrorMessage = (key: MetricKey, value: string) => {
  if (!value.trim()) return ""
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return "숫자로 입력해 주세요."
  const range = metricRanges[key]
  if (parsed < range.min || parsed > range.max) {
    return `${range.min}~${range.max} 범위로 입력해 주세요.`
  }
  return ""
}

export default function ScoutingForm() {
  const [playerData, setPlayerData] = useState<PlayerData>({
    name: "",
    age: "",
    team: "",
    position: "",
  })

  const [measurements, setMeasurements] = useState<MeasurementData>({
    sprint10m: "",
    sprint30m: "",
    standingLongJump: "",
    sideStep: "",
    pushUp: "",
    sitAndReach: "",
    powerDribble10m: "",
    passingAccuracy: "",
    blazePodReaction: "",
  })
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
  })
  const [submitError, setSubmitError] = useState("")
  const [reportData, setReportData] = useState<{
    playerName: string
    age: number
    position: "FW" | "MF" | "DF"
    team: string
    measurementDate: string
    report: ReturnType<typeof buildReport>
    metrics: PlayerMetrics
    benchmarks: PlayerMetrics
    savedId: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePlayerChange = (field: keyof PlayerData, value: string) => {
    setPlayerData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMeasurementChange = (field: keyof MeasurementData, value: string) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }))
    const metricKey = field as MetricKey
    setMetricErrors((prev) => ({ ...prev, [metricKey]: getMetricErrorMessage(metricKey, value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setSubmitError("")
    setCopied(false)

    if (!playerData.name.trim() || !playerData.age.trim() || !playerData.team.trim() || !playerData.position) {
      setSubmitError("선수 정보를 모두 입력해 주세요.")
      return
    }

    const age = Number(playerData.age)
    if (!Number.isFinite(age) || age < 10 || age > 18) {
      setSubmitError("나이는 10~18 사이로 입력해 주세요.")
      return
    }

    if (playerData.position !== "FW" && playerData.position !== "MF" && playerData.position !== "DF") {
      setSubmitError("포지션은 FW / MF / DF 중에서 선택해 주세요.")
      return
    }

    const nextErrors = { ...metricErrors }
    const parsedMetrics = {} as PlayerMetrics
    for (const key of Object.keys(metricRanges) as MetricKey[]) {
      const value = measurements[key]
      const error = getMetricErrorMessage(key, value)
      nextErrors[key] = error
      if (error) continue
      if (!value.trim()) {
        nextErrors[key] = "값을 입력해 주세요."
        continue
      }
      parsedMetrics[key] = Number(value)
    }
    setMetricErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      setSubmitError("입력값을 확인해 주세요.")
      return
    }

    setIsSubmitting(true)
    try {
      const report = buildReport(parsedMetrics, age, playerData.position)
      const savedId = crypto.randomUUID()
      await createPlayer({
        id: savedId,
        name: playerData.name.trim(),
        age,
        position: playerData.position,
        team: playerData.team.trim(),
        note: null,
        metrics: parsedMetrics,
        report,
      })
      const benchmarks = getBenchmarks(playerData.position, age)
      setReportData({
        playerName: playerData.name.trim(),
        age,
        position: playerData.position,
        team: playerData.team.trim(),
        measurementDate: new Date().toLocaleDateString("ko-KR").replace(/\.\s?/g, "."),
        report,
        metrics: parsedMetrics,
        benchmarks,
        savedId,
      })
      alert("리포트 생성완료!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      setSubmitError(`저장 실패: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const shareUrl = useMemo(() => {
    if (!reportData || typeof window === "undefined") return ""
    return `${window.location.origin}/share/${reportData.savedId}`
  }, [reportData])

  const handleCopyShare = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setSubmitError("공유 링크 복사에 실패했습니다.")
    }
  }

  const stats = useMemo(() => {
    if (!reportData) return []
    const rows: Array<{ key: MetricKey; label: string; unit: string }> = [
      { key: "sprint10m", label: "10m스프린트", unit: "초" },
      { key: "sprint30m", label: "30m스프린트", unit: "초" },
      { key: "standingLongJump", label: "제자리멀리뛰기", unit: "cm" },
      { key: "sideStep", label: "사이드스텝", unit: "회" },
      { key: "pushUp", label: "팔굽혀펴기", unit: "회" },
      { key: "sitAndReach", label: "장좌체전굴", unit: "cm" },
      { key: "powerDribble10m", label: "파워드리블", unit: "초" },
      { key: "passingAccuracy", label: "패싱정확도", unit: "개/45초" },
      { key: "blazePodReaction", label: "BlazePod반응속도", unit: "ms" },
    ]
    return rows.map((row) => ({
      name: row.label,
      value: `${reportData.metrics[row.key]}${row.unit}`,
      score: reportData.report.scores[row.key],
      grade: reportData.report.grades[row.key] as Grade,
      benchmark: `${reportData.benchmarks[row.key]}${row.unit}`,
    }))
  }, [reportData])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">유소년 스카우팅</h1>
          <p className="text-gray-500 mt-1">선수 측정 데이터 입력</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Player Information */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">선수 정보</h2>
                <p className="text-sm text-gray-500">기본 정보를 입력해주세요</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={playerData.name}
                  onChange={(e) => handlePlayerChange("name", e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  나이
                </label>
                <input
                  type="number"
                  value={playerData.age}
                  onChange={(e) => handlePlayerChange("age", e.target.value)}
                  placeholder="14"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소속팀
                </label>
                <input
                  type="text"
                  value={playerData.team}
                  onChange={(e) => handlePlayerChange("team", e.target.value)}
                  placeholder="서울 FC U-15"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  포지션
                </label>
                <select
                  value={playerData.position}
                  onChange={(e) => handlePlayerChange("position", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-white"
                >
                  <option value="">선택하세요</option>
                  <option value="FW">FW (공격수)</option>
                  <option value="MF">MF (미드필더)</option>
                  <option value="DF">DF (수비수)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Measurements */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Ruler className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">측정값 입력</h2>
                <p className="text-sm text-gray-500">9개 항목의 측정 결과를 입력해주세요</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {measurementFields.map((field) => {
                const Icon = field.icon
                return (
                  <div
                    key={field.key}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={measurements[field.key as keyof MeasurementData]}
                        onChange={(e) =>
                          handleMeasurementChange(
                            field.key as keyof MeasurementData,
                            e.target.value
                          )
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 pr-14 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                        {field.unit}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      권장 범위: <span className="text-emerald-600 font-medium">{field.range}</span>
                    </p>
                    {metricErrors[field.key as MetricKey] ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {metricErrors[field.key as MetricKey]}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isSubmitting ? "생성 중..." : "리포트 생성"}
          </button>
        </form>

        {submitError ? (
          <Card className="mt-4 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {submitError}
          </Card>
        ) : null}

        {reportData ? (
          <div className="mt-6 space-y-4">
            <PlayerProfileCard
              name={reportData.playerName}
              age={reportData.age}
              position={reportData.position}
              team={reportData.team}
              measurementDate={reportData.measurementDate}
            />
            <OverallGrade grade={getGrade(reportData.report.overallScore) as Grade} score={reportData.report.overallScore} />
            <RadarChart stats={stats} />
            <StatCardGrid stats={stats} />
            <CommentSection comment={reportData.report.overallEvaluation} />

            <Button
              onClick={handleCopyShare}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5" />
                  링크가 복사되었습니다!
                </>
              ) : (
                <>
                  <Link2 className="h-5 w-5" />
                  공유 링크 복사
                </>
              )}
            </Button>
          </div>
        ) : null}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 ScoutLink
        </p>
      </div>
    </div>
  )
}
