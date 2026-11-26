export interface DomainTelemetry {
  code: string;
  label: string;
  beacon: string;
  stages: [string, string, string];
}

export function getDomainTelemetry(
  archetype?: string,
  title?: string,
  index: number = 1
): DomainTelemetry {
  const arch = (archetype || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (arch.includes("esport") || t.includes("bgmi") || t.includes("game")) {
    return {
      code: `GAME.0${index}`,
      label: "COMPETITIVE GAMING & FRAME PACING",
      beacon: "VULKAN RT",
      stages: ["Vulkan Pipeline", "Frame Pacing", "Touch Latency"],
    };
  }

  if (arch.includes("system") || t.includes("distributed") || t.includes("consensus") || t.includes("raft")) {
    return {
      code: `SYS.0${index}`,
      label: "DISTRIBUTED SYSTEMS & CONSENSUS",
      beacon: "QUORUM SYNC",
      stages: ["Leader Election", "Log Replication", "Jepsen Chaos"],
    };
  }

  if (arch.includes("music") || t.includes("guitar") || t.includes("bach") || t.includes("polyphony")) {
    return {
      code: `ACOUSTIC.0${index}`,
      label: "POLYPHONY & ACOUSTICS",
      beacon: "FOURIER SPECTRUM",
      stages: ["Biomechanics", "Voice Leading", "Fugal Analysis"],
    };
  }

  if (arch.includes("quant") || t.includes("finance") || t.includes("trading") || t.includes("market")) {
    return {
      code: `QUANT.0${index}`,
      label: "QUANTITATIVE CAPITAL ARCHITECTURE",
      beacon: "ORDER FLOW",
      stages: ["Stochastics", "Volatility Surface", "Risk Engine"],
    };
  }

  if (arch.includes("ai") || t.includes("agent") || t.includes("neural") || t.includes("learning") || t.includes("llm")) {
    return {
      code: `AGENT.0${index}`,
      label: "AUTONOMOUS AGENT SYNTHESIS",
      beacon: "NEURAL DAG",
      stages: ["Curriculum Spec", "Pedagogical DAG", "Socratic Loop"],
    };
  }

  const cleanLabel = (archetype?.replace(/_/g, " ") || "DETERMINISTIC SYLLABUS").toUpperCase();
  return {
    code: `DISC.0${index}`,
    label: cleanLabel.length > 28 ? cleanLabel.slice(0, 26) + "..." : cleanLabel,
    beacon: "DAG SYNCED",
    stages: ["First Principles", "Core Synthesis", "Capstone Drill"],
  };
}

