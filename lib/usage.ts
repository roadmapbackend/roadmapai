/** Tokens one AI call really used, as reported by the model */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export const NO_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0 };

export const totalTokens = (u: TokenUsage) => u.promptTokens + u.completionTokens;

export const addUsage = (a: TokenUsage, b: TokenUsage): TokenUsage => ({
  promptTokens: a.promptTokens + b.promptTokens,
  completionTokens: a.completionTokens + b.completionTokens,
});

const count = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : 0);

/** Reads the usage block of a Gemini response. Thinking is billed as output. */
export function readGeminiUsage(data: unknown): TokenUsage {
  const meta = (data as { usageMetadata?: Record<string, unknown> } | null)?.usageMetadata ?? {};
  return {
    promptTokens: count(meta.promptTokenCount),
    completionTokens: count(meta.candidatesTokenCount) + count(meta.thoughtsTokenCount),
  };
}

/** Reads the usage our own API routes send back */
export function parseUsage(value: unknown): TokenUsage {
  const u = (value ?? {}) as Record<string, unknown>;
  return { promptTokens: count(u.promptTokens), completionTokens: count(u.completionTokens) };
}
