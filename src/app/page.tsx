"use client"

import { useState } from "react"
import { User, Ruler, Zap, Target, Timer, Activity } from "lucide-react"

interface PlayerData {
  name: string
  age: string
  team: string
  position: string
}

interface MeasurementData {
  sprint10m: string
  sprint30m: string
  standingJump: string
  sideStep: string
  pushUp: string
  sitAndReach: string
  powerDribble: string
  passingAccuracy: string
  blazePodReaction: string
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
    key: "standingJump",
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
    key: "powerDribble",
    label: "파워드리블",
    unit: "초",
    icon: Timer,
    range: "2.0 ~ 6.0",
    placeholder: "11.5",
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
]

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
    standingJump: "",
    sideStep: "",
    pushUp: "",
    sitAndReach: "",
    powerDribble: "",
    passingAccuracy: "",
    blazePodReaction: "",
  })

  const handlePlayerChange = (field: keyof PlayerData, value: string) => {
    setPlayerData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMeasurementChange = (field: keyof MeasurementData, value: string) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Player Data:", playerData)
    console.log("Measurements:", measurements)
    alert("리포트가 생성되었습니다!")
  }

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
                  <option value="GK">GK (골키퍼)</option>
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
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
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
            리포트 생성
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 Youth Football Scouting System
        </p>
      </div>
    </div>
  )
}
