import { useEffect, useRef, useState } from "react";
import { BoltedPanel, DotGrid, FlatTag, PixelNumeral, SpinnerRing, StatusOctagon } from "./Primitives";

// Shared animated SVG line-draw connector
function DrawLine({
  x1, y1, x2, y2, bend = false, color = "#4A4E70", delay = 0,
}: {
  x1: number; y1: number; x2: number; y2: number;
  bend?: boolean; color?: string; delay?: number;
}) {
  const len = Math.hypot(x2 - x1, y2 - y1) + (bend ? Math.abs(x2 - x1) + Math.abs(y2 - y1) : 0);
  return (
    <>
      {bend ? (
        // Right-angle route: horizontal then vertical
        <>
          <line x1={x1} y1={y1} x2={x2} y2={y1}
            stroke={color} strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray={Math.abs(x2-x1)}
            style={{ animation: `line-draw ${0.5}s linear ${delay}s both` }}
          />
          <line x1={x2} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray={Math.abs(y2-y1)}
            style={{ animation: `line-draw ${0.4}s linear ${delay + 0.5}s both` }}
          />
        </>
      ) : (
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={len}
          style={{ animation: `line-draw ${0.6}s linear ${delay}s both` }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 1 — DETECT — Line-draw routing
// TELEMETRY tag → Cyttack panel → ANOMALY FLAGGED + checkmark
// ─────────────────────────────────────────────────────────────────────
export function DetectDiagram() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKey((k) => k + 1), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div key={key} className="relative w-full h-[180px] bg-[#181A2E] rounded-xl overflow-hidden">
      <DotGrid />
      <div className="absolute inset-0 flex items-center justify-between px-4 gap-2">
        {/* Input */}
        <div className="flex flex-col items-center gap-1.5">
          <FlatTag color="#F2D94E" className="block">TELEMETRY</FlatTag>
          <div className="w-px h-8 bg-[#4A4E70]" style={{ animation: "line-draw 0.5s linear 0.2s both" }} />
          <FlatTag color="#7FC8F8" textColor="#111">INFRA LOG</FlatTag>
        </div>

        {/* Lines to core */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-px bg-[#4A4E70]" style={{ animation: "line-draw 0.5s linear 0.6s both" }} />
        </div>

        {/* Core panel */}
        <BoltedPanel label="CYTTACK" className="w-[90px] shrink-0">
          <div className="flex justify-center py-1">
            <SpinnerRing size={28} color="#7FC8F8" />
          </div>
        </BoltedPanel>

        {/* Lines to output */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-px bg-[#4A4E70]" style={{ animation: "line-draw 0.5s linear 1.2s both" }} />
        </div>

        {/* Output */}
        <div
          className="flex flex-col items-center gap-2"
          style={{ animation: "fade-in-schematic 0.4s ease 1.7s both" }}
        >
          <StatusOctagon status="success" size={26} />
          <FlatTag color="#B9E88A" textColor="#111">FLAGGED</FlatTag>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 2 — PREDICT — Count-up + Branch with sub-rows
// RISK SCORE → stat card counting to 94 → PRIORS/ENTROPY/POSTERIOR
// ─────────────────────────────────────────────────────────────────────
export function PredictDiagram() {
  const [score, setScore] = useState(0);
  const [litRow, setLitRow] = useState(-1);
  useEffect(() => {
    let n = 0;
    let row = -1;
    const t = setInterval(() => {
      n += 3;
      if (n > 94) {
        n = 94;
        clearInterval(t);
        // Light up rows in sequence
        const r1 = setTimeout(() => setLitRow(0), 300);
        const r2 = setTimeout(() => setLitRow(1), 700);
        const r3 = setTimeout(() => setLitRow(2), 1100);
        const reset = setTimeout(() => {
          setScore(0);
          setLitRow(-1);
        }, 3500);
        return;
      }
      setScore(n);
      // Light rows based on score milestones
      const newRow = n > 70 ? 2 : n > 45 ? 1 : n > 20 ? 0 : -1;
      if (newRow !== row) { row = newRow; setLitRow(newRow); }
    }, 55);
    return () => clearInterval(t);
  }, []);

  const rows = ["PRIORS", "ENTROPY", "POSTERIOR"];
  const rowColors = ["#A9A4FF", "#7FC8F8", "#4ADE80"];

  return (
    <div className="relative w-full h-[180px] bg-[#181A2E] rounded-xl overflow-hidden">
      <DotGrid />
      <div className="absolute inset-0 flex items-center gap-3 px-4">
        {/* Input tag */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <FlatTag color="#A9A4FF" textColor="#111">RISK</FlatTag>
          <FlatTag color="#A9A4FF" textColor="#111">SCORE</FlatTag>
        </div>

        {/* Arrow */}
        <div className="w-6 h-px bg-[#4A4E70] shrink-0" />

        {/* Belief state panel */}
        <BoltedPanel label="BELIEF STATE" className="w-[88px] shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <PixelNumeral value={String(score).padStart(2, "0")} color="#A9A4FF" size="1.3rem" />
            <div className="text-[7px] font-mono text-[#555870] tracking-widest">% CONFIDENCE</div>
          </div>
        </BoltedPanel>

        {/* Arrow */}
        <div className="w-6 h-px bg-[#4A4E70] shrink-0" />

        {/* Sub-rows panel */}
        <BoltedPanel className="flex-1">
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={r} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
                  style={{ backgroundColor: litRow >= i ? rowColors[i] : "#2E3150" }}
                />
                <div
                  className="text-[9px] font-mono font-bold uppercase tracking-widest transition-colors duration-300"
                  style={{ color: litRow >= i ? rowColors[i] : "#3A3E58" }}
                >
                  {r}
                </div>
              </div>
            ))}
          </div>
        </BoltedPanel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 3 — RESPOND — Spinner core
// INCIDENT + AI tags → spinning agent panel → DEPLOYED + CONTAINED
// ─────────────────────────────────────────────────────────────────────
export function RespondDiagram() {
  const [showOutput, setShowOutput] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setShowOutput(true);
      setTimeout(() => setShowOutput(false), 2200);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-[180px] bg-[#181A2E] rounded-xl overflow-hidden">
      <DotGrid />
      <div className="absolute inset-0 flex items-center gap-2 px-3">
        {/* Inputs */}
        <div className="flex flex-col gap-2 shrink-0">
          <FlatTag color="#F2994A">INCIDENT</FlatTag>
          <FlatTag color="#F2D94E" textColor="#111">AI AGENT</FlatTag>
        </div>

        {/* Arrow */}
        <div className="w-5 h-px bg-[#4A4E70] shrink-0" />

        {/* Spinning core */}
        <BoltedPanel label="PROCESSING" className="w-[80px] shrink-0">
          <div className="flex justify-center py-1">
            <SpinnerRing size={34} color="#F2994A" />
          </div>
        </BoltedPanel>

        {/* Arrow */}
        <div className="w-5 h-px bg-[#4A4E70] shrink-0" />

        {/* Outputs */}
        <div
          className="flex flex-col gap-2 transition-opacity duration-500"
          style={{ opacity: showOutput ? 1 : 0.15 }}
        >
          <div className="flex items-center gap-1.5">
            <StatusOctagon status="success" size={20} />
            <FlatTag color="#B9E88A" textColor="#111">DEPLOYED</FlatTag>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusOctagon status="success" size={20} />
            <FlatTag color="#B9E88A" textColor="#111">CONTAINED</FlatTag>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step 4 — RECOVER — Line-draw + stacked rows → INCIDENT CLOSED
// ─────────────────────────────────────────────────────────────────────
export function RecoverDiagram() {
  const [litRow, setLitRow] = useState(-1);
  useEffect(() => {
    const tick = () => {
      setLitRow(-1);
      const t1 = setTimeout(() => setLitRow(0), 600);
      const t2 = setTimeout(() => setLitRow(1), 1100);
      const t3 = setTimeout(() => setLitRow(2), 1600);
      const reset = setTimeout(() => { setLitRow(-1); tick(); }, 4000);
      return () => [t1, t2, t3, reset].forEach(clearTimeout);
    };
    const stop = tick();
    return stop;
  }, []);

  const rows = [
    { label: "ACTIONS LOGGED", color: "#7FC8F8" },
    { label: "ROOT CAUSE", color: "#A9A4FF" },
    { label: "REPORT GEN", color: "#4ADE80" },
  ];

  return (
    <div className="relative w-full h-[180px] bg-[#181A2E] rounded-xl overflow-hidden">
      <DotGrid />
      <div className="absolute inset-0 flex items-center gap-3 px-4">
        {/* Audit trail panel with stacked rows */}
        <BoltedPanel label="AUDIT TRAIL" className="flex-1">
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={r.label} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-400"
                  style={{ backgroundColor: litRow >= i ? r.color : "#2E3150" }}
                />
                <div
                  className="text-[9px] font-mono font-bold uppercase tracking-widest transition-colors duration-400"
                  style={{ color: litRow >= i ? r.color : "#3A3E58" }}
                >
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        </BoltedPanel>

        {/* Connector */}
        <div
          className="w-8 h-px bg-[#4A4E70] shrink-0 transition-opacity duration-300"
          style={{ opacity: litRow >= 2 ? 1 : 0.2 }}
        />

        {/* Final checkmark */}
        <div
          className="flex flex-col items-center gap-1.5 transition-opacity duration-500"
          style={{ opacity: litRow >= 2 ? 1 : 0.1 }}
        >
          <StatusOctagon status="success" size={32} />
          <FlatTag color="#B9E88A" textColor="#111">CLOSED</FlatTag>
        </div>
      </div>
    </div>
  );
}
