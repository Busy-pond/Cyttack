import { useEffect, useRef, useState } from "react";
import { BoltedPanel, DotGrid, FlatTag, PixelNumeral, StatusOctagon } from "./Primitives";

// ─────────────────────────────────────────────────────────────────────
// Card 1 — DECAY BOUNCE
// Dotted timeline MON·TUE·WED·THU with bouncing decay arcs
// ─────────────────────────────────────────────────────────────────────
export function AlertsDecayDiagram() {
  const [phase, setPhase] = useState(0); // 0-4 arcs revealed, then reset
  useEffect(() => {
    const t = setInterval(() => {
      setPhase((p) => (p >= 5 ? 0 : p + 1));
    }, 700);
    return () => clearInterval(t);
  }, []);

  const arcs = [
    { x1: 22, x2: 88, h: 58, opacity: 1.0, color: "#F2994A", dash: "" },
    { x1: 88, x2: 148, h: 36, opacity: 0.7, color: "#F2994A", dash: "" },
    { x1: 148, x2: 200, h: 18, opacity: 0.4, color: "#F2994A", dash: "5 3" },
    { x1: 200, x2: 244, h: 8, opacity: 0.2, color: "#F2994A", dash: "3 3" },
  ];

  return (
    <div className="relative w-full h-[148px] bg-[#181A2E] rounded-xl overflow-hidden">
      <DotGrid />
      <svg
        viewBox="0 0 268 130"
        className="absolute inset-0 w-full h-full"
        style={{ padding: 0 }}
      >
        {/* Dotted baseline */}
        <line
          x1="16" y1="96" x2="254" y2="96"
          stroke="#363858" strokeWidth="1" strokeDasharray="4 4"
        />

        {/* Day labels */}
        {["MON", "TUE", "WED", "THU"].map((d, i) => (
          <text key={d} x={40 + i * 58} y="114" fill="#434568" fontSize="7"
            textAnchor="middle" fontFamily="monospace" fontWeight="bold">
            {d}
          </text>
        ))}

        {/* Arcs */}
        {arcs.map((arc, i) => {
          const mid = (arc.x1 + arc.x2) / 2;
          const path = `M ${arc.x1} 96 Q ${mid} ${96 - arc.h} ${arc.x2} 96`;
          const visible = phase > i;
          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={arc.color}
              strokeWidth="2"
              strokeDasharray={arc.dash}
              style={{
                opacity: visible ? arc.opacity : 0,
                transition: "opacity 0.35s ease",
              }}
            />
          );
        })}

        {/* X badge at end of decay */}
        {phase >= 5 && (
          <g transform="translate(230, 72)">
            {/* inline octagon fail */}
            <polygon
              points="13,2 19,2 24,7 24,13 19,18 13,18 8,13 8,7"
              fill="#F87171"
            />
            <line x1="13" y1="7" x2="19" y2="13" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="19" y1="7" x2="13" y2="13" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Card 2 — COUNT-UP + BRANCH
// Pixel numeral counting to 500, branching to 92% NOISE / 8 REAL
// ─────────────────────────────────────────────────────────────────────
export function ManualResponseDiagram() {
  const [count, setCount] = useState(0);
  const [showBranch, setShowBranch] = useState(false);
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      n += 18;
      if (n >= 500) {
        n = 500;
        clearInterval(t);
        setTimeout(() => setShowBranch(true), 300);
        setTimeout(() => {
          setCount(0);
          setShowBranch(false);
          // restart after a pause
          let n2 = 0;
          const t2 = setInterval(() => {
            n2 += 18;
            setCount(n2);
            if (n2 >= 500) {
              clearInterval(t2);
              setTimeout(() => setShowBranch(true), 300);
            }
          }, 50);
        }, 3200);
      }
      setCount(n);
    }, 50);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-[148px] bg-[#181A2E] rounded-xl overflow-hidden">
      <DotGrid />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <BoltedPanel className="w-28 flex flex-col items-center py-2">
          <PixelNumeral value={count} color="#F2D94E" size="1.5rem" />
          <div className="text-[8px] font-mono font-bold tracking-widest text-[#555870] mt-1">
            ALERTS/WK
          </div>
        </BoltedPanel>

        {/* Branch lines + tags */}
        <div
          className="flex gap-3 transition-all duration-400"
          style={{ opacity: showBranch ? 1 : 0 }}
        >
          <FlatTag color="#F2994A" className="flex items-center gap-1">
            <span>🗑</span> 92% NOISE
          </FlatTag>
          <FlatTag color="#B9E88A" textColor="#111">
            <span>✓</span> 8 REAL
          </FlatTag>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Card 3 — GHOSTED SILOS
// Two bolted panels at 50% opacity, connector line that never completes
// ─────────────────────────────────────────────────────────────────────
export function SiloDiagram() {
  const lineRef = useRef<SVGLineElement>(null);
  const [dashOffset, setDashOffset] = useState(80);

  useEffect(() => {
    // Animate the line trying to connect but stopping at the midpoint
    let dir = -1;
    let val = 80;
    const t = setInterval(() => {
      val += dir * 2;
      if (val <= 40) { dir = 1; }
      if (val >= 80) { dir = -1; }
      setDashOffset(val);
    }, 40);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-[148px] bg-[#181A2E] rounded-xl overflow-hidden">
      <DotGrid />
      <div className="absolute inset-0 flex items-center justify-between px-5">
        <BoltedPanel opacity={0.45} label="SOC TEAM" className="w-[90px]">
          <div className="flex flex-col gap-1 mt-1">
            {["ALERTS", "TRIAGE"].map((r) => (
              <div key={r} className="h-2 w-full rounded-sm bg-[#2E3150]" />
            ))}
          </div>
        </BoltedPanel>

        {/* Connector SVG — line that never reaches the other side */}
        <svg
          className="flex-1 h-8 mx-1"
          viewBox="0 0 80 32"
          preserveAspectRatio="none"
        >
          <line
            ref={lineRef}
            x1="0" y1="16" x2="80" y2="16"
            stroke="#4A4E70"
            strokeWidth="1.5"
            strokeDasharray="80"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
          {/* Arrow head stub that never arrives */}
          <polyline
            points="72,10 80,16 72,22"
            fill="none"
            stroke="#4A4E70"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.3}
          />
        </svg>

        <BoltedPanel opacity={0.45} label="COMPLIANCE" className="w-[90px]">
          <div className="flex flex-col gap-1 mt-1">
            {["AUDITS", "REPORTS"].map((r) => (
              <div key={r} className="h-2 w-full rounded-sm bg-[#2E3150]" />
            ))}
          </div>
        </BoltedPanel>
      </div>

      {/* "NOT CONNECTED" label */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#F87171]/60">
          no shared context
        </span>
      </div>
    </div>
  );
}
