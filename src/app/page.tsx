"use client"

import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { buildReport, getBenchmarks, getGrade, type MetricKey, type PlayerMetrics, type PositionType } from "@/lib/report"
import { createPlayer } from "@/lib/supabase"
import { PlayerProfileCard } from "@/components/scouting/player-profile-card"
import { OverallGrade } from "@/components/scouting/overall-grade"
import { RadarChart } from "@/components/scouting/radar-chart"
import { StatCardGrid } from "@/components/scouting/stat-card-grid"
import { CommentSection } from "@/components/scouting/comment-section"
import { Button } from "@/components/ui/button"
import { Check, Link2 } from "lucide-react"

type StatView = {
  name: string
  value: string
  score: number
  grade: "엘리트" | "우수" | "평균이상" | "평균이하" | "기초"
  benchmark: string
}

type GeneratedReport = {
  id: string
  name: string
  age: number
  position: PositionType
  team: string
  measurementDate: string
  overallGrade: "엘리트" | "우수" | "평균이상" | "평균이하" | "기초"
  overallScore: number
  comment: string
  stats: StatView[]
}

type MetricRange = {
  min: number
  max: number
}

const metricRows: Array<{
  key: MetricKey
  label: string
  unit: string
}> = [
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

export default function ScoutingReportPage() {
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [team, setTeam] = useState("")
  const [position, setPosition] = useState<PositionType>("MF")
  const [metricInputs, setMetricInputs] = useState<Record<MetricKey, string>>({
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
  const [statusMessage, setStatusMessage] = useState("")
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSavingPdf, setIsSavingPdf] = useState(false)
  const [metricErrors, setMetricErrors] = useState<Partial<Record<MetricKey, string>>>({})
  const reportRef = useRef<HTMLDivElement>(null)

  const getMetricErrorMessage = (key: MetricKey, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return "값을 입력해 주세요."

    const numericValue = Number(trimmed)
    if (!Number.isFinite(numericValue)) {
      return "숫자 형식으로 입력해 주세요."
    }

    const range = metricRanges[key]
    if (numericValue < range.min || numericValue > range.max) {
      return `${range.min}~${range.max} 범위로 입력해 주세요.`
    }

    return ""
  }

  const handleMetricInput = (key: MetricKey, value: string) => {
    const error = getMetricErrorMessage(key, value)
    setMetricInputs((prev) => ({
      ...prev,
      [key]: value,
    }))
    setMetricErrors((prev) => ({
      ...prev,
      [key]: error,
    }))
  }

  const handleGenerateAndSave = async () => {
    setStatusMessage("")

    const parsedAge = Number(age)
    if (!name.trim() || !team.trim() || !parsedAge) {
      setStatusMessage("선수 정보(이름, 나이, 소속팀, 포지션)를 모두 입력해 주세요.")
      return
    }

    const parsedMetrics = {} as PlayerMetrics
    const nextMetricErrors: Partial<Record<MetricKey, string>> = {}
    for (const row of metricRows) {
      const inputValue = metricInputs[row.key]
      const error = getMetricErrorMessage(row.key, inputValue)
      if (error) {
        nextMetricErrors[row.key] = error
        setMetricErrors(nextMetricErrors)
        setStatusMessage(`${row.label}: ${error}`)
        return
      }
      const value = Number(inputValue)
      parsedMetrics[row.key] = value
    }
    setMetricErrors({})

    setIsSubmitting(true)
    try {
      const id = crypto.randomUUID()
      const report = buildReport(parsedMetrics, parsedAge, position)
      const benchmarks = getBenchmarks(position, parsedAge)
      const measurementDate = new Date().toLocaleDateString("ko-KR").replace(/\.\s?/g, ".")
      const overallGrade = getGrade(report.overallScore)

      const stats: StatView[] = metricRows.map((row) => ({
        name: row.label,
        value: `${parsedMetrics[row.key]}${row.unit}`,
        score: report.scores[row.key],
        grade: report.grades[row.key] as StatView["grade"],
        benchmark: `${benchmarks[row.key]}${row.unit}`,
      }))

      const nextReport: GeneratedReport = {
        id,
        name: name.trim(),
        age: parsedAge,
        position,
        team: team.trim(),
        measurementDate,
        overallGrade,
        overallScore: report.overallScore,
        comment: report.overallEvaluation,
        stats,
      }

      await createPlayer({
        id,
        name: nextReport.name,
        age: nextReport.age,
        position: nextReport.position,
        team: nextReport.team,
        note: null,
        metrics: parsedMetrics,
        report,
      })

      const nextShareUrl = `${window.location.origin}/share/${id}`
      setShareUrl(nextShareUrl)
      setGeneratedReport(nextReport)
      setStatusMessage("리포트 생성 및 Supabase 저장 완료! 공유 링크를 복사해 전달하세요.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다."
      setStatusMessage(`저장 실패: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "")
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleSavePdf = async () => {
    if (!reportRef.current || isSavingPdf || !generatedReport) return

    setIsSavingPdf(true)
    try {
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready
      }

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`scouting-report-${generatedReport.name}.pdf`)
    } catch (err) {
      console.error("Failed to save PDF:", err)
    } finally {
      setIsSavingPdf(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">1) 선수 정보 입력</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="나이"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="소속팀"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={position}
              onChange={(e) => setPosition(e.target.value as PositionType)}
            >
              <option value="FW">FW</option>
              <option value="MF">MF</option>
              <option value="DF">DF</option>
            </select>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">2) 9개 측정값 입력</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {metricRows.map((row) => (
              <div key={row.key} className="space-y-1">
                <input
                  className={`rounded-md border px-3 py-2 text-sm ${
                    metricErrors[row.key] ? "border-rose-500" : ""
                  }`}
                  placeholder={`${row.label} (${row.unit})`}
                  type="number"
                  step="any"
                  min={metricRanges[row.key].min}
                  max={metricRanges[row.key].max}
                  value={metricInputs[row.key]}
                  onChange={(e) => handleMetricInput(row.key, e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  권장 범위: {metricRanges[row.key].min}~{metricRanges[row.key].max} {row.unit}
                </p>
                {metricErrors[row.key] ? (
                  <p className="text-xs font-medium text-rose-600">{metricErrors[row.key]}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleGenerateAndSave}
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {isSubmitting ? "저장 중..." : "3~4) 리포트 생성 + Supabase 저장"}
            </Button>
            <Button
              onClick={handleShare}
              disabled={!generatedReport}
              className={`flex-1 gap-2 transition-all duration-200 ${
                copied
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-slate-800 hover:bg-slate-900"
              }`}
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
                  5) 공유 링크 복사
                </>
              )}
            </Button>
          </div>
          {statusMessage ? (
            <p className="mt-3 text-sm font-medium text-slate-600">{statusMessage}</p>
          ) : null}
          {shareUrl ? (
            <p className="mt-2 break-all text-xs text-slate-500">{shareUrl}</p>
          ) : null}
        </section>

        {generatedReport ? (
          <div ref={reportRef} className="space-y-4">
            <PlayerProfileCard
              name={generatedReport.name}
              age={generatedReport.age}
              position={generatedReport.position}
              team={generatedReport.team}
              measurementDate={generatedReport.measurementDate}
            />
            <OverallGrade grade={generatedReport.overallGrade} score={generatedReport.overallScore} />
            <RadarChart stats={generatedReport.stats} />
            <StatCardGrid stats={generatedReport.stats} />
            <CommentSection comment={generatedReport.comment} />
          </div>
        ) : null}

        <div className="flex flex-col gap-2 pb-4 sm:flex-row">
          <Button
            onClick={handleSavePdf}
            disabled={isSavingPdf || !generatedReport}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {isSavingPdf ? "PDF 저장 중..." : "리포트 PDF 저장"}
          </Button>
        </div>
      </div>
    </main>
  )
}
