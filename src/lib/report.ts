export type MetricKey =
  | "sprint10m"
  | "sprint30m"
  | "standingLongJump"
  | "sideStep"
  | "pushUp"
  | "sitAndReach"
  | "powerDribble10m"
  | "passingAccuracy"
  | "blazePodReaction";

export type PlayerMetrics = Record<MetricKey, number>;
export type PositionType = "FW" | "MF" | "DF";

export type PlayerReport = {
  scores: Record<MetricKey, number>;
  grades: Record<MetricKey, string>;
  overallScore: number;
  overallEvaluation: string;
};

export const metricLabels: Record<MetricKey, string> = {
  sprint10m: "10m 스프린트 (초)",
  sprint30m: "30m 스프린트 (초)",
  standingLongJump: "제자리멀리뛰기 (cm)",
  sideStep: "사이드스텝 (회/20초)",
  pushUp: "팔굽혀펴기 (회/1분)",
  sitAndReach: "장좌체전굴 (cm)",
  powerDribble10m: "파워드리블 10m (초)",
  passingAccuracy: "패싱 정확도 (개/45초)",
  blazePodReaction: "BlazePod 반응속도 (ms)",
};

type MetricRule = {
  lowerIsBetter: boolean;
};

type AgeBand = "u15" | "u18" | "adult";

type Benchmark = Record<PositionType, Record<AgeBand, PlayerMetrics>>;

const metricRules: Record<MetricKey, MetricRule> = {
  sprint10m: { lowerIsBetter: true },
  sprint30m: { lowerIsBetter: true },
  standingLongJump: { lowerIsBetter: false },
  sideStep: { lowerIsBetter: false },
  pushUp: { lowerIsBetter: false },
  sitAndReach: { lowerIsBetter: false },
  powerDribble10m: { lowerIsBetter: true },
  passingAccuracy: { lowerIsBetter: false },
  blazePodReaction: { lowerIsBetter: true },
};

const benchmark: Benchmark = {
  FW: {
    u15: {
      sprint10m: 1.95,
      sprint30m: 4.75,
      standingLongJump: 195,
      sideStep: 38,
      pushUp: 28,
      sitAndReach: 8,
      powerDribble10m: 2.6,
      passingAccuracy: 22,
      blazePodReaction: 430,
    },
    u18: {
      sprint10m: 1.85,
      sprint30m: 4.45,
      standingLongJump: 220,
      sideStep: 42,
      pushUp: 36,
      sitAndReach: 11,
      powerDribble10m: 2.35,
      passingAccuracy: 26,
      blazePodReaction: 390,
    },
    adult: {
      sprint10m: 1.78,
      sprint30m: 4.3,
      standingLongJump: 235,
      sideStep: 44,
      pushUp: 42,
      sitAndReach: 13,
      powerDribble10m: 2.2,
      passingAccuracy: 29,
      blazePodReaction: 360,
    },
  },
  MF: {
    u15: {
      sprint10m: 2.0,
      sprint30m: 4.85,
      standingLongJump: 190,
      sideStep: 39,
      pushUp: 30,
      sitAndReach: 9,
      powerDribble10m: 2.65,
      passingAccuracy: 24,
      blazePodReaction: 425,
    },
    u18: {
      sprint10m: 1.9,
      sprint30m: 4.55,
      standingLongJump: 215,
      sideStep: 43,
      pushUp: 38,
      sitAndReach: 12,
      powerDribble10m: 2.4,
      passingAccuracy: 29,
      blazePodReaction: 385,
    },
    adult: {
      sprint10m: 1.83,
      sprint30m: 4.4,
      standingLongJump: 228,
      sideStep: 45,
      pushUp: 44,
      sitAndReach: 14,
      powerDribble10m: 2.25,
      passingAccuracy: 32,
      blazePodReaction: 355,
    },
  },
  DF: {
    u15: {
      sprint10m: 2.02,
      sprint30m: 4.9,
      standingLongJump: 198,
      sideStep: 37,
      pushUp: 32,
      sitAndReach: 7,
      powerDribble10m: 2.75,
      passingAccuracy: 21,
      blazePodReaction: 440,
    },
    u18: {
      sprint10m: 1.93,
      sprint30m: 4.65,
      standingLongJump: 223,
      sideStep: 41,
      pushUp: 40,
      sitAndReach: 10,
      powerDribble10m: 2.5,
      passingAccuracy: 25,
      blazePodReaction: 400,
    },
    adult: {
      sprint10m: 1.87,
      sprint30m: 4.48,
      standingLongJump: 236,
      sideStep: 43,
      pushUp: 48,
      sitAndReach: 12,
      powerDribble10m: 2.35,
      passingAccuracy: 28,
      blazePodReaction: 370,
    },
  },
};

const getAgeBand = (age: number): AgeBand => {
  if (age <= 15) return "u15";
  if (age <= 18) return "u18";
  return "adult";
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const normalizeToScore = (
  value: number,
  baseline: number,
  lowerIsBetter: boolean
) => {
  const safeValue = value <= 0 ? 0.0001 : value;
  const ratio = lowerIsBetter ? baseline / safeValue : safeValue / baseline;
  return clampScore(Math.round(ratio * 70));
};

export const getGrade = (score: number) => {
  if (score >= 90) return "엘리트";
  if (score >= 80) return "우수";
  if (score >= 70) return "평균이상";
  if (score >= 60) return "평균이하";
  return "기초";
};

export const getOverallEvaluation = (overall: number) => {
  if (overall >= 90) return "엘리트 등급입니다. 상위 레벨 경기에서도 경쟁력이 높습니다.";
  if (overall >= 80) return "우수 등급입니다. 전술 적합성이 좋으면 즉시 활용 가능합니다.";
  if (overall >= 70) return "평균이상 등급입니다. 보완 훈련 시 주전 자원으로 성장 가능합니다.";
  if (overall >= 60) return "평균이하 등급입니다. 체계적인 보강 훈련이 필요합니다.";
  return "기초 등급입니다. 기본 체력/기술의 우선 강화가 필요합니다.";
};

export const buildReport = (
  metrics: PlayerMetrics,
  age: number,
  position: PositionType
): PlayerReport => {
  const ageBand = getAgeBand(age);
  const base = benchmark[position][ageBand];
  const scored = {} as Record<MetricKey, number>;

  (Object.keys(metricLabels) as MetricKey[]).forEach((key) => {
    scored[key] = normalizeToScore(
      metrics[key],
      base[key],
      metricRules[key].lowerIsBetter
    );
  });

  const values = Object.values(scored);
  const overallScore = Math.round(
    values.reduce((sum, score) => sum + score, 0) / values.length
  );

  return {
    scores: scored,
    grades: {
      sprint10m: getGrade(scored.sprint10m),
      sprint30m: getGrade(scored.sprint30m),
      standingLongJump: getGrade(scored.standingLongJump),
      sideStep: getGrade(scored.sideStep),
      pushUp: getGrade(scored.pushUp),
      sitAndReach: getGrade(scored.sitAndReach),
      powerDribble10m: getGrade(scored.powerDribble10m),
      passingAccuracy: getGrade(scored.passingAccuracy),
      blazePodReaction: getGrade(scored.blazePodReaction),
    },
    overallScore,
    overallEvaluation: getOverallEvaluation(overallScore),
  };
};
