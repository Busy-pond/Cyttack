import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Shield, Zap, Activity, Eye, Brain, ShieldCheck, RefreshCw,
  CheckCircle2, ArrowRight, Github, AlertTriangle, Clock, Network,
  Lock, Server, FileText,
} from "lucide-react";
import {
  AlertsDecayDiagram, ManualResponseDiagram, SiloDiagram,
} from "@/components/schematic/ProblemDiagrams";
import {
  DetectDiagram, PredictDiagram, RespondDiagram, RecoverDiagram,
} from "@/components/schematic/SolutionDiagrams";
import { SpinnerRing } from "@/components/schematic/Primitives";

// ── Gradient constants ────────────────────────────────────────────────
const HERO_GRADIENT = "linear-gradient(135deg, #1B1E3C 0%, #2B2E4A 35%, #1F4B44 70%, #14532D 100%)";

// ── Fade-up on scroll ────────────────────────────────────────────────
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("is-visible"); obs.unobserve(el); } },
      { threshold: 0.10 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FadeSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useFadeUp();
  return <div id={id} ref={ref} className={`reveal-section ${className}`}>{children}</div>;
}

// ── Eyebrow ───────────────────────────────────────────────────────────
function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-3 ${light ? "text-white/50" : "text-muted-foreground"}`}>
      {children}
    </p>
  );
}

// ── Workflow player tab definitions ───────────────────────────────────
const TABS = [
  {
    id: "detect", label: "DETECT", icon: Eye,
    title: "Anomaly detection in real time",
    desc: "Infrastructure telemetry is continuously monitored. Agents flag deviations from baseline the moment they occur.",
    accentColor: "#0D9488", panelBg: "rgba(13,148,136,0.08)",
    tabColor: "text-teal-400", barColor: "#0D9488",
  },
  {
    id: "predict", label: "PREDICT", icon: Brain,
    title: "Blast radius scored before impact",
    desc: "A Bayesian belief model calculates attack probability and propagation scope before it fully unfolds.",
    accentColor: "#B7791F", panelBg: "rgba(183,121,31,0.08)",
    tabColor: "text-amber-400", barColor: "#B7791F",
  },
  {
    id: "respond", label: "RESPOND", icon: ShieldCheck,
    title: "Autonomous countermeasures, zero lag",
    desc: "Agents execute containment in isolated sandboxes — auditable, reversible, faster than any human approval cycle.",
    accentColor: "#6366F1", panelBg: "rgba(99,102,241,0.08)",
    tabColor: "text-indigo-400", barColor: "#6366F1",
  },
  {
    id: "recover", label: "RECOVER", icon: RefreshCw,
    title: "Audit trail auto-generated, compliance ready",
    desc: "Every agent action traced end-to-end. Root-cause summary delivered automatically for compliance and leadership.",
    accentColor: "#2F855A", panelBg: "rgba(47,133,90,0.08)",
    tabColor: "text-emerald-400", barColor: "#2F855A",
  },
];

// ── Per-tab animated panel content ───────────────────────────────────
function DetectPanel() {
  const [hi, setHi] = useState(3);
  useEffect(() => { const t = setInterval(() => setHi((h) => (h + 1) % 7), 1600); return () => clearInterval(t); }, []);
  const lines = [
    { node: "NODE-001", event: "AUTH_SUCCESS user=admin", bad: false },
    { node: "NODE-002", event: "NET_TRAFFIC bytes=1.4MB", bad: false },
    { node: "NODE-003", event: "PROC_START cmd=svchost.exe", bad: false },
    { node: "NODE-004", event: "ANOMALY 3.2σ deviation", bad: true },
    { node: "NODE-005", event: "FILE_READ path=/etc/passwd", bad: false },
    { node: "NODE-006", event: "AUTH_FAIL attempts=14", bad: true },
    { node: "NODE-007", event: "NET_TRAFFIC bytes=0.3MB", bad: false },
  ];
  return (
    <div className="flex flex-col gap-1 font-mono text-[11px]">
      {lines.map((l, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1 rounded transition-all duration-500"
          style={{ background: i === hi ? (l.bad ? "rgba(192,57,43,0.15)" : "rgba(13,148,136,0.10)") : "transparent" }}>
          <span className="text-white/30 w-18 shrink-0 text-[9px]">{l.node}</span>
          <span className={`flex-1 ${!l.bad ? "text-white/60" : "text-red-400 font-semibold"}`}>{l.event}</span>
          {!l.bad && i === hi && <span className="text-[8px] text-teal-400 font-bold">OK</span>}
          {l.bad && i === hi && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded font-bold">FLAG</span>}
        </div>
      ))}
    </div>
  );
}

function PredictPanel() {
  const [score, setScore] = useState(12);
  useEffect(() => { const t = setInterval(() => setScore((s) => s >= 87 ? 12 : Math.min(87, s + 3)), 80); return () => clearInterval(t); }, []);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/60">Bayesian model updating…</span>
        <span className="font-mono text-sm font-bold text-amber-400">{score}%</span>
      </div>
      {[
        { label: "P(Lateral Move)", val: Math.min(score, 74), c: "#F2994A" },
        { label: "P(Data Exfil)", val: Math.min(score * 0.9, 63), c: "#F87171" },
        { label: "P(Persistence)", val: Math.min(score * 0.7, 51), c: "#A9A4FF" },
      ].map((b) => (
        <div key={b.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/50">{b.label}</span>
            <span className="font-mono text-white/80">{Math.round(b.val)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-75" style={{ width: `${b.val}%`, backgroundColor: b.c }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RespondPanel() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep((s) => (s >= 3 ? 0 : s + 1)), 1300); return () => clearInterval(t); }, []);
  const actions = [
    { a: "Isolate NODE-004 from segment", ms: "312ms" },
    { a: "Block outbound port 445", ms: "489ms" },
    { a: "Snapshot memory for forensics", ms: "1.2s" },
    { a: "Report dispatched to commander", ms: "1.8s" },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/30 mb-1">AGENT SANDBOX · EXECUTING</div>
      {actions.map((a, i) => (
        <div key={i} className="flex items-center gap-2.5">
          {i < step ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            : i === step ? <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
            : <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />}
          <span className={`flex-1 text-[11px] ${i < step ? "text-white/30 line-through" : i === step ? "text-white" : "text-white/20"}`}>{a.a}</span>
          {i < step && <span className="text-[9px] font-mono text-white/30">{a.ms}</span>}
        </div>
      ))}
    </div>
  );
}

function RecoverPanel() {
  const [ticked, setTicked] = useState(0);
  useEffect(() => { const t = setInterval(() => setTicked((s) => (s >= 5 ? 0 : s + 1)), 850); return () => clearInterval(t); }, []);
  const items = [
    { l: "Detection time logged", v: "00:00:04" },
    { l: "Containment confirmed", v: "00:00:09" },
    { l: "Blast radius assessed", v: "1 node" },
    { l: "Agent actions audited", v: "14 steps" },
    { l: "Compliance report done", v: "0 flags" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/30 mb-1">INCIDENT REPORT · AUTO-GENERATED</div>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between items-center border-b border-white/5 pb-1.5 last:border-0">
          <div className="flex items-center gap-1.5">
            {i < ticked ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" />}
            <span className={`text-[11px] ${i < ticked ? "text-white/70" : "text-white/20"}`}>{item.l}</span>
          </div>
          <span className={`text-[10px] font-mono font-semibold transition-opacity duration-300 ${i < ticked ? "text-emerald-400 opacity-100" : "opacity-0"}`}>{item.v}</span>
        </div>
      ))}
    </div>
  );
}

const TAB_PANELS = [DetectPanel, PredictPanel, RespondPanel, RecoverPanel];
const TAB_DURATION = 5000;

// ── WorkflowPlayer ────────────────────────────────────────────────────
function WorkflowPlayer() {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);

  const jumpTo = (idx: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setVisible(false);
    setTimeout(() => {
      setActiveTab(idx);
      setProgress(0);
      startRef.current = Date.now();
      setVisible(true);
    }, 300);
  };

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / TAB_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        setActiveTab((prev) => {
          const next = (prev + 1) % TABS.length;
          setVisible(false);
          setTimeout(() => { setProgress(0); startRef.current = Date.now(); setVisible(true); }, 300);
          return next;
        });
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeTab]);

  const tab = TABS[activeTab];
  const PanelContent = TAB_PANELS[activeTab];

  return (
    <div className="w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#181A2E]/80 backdrop-blur">
      {/* Tab header strip */}
      <div className="grid grid-cols-4 border-b border-white/10 bg-white/5">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const isActive = i === activeTab;
          return (
            <button key={t.id} onClick={() => jumpTo(i)}
              className={`relative flex flex-col items-center gap-1 py-3 px-2 text-center transition-colors ${isActive ? "bg-white/8" : "hover:bg-white/5"}`}>
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? t.tabColor : "text-white/25"}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? t.tabColor : "text-white/25"}`}>{t.label}</span>
              </div>
              <div className="w-full h-0.5 rounded-full overflow-hidden bg-white/10">
                <div className="h-full rounded-full transition-none" style={{ width: isActive ? `${progress}%` : "0%", backgroundColor: tab.barColor }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div className="transition-all duration-300 p-6 md:p-8"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)", background: tab.panelBg }}>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className={`font-heading text-xl font-bold mb-2 ${tab.tabColor}`}>{tab.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{tab.desc}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#181A2E]/60 p-5 min-h-[160px] flex flex-col justify-center">
            <PanelContent />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trusted sectors ───────────────────────────────────────────────────
const SECTORS = [
  "Power Grid Authority", "Metro Rail Operations", "National Health Network",
  "CERT-In SOC", "Water & Utilities Board", "Public Exam Board",
  "Defence Cyber Command", "Airport Operations Centre", "Smart City Mission",
];

// ── Problem cards ─────────────────────────────────────────────────────
const PROBLEM_CARDS = [
  { Diagram: AlertsDecayDiagram, title: "Alerts Pile Up Faster Than Analysts Can Read Them", body: "Thousands of log lines a minute. One missed signal is a breach." },
  { Diagram: ManualResponseDiagram, title: "Manual Response Takes Hours, Attacks Take Seconds", body: "By the time a human confirms an incident, lateral movement is already done." },
  { Diagram: SiloDiagram, title: "No One Has the Full Picture", body: "Compliance, ops, and security teams see different slices of the same attack." },
];

// ── Solution steps ────────────────────────────────────────────────────
const SOLUTION_STEPS = [
  {
    num: "1", title: "Detect", icon: Eye, Diagram: DetectDiagram, dark: false,
    desc: "SentinelGrid's agents continuously monitor infrastructure telemetry and flag anomalies the moment they deviate from baseline behavior.",
  },
  {
    num: "2", title: "Predict", icon: Brain, Diagram: PredictDiagram, dark: false,
    desc: "A Bayesian belief model scores the likelihood and blast radius of an attack before it fully unfolds, prioritizing what actually matters.",
  },
  {
    num: "3", title: "Respond", icon: ShieldCheck, Diagram: RespondDiagram, dark: true,
    desc: "Autonomous agents execute contained, auditable countermeasures in isolated sandboxes — no waiting on a human to click 'approve' during the critical first seconds.",
  },
  {
    num: "4", title: "Recover", icon: RefreshCw, Diagram: RecoverDiagram, dark: true,
    desc: "Full audit trail and root-cause summary generated automatically, so compliance and leadership see exactly what happened and why.",
  },
];

// ── Enterprise features ───────────────────────────────────────────────
const ENTERPRISE = [
  { icon: FileText, title: "Compliance-First Design", body: "Built around AML and regulatory audit requirements, not bolted on afterward." },
  { icon: Eye, title: "Full Agent Observability", body: "Every autonomous action traced end-to-end via Arize Phoenix — no black-box decisions." },
  { icon: Server, title: "Cloud-Native Integrations", body: "Deploys against real GCP resource telemetry, MongoDB Atlas, and existing SIEM/logging pipelines." },
];

const TESTIMONIALS = [
  { quote: "Response time went from hours to seconds during our tabletop exercise. The autonomous containment didn't touch anything it wasn't supposed to.", name: "A. Sharma", title: "Security Analyst", org: "Simulated Power Grid Authority" },
  { quote: "The audit trail alone would save our compliance team a full day per incident. Every agent action is traceable and explainable.", name: "R. Mehta", title: "Chief Information Security Officer", org: "Illustrative National Health Network" },
];

// ── Main component ────────────────────────────────────────────────────
export default function Landing() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const launchDemo = () => navigate("/simulation");

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ── NAV ── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur border-b border-border" : "bg-transparent border-b border-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className={`font-heading font-semibold text-base tracking-tight transition-colors ${scrolled ? "text-foreground" : "text-white"}`}>SentinelGrid</span>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            {[["PRODUCT","#product"],["HOW IT WORKS","#solution"],["IMPACT","#impact"],["ABOUT","#enterprise"]].map(([label, href]) => (
              <a key={label} href={href}
                className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/60 hover:text-white"}`}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm"
              className={`text-xs font-semibold uppercase tracking-wider hidden sm:inline-flex ${scrolled ? "" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
              Log in
            </Button>
            <Button size="sm" onClick={launchDemo}
              className={`text-xs font-semibold uppercase tracking-wider gap-1.5 ${scrolled ? "bg-primary text-white hover:bg-primary/90" : "bg-white text-primary hover:bg-white/90"}`}>
              Launch Live Demo <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div id="product" style={{ background: HERO_GRADIENT }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <Eyebrow light>AI Incident Response for Critical Infrastructure</Eyebrow>
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.06] max-w-3xl mx-auto">
            Helping security teams stop attacks before they spread.
          </h1>
          <p className="mt-6 text-lg text-white/65 max-w-2xl mx-auto leading-relaxed">
            An autonomous multi-agent system that detects, predicts, and neutralizes attacks on power grids, hospitals, and rail networks — in seconds, not days.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" onClick={launchDemo}
              className="bg-white text-primary hover:bg-white/90 text-sm font-semibold uppercase tracking-wider gap-2 px-8">
              Launch Live Demo <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-semibold uppercase tracking-wider gap-2 px-8 border-white/30 text-white hover:bg-white/10">
              How It Works
            </Button>
          </div>

          <div className="mt-14 text-left">
            <WorkflowPlayer />
          </div>
        </div>

        {/* ── TRUSTED BY ── (inside dark hero) */}
        <div className="border-t border-white/10 py-10 overflow-hidden">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-6">
            Built for the sectors that can't afford downtime.
          </p>
          <div className="relative flex overflow-hidden">
            <div className="marquee-track flex gap-16 items-center animate-marquee whitespace-nowrap">
              {[...SECTORS, ...SECTORS].map((s, i) => (
                <span key={i} className="text-sm font-semibold text-white/20 uppercase tracking-wider shrink-0">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section className="py-24 bg-background" id="problem">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection className="text-center mb-14">
            <div style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(192,57,43,0.07), transparent)" }} className="py-4">
              <Eyebrow>The Problem</Eyebrow>
              <h2 className="font-heading text-4xl font-bold text-foreground max-w-2xl mx-auto">
                Security teams see the alert. By the time they act, it's already too late.
              </h2>
            </div>
          </FadeSection>
          <div className="grid md:grid-cols-3 gap-6">
            {PROBLEM_CARDS.map(({ Diagram, title, body }) => (
              <FadeSection key={title}>
                <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4">
                    <Diagram />
                  </div>
                  <div className="px-5 pb-5">
                    <h3 className="font-heading text-sm font-bold text-foreground mb-1.5">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution">
        {SOLUTION_STEPS.map((step, i) => {
          const Icon = step.icon;
          const reversed = i % 2 === 1;
          const isDark = step.dark;

          return (
            <div key={step.num}
              style={isDark ? { background: HERO_GRADIENT } : { background: i % 2 === 0 ? "hsl(var(--background))" : "hsl(var(--secondary)/0.4)" }}>
              <div className="max-w-6xl mx-auto px-6 py-20">
                <FadeSection>
                  {i === 0 && (
                    <div className="text-center mb-16">
                      <Eyebrow light={isDark}>The Solution</Eyebrow>
                      <h2 className={`font-heading text-4xl font-bold max-w-2xl mx-auto ${isDark ? "text-white" : "text-foreground"}`}>
                        4 stages that cut incident response from hours to seconds.
                      </h2>
                    </div>
                  )}
                  <div className={`grid md:grid-cols-2 gap-12 items-center ${reversed ? "md:[direction:rtl]" : ""}`}>
                    {/* Text */}
                    <div className={reversed ? "[direction:ltr]" : ""}>
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`font-heading text-6xl font-bold leading-none select-none ${isDark ? "text-white/15" : "text-border"}`}>{step.num}</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-white/10" : "bg-primary/8"}`}>
                          <Icon className={`w-5 h-5 ${isDark ? "text-white/80" : "text-primary"}`} />
                        </div>
                      </div>
                      <h3 className={`font-heading text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-foreground"}`}>{step.title}</h3>
                      <p className={`text-base leading-relaxed ${isDark ? "text-white/60" : "text-muted-foreground"}`}>{step.desc}</p>
                    </div>
                    {/* Diagram */}
                    <div className={reversed ? "[direction:ltr]" : ""}>
                      <step.Diagram />
                    </div>
                  </div>
                </FadeSection>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── IMPACT ── */}
      <section id="impact" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection className="text-center mb-16">
            <div style={{ background: "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(43,46,74,0.06), transparent)" }} className="py-4">
              <Eyebrow>The Impact</Eyebrow>
              <h2 className="font-heading text-4xl font-bold text-foreground max-w-xl mx-auto">
                What happens when detection and response are the same step.
              </h2>
              <p className="text-xs text-muted-foreground mt-3">Simulated / estimated figures from tabletop scenarios.</p>
            </div>
          </FadeSection>
          <FadeSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { val: "90%+", label: "Faster mean-time-to-detect vs. manual triage", icon: Zap },
                { val: "< 5s", label: "From anomaly flagged to countermeasure deployed", icon: Activity },
                { val: "5", label: "Categories of compliance violations auto-detected", icon: Lock },
                { val: "100%", label: "Auditable — every agent action logged and traceable", icon: CheckCircle2 },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.val} className="flex flex-col items-center text-center gap-3">
                    <Icon className="w-6 h-6 text-muted-foreground/50" />
                    <div className="font-heading text-5xl font-bold text-foreground">{stat.val}</div>
                    <div className="text-sm text-muted-foreground leading-snug max-w-[140px]">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── ENTERPRISE ── */}
      <section id="enterprise" className="py-24 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection className="text-center mb-14">
            <Eyebrow>Enterprise-Ready</Eyebrow>
            <h2 className="font-heading text-4xl font-bold text-foreground max-w-xl mx-auto">
              Built for regulated environments from day one.
            </h2>
          </FadeSection>
          <div className="grid md:grid-cols-3 gap-6">
            {ENTERPRISE.map((feat) => {
              const Icon = feat.icon;
              return (
                <FadeSection key={feat.title}>
                  <div className="rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-base font-bold text-foreground mb-2">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.body}</p>
                  </div>
                </FadeSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection className="text-center mb-12">
            <Eyebrow>Illustrative Feedback</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-foreground">What a SOC lead would say.</h2>
            <p className="text-xs text-muted-foreground mt-2">Clearly fictional personas — for demo purposes only.</p>
          </FadeSection>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <FadeSection key={t.name}>
                <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                  <p className="text-base text-foreground leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.title}</div>
                    <div className="text-xs text-muted-foreground/60">{t.org}</div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: HERO_GRADIENT }} className="py-32">
        <FadeSection className="max-w-3xl mx-auto px-6 text-center">
          <Eyebrow light>Live Simulation</Eyebrow>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            See SentinelGrid stop a live attack in real time.
          </h2>
          <Button size="lg" onClick={launchDemo}
            className="bg-white text-primary hover:bg-white/90 text-sm font-semibold uppercase tracking-wider gap-2 px-10">
            Launch Live Demo <ArrowRight className="w-4 h-4" />
          </Button>
        </FadeSection>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-background py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-heading font-semibold text-sm">SentinelGrid</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              An autonomous multi-agent system for detecting and responding to threats against critical infrastructure. Built for CERT-In and India's national cyber resilience.
            </p>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Product</div>
            <div className="flex flex-col gap-2">
              {["Detect","Predict","Respond","Recover"].map((l) => (
                <a key={l} href="#solution" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Learn More</div>
            <div className="flex flex-col gap-2">
              {[
                { label: "How It Works", href: "#solution" },
                { label: "Impact", href: "#impact" },
                { label: "Enterprise", href: "#enterprise" },
                { label: "GitHub", href: "https://github.com", ext: true },
              ].map((l) => (
                <a key={l.label} href={l.href}
                  target={l.ext ? "_blank" : undefined}
                  rel={l.ext ? "noreferrer" : undefined}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  {l.ext && <Github className="w-3.5 h-3.5" />} {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-border flex flex-wrap justify-between gap-3">
          <p className="text-xs text-muted-foreground">© 2025 SentinelGrid · Built for national hackathon demo purposes only.</p>
          <p className="text-xs text-muted-foreground">All sector names, personas, and statistics are fictional / simulated.</p>
        </div>
      </footer>
    </div>
  );
}
