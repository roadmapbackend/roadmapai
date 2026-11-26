"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Check, Clock } from "@/components/ui/icons";

type Status = "not_started" | "in_progress" | "completed";

interface RailTopic {
  id: string;
  topic_number: number;
  title: string;
  description: string;
  estimated_minutes: number;
  status: Status;
}

interface RailDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  topics: RailTopic[];
}

interface RoadmapRailProps<D extends RailDay> {
  days: D[];
  /** Accessible name for the graph */
  label: string;
  selectedTopicId: string | null;
  onSelectTopic: (day: D, topic: D["topics"][number]) => void;
  onToggleComplete: (day: D, topic: D["topics"][number]) => void;
  className?: string;
}

// Geometry of the graph column
const TRUNK_X = 11;
const BRANCH_X = 27;
const RAIL_WIDTH = 40;
const NODE_Y = 16;
const ROW = 32;
const OPEN_ROW = 56;

const TRUNK_COLOR = "var(--saffron)";
const BRANCH_COLOR = "var(--cyan)";

const HOVER_DELAY_MS = 250;
const CARD_WIDTH = 288;

const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

// The stored titles repeat the number that the row already shows
const dayTitle = (d: RailDay) => d.title.replace(/^(Day\s+\d+:\s*)+/i, "").trim();
const topicTitle = (t: RailTopic) => t.title.replace(/^Topic\s+\d+:\s*/i, "").trim();

type Row<D extends RailDay> =
  | { key: string; kind: "day"; day: D; first: boolean; last: boolean; open: boolean }
  | { key: string; kind: "topic"; day: D; topic: D["topics"][number]; firstTopic: boolean; lastTopic: boolean; lastDay: boolean };

/** Days and topics as a vertical commit graph: numbers first, titles once a node is clicked */
export function RoadmapRail<D extends RailDay>({
  days,
  label,
  selectedTopicId,
  onSelectTopic,
  onToggleComplete,
  className,
}: RoadmapRailProps<D>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hover, setHover] = useState<{ key: string; rect: DOMRect } | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const selectedDayId = days.find((d) => d.topics.some((t) => t.id === selectedTopicId))?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(selectedDayId ? [selectedDayId] : []));

  // Show the selected topic's branch whenever the selection moves
  const [lastSelected, setLastSelected] = useState(selectedTopicId);
  if (lastSelected !== selectedTopicId) {
    setLastSelected(selectedTopicId);
    if (selectedDayId) setOpen((prev) => new Set(prev).add(selectedDayId));
  }

  const rows = useMemo(() => {
    const out: Row<D>[] = [];
    days.forEach((day, i) => {
      const lastDay = i === days.length - 1;
      const isOpen = open.has(day.id);
      out.push({ key: day.id, kind: "day", day, first: i === 0, last: lastDay, open: isOpen });
      if (!isOpen) return;
      day.topics.forEach((topic, t) =>
        out.push({
          key: topic.id,
          kind: "topic",
          day,
          topic,
          firstTopic: t === 0,
          lastTopic: t === day.topics.length - 1,
          lastDay,
        })
      );
    });
    return out;
  }, [days, open]);

  const tabKey =
    rows.find((r) => r.key === focusKey)?.key ?? rows.find((r) => r.key === selectedTopicId)?.key ?? rows[0]?.key;

  const closeCard = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHover(null);
  };
  const openCard = (key: string, el: HTMLElement) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHover({ key, rect: el.getBoundingClientRect() }), HOVER_DELAY_MS);
  };

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    []
  );

  // The card is placed once, so hide it when anything scrolls
  useEffect(() => {
    if (!hover) return;
    const hide = () => setHover(null);
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [hover]);

  const toggleDay = (id: string, next?: boolean) =>
    setOpen((prev) => {
      const set = new Set(prev);
      if (next ?? !set.has(id)) set.add(id);
      else set.delete(id);
      return set;
    });

  const focusRow = (key: string | undefined) => {
    if (!key) return;
    setFocusKey(key);
    rootRef.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(key)}"]`)?.focus();
  };

  const activate = (row: Row<D>) => {
    closeCard();
    setFocusKey(row.key);
    if (row.kind === "day") toggleDay(row.day.id);
    else onSelectTopic(row.day, row.topic);
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: Row<D>, index: number) => {
    if (e.target !== e.currentTarget) return;
    switch (e.key) {
      case "ArrowDown":
        focusRow(rows[index + 1]?.key);
        break;
      case "ArrowUp":
        focusRow(rows[index - 1]?.key);
        break;
      case "Home":
        focusRow(rows[0]?.key);
        break;
      case "End":
        focusRow(rows[rows.length - 1]?.key);
        break;
      case "ArrowRight":
        if (row.kind === "day" && !row.open) toggleDay(row.day.id, true);
        else focusRow(rows[index + 1]?.key);
        break;
      case "ArrowLeft":
        if (row.kind === "topic") focusRow(row.day.id);
        else toggleDay(row.day.id, false);
        break;
      case "Enter":
      case " ":
        activate(row);
        break;
      case "Escape":
        closeCard();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const hovered = hover ? rows.find((r) => r.key === hover.key) : undefined;

  return (
    <>
      <div
        ref={rootRef}
        role="tree"
        aria-label={label}
        data-lenis-prevent={className ? "" : undefined}
        onMouseLeave={closeCard}
        className={cn("overflow-x-hidden py-1", className)}
      >
        {rows.map((row, index) => {
          const isDay = row.kind === "day";
          const selected = !isDay && row.topic.id === selectedTopicId;
          const revealed = isDay ? row.open : selected;
          const done = row.day.topics.filter((t) => t.status === "completed").length;
          const complete = isDay
            ? row.day.topics.length > 0 && done === row.day.topics.length
            : row.topic.status === "completed";

          return (
            <div
              key={row.key}
              data-row={row.key}
              role="treeitem"
              aria-level={isDay ? 1 : 2}
              aria-expanded={isDay ? row.open : undefined}
              aria-selected={selected}
              aria-label={
                isDay
                  ? `Day ${row.day.day_number}: ${dayTitle(row.day)}, ${done} of ${row.day.topics.length} topics completed`
                  : `Topic ${row.topic.topic_number}: ${topicTitle(row.topic)}, ${STATUS_LABEL[row.topic.status]}`
              }
              tabIndex={row.key === tabKey ? 0 : -1}
              onClick={() => activate(row)}
              onKeyDown={(e) => handleKeyDown(e, row, index)}
              onFocus={(e) => {
                setFocusKey(row.key);
                if (e.target === e.currentTarget && e.currentTarget.matches(":focus-visible")) openCard(row.key, e.currentTarget);
              }}
              onBlur={closeCard}
              onPointerEnter={(e) => e.pointerType === "mouse" && openCard(row.key, e.currentTarget)}
              onPointerLeave={closeCard}
              style={{ height: revealed ? OPEN_ROW : ROW }}
              className={cn(
                "group/row relative flex cursor-pointer select-none rounded-md pr-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500",
                selected ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.05]"
              )}
            >
              <RailLines row={row} height={revealed ? OPEN_ROW : ROW} selected={selected} complete={complete} />

              <div className="min-w-0 flex-1 pt-[7px]" style={{ paddingLeft: RAIL_WIDTH + (isDay ? 0 : 4) }}>
                <div className="flex items-center gap-2 text-[13px] leading-[18px]">
                  <span className={cn("shrink-0", isDay || selected ? "font-semibold text-foreground" : "text-foreground/85")}>
                    {isDay ? `Day ${row.day.day_number}` : `Topic ${row.topic.topic_number}`}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs tabular-nums text-muted-foreground">
                    {isDay ? `${done}/${row.day.topics.length}` : `${row.topic.estimated_minutes}m`}
                  </span>
                  {!isDay && (
                    <StatusMarker
                      status={row.topic.status}
                      onToggle={() => {
                        closeCard();
                        onToggleComplete(row.day, row.topic);
                      }}
                    />
                  )}
                </div>
                {revealed && (
                  <p className="truncate text-xs leading-5 text-muted-foreground">
                    {isDay ? dayTitle(row.day) : topicTitle(row.topic)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hover && hovered && <HoverCard row={hovered} rect={hover.rect} />}
    </>
  );
}

function RailLines<D extends RailDay>({
  row,
  height,
  selected,
  complete,
}: {
  row: Row<D>;
  height: number;
  selected: boolean;
  complete: boolean;
}) {
  const isDay = row.kind === "day";
  const x = isDay ? TRUNK_X : BRANCH_X;
  const color = isDay ? TRUNK_COLOR : BRANCH_COLOR;

  return (
    <svg aria-hidden="true" width={RAIL_WIDTH} height={height} className="pointer-events-none absolute left-0 top-0 overflow-visible" fill="none" strokeWidth={2}>
      {row.kind === "day" ? (
        <>
          {!row.first && <path d={`M ${TRUNK_X} 0 V ${NODE_Y}`} stroke={TRUNK_COLOR} />}
          {!row.last && <path d={`M ${TRUNK_X} ${NODE_Y} V ${height}`} stroke={TRUNK_COLOR} />}
          {/* The branch leaves the trunk here */}
          {row.open && row.day.topics.length > 0 && (
            <path
              d={`M ${TRUNK_X} ${NODE_Y} C ${TRUNK_X} ${NODE_Y + 22} ${BRANCH_X} ${height - 22} ${BRANCH_X} ${height}`}
              stroke={BRANCH_COLOR}
            />
          )}
        </>
      ) : (
        <>
          {!row.lastDay && <path d={`M ${TRUNK_X} 0 V ${height}`} stroke={TRUNK_COLOR} />}
          <path d={`M ${BRANCH_X} 0 V ${NODE_Y}`} stroke={BRANCH_COLOR} />
          {!row.lastTopic && <path d={`M ${BRANCH_X} ${NODE_Y} V ${height}`} stroke={BRANCH_COLOR} />}
          {/* ...and merges back after the day's last topic */}
          {row.lastTopic && !row.lastDay && (
            <path
              d={`M ${BRANCH_X} ${NODE_Y} C ${BRANCH_X} ${height - 2} ${TRUNK_X} ${NODE_Y + 4} ${TRUNK_X} ${height}`}
              stroke={BRANCH_COLOR}
            />
          )}
        </>
      )}

      {selected ? (
        <>
          <circle cx={x} cy={NODE_Y} r={6.5} fill="var(--background)" stroke={color} strokeWidth={2.5} />
          <circle cx={x} cy={NODE_Y} r={2.5} fill={color} />
        </>
      ) : (
        <circle
          cx={x}
          cy={NODE_Y}
          r={isDay ? 5 : 4.5}
          fill={complete ? color : "var(--background)"}
          stroke={color}
          className="transition-[r] duration-150 group-hover/row:[r:6.5px]"
        />
      )}
    </svg>
  );
}

function StatusMarker({ status, onToggle }: { status: Status; onToggle: () => void }) {
  const title = status === "completed" ? "Mark incomplete" : "Mark completed";
  return (
    <button
      type="button"
      tabIndex={-1}
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "relative flex size-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer after:absolute after:-inset-2",
        status === "completed"
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-foreground/25 text-transparent hover:border-emerald-500 hover:text-emerald-500"
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </button>
  );
}

function HoverCard<D extends RailDay>({ row, rect }: { row: Row<D>; rect: DOMRect }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(rect.top);

  // Keep the card on screen once its height is known
  useLayoutEffect(() => {
    const height = ref.current?.offsetHeight ?? 0;
    setTop(Math.max(8, Math.min(rect.top, window.innerHeight - height - 8)));
  }, [rect, row.key]);

  const beside = rect.right + 12 + CARD_WIDTH <= window.innerWidth;
  const left = beside ? rect.right + 12 : Math.max(8, Math.min(rect.left + RAIL_WIDTH, window.innerWidth - CARD_WIDTH - 8));
  const isDay = row.kind === "day";
  const done = row.day.topics.filter((t) => t.status === "completed").length;
  const minutes = isDay
    ? row.day.topics.reduce((sum, t) => sum + t.estimated_minutes, 0)
    : row.topic.estimated_minutes;

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      style={{ left, width: CARD_WIDTH, top: beside ? top : rect.bottom + 6 }}
      className="pointer-events-none fixed z-[70] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
    >
      <p className="font-mono text-[11px] text-muted-foreground">
        Day {row.day.day_number}
        {!isDay && ` · Topic ${row.topic.topic_number}`}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{isDay ? dayTitle(row.day) : topicTitle(row.topic)}</p>
      <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
        {isDay ? row.day.description : row.topic.description}
      </p>
      <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        {minutes} min
        <span aria-hidden="true">·</span>
        {isDay ? `${done} of ${row.day.topics.length} topics done` : STATUS_LABEL[row.topic.status]}
      </p>
    </div>,
    document.body
  );
}
