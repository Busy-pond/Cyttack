import { useId } from "react";

// ── Corner bolt ───────────────────────────────────────────────────────
function Bolt({ pos }: { pos: string }) {
  return (
    <div className={`absolute ${pos} w-3 h-3`}>
      <svg viewBox="0 0 12 12" className="w-full h-full">
        <circle cx="6" cy="6" r="5" fill="#252840" stroke="#3A3E60" strokeWidth="1" />
        <line x1="3" y1="6" x2="9" y2="6" stroke="#4A5070" strokeWidth="1" />
        <line x1="6" y1="3" x2="6" y2="9" stroke="#4A5070" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── BoltedPanel ───────────────────────────────────────────────────────
export function BoltedPanel({
  children,
  className = "",
  label,
  opacity = 1,
}: {
  children?: React.ReactNode;
  className?: string;
  label?: string;
  opacity?: number;
}) {
  return (
    <div
      className={`relative rounded-xl border border-[#373A5A] bg-[#1C1E35] px-4 py-3 ${className}`}
      style={{ opacity }}
    >
      <Bolt pos="top-1.5 left-1.5" />
      <Bolt pos="top-1.5 right-1.5" />
      <Bolt pos="bottom-1.5 left-1.5" />
      <Bolt pos="bottom-1.5 right-1.5" />
      {label && (
        <div className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#555870] mb-2 text-center">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

// ── FlatTag ───────────────────────────────────────────────────────────
export function FlatTag({
  children,
  color = "#F2994A",
  textColor = "#111",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${className}`}
      style={{ backgroundColor: color, color: textColor, borderRadius: 2 }}
    >
      {children}
    </div>
  );
}

// ── PixelNumeral ──────────────────────────────────────────────────────
export function PixelNumeral({
  value,
  color = "#F2D94E",
  size = "1.8rem",
  className = "",
}: {
  value: string | number;
  color?: string;
  size?: string;
  className?: string;
}) {
  return (
    <span
      className={`leading-none ${className}`}
      style={{
        color,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: size,
        lineHeight: 1,
      }}
    >
      {value}
    </span>
  );
}

// ── StatusOctagon ─────────────────────────────────────────────────────
export function StatusOctagon({
  status,
  size = 26,
}: {
  status: "success" | "fail";
  size?: number;
}) {
  const fill = status === "success" ? "#4ADE80" : "#F87171";
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 - 22.5) * Math.PI) / 180;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <polygon points={pts} fill={fill} />
      {status === "success" ? (
        <polyline
          points={`${size * 0.27},${size * 0.5} ${size * 0.44},${size * 0.66} ${size * 0.73},${size * 0.34}`}
          fill="none"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <line x1={size*0.3} y1={size*0.3} x2={size*0.7} y2={size*0.7} stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <line x1={size*0.7} y1={size*0.3} x2={size*0.3} y2={size*0.7} stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ── DotGrid ───────────────────────────────────────────────────────────
export function DotGrid({ light = false }: { light?: boolean }) {
  const id = `dg${useId().replace(/:/g, "")}`;
  const dotColor = light
    ? "rgba(0,0,0,0.06)"
    : "rgba(255,255,255,0.07)";
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.75" fill={dotColor} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// ── SpinnerRing ───────────────────────────────────────────────────────
// 8 pixel dots rotating — the SPINNER CORE animation (Section 14.7)
export function SpinnerRing({
  size = 40,
  color = "#A9A4FF",
}: {
  size?: number;
  color?: string;
}) {
  const cx = size / 2;
  const r = size / 2 - 4;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ animation: "spin-ring 1.2s linear infinite" }}
    >
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const x = cx + r * Math.cos(a);
        const y = cx + r * Math.sin(a);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5}
            fill={color}
            opacity={0.2 + (i / 8) * 0.8}
          />
        );
      })}
    </svg>
  );
}
