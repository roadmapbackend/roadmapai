"use client";

import React, { useEffect, useState, useRef, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Network, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "@/components/ui/icons";

declare global {
  interface Window {
    katex?: {
      renderToString: (tex: string, options?: { displayMode?: boolean; throwOnError?: boolean }) => string;
    };
    mermaid?: {
      initialize: (config: any) => void;
      render: (id: string, text: string) => Promise<{ svg: string }>;
    };
  }
}

/**
 * Universal mathematical fallback parser for LaTeX equations when KaTeX CDN is offline or hydrating
 */
function renderLatexFallback(tex: string, isBlock: boolean = false): string {
  let cleaned = tex
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\mathbb\{E\}/g, "𝔼")
    .replace(/\\mathbb\{R\}/g, "ℝ")
    .replace(/\\mathbb\{P\}/g, "ℙ")
    .replace(/\\mathcal\{N\}/g, "𝒩")
    .replace(/\\mu/g, "μ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\varphi/g, "φ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\Phi/g, "Φ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\rho/g, "ρ")
    .replace(/\\dots/g, "…")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\\le/g, "≤")
    .replace(/\\ge/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\to/g, "→")
    .replace(/\\infty/g, "∞")
    .replace(/\\in/g, "∈")
    .replace(/\\pm/g, "±")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
    .replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, "∑($1..$2)")
    .replace(/\\sum/g, "∑")
    .replace(/\\lim_\{([^}]+)\}/g, "lim($1)")
    .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>")
    .replace(/\^([0-9a-zA-Z])/g, "<sup>$1</sup>")
    .replace(/_\{([^}]+)\}/g, "<sub>$1</sub>")
    .replace(/_([0-9a-zA-Z])/g, "<sub>$1</sub>");

  if (isBlock) {
    return `<div class="math-display-card text-foreground font-serif tracking-wide py-3 text-base">${cleaned}</div>`;
  }
  return `<span class="math-inline text-foreground font-serif text-[1.05em] px-1">${cleaned}</span>`;
}

/**
 * Renders LaTeX using KaTeX if available, otherwise falls back gracefully
 */
function MathEquation({ math, isBlock = false }: { math: string; isBlock?: boolean }) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let rendered = "";
    if (typeof window !== "undefined" && window.katex) {
      try {
        rendered = window.katex.renderToString(math.trim(), {
          displayMode: isBlock,
          throwOnError: false,
        });
        if (isBlock) {
          rendered = `<div class="math-display-card text-foreground overflow-x-auto">${rendered}</div>`;
        } else {
          rendered = `<span class="math-inline text-foreground">${rendered}</span>`;
        }
      } catch {
        rendered = renderLatexFallback(math, isBlock);
      }
    } else {
      rendered = renderLatexFallback(math, isBlock);
    }
    setHtml(rendered);
  }, [math, isBlock]);

  if (!html) {
    return <span dangerouslySetInnerHTML={{ __html: renderLatexFallback(math, isBlock) }} />;
  }

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Intelligent ASCII flow-graph to Mermaid syntax converter with aesthetic rounded nodes
 */
function convertAsciiToMermaid(asciiText: string): string | null {
  const lines = asciiText.split("\n");
  const nodeMatches: string[] = [];
  
  // 1. Look for bracketed nodes e.g. [ Distributed Ingestion Stream ], [ Worker Node 1 ]
  for (const line of lines) {
    const matches = line.match(/\[\s*([^\]]+?)\s*\]/g);
    if (matches) {
      for (const m of matches) {
        const clean = m.replace(/[\[\]]/g, "").trim();
        if (clean.length > 2 && !nodeMatches.includes(clean)) {
          nodeMatches.push(clean);
        }
      }
    }
  }

  // 2. Also look for box-style ASCII borders e.g. | Node Name | or +---+
  if (nodeMatches.length < 2) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const parts = trimmed
          .split("|")
          .map((p) => p.trim())
          .filter((p) => p.length > 2 && !p.startsWith("-") && !p.startsWith("="));
        for (const p of parts) {
          if (!nodeMatches.includes(p)) {
            nodeMatches.push(p);
          }
        }
      }
    }
  }

  if (nodeMatches.length < 2) return null;

  // Build clean top-down Mermaid graph with rounded pill nodes
  let mermaid = "graph TD\n";
  const idMap = new Map<string, string>();
  const styles = ["orange", "cyan", "emerald", "purple"];

  nodeMatches.forEach((name, i) => {
    const id = `N${i + 1}`;
    idMap.set(name, id);
    const safeLabel = name.replace(/["\(\)]/g, "");
    const styleClass = styles[i % styles.length];
    // Use ("label") syntax which natively triggers rounded corners in Mermaid
    mermaid += `  ${id}("${safeLabel}"):::${styleClass}\n`;
  });

  // Connect sequentially
  for (let i = 0; i < nodeMatches.length - 1; i++) {
    const fromId = idMap.get(nodeMatches[i]);
    const toId = idMap.get(nodeMatches[i + 1]);
    if (fromId && toId) {
      mermaid += `  ${fromId} --> ${toId}\n`;
    }
  }

  // Add aesthetic rounded styling tokens
  mermaid += `\n  classDef orange fill:#1c1917,stroke:#f97316,stroke-width:2px,color:#ffedd5,rx:18px,ry:18px\n`;
  mermaid += `  classDef cyan fill:#082f49,stroke:#38bdf8,stroke-width:2px,color:#f0f9ff,rx:18px,ry:18px\n`;
  mermaid += `  classDef emerald fill:#022c22,stroke:#34d399,stroke-width:2px,color:#f0fdf4,rx:18px,ry:18px\n`;
  mermaid += `  classDef purple fill:#2e1065,stroke:#a78bfa,stroke-width:2px,color:#faf5ff,rx:18px,ry:18px\n`;

  return mermaid;
}

/**
 * Interactive Architecture Diagram Component (Visual SVG with Rounded Nodes + Blueprint Mode + Zoom)
 */
function ArchitectureDiagram({
  rawContent,
  isMermaid = false,
  title = "System Architecture & Topology"
}: {
  rawContent: string;
  isMermaid?: boolean;
  title?: string;
}) {
  const [activeTab, setActiveTab] = useState<"visual" | "blueprint">("visual");
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hasRenderError, setHasRenderError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, "_");

  const mermaidDefinition = isMermaid ? rawContent.trim() : convertAsciiToMermaid(rawContent);

  useEffect(() => {
    if (!mermaidDefinition) {
      setActiveTab("blueprint");
      return;
    }

    let isMounted = true;
    const tryRenderMermaid = async () => {
      if (typeof window !== "undefined" && window.mermaid) {
        try {
          const isDark = document.documentElement.classList.contains("dark");
          window.mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? "dark" : "neutral",
            themeVariables: {
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '11px',
              primaryColor: isDark ? '#1e293b' : '#ffffff',
              primaryTextColor: isDark ? '#f8fafc' : '#0f172a',
              primaryBorderColor: isDark ? '#f97316' : '#ea580c',
              lineColor: isDark ? '#38bdf8' : '#0284c7',
              secondaryColor: isDark ? '#0f172a' : '#f8fafc',
              tertiaryColor: isDark ? '#1e1b4b' : '#e0e7ff',
              mainBkg: isDark ? '#0f172a' : '#ffffff',
              nodeBorder: isDark ? '#f97316' : '#ea580c',
              clusterBkg: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(241, 245, 249, 0.75)',
              clusterBorder: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
              edgeLabelBackground: isDark ? '#0f172a' : '#ffffff',
            },
            themeCSS: `
              .node rect, .node polygon, .node circle {
                rx: 10px !important;
                ry: 10px !important;
                stroke-width: 1.5px !important;
                filter: drop-shadow(0 4px 10px rgba(0, 0, 0, ${isDark ? '0.35' : '0.06'})) !important;
              }
              .node .label {
                font-family: inherit !important;
                font-weight: 600 !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
                padding: 6px 10px !important;
              }
              .cluster rect {
                rx: 14px !important;
                ry: 14px !important;
                stroke-width: 1px !important;
                stroke-dasharray: 4 4 !important;
              }
              .edgePath path {
                stroke-width: 1.5px !important;
                stroke: ${isDark ? '#38bdf8' : '#0284c7'} !important;
              }
              .marker {
                fill: ${isDark ? '#38bdf8' : '#0284c7'} !important;
                stroke: ${isDark ? '#38bdf8' : '#0284c7'} !important;
              }
            `,
            securityLevel: "loose",
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: "basis",
              padding: 12,
            },
          });

          const renderId = `mermaid_diag_${uniqueId}`;
          const result = await window.mermaid.render(renderId, mermaidDefinition);
          if (isMounted) {
            // Post-process SVG to enforce rounded corners on all rectangular node shapes & clusters
            let styledSvg = result.svg.replace(/<rect[^>]*>/g, (match) => {
              const isCluster = match.includes('cluster');
              const r = isCluster ? "14" : "10";
              const cleaned = match.replace(/\srx="[^"]*"/g, "").replace(/\sry="[^"]*"/g, "");
              return cleaned.replace("<rect", `<rect rx="${r}" ry="${r}"`);
            });

            setSvgContent(styledSvg);
            setHasRenderError(false);
          }
        } catch (err) {
          console.debug("Mermaid render notice:", err);
          if (isMounted) {
            setHasRenderError(true);
            setActiveTab("blueprint");
          }
        }
      } else {
        const timer = setTimeout(() => {
          if (isMounted && window.mermaid) {
            tryRenderMermaid();
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    };

    tryRenderMermaid();
    return () => { isMounted = false; };
  }, [mermaidDefinition, uniqueId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zoomIn = () => setZoom((z) => Math.min(1.8, Math.round((z + 0.15) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100));
  const resetZoom = () => setZoom(1.0);

  return (
    <div className="diagram-canvas border border-border/80 rounded-xl overflow-hidden shadow-xs my-4 bg-card transition-all max-w-3xl mx-auto">
      {/* Visual Canvas Header */}
      <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Network className="size-4" />
          </div>
          <div>
            <span className="text-xs font-bold font-mono tracking-tight text-foreground block">
              {title}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              {isMermaid ? "Aesthetic Vector Graph (Rounded Nodes)" : "Deterministic Topology Blueprint"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls for visual graph */}
          {activeTab === "visual" && svgContent && (
            <div className="flex items-center bg-muted/60 border border-border/80 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={zoomOut}
                title="Zoom Out"
                className="size-6 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                onClick={resetZoom}
                title="Reset Zoom"
                className="px-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="size-2.5" />
                <span>{Math.round(zoom * 100)}%</span>
              </button>
              <button
                onClick={zoomIn}
                title="Zoom In"
                className="size-6 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ZoomIn className="size-3.5" />
              </button>
            </div>
          )}

          {mermaidDefinition && !hasRenderError && (
            <div className="bg-muted p-0.5 rounded-lg border border-border flex items-center text-[11px] font-mono">
              <button
                onClick={() => setActiveTab("visual")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === "visual"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Visual Graph
              </button>
              <button
                onClick={() => setActiveTab("blueprint")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === "blueprint"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Blueprint
              </button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs font-mono h-8 px-2.5 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500 mr-1" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 mr-1" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Canvas Body */}
      <div className="relative p-4 sm:p-5 bg-muted/10 overflow-x-auto min-h-[160px] flex items-center justify-center">
        {activeTab === "visual" && svgContent ? (
          <div 
            ref={containerRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center top",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full flex justify-center py-2 [&_svg]:max-w-[520px] [&_svg]:w-full [&_svg]:h-auto transition-all"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full">
            <pre className="p-4 bg-muted/40 dark:bg-black/40 border border-border/80 rounded-xl font-mono text-xs text-foreground overflow-x-auto leading-relaxed select-all">
              <code>{rawContent}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Universal Rich Text with Math & Formatting Support (Preserves all math & multi-line proofs)
 */
function RenderRichText({ content }: { content: string }) {
  if (!content) return null;

  // Split by block equations: $$...$$
  const blockMathSegments = content.split(/(\$\$[\s\S]+?\$\$)/g);

  return (
    <div className="space-y-2">
      {blockMathSegments.map((segment, idx) => {
        if (segment.startsWith("$$") && segment.endsWith("$$") && segment.length > 4) {
          const formula = segment.slice(2, -2).trim();
          return <MathEquation key={idx} math={formula} isBlock={true} />;
        }

        // Regular lines
        const lines = segment.split("\n");
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              return (
                <div key={lIdx} className="leading-relaxed">
                  <TextWithMath text={trimmed} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Industrial Incident / Failure Mode Card (With full multi-line proofs and derivations)
 */
function FailureModeCard({
  title,
  context,
  rootCause,
  mitigation,
}: {
  title: string;
  context: string;
  rootCause: string;
  mitigation: string;
}) {
  return (
    <div className="border border-border/90 bg-card rounded-2xl p-5 my-5 shadow-sm space-y-4 relative overflow-hidden transition-all hover:border-orange-500/30">
      <div className="flex items-center gap-2.5">
        <div className="size-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="size-4" />
        </div>
        <h4 className="text-sm font-bold text-foreground font-mono tracking-tight">
          {title}
        </h4>
      </div>

      {context && (
        <div className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/50">
          <strong className="text-foreground font-mono block mb-1 uppercase text-[10px]">Context & Symptoms:</strong>
          <RenderRichText content={context} />
        </div>
      )}

      {rootCause && (
        <div className="text-xs leading-relaxed text-rose-950 dark:text-rose-200 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
          <strong className="text-rose-600 dark:text-rose-400 font-mono block mb-1 uppercase text-[10px]">Underlying Root Cause:</strong>
          <RenderRichText content={rootCause} />
        </div>
      )}

      {mitigation && (
        <div className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-200 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
          <strong className="text-emerald-600 dark:text-emerald-400 font-mono block mb-1 uppercase text-[10px] flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>Production Mitigation Protocol:</span>
          </strong>
          <RenderRichText content={mitigation} />
        </div>
      )}
    </div>
  );
}

/**
 * Parses inline math ($...$), bold, italic, code, and links in prose
 */
function TextWithMath({ text }: { text: string }) {
  if (!text) return null;

  // Split text by inline math: $...$ (avoiding double $$)
  const mathSegments = text.split(/(\$(?!\$)[^\$]+?\$(?!\$))/g);

  return (
    <>
      {mathSegments.map((segment, idx) => {
        if (segment.startsWith("$") && segment.endsWith("$") && segment.length > 2) {
          const formula = segment.slice(1, -1);
          return <MathEquation key={idx} math={formula} isBlock={false} />;
        }

        // Parse bold, inline code, and formatting inside text
        const parts = segment.split(/(\*\*[^\*]+?\*\*|`[^`]+?`)/g);
        return (
          <React.Fragment key={idx}>
            {parts.map((p, pIdx) => {
              if (p.startsWith("**") && p.endsWith("**")) {
                return <strong key={pIdx} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>;
              }
              if (p.startsWith("`") && p.endsWith("`")) {
                return (
                  <code key={pIdx} className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-[11px] border border-border/80 mx-0.5">
                    {p.slice(1, -1)}
                  </code>
                );
              }
              return p;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

export function MasterclassViewer({ 
  markdown,
  skillLevel,
  dailyHours,
  estimatedMinutes,
}: { 
  markdown: string;
  skillLevel?: string;
  dailyHours?: number;
  estimatedMinutes?: number;
}) {
  if (!markdown) {
    return (
      <div className="py-12 text-center text-xs font-mono text-muted-foreground">
        Synthesizing module curriculum...
      </div>
    );
  }

  const blocks: React.ReactNode[] = [];

  // Adaptive Pacing & Pedagogical Track Header
  if (dailyHours || skillLevel || estimatedMinutes) {
    blocks.push(
      <div 
        key="pacing-track-badge"
        className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2 mb-5 rounded-xl border border-border/80 bg-muted/40 font-mono text-[11px] text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground capitalize">
            {skillLevel ? `${skillLevel} Track` : "Personalized Track"}
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span>
            {estimatedMinutes ? `⏱️ ~${estimatedMinutes} min study pace` : "Target study block"}
          </span>
        </div>
        {dailyHours && (
          <div className="flex items-center gap-1.5 text-[10px] bg-background/80 border border-border px-2 py-0.5 rounded-md">
            <span className="text-orange-600 dark:text-orange-400 font-bold">{dailyHours} hrs/day</span>
            <span className="text-muted-foreground">budget calibrated</span>
          </div>
        )}
      </div>
    );
  }

  const lines = markdown.split("\n");

  let currentBlockType: "none" | "code" | "math_block" = "none";
  let blockBuffer: string[] = [];
  let codeLang = "";
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ").trim();
    paragraphBuffer = [];
    if (!text) return;

    // Check if it is a blockquote
    if (text.startsWith(">")) {
      const cleanQuote = text.replace(/^>\s*/, "");
      blocks.push(
        <div key={`quote-${blocks.length}`} className="my-4 p-4 rounded-xl border-l-4 border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 text-xs sm:text-sm leading-relaxed text-foreground italic flex items-start gap-3">
          <Sparkles className="size-4 text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1 not-italic font-medium">
            <TextWithMath text={cleanQuote} />
          </div>
        </div>
      );
      return;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-relaxed text-muted-foreground my-3">
        <TextWithMath text={text} />
      </p>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Math block delimiter: $$
    if (trimmed.startsWith("$$") || trimmed.endsWith("$$")) {
      if (currentBlockType === "math_block") {
        blockBuffer.push(trimmed.replace(/\$\$$/, ""));
        const mathContent = blockBuffer.join(" ").replace(/\$\$/g, "").trim();
        flushParagraph();
        blocks.push(<MathEquation key={`math-${blocks.length}`} math={mathContent} isBlock={true} />);
        blockBuffer = [];
        currentBlockType = "none";
        continue;
      } else if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
        flushParagraph();
        const formula = trimmed.slice(2, -2).trim();
        blocks.push(<MathEquation key={`math-${blocks.length}`} math={formula} isBlock={true} />);
        continue;
      } else if (trimmed.startsWith("$$")) {
        flushParagraph();
        currentBlockType = "math_block";
        blockBuffer = [trimmed.slice(2)];
        continue;
      }
    }

    if (currentBlockType === "math_block") {
      blockBuffer.push(line);
      continue;
    }

    // 2. Code Block delimiter: ```
    if (trimmed.startsWith("```")) {
      if (currentBlockType === "code") {
        const codeContent = blockBuffer.join("\n");
        flushParagraph();

        const isMermaid = codeLang === "mermaid" || codeContent.includes("graph TD") || codeContent.includes("sequenceDiagram");
        const isAsciiDiagram =
          codeContent.includes("-->") ||
          codeContent.includes("▼") ||
          codeContent.includes("│") ||
          codeContent.includes("+---") ||
          /\[\s*[^\]]+?\s*\]/.test(codeContent);

        if (isMermaid || isAsciiDiagram) {
          blocks.push(
            <ArchitectureDiagram
              key={`diag-${blocks.length}`}
              rawContent={codeContent}
              isMermaid={isMermaid}
              title={isMermaid ? "System Architecture & Topology" : "Dataflow & State Topology"}
            />
          );
        } else {
          blocks.push(
            <div key={`code-${blocks.length}`} className="my-5 rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="px-4 py-2 bg-muted/60 border-b border-border flex items-center justify-between">
                <Badge variant="amber" className="text-[10px] font-mono uppercase px-2 py-0">
                  {codeLang || "Code"}
                </Badge>
              </div>
              <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto leading-relaxed bg-muted/20">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        blockBuffer = [];
        codeLang = "";
        currentBlockType = "none";
        continue;
      } else {
        flushParagraph();
        currentBlockType = "code";
        codeLang = trimmed.slice(3).trim().toLowerCase();
        blockBuffer = [];
        continue;
      }
    }

    if (currentBlockType === "code") {
      blockBuffer.push(line);
      continue;
    }

    // 3. Headings
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      blocks.push(
        <h1 key={`h1-${blocks.length}`} className="text-2xl font-bold font-display text-foreground mt-8 mb-4 tracking-tight flex items-center gap-2.5">
          <span>{trimmed.slice(2)}</span>
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      const headingText = trimmed.slice(3).trim();
      const numMatch = headingText.match(/^(\d+)[\.\s]+(.*)/);
      const badge = numMatch ? `0${numMatch[1]}`.slice(-2) : null;
      const cleanHeading = numMatch ? numMatch[2] : headingText;

      blocks.push(
        <div key={`h2-${blocks.length}`} className="mt-8 mb-3 pt-4 border-t border-border/70 flex items-center gap-2.5">
          {badge && (
            <Badge variant="orange" className="border-0 font-mono text-[11px] px-2 py-0.5">
              {badge}
            </Badge>
          )}
          <h2 className="text-lg font-bold text-foreground font-display tracking-tight">
            {cleanHeading}
          </h2>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-sm font-bold text-orange-600 dark:text-orange-400 font-display mt-5 mb-2 flex items-center gap-2">
          <ChevronRight className="size-4 shrink-0 text-orange-500" />
          <span>{trimmed.slice(4)}</span>
        </h3>
      );
      continue;
    }

    // 4. Horizontal Dividers
    if (trimmed === "---" || trimmed === "***") {
      flushParagraph();
      blocks.push(<div key={`hr-${blocks.length}`} className="my-6 border-b border-border/60" />);
      continue;
    }

    // 5. Failure Mode & Industrial War Story Check (Multi-line accumulation preserving ALL derivations)
    if (trimmed.startsWith("Failure Mode") || trimmed.startsWith("Incident Case")) {
      flushParagraph();
      const title = trimmed;
      let activeField: "context" | "rootCause" | "mitigation" | "none" = "none";
      const contextLines: string[] = [];
      const rootCauseLines: string[] = [];
      const mitigationLines: string[] = [];

      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();

        if (
          nextTrimmed.startsWith("Failure Mode") ||
          nextTrimmed.startsWith("Incident Case") ||
          nextTrimmed.startsWith("##") ||
          nextTrimmed === "---" ||
          nextTrimmed === "***"
        ) {
          break;
        }

        if (/^[*\-\s]*context:/i.test(nextTrimmed)) {
          activeField = "context";
          contextLines.push(nextTrimmed.replace(/^[*\-\s]*context:\s*/i, ""));
        } else if (/^[*\-\s]*root\s*cause:/i.test(nextTrimmed)) {
          activeField = "rootCause";
          rootCauseLines.push(nextTrimmed.replace(/^[*\-\s]*root\s*cause:\s*/i, ""));
        } else if (/^[*\-\s]*mitigation:/i.test(nextTrimmed)) {
          activeField = "mitigation";
          mitigationLines.push(nextTrimmed.replace(/^[*\-\s]*mitigation:\s*/i, ""));
        } else if (activeField !== "none" && nextTrimmed.length > 0) {
          if (activeField === "context") contextLines.push(nextLine);
          else if (activeField === "rootCause") rootCauseLines.push(nextLine);
          else if (activeField === "mitigation") mitigationLines.push(nextLine);
        } else if (nextTrimmed.length > 0) {
          contextLines.push(nextLine);
        }
        j++;
      }

      if (rootCauseLines.length > 0 || mitigationLines.length > 0) {
        blocks.push(
          <FailureModeCard
            key={`failure-${blocks.length}`}
            title={title}
            context={contextLines.join("\n")}
            rootCause={rootCauseLines.join("\n")}
            mitigation={mitigationLines.join("\n")}
          />
        );
        i = j - 1;
        continue;
      }
    }

    // 6. Ordered / Unordered Bullet Lists
    const listMatch = line.match(/^(\s*)([0-9]+\.|\*|\-)\s+(.*)/);
    if (listMatch) {
      flushParagraph();
      const isOrdered = /[0-9]+\./.test(listMatch[2]);
      const bulletText = listMatch[3];

      blocks.push(
        <div key={`list-${blocks.length}`} className="flex items-start gap-3 my-2 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-2">
          {isOrdered ? (
            <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0 mt-0.5 min-w-[20px]">
              {listMatch[2]}
            </span>
          ) : (
            <span className="size-1 rounded-full bg-foreground/50 shrink-0 mt-2.5" />
          )}
          <div className="flex-1">
            <TextWithMath text={bulletText} />
          </div>
        </div>
      );
      continue;
    }

    // Regular text line accumulation
    if (trimmed.length > 0) {
      paragraphBuffer.push(trimmed);
    } else {
      flushParagraph();
    }
  }

  flushParagraph();

  return (
    <div className="masterclass-container space-y-2 text-foreground font-sans">
      {blocks}
    </div>
  );
}
