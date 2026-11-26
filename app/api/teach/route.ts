import { NextRequest, NextResponse } from "next/server";
import { readGeminiUsage } from "@/lib/usage";
import { synthesizeResearchedLesson } from "@/lib/knowledge-engine";

export const maxDuration = 60;

function cleanAndParseJson(raw: string): any {
  if (!raw) return null;

  // 1. Direct parse attempt
  try {
    return JSON.parse(raw);
  } catch {}

  // 2. Extract outermost JSON object
  const startIdx = raw.indexOf("{");
  const endIdx = raw.lastIndexOf("}");
  let candidate =
    startIdx !== -1 && endIdx !== -1 && endIdx > startIdx
      ? raw.slice(startIdx, endIdx + 1)
      : raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(candidate);
  } catch {}

  // 3. Fix unescaped LaTeX backslashes
  try {
    const escaped = candidate.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    return JSON.parse(escaped);
  } catch {}

  // 4. Robust Structural Field Extractor
  // Successfully extracts content_markdown even if it contains internal unescaped quotes or raw control characters
  try {
    const startMd = candidate.indexOf('"content_markdown"');
    if (startMd !== -1) {
      const valStart = candidate.indexOf('"', startMd + 18) + 1;
      const endMarkers = ['"practical_examples"', '"citations"', '"recommended_courses"'];
      let minEnd = -1;
      for (const m of endMarkers) {
        const pos = candidate.indexOf(m, valStart);
        if (pos !== -1 && (minEnd === -1 || pos < minEnd)) {
          minEnd = pos;
        }
      }

      let content_markdown = "";
      if (minEnd !== -1) {
        const lastQuote = candidate.lastIndexOf('"', minEnd - 1);
        content_markdown = candidate.substring(valStart, lastQuote !== -1 ? lastQuote : minEnd);
      } else {
        content_markdown = candidate.substring(valStart, candidate.length - 1);
      }

      function extractArray(key: string) {
        const idx = candidate.indexOf(`"${key}"`);
        if (idx === -1) return [];
        const arrStart = candidate.indexOf("[", idx);
        if (arrStart === -1) return [];
        let depth = 0;
        let arrEnd = -1;
        for (let i = arrStart; i < candidate.length; i++) {
          if (candidate[i] === "[") depth++;
          else if (candidate[i] === "]") {
            depth--;
            if (depth === 0) {
              arrEnd = i;
              break;
            }
          }
        }
        if (arrEnd !== -1) {
          const arrStr = candidate.substring(arrStart, arrEnd + 1);
          try {
            return JSON.parse(arrStr);
          } catch {
            try {
              const esc = arrStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
              return JSON.parse(esc);
            } catch {}
          }
        }
        return [];
      }

      if (content_markdown && content_markdown.trim().length > 100) {
        const unescapedMd = content_markdown
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"');

        return {
          content_markdown: unescapedMd,
          practical_examples: extractArray("practical_examples"),
          citations: extractArray("citations"),
          recommended_courses: extractArray("recommended_courses"),
        };
      }
    }
  } catch (err) {
    console.warn("[/api/teach] Robust extraction notice:", err);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      topicId, 
      topicTitle, 
      domain, 
      topicDesc,
      dailyHours,
      estimatedMinutes,
      skillLevel,
      dayNumber,
      totalDays
    } = body;

    if (!topicTitle) {
      return NextResponse.json({ error: "Missing topicTitle" }, { status: 400 });
    }

    const cleanTitle = topicTitle.replace(/^Topic\s+\d+:\s*/i, "").trim();
    const cleanDomain = (domain || "Computer Science").trim();
    const hours = Number(dailyHours) || 2.0;
    const level = (skillLevel || "intermediate").toLowerCase();
    const minutes = Number(estimatedMinutes) || Math.round((hours * 60) / 3);

    // Detect domain discipline to tailor teacher persona, diagrams, and drills
    const lowerDomain = `${cleanDomain} ${cleanTitle}`.toLowerCase();
    const isGaming = /bgmi|battlegrounds|pubg|valorant|csgo|cs:go|counter-strike|fortnite|apex|cod|call of duty|warzone|league of legends|lol|dota|overwatch|rocket league|r6|rainbow six|gaming|gameplay|fps|battle royale|moba|chess|speedrun/i.test(lowerDomain);
    const isSports = /football|soccer|basketball|tennis|badminton|cricket|boxing|mma|martial arts|wrestling|swimming|running|marathon|gym|workout|fitness|bodybuilding|weightlifting|powerlifting|calisthenics|crossfit|yoga/i.test(lowerDomain);
    const isMusic = /guitar|piano|violin|drums|bass|music|singing|vocals|brass|flute|harmony|audio production|songwriting|composition/i.test(lowerDomain);
    const isCulinary = /cooking|culinary|baking|pastry|chef|knife skills|barista|coffee|espresso|cocktail|mixology/i.test(lowerDomain);
    const isTech = /software|code|programming|python|typescript|javascript|react|rust|c\+\+|golang|docker|kubernetes|aws|database|sql|api|machine learning|deep learning|system architecture/i.test(lowerDomain);

    let disciplinePrompt = "";
    if (isGaming) {
      disciplinePrompt = `
DISCIPLINE CONTEXT: COMPETITIVE GAMING & ESPORTS
PERSONA & PEDAGOGY: You are an elite tier-1 esports coach and pro tournament player.
Teach authentic gameplay mastery of "${cleanTitle}" in "${cleanDomain}". Focus strictly on real game mechanics:
- Device/HUD setup, gyroscope & finger sensitivity calibration, crosshair placement baseline.
- Recoil compensation, spray pull-down patterns, burst control, hip-fire vs ADS transitions, peek-and-fire agility.
- Weapon tier synergies, damage falloff, attachments, and utility throwables (cooking grenades, smoke screens).
- Map rotations, zone/circle management, hard-cover vs soft-cover, compound assaults, and squad crossfire.
- Clutch decision-making, 1vX composure, trigger discipline, and tournament VOD meta analysis.
- VISUAL ELEMENT: Create a tactical Mermaid diagram (flowchart with rounded nodes) showing rotation paths, engagement priority, compound entry protocol, or clutch decision tree.
- PRACTICAL EXAMPLES: Provide concrete training grounds drills, exact sensitivity/gyroscope setting guides, recoil pull-down routines (with target distances, reps, and minutes), or tactical execution checklists.
- CITATIONS: Official developer weapon stats, pro tournament VOD analyses, competitive rulebooks, or top pro guides.`;
    } else if (isSports) {
      disciplinePrompt = `
DISCIPLINE CONTEXT: ATHLETICS, SPORTS & BIOMECHANICS
PERSONA & PEDAGOGY: You are an elite athletic coach and sports biomechanist.
Teach authentic physical mastery of "${cleanTitle}" in "${cleanDomain}". Focus on kinetic chain alignment, posture, movement economy, progressive drills, energy system management, and injury prevention.
- VISUAL ELEMENT: Create a Mermaid flowchart with rounded nodes showing movement sequencing or training progressions.
- PRACTICAL EXAMPLES: Provide structured practice sessions with exact exercises, sets, reps, rest intervals, and form cues.`;
    } else if (isMusic) {
      disciplinePrompt = `
DISCIPLINE CONTEXT: MUSIC & INSTRUMENTAL MASTERY
PERSONA & PEDAGOGY: You are a master conservatory instructor and concert artist.
Teach authentic musical mastery of "${cleanTitle}" in "${cleanDomain}". Focus on posture, hand ergonomics, tone extraction, interval dexterity, chord voicing transitions, metronome subdivision, and expressive phrasing.
- VISUAL ELEMENT: Create a Mermaid flowchart with rounded nodes showing harmonic progressions, practice cycles, or voice leading.
- PRACTICAL EXAMPLES: Provide exercise patterns, fingerings, tab/notation guidelines, metronome BPM ramps, and transition drills.`;
    } else if (isCulinary) {
      disciplinePrompt = `
DISCIPLINE CONTEXT: CULINARY ARTS & GASTRONOMY
PERSONA & PEDAGOGY: You are an executive chef and culinary educator.
Teach authentic culinary mastery of "${cleanTitle}" in "${cleanDomain}". Focus on knife mechanics, mise en place, heat control, Maillard reaction, seasoning balance (salt-acid-fat-heat), timing, and plating.`;
    } else if (isTech) {
      disciplinePrompt = `
DISCIPLINE CONTEXT: COMPUTER SCIENCE & SYSTEMS ENGINEERING
PERSONA & PEDAGOGY: You are a principal software architect and systems engineer.
Teach system architecture, core algorithms, data structures, concurrency, operational workflows, and production reliability for "${cleanTitle}".
- PRACTICAL EXAMPLES: Provide clean, production-grade code with explanatory comments.`;
    } else {
      disciplinePrompt = `
DISCIPLINE CONTEXT: ${cleanDomain.toUpperCase()}
PERSONA & PEDAGOGY: You are a world-class educator and master practitioner in ${cleanDomain}.
Teach "${cleanTitle}" with deep authenticity, practical methodology, real-world examples, and actionable exercises tailored directly to this field.`;
    }

    // Calibrate pedagogical progression and volume pacing strictly calibrated to allocated time
    const effectiveMinutes = minutes > 0 ? minutes : Math.round((hours * 60) / 3);

    let volumePacingPrompt = "";
    if (effectiveMinutes >= 75 || hours >= 4.0) {
      volumePacingPrompt = `
ALLOCATED STUDY TIME: ${effectiveMinutes} MINUTES (EXTENDED INTENSIVE MASTERCLASS - ${hours} HRS/DAY COMMITMENT).
CRITICAL LENGTH & VOLUME DIRECTIVE: Deliver an exhaustive, definitive masterclass of 3,200 to 4,800+ words.
This module is allocated ${effectiveMinutes} minutes of intensive study. A brief or summarized overview is strictly unacceptable.
You MUST provide full depth across every section:
- SECTION 1 (FIRST PRINCIPLES & GOVERNING DYNAMICS): Thorough theoretical grounding (at least 500-700 words), formal definitions, core invariants, and a detailed Markdown comparative trade-off table.
- SECTION 2 (SYSTEMATIC ARCHITECTURE & MULTI-STAGE PIPELINE): Detailed narrative deconstruction (at least 800-1,200 words) breaking down the end-to-end operational lifecycle.
  * MANDATORY MERMAID DIAGRAM: Comprehensive flowchart (\`\`\`mermaid\ngraph TD\n...\`\`\`) with at least 3 subgraphs, rounded nodes (NodeID("Label")), data flow links, and error feedback loops.
  * STEP-BY-STEP METHODOLOGY: 5 to 6 chronologically ordered execution stages with exact parameters, thresholds, and form cues.
- SECTION 3 (HIGH-PRESSURE FAILURE MODES & INDUSTRIAL CASE STUDIES): Detail 3 to 4 realistic high-pressure failure scenarios (at least 600-800 words). For each, specify: Context, Underlying Root Cause, Concrete Step-by-Step Recovery Protocol, and Preventative Checklist.
- SECTION 4 (PRODUCTION-GRADE DRILLS & EXECUTION BLUEPRINTS): Full, unabridged practical implementation (or multi-phase deliberate practice drills) with exact instructions, benchmarks, and stage criteria.
- SECTION 5 (SOCRATIC DIAGNOSTIC & ADVANCED MASTERY PROBES): 3 to 4 rigorous scenario questions probing edge cases and non-obvious failure modes.`;
    } else if (effectiveMinutes >= 45 || hours >= 2.5) {
      volumePacingPrompt = `
ALLOCATED STUDY TIME: ${effectiveMinutes} MINUTES (DEEP MASTERCLASS TRACK - ${hours} HRS/DAY COMMITMENT).
CRITICAL LENGTH & VOLUME DIRECTIVE: Deliver a thorough, comprehensive educational module of 2,400 to 3,400 words calibrated for a ${effectiveMinutes}-minute dedicated study block:
A brief or surface-level overview is strictly unacceptable.
- SECTION 1 (CONCEPTUAL ANCHOR & MENTAL MODEL): Deep first-principles intuition (at least 400-600 words) explaining the foundational mechanics before moving to practice.
- SECTION 2 (SYSTEMATIC WORKFLOW & DEEP MECHANICS): Step-by-step operational mechanics (at least 700-1,000 words).
  * MANDATORY MERMAID DIAGRAM: Rounded-node flowchart (\`\`\`mermaid\ngraph TD\n...\`\`\`) with 2+ subgraphs showing the full execution lifecycle and verification gates.
  * Detailed 4 to 5 stage execution checklist with exact parameters and operational cues.
- SECTION 3 (FAILURE MODES & RECOVERY RUNBOOK): 3 distinct failure traps with context, root causes, and corrective protocols.
- SECTION 4 (PRACTICAL DELIBERATE PRACTICE DRILLS / CODE): Complete, production-grade drill routines or working code with comments.
- SECTION 5 (SOCRATIC DIAGNOSTICS): 3 scenario-based questions testing deep understanding.`;
    } else if (effectiveMinutes >= 25) {
      volumePacingPrompt = `
ALLOCATED STUDY TIME: ${effectiveMinutes} MINUTES (BALANCED & THOROUGH STUDY TRACK).
CRITICAL LENGTH & VOLUME DIRECTIVE: Deliver an in-depth, structured explanation of 1,800 to 2,500 words calibrated for a ${effectiveMinutes}-minute study block:
- Deliver solid conceptual intuition, a multi-stage rounded Mermaid diagram with subgraphs, step-by-step operational mechanics (3 to 4 phases), 2-3 realistic failure modes with mitigations, a complete practical drill/execution guide, and Socratic diagnostic questions.
- Maintain substantial explanatory paragraphs under each heading.`;
    } else {
      volumePacingPrompt = `
ALLOCATED STUDY TIME: ${effectiveMinutes} MINUTES (FOCUSED HIGH-EFFICIENCY SPRINT TRACK).
CRITICAL LENGTH & VOLUME DIRECTIVE: Deliver a substantive, high-signal tutorial of 1,200 to 1,600 words:
- Provide clear first-principles intuition, a clean rounded Mermaid flowchart, step-by-step execution rules, 1-2 critical pitfalls with corrective actions, 1 focused practical drill, and 2 diagnostic self-check questions.`;
    }

    let learnerLevelPrompt = "";
    if (level.includes("beg")) {
      learnerLevelPrompt = `
LEARNER EXPERIENCE LEVEL: BEGINNER
- PEDAGOGICAL FLOW: Start from ground-level fundamentals with zero assumed jargon. Demystify "${cleanTitle}" using memorable real-world analogies before introducing specialized terms.
- Scaffold step-by-step from foundational intuition -> core execution -> practical drills.`;
    } else if (level.includes("adv") || level.includes("exp")) {
      learnerLevelPrompt = `
LEARNER EXPERIENCE LEVEL: ADVANCED / EXPERT
- PEDAGOGICAL FLOW: Write for an experienced practitioner or competitive master in ${cleanDomain}. Skip elementary hand-holding.
- Focus immediately on subtle micro-optimizations, meta-strategies, high-pressure execution, and edge-case reactions.`;
    } else {
      learnerLevelPrompt = `
LEARNER EXPERIENCE LEVEL: INTERMEDIATE
- PEDAGOGICAL FLOW: Assume baseline domain familiarity. Move smoothly from a quick refresher of "${cleanTitle}" into core mechanics, practical workflows, and real-world execution trade-offs.`;
    }

    // 1. Google Gemini LLM cascade
    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (googleApiKey && !googleApiKey.startsWith("your-")) {
      try {
        const prompt = `You are Agent 3: Daily Teacher Agent for Daari, an institutional adaptive learning engine.
Deliver an adaptive educational module for:
Subject Domain: "${cleanDomain}"
Specific Topic: "${cleanTitle}"
Context / Objectives: "${topicDesc || ''}"
${dayNumber ? `Roadmap Stage: Day ${dayNumber} ${totalDays ? `of ${totalDays}` : ""}` : ""}

${disciplinePrompt}

${learnerLevelPrompt}

${volumePacingPrompt}

CORE PEDAGOGICAL PROGRESSION (MANDATORY):
Structure the explanation with a smooth, logical learning arc:
1. INTUITIVE INTRODUCTION & CONCEPTUAL ANCHOR:
   - Begin with the core "why" and foundational mental model of "${cleanTitle}" in "${cleanDomain}".
   - Establish the primary objective before diving into technical mechanics.
2. CORE MECHANICS, METHODOLOGY & SYSTEMATIC DECONSTRUCTION:
   - Systematically deconstruct how the techniques or processes function step-by-step.
   - MANDATORY VISUAL ELEMENT: Include at least one complete Mermaid diagram block (\`\`\`mermaid\ngraph TD\n...\`\`\`) with rounded nodes (e.g. N1("Label")) and subgraphs illustrating the pipeline, decision tree, tactical rotation, or workflow.
   - Provide concrete, actionable execution steps.
3. COMMON PITFALLS, HIGH-PRESSURE BLUNDERS & ERROR CORRECTION:
   - Detail real-world blunders matching the allocated time budget. Structure each as:
     Pitfall X: [Descriptive Title]
     * Context: [When and how this error occurs in practice]
     * Root Cause: [Underlying psychological, physical, or systematic cause]
     * Correction: [Concrete step-by-step correction and preventative drill]
4. SOCRATIC VERIFICATION & DIAGNOSTIC CHECK:
   - 2-3 thought-provoking evaluation questions or scenario drills testing mastery.
5. PRACTICAL DRILLS, SETUP & RESOURCES:
   - In 'practical_examples', provide complete working drills, setup configurations, practice routines, or code with explanatory notes.
   - In 'citations', provide 2 to 4 genuine, discipline-appropriate authoritative references (pro tournament analyses, official guides, textbooks, or research papers).
   - In 'recommended_courses', provide 2 to 4 specific top courses, masterclasses, or professional academies.

Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "content_markdown": string (Markdown tutorial following the specified volume, progression, and formatting. Include Mermaid diagrams and clear headings),
  "practical_examples": [
    {
      "language": string (e.g. "text", "markdown", "drill", "python", "typescript", "bash"),
      "title": string (clear descriptive title),
      "code": string (complete, working drill, setup guide, or code with comments)
    }
  ],
  "citations": [
    {
      "title": string (SPECIFIC, GENUINE authoritative guide, tournament analysis, textbook, or paper),
      "url": string (real URL or search reference),
      "source_type": string (e.g. "Pro Tournament Analysis", "Official Balance Guide", "Authoritative Reference", "Research Paper"),
      "snippet": string (specific quote or core takeaway)
    }
  ],
  "recommended_courses": [
    {
      "title": string (REAL, SPECIFIC course, masterclass, or academy specialization),
      "platform": string (e.g. "Pro Masterclass", "Coursera", "edX", "MIT OpenCourseWare", "Esports Coaching Academy"),
      "url": string,
      "level": string ("Beginner", "Intermediate", or "Advanced")
    }
  ]
}

In JSON string values, avoid unescaped internal double quotes (use single quotes 'example' or escape with \\") to preserve JSON integrity.`;

        const candidateModels = [
          process.env.GEMINI_MODEL || "gemini-2.5-flash",
          "gemini-2.5-flash",
          "gemini-flash-latest",
          "gemini-flash-lite-latest",
          "gemini-2.5-flash-lite",
          "gemini-3.5-flash",
          "gemini-3.1-flash-lite",
          "gemini-3-flash-preview",
        ];
        const uniqueModels = Array.from(new Set(candidateModels));

        for (const model of uniqueModels) {
          try {
            const geminiRes = await fetch(
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
                    temperature: 0.2,
                    responseMimeType: "application/json",
                    maxOutputTokens: 8192,
                  },
                }),
                signal: AbortSignal.timeout(45000),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                const parsed = cleanAndParseJson(rawText);
                if (parsed && parsed.content_markdown && parsed.citations && parsed.recommended_courses) {
                  return NextResponse.json({
                    topic_id: topicId,
                    content_markdown: parsed.content_markdown,
                    practical_examples: parsed.practical_examples || [],
                    citations: parsed.citations,
                    recommended_courses: parsed.recommended_courses,
                    usage: readGeminiUsage(geminiData),
                  });
                }
              }
            } else {
              console.warn(`[/api/teach] Model ${model} returned status ${geminiRes.status}. Trying next model...`);
            }
          } catch (modelErr) {
            console.warn(`[/api/teach] Model ${model} request error:`, modelErr);
          }
        }
      } catch (geminiErr) {
        console.warn("[/api/teach] Live LLM cascade notice:", geminiErr);
      }
    }

    // 2. Fallback: High-Fidelity Domain & Topic Knowledge Engine
    const researched = synthesizeResearchedLesson(cleanTitle, cleanDomain, topicDesc, topicId, {
      skillLevel: level,
      dailyHours: hours,
      estimatedMinutes: Number(estimatedMinutes) || Math.round((hours * 60) / 3),
      dayNumber: Number(dayNumber) || 1,
      totalDays: Number(totalDays) || 7,
    });
    return NextResponse.json(researched);
  } catch (err: any) {
    console.error("[/api/teach] Internal error:", err);
    return NextResponse.json({ error: err.message || "Failed to synthesize lesson" }, { status: 500 });
  }
}

