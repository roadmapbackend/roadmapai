import { NextRequest, NextResponse } from "next/server";
import { readGeminiUsage } from "@/lib/usage";

export const maxDuration = 60;

function cleanAndParseJson(raw: string): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {}

  const startIdx = raw.indexOf("{");
  const endIdx = raw.lastIndexOf("}");
  let candidate =
    startIdx !== -1 && endIdx !== -1 && endIdx > startIdx
      ? raw.slice(startIdx, endIdx + 1)
      : raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(candidate);
  } catch {
    try {
      const escaped = candidate.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      return JSON.parse(escaped);
    } catch {
      return null;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      domain, 
      dayNumber, 
      dayTitle, 
      dayDescription, 
      dailyHours, 
      learningObjectives, 
      skillLevel 
    } = body;

    const cleanDomain = (domain || "General").trim();
    const cleanTitle = (dayTitle || `Day ${dayNumber || 1}`).replace(/^Day\s+\d+:\s*/i, "").trim();
    const hours = Number(dailyHours) || 2.0;
    const level = (skillLevel || "intermediate").toLowerCase();
    const totalMinutes = Math.round(hours * 60);

    // Dynamic topic count based on daily hours commitment
    const minTopics = hours <= 1.0 ? 2 : hours <= 2.5 ? 3 : 3;
    const maxTopics = hours <= 1.0 ? 2 : hours <= 2.5 ? 3 : 4;

    // 1. Try Google Gemini API if configured
    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (googleApiKey && !googleApiKey.startsWith("your-")) {
      const lowerContext = `${cleanDomain} ${cleanTitle}`.toLowerCase();
      const isGaming = /bgmi|battlegrounds|pubg|valorant|csgo|cs:go|counter-strike|fortnite|apex|cod|call of duty|warzone|league of legends|lol|dota|overwatch|rocket league|r6|rainbow six|gaming|gameplay|fps|battle royale|moba|chess|speedrun/i.test(lowerContext);
      const isSports = /football|soccer|basketball|tennis|badminton|cricket|boxing|mma|martial arts|wrestling|swimming|running|marathon|gym|workout|fitness|bodybuilding|weightlifting|powerlifting|calisthenics|crossfit|yoga/i.test(lowerContext);
      const isMusic = /guitar|piano|violin|drums|bass|music|singing|vocals|brass|flute|harmony|audio production|songwriting|composition/i.test(lowerContext);

      let domainAdvice = "";
      if (isGaming) {
        domainAdvice = `
DISCIPLINE CONTEXT: COMPETITIVE GAMING / ESPORTS
- Focus on real in-game gameplay: controls & sensitivity calibration, crosshair placement, spray pull-down & recoil control, weapon tiers & throwables, drop strategy & map rotations, squad crossfire & comms, and endgame clutch decision-making.
- DO NOT treat this as computer science or software engineering. Teach the actual game!`;
      } else if (isSports) {
        domainAdvice = `
DISCIPLINE CONTEXT: ATHLETICS & SPORTS
- Focus on biomechanics, proper form, kinetic chain transfer, practice drills, conditioning, and mistake correction.`;
      } else if (isMusic) {
        domainAdvice = `
DISCIPLINE CONTEXT: MUSIC & INSTRUMENTAL CRAFT
- Focus on posture/ergonomics, hand technique, scale/chord transitions, metronome timing drills, and musical interpretation.`;
      }

      const prompt = `You are Agent 2: Daily Structure Agent for Daari, an elite learning and curriculum architecture engine.
Your objective is to dynamically architect an organic, highly tailored set of subtopics for Day ${dayNumber || 1} of an intensive roadmap.

Subject / Field: "${cleanDomain}"
Day ${dayNumber || 1}: "${cleanTitle}"
Day Overview: "${dayDescription || ''}"
Key Focus Objectives: ${(learningObjectives || []).join(", ") || "Core principles, practical execution, and mastery synthesis"}
Learner Experience Level: ${level.toUpperCase()}
Allocated Time: ${hours} hours (${totalMinutes} minutes total)
${domainAdvice}

CRITICAL ARCHITECTURAL DIRECTIVES:
1. STRICT PEDAGOGICAL FLOW & NATURAL PROGRESSION:
   The subtopics for the day must form a seamless, logical learning journey:
   - Topic 1 (Intuitive Foundations & Setup): Introduce the core mental model, intuition, terminology, and foundational setup tailored to a ${level} learner.
   - Intermediate Topic(s) (Applied Mechanics & Execution): Concrete workflows, step-by-step techniques, and applied practice drills.
   - Final Topic (Nuance, Pitfall Prevention & Practical Mastery): High-pressure scenarios, common amateur blunders, edge-case reactions, and skill synthesis.
2. NO FORMULAIC BOILERPLATE:
   Do NOT use generic placeholder titles like "Foundations & Key Principles", "Applied Hands-On Drills", "Edge Cases & Diagnostics", or "Integration Milestone".
   Give each topic an AUTHENTIC, SUBSTANTIVE, and SPECIFIC title representing the real mechanisms or concepts for "${cleanTitle}".
3. HOURS-CALIBRATED TOPIC COUNT & TIME BUDGET:
   - Generate ${minTopics === maxTopics ? `exactly ${minTopics}` : `between ${minTopics} and ${maxTopics}`} subtopics based on the ${hours} hours/day allocation.
   - The sum of 'estimated_minutes' across all subtopics must approximately equal ${totalMinutes} minutes.
4. Provide a detailed 2-3 sentence description for each topic explaining what concrete skills, drills, or techniques are mastered.

Return ONLY a valid JSON object matching this exact structure:
{
  "topics": [
    {
      "topic_number": 1,
      "title": string (specific, authentic subtopic title),
      "description": string (detailed description of what is learned and practiced),
      "estimated_minutes": number
    }
  ]
}

In JSON string values, avoid unescaped internal double quotes (use single quotes 'example' or escape with \\") to preserve JSON integrity.`;

      const candidateModels = [
        process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite-preview",
        "gemini-3.8-flash",
      ];
      const uniqueModels = Array.from(new Set(candidateModels));

      for (const model of uniqueModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": googleApiKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  responseMimeType: "application/json",
                },
              }),
              signal: AbortSignal.timeout(20000),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = cleanAndParseJson(rawText);
              if (parsed && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
                return NextResponse.json({
                  topics: parsed.topics.map((t: any, idx: number) => ({
                    topic_number: idx + 1,
                    title: t.title || `Topic ${idx + 1}: ${cleanTitle} Exploration`,
                    description: t.description || `In-depth technical breakdown of ${cleanTitle}.`,
                    estimated_minutes: Number(t.estimated_minutes) || Math.floor(totalMinutes / parsed.topics.length),
                  })),
                  usage: readGeminiUsage(data),
                });
              }
            }
          }
        } catch (modelErr) {
          console.warn(`[/api/structure] Model ${model} error:`, modelErr);
        }
      }
    }

    // Fallback: Return empty so client uses smart generative deconstruction
    return NextResponse.json({ topics: [] });
  } catch (err: any) {
    console.error("[/api/structure] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

