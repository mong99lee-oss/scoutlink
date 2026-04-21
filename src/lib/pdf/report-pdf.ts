import jsPDF from "jspdf"
import { NOTO_SANS_KR_BASE64 } from "./noto-sans-kr-base64"

type Grade = "엘리트" | "우수" | "평균이상" | "평균이하" | "기초"

type StatView = {
  name: string
  value: string
  score: number
  grade: Grade
  benchmark?: string
}

export type ReportPdfData = {
  playerName: string
  age: number
  position: string
  team: string
  measurementDate: string
  overallGrade: Grade
  overallScore: number
  comment: string
  stats: StatView[]
}

const FONT_NAME = "NotoSansKR"
const FONT_FILE_NAME = "NotoSansKR-Regular.ttf"

let fontRegistered = false

const ensureKoreanFont = (doc: jsPDF) => {
  if (!fontRegistered) {
    doc.addFileToVFS(FONT_FILE_NAME, NOTO_SANS_KR_BASE64)
    doc.addFont(FONT_FILE_NAME, FONT_NAME, "normal")
    fontRegistered = true
  }
  doc.setFont(FONT_NAME, "normal")
}

const line = (doc: jsPDF, text: string, x: number, y: number) => {
  doc.text(text, x, y)
  return y
}

const asText = (value: unknown, fallback = "-") => {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  return text.length > 0 ? text : fallback
}

export const saveScoutingReportPdf = (data: ReportPdfData, fileName: string) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
  ensureKoreanFont(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - margin) return
    doc.addPage()
    ensureKoreanFont(doc)
    y = margin
  }

  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  y = line(doc, "ScoutLink 선수 스카우팅 리포트", margin, y) + 4

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(11)
  doc.setTextColor(51, 65, 85)
  y = line(doc, `선수명: ${asText(data.playerName)}`, margin, y) + 5
  y = line(doc, `나이 / 포지션: ${asText(data.age)}세 / ${asText(data.position)}`, margin, y) + 5
  y = line(doc, `소속팀: ${asText(data.team)}`, margin, y) + 5
  y = line(doc, `측정일: ${asText(data.measurementDate)}`, margin, y) + 7

  ensureSpace(16)
  doc.setFillColor(240, 253, 244)
  doc.setDrawColor(167, 243, 208)
  doc.roundedRect(margin, y - 4, contentWidth, 14, 2, 2, "FD")
  doc.setFontSize(13)
  doc.setTextColor(6, 95, 70)
  y = line(doc, `종합 등급: ${data.overallGrade} (${data.overallScore}점)`, margin + 4, y + 5) + 4

  y += 3
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  y = line(doc, "측정 항목별 결과", margin, y) + 5

  data.stats.forEach((stat) => {
    const safeName = asText(stat.name)
    const safeValue = asText(stat.value)
    const safeBenchmark = asText(stat.benchmark)
    const nameLines = doc.splitTextToSize(safeName, 36)
    const valueLines = doc.splitTextToSize(safeValue, 72)
    const benchmarkLines = doc.splitTextToSize(`기준치: ${safeBenchmark}`, 72)
    const textStackHeight = 6 + valueLines.length * 5 + benchmarkLines.length * 4
    const cardHeight = Math.max(22, textStackHeight + 6)

    ensureSpace(cardHeight + 3)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(margin, y - 4, contentWidth, cardHeight, 2, 2, "FD")

    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(nameLines, margin + 3, y + 1)

    doc.setFontSize(13)
    doc.setTextColor(15, 23, 42)
    doc.text(valueLines, margin + 42, y + 1)

    doc.setFontSize(9.5)
    doc.setTextColor(100, 116, 139)
    doc.text(benchmarkLines, margin + 42, y + 8 + valueLines.length * 5)

    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    doc.text(`${asText(stat.grade)} / ${asText(stat.score)}점`, pageWidth - margin - 3, y + 1, { align: "right" })

    y += cardHeight + 3
  })

  ensureSpace(22)
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  y = line(doc, "종합 코멘트", margin, y) + 5

  const commentLines = doc.splitTextToSize(asText(data.comment), contentWidth - 6) as string[]
  let commentIndex = 0

  while (commentIndex < commentLines.length) {
    ensureSpace(14)
    const maxBoxHeight = pageHeight - margin - (y - 4)
    const maxLines = Math.max(1, Math.floor((maxBoxHeight - 7) / 5))
    const linesForPage = commentLines.slice(commentIndex, commentIndex + maxLines)
    const commentHeight = Math.max(14, linesForPage.length * 5 + 7)
    ensureSpace(commentHeight)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(margin, y - 4, contentWidth, commentHeight, 2, 2, "FD")
    doc.setFontSize(10.5)
    doc.setTextColor(71, 85, 105)
    doc.text(linesForPage, margin + 3, y + 1)

    commentIndex += linesForPage.length
    y += commentHeight + 4

    if (commentIndex < commentLines.length) {
      ensureSpace(16)
      doc.setFontSize(12)
      doc.setTextColor(30, 41, 59)
      y = line(doc, "종합 코멘트 (계속)", margin, y) + 5
    }
  }

  doc.save(fileName)
}
