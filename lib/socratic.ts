/** Shared shape of a Socratic session, used by the page and the API route */

export const MOVES = {
  predict: { label: "Predict", hint: "Commit to an outcome before you see it" },
  break: { label: "Break it", hint: "A case designed to break your own idea" },
  flaw: { label: "Spot the flaw", hint: "One mistake is hidden in an explanation" },
  teach: { label: "Teach it", hint: "Explain it to a confused beginner" },
  transfer: { label: "Transfer", hint: "Use the same idea somewhere unfamiliar" },
  probe: { label: "Probe", hint: "Follow one claim down to its cause" },
} as const;
export type Move = keyof typeof MOVES;

export const DIMENSIONS = {
  mechanism: "How it works",
  causality: "Why it works",
  boundaries: "Where it fails",
  transfer: "Using it elsewhere",
} as const;
export type Dimension = keyof typeof DIMENSIONS;

export type Verdict = "strong" | "partial" | "weak" | "off_topic";
export type Confidence = 1 | 2 | 3;
export const CONFIDENCE_LABEL: Record<Confidence, string> = { 1: "Guessing", 2: "Fairly sure", 3: "Certain" };

export interface Claim {
  id: string;
  text: string;
  status: "solid" | "shaky" | "wrong";
  note: string;
}

export interface SocraticState {
  claims: Claim[];
  mastery: Record<Dimension, number>;
  /** Answers that engaged with the topic */
  turns: number;
  /** One entry per answer: how sure the learner was, and how right (0 to 1) */
  calibration: Array<{ confidence: Confidence; score: number }>;
  move: Move | null;
  /** The mistake planted by "Spot the flaw", until it is graded */
  plantedFlaw: string;
}

export const MASTERY_TARGET = 70;
export const MIN_TURNS = 3;

export const emptyState = (): SocraticState => ({
  claims: [],
  mastery: { mechanism: 0, causality: 0, boundaries: 0, transfer: 0 },
  turns: 0,
  calibration: [],
  move: null,
  plantedFlaw: "",
});

export function isMastered(state: SocraticState): boolean {
  return (
    state.turns >= MIN_TURNS &&
    Object.values(state.mastery).every((v) => v >= MASTERY_TARGET) &&
    state.claims.every((c) => c.status !== "wrong")
  );
}

/** Positive when the learner is surer than they are right */
export function calibrationGap(state: SocraticState): number | null {
  if (state.calibration.length < 2) return null;
  const sum = state.calibration.reduce((acc, c) => acc + ((c.confidence - 1) / 2 - c.score), 0);
  return sum / state.calibration.length;
}
