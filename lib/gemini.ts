import { readGeminiUsage, type TokenUsage } from "@/lib/usage";

const MODELS = Array.from(
  new Set([
    process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
  ])
);

/** Start the next model when the current one has not answered by now */
const HEDGE_MS = 4000;
/** Overloads are often brief, so go round the models more than once */
const ROUNDS = 2;
const ROUND_PAUSE_MS = 1500;

/**
 * Asks Gemini for JSON. If a model is slow or overloaded the next one starts alongside
 * it, and the first valid answer wins. Throws when none answers before the deadline.
 */
export async function generateJson<T>(
  prompt: { system: string; user: string },
  schema: object,
  validate: (value: unknown) => T | null,
  { deadlineMs = 30000, temperature = 0.6 } = {}
): Promise<{ value: T; usage: TokenUsage }> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API key configured");

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), deadlineMs);

  const attempt = async (model: string): Promise<{ value: T; usage: TokenUsage }> => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${model} returned ${res.status}`);
    const data = await res.json();
    const parts: Array<{ text?: string }> = data.candidates?.[0]?.content?.parts ?? [];
    const value = validate(JSON.parse(parts.map((p) => p.text ?? "").join("")));
    if (value === null) throw new Error(`${model} returned an unexpected shape`);
    return { value, usage: readGeminiUsage(data) };
  };

  try {
    return await new Promise<{ value: T; usage: TokenUsage }>((resolve, reject) => {
      let started = 0;
      let failed = 0;
      const errors: string[] = [];
      controller.signal.addEventListener("abort", () => reject(new Error("Gemini timed out")));

      const total = MODELS.length * ROUNDS;

      const startNext = () => {
        if (started >= total || controller.signal.aborted) return;
        const model = MODELS[started++ % MODELS.length];
        const hedge = setTimeout(startNext, HEDGE_MS);
        attempt(model).then(
          (value) => {
            clearTimeout(hedge);
            resolve(value);
          },
          (err) => {
            clearTimeout(hedge);
            errors.push(String(err?.message ?? err));
            failed += 1;
            if (failed === total) reject(new Error(errors.join("; ")));
            else if (failed === MODELS.length) setTimeout(startNext, ROUND_PAUSE_MS);
            else startNext();
          }
        );
      };
      startNext();
    });
  } finally {
    clearTimeout(deadline);
    controller.abort();
  }
}
