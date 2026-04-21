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
  passingAccuracy: "패싱정확도 (개/45초)",
  blazePodReaction: "BlazePod반응속도 (ms)",
};

type MetricRule = {
  lowerIsBetter: boolean;
};

type AgeBand = "u10" | "u11" | "u12" | "u13" | "u14" | "u15" | "u16" | "u17" | "u18";

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

const benchmarkAnchors: Record<PositionType, { u15: PlayerMetrics; u18: PlayerMetrics }> = {
  FW: {
    u15: {
      sprint10m: 1.95,
      sprint30m: 4.75,
      standingLongJump: 195,
      sideStep: 38,
      pushUp: 28,
      sitAndReach: 13,
      powerDribble10m: 2.6,
      passingAccuracy: 28,
      blazePodReaction: 430,
    },
    u18: {
      sprint10m: 1.85,
      sprint30m: 4.45,
      standingLongJump: 220,
      sideStep: 42,
      pushUp: 36,
      sitAndReach: 16,
      powerDribble10m: 2.35,
      passingAccuracy: 31,
      blazePodReaction: 390,
    },
  },
  MF: {
    u15: {
      sprint10m: 2.0,
      sprint30m: 4.85,
      standingLongJump: 190,
      sideStep: 39,
      pushUp: 30,
      sitAndReach: 14,
      powerDribble10m: 2.65,
      passingAccuracy: 30,
      blazePodReaction: 425,
    },
    u18: {
      sprint10m: 1.9,
      sprint30m: 4.55,
      standingLongJump: 215,
      sideStep: 43,
      pushUp: 38,
      sitAndReach: 17,
      powerDribble10m: 2.4,
      passingAccuracy: 34,
      blazePodReaction: 385,
    },
  },
  DF: {
    u15: {
      sprint10m: 2.02,
      sprint30m: 4.9,
      standingLongJump: 198,
      sideStep: 37,
      pushUp: 32,
      sitAndReach: 12,
      powerDribble10m: 2.75,
      passingAccuracy: 26,
      blazePodReaction: 440,
    },
    u18: {
      sprint10m: 1.93,
      sprint30m: 4.65,
      standingLongJump: 223,
      sideStep: 41,
      pushUp: 40,
      sitAndReach: 15,
      powerDribble10m: 2.5,
      passingAccuracy: 29,
      blazePodReaction: 400,
    },
  },
};

const ageBands: AgeBand[] = ["u10", "u11", "u12", "u13", "u14", "u15", "u16", "u17", "u18"];

const buildAgeBenchmarks = (u15: PlayerMetrics, u18: PlayerMetrics): Record<AgeBand, PlayerMetrics> => {
  const generated = {} as Record<AgeBand, PlayerMetrics>;

  ageBands.forEach((band) => {
    const age = Number(band.slice(1));
    const metrics = {} as PlayerMetrics;

    (Object.keys(metricLabels) as MetricKey[]).forEach((key) => {
      const yearlyDelta = (u18[key] - u15[key]) / 3;
      const projected = u15[key] + yearlyDelta * (age - 15);
      metrics[key] = Number(projected.toFixed(2));
    });

    generated[band] = metrics;
  });

  return generated;
};

const benchmark: Benchmark = {
  FW: buildAgeBenchmarks(benchmarkAnchors.FW.u15, benchmarkAnchors.FW.u18),
  MF: buildAgeBenchmarks(benchmarkAnchors.MF.u15, benchmarkAnchors.MF.u18),
  DF: buildAgeBenchmarks(benchmarkAnchors.DF.u15, benchmarkAnchors.DF.u18),
};

const getAgeBand = (age: number): AgeBand => {
  const clampedAge = Math.max(10, Math.min(18, Math.round(age)));
  return `u${clampedAge}` as AgeBand;
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

const metricName: Record<MetricKey, string> = {
  sprint10m: "10m 스프린트",
  sprint30m: "30m 스프린트",
  standingLongJump: "제자리멀리뛰기",
  sideStep: "사이드스텝",
  pushUp: "팔굽혀펴기",
  sitAndReach: "장좌체전굴",
  powerDribble10m: "파워드리블",
  passingAccuracy: "패싱정확도",
  blazePodReaction: "BlazePod반응속도",
};

const trainingTip: Record<MetricKey, string> = {
  sprint10m: "짧은 거리 스타트 드릴과 하체 폭발력 훈련",
  sprint30m: "가속-유지 구간 반복 훈련과 주기적 스프린트 인터벌",
  standingLongJump: "플라이오메트릭 점프와 코어-둔근 강화",
  sideStep: "민첩성 사다리와 방향 전환 스텝 훈련",
  pushUp: "상체 근지구력 서킷(푸시업/플랭크/메디신볼)",
  sitAndReach: "햄스트링-고관절 중심의 동적/정적 유연성 루틴",
  powerDribble10m: "속도 유지 드리블과 양발 터치 빈도 향상 훈련",
  passingAccuracy: "짧은-중거리 원터치 패스와 약발 패스 정확도 훈련",
  blazePodReaction: "시각 자극 기반 반응 선택 훈련과 인지 전환 드릴",
};

const buildDetailedEvaluation = (
  scores: Record<MetricKey, number>,
  overall: number
) => {
  const entries = (Object.keys(scores) as MetricKey[]).map((key) => ({
    key,
    score: scores[key],
  }));
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const top2 = sorted.slice(0, 2);
  const bottom2 = sorted.slice(-2).sort((a, b) => a.score - b.score);

  const strongText = top2
    .map((item) => `${metricName[item.key]}(${item.score}점)`)
    .join(", ");
  const weakText = bottom2
    .map((item) => `${metricName[item.key]}(${item.score}점)`)
    .join(", ");
  const recommendText = Array.from(new Set(bottom2.map((item) => trainingTip[item.key]))).join(
    " / "
  );

  return `${getOverallEvaluation(overall)} 강점은 ${strongText}로 확인되어 경기 전개에서 경쟁력이 높습니다. 반면 보완이 필요한 항목은 ${weakText}입니다. 다음 훈련 주기에는 ${recommendText}을 중심으로 4~6주 프로그램을 운영하면 종합 점수 향상을 기대할 수 있습니다.`;
};

export const getBenchmarks = (
  position: string,
  age: number
): PlayerMetrics => {
  const ageBand = getAgeBand(age);
  const normalizedPosition: PositionType =
    position === "FW" || position === "DF" || position === "MF" ? position : "MF";
  return benchmark[normalizedPosition][ageBand];
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
    overallEvaluation: buildDetailedEvaluation(scored, overallScore),
  };
};
