import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Zap,
  Activity,
  Eye,
  Brain,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Github,
  AlertTriangle,
  Clock,
  Network,
  Lock,
  Server,
  FileText,
} from "lucide-react";

// ── Fade-up on scroll hook ───────────────────────────────────────────
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Eyebrow label ────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

// ── Section wrapper with fade-up ─────────────────────────────────────
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useFadeUp();
  return (
    <section
      id={id}
      ref={ref}
      className={`reveal-section py-24 max-w-6xl mx-auto px-6 ${className}`}
    >
      {children}
    </section>
  );
}

// ── Tab strip for hero ───────────────────────────────────────────────
const HERO_TABS = [
  {
    id: "detect",
    label: "DETECT",
    icon: Eye,
    title: "Anomaly detection in real time",
    desc: "Infrastructure telemetry is continuously monitored. Agents flag deviations from baseline the moment they occur — before an alert queue ever forms.",
    color: "text-primary",
    bg: "bg-primary/8",
    visual: (
      <div className="w-full h-52 flex items-center justify-center relative overflow-hidden rounded-xl bg-secondary border border-border">
        <div className="absolute inset-0 flex flex-col gap-2 p-4 opacity-40">
          {[85, 60, 90, 45, 78, 55, 92].map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-16 text-[9px] text-muted-foreground font-mono shrink-0">
                NODE-{String(i + 1).padStart(3, "0")}
              </div>
              <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${v}%` }}
                />
              </div>
              <div className="w-8 text-[9px] text-muted-foreground font-mono">{v}%</div>
            </div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-critical/10 border border-critical/30 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-critical" />
          </div>
          <div className="text-xs font-semibold text-foreground">Anomaly detected</div>
          <div className="text-[10px] text-muted-foreground">NODE-004 · 3.2σ deviation</div>
        </div>
      </div>
    ),
  },
  {
    id: "predict",
    label: "PREDICT",
    icon: Brain,
    title: "Blast radius scored before impact",
    desc: "A Bayesian belief model calculates attack probability and propagation scope — so analysts focus on the 1 alert that matters, not the 10,000 that don't.",
    color: "text-high",
    bg: "bg-high/8",
    visual: (
      <div className="w-full h-52 flex items-center justify-center relative overflow-hidden rounded-xl bg-secondary border border-border">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-end gap-3">
            {[
              { label: "P(Breach)", val: 87, color: "bg-critical" },
              { label: "P(Spread)", val: 62, color: "bg-high" },
              { label: "P(Recovery)", val: 41, color: "bg-low" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1">
                <div className="text-xs font-bold text-foreground">{b.val}%</div>
                <div
                  className={`w-10 ${b.color} rounded-t-sm`}
                  style={{ height: `${b.val * 0.6}px` }}
                />
                <div className="text-[9px] text-muted-foreground">{b.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-high/10 border border-high/20">
            <Brain className="w-3.5 h-3.5 text-high" />
            <span className="text-[10px] font-semibold text-high">HIGH CONFIDENCE</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "respond",
    label: "RESPOND",
    icon: ShieldCheck,
    title: "Autonomous countermeasures, zero lag",
    desc: "Agents execute containment in isolated sandboxes. Auditable, reversible, and faster than any human approval cycle during the critical first seconds.",
    color: "text-contained",
    bg: "bg-contained/8",
    visual: (
      <div className="w-full h-52 flex flex-col justify-center gap-2 px-6 rounded-xl bg-secondary border border-border overflow-hidden">
        {[
          { action: "Isolate NODE-004 from network segment", status: "done", ms: "312ms" },
          { action: "Block outbound traffic on port 445", status: "done", ms: "489ms" },
          { action: "Snapshot memory state for forensics", status: "done", ms: "1.2s" },
          { action: "Notify incident commander", status: "active", ms: "…" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.status === "done" ? (
              <CheckCircle2 className="w-4 h-4 text-contained shrink-0" />
            ) : (
              <Activity className="w-4 h-4 text-primary shrink-0 animate-pulse" />
            )}
            <div className="flex-1 text-xs text-foreground">{step.action}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{step.ms}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "recover",
    label: "RECOVER",
    icon: RefreshCw,
    title: "Audit trail auto-generated, compliance ready",
    desc: "Every agent action is traced end-to-end. Root-cause summary and timeline delivered automatically — so compliance and leadership see exactly what happened.",
    color: "text-low",
    bg: "bg-low/8",
    visual: (
      <div className="w-full h-52 flex flex-col justify-center gap-2 px-5 rounded-xl bg-secondary border border-border overflow-hidden">
        <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          INCIDENT REPORT · AUTO-GENERATED
        </div>
        {[
          { label: "Detection time", value: "00:00:04" },
          { label: "Containment time", value: "00:00:09" },
          { label: "Blast radius", value: "1 node (contained)" },
          { label: "Actions logged", value: "14 auditable steps" },
          { label: "Compliance flags", value: "0 violations" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">{row.label}</span>
            <span className="text-[11px] font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const TRUSTED_SECTORS = [
  "Power Grid Authority",
  "Metro Rail Operations",
  "National Health Network",
  "CERT-In SOC",
  "Water & Utilities Board",
  "Public Exam Board",
  "Defence Cyber Command",
  "Airport Operations Centre",
  "Smart City Mission",
  "Nuclear Safety Board",
];

const PROBLEM_CARDS = [
  {
    icon: AlertTriangle,
    title: "Alerts pile up faster than analysts can read them.",
    body: "Thousands of log lines a minute. One missed signal is a breach.",
    color: "text-critical",
    bg: "bg-critical/6",
  },
  {
    icon: Clock,
    title: "Manual response takes hours. Attacks take seconds.",
    body: "By the time a human confirms an incident, lateral movement is already done.",
    color: "text-high",
    bg: "bg-high/6",
  },
  {
    icon: Network,
    title: "No one has the full picture.",
    body: "Compliance, ops, and security teams see different slices of the same attack.",
    color: "text-primary",
    bg: "bg-primary/6",
  },
];

const SOLUTION_STEPS = [
  {
    num: "1",
    title: "Detect",
    icon: Eye,
    desc: "SentinelGrid's agents continuously monitor infrastructure telemetry and flag anomalies the moment they deviate from baseline behavior.",
  },
  {
    num: "2",
    title: "Predict",
    icon: Brain,
    desc: "A Bayesian belief model scores the likelihood and blast radius of an attack before it fully unfolds, prioritizing what actually matters.",
  },
  {
    num: "3",
    title: "Respond",
    icon: ShieldCheck,
    desc: "Autonomous agents execute contained, auditable countermeasures in isolated sandboxes — no waiting on a human to click 'approve' during the critical first seconds.",
  },
  {
    num: "4",
    title: "Recover",
    icon: RefreshCw,
    desc: "Full audit trail and root-cause summary generated automatically, so compliance and leadership see exactly what happened and why.",
  },
];

const ENTERPRISE_FEATURES = [
  {
    icon: FileText,
    title: "Compliance-First Design",
    body: "Built around AML and regulatory audit requirements, not bolted on afterward.",
  },
  {
    icon: Eye,
    title: "Full Agent Observability",
    body: "Every autonomous action is traced end-to-end via Arize Phoenix — no black-box decisions.",
  },
  {
    icon: Server,
    title: "Cloud-Native Integrations",
    body: "Deploys against real GCP resource telemetry, MongoDB Atlas, and existing SIEM/logging pipelines — no rip and replace.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Response time went from hours to seconds during our tabletop exercise. The autonomous containment didn't touch anything it wasn't supposed to.",
    name: "A. Sharma",
    title: "Security Analyst",
    org: "Simulated Power Grid Authority",
  },
  {
    quote:
      "The audit trail alone would save our compliance team a full day per incident. Every agent action is traceable and explainable.",
    name: "R. Mehta",
    title: "Chief Information Security Officer",
    org: "Illustrative National Health Network",
  },
];

// ── Main component ───────────────────────────────────────────────────
export default function Landing() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  const launchDemo = () => navigate("/simulation");

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-semibold text-base tracking-tight">
              SentinelGrid
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7">
            {["PRODUCT", "HOW IT WORKS", "IMPACT", "ABOUT"].map((link) => {
              const ids: Record<string, string> = {
                PRODUCT: "product",
                "HOW IT WORKS": "solution",
                IMPACT: "impact",
                ABOUT: "enterprise",
              };
              return (
                <a
                  key={link}
                  href={`#${ids[link]}`}
                  className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link}
                </a>
              );
            })}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider hidden sm:inline-flex">
              Log in
            </Button>
            <Button
              size="sm"
              className="text-xs font-semibold uppercase tracking-wider bg-primary text-white hover:bg-primary/90 gap-1.5"
              onClick={launchDemo}
            >
              Launch Live Demo <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center" id="product">
        <Eyebrow>AI Incident Response for Critical Infrastructure</Eyebrow>
        <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.08] max-w-3xl mx-auto">
          Helping security teams stop attacks before they spread.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          An autonomous multi-agent system that detects, predicts, and neutralizes attacks on power
          grids, hospitals, and rail networks — in seconds, not days.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <Button
            size="lg"
            className="bg-primary text-white hover:bg-primary/90 text-sm font-semibold uppercase tracking-wider gap-2 px-8"
            onClick={launchDemo}
          >
            Launch Live Demo <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-sm font-semibold uppercase tracking-wider gap-2 px-8"
            onClick={() => document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" })}
          >
            How It Works
          </Button>
        </div>

        {/* Tab strip */}
        <div className="mt-16 text-left">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-secondary rounded-xl p-1 max-w-fit mx-auto">
            {HERO_TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-widest transition-all ${
                    activeTab === i
                      ? "bg-card border border-border shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab panel */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-4 ${HERO_TABS[activeTab].bg} ${HERO_TABS[activeTab].color}`}
              >
                <span>{HERO_TABS[activeTab].label}</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                {HERO_TABS[activeTab].title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {HERO_TABS[activeTab].desc}
              </p>
            </div>
            <div>{HERO_TABS[activeTab].visual}</div>
          </div>
        </div>
      </div>

      {/* ── TRUSTED BY ── */}
      <div className="border-y border-border bg-secondary/40 py-10 overflow-hidden">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Built for the sectors that can't afford downtime.
        </p>
        <div className="relative flex overflow-hidden">
          <div className="marquee-track flex gap-16 items-center animate-marquee whitespace-nowrap">
            {[...TRUSTED_SECTORS, ...TRUSTED_SECTORS].map((s, i) => (
              <span
                key={i}
                className="text-sm font-semibold text-muted-foreground/50 uppercase tracking-wider shrink-0"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section id="problem" className="py-24 bg-background">
        <Section>
          <div className="text-center mb-14">
            <Eyebrow>The Problem</Eyebrow>
            <h2 className="font-heading text-4xl font-bold text-foreground max-w-2xl mx-auto">
              Security teams see the alert. By the time they act, it's already too late.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PROBLEM_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </Section>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution" className="py-24 bg-secondary/30">
        <Section>
          <div className="text-center mb-16">
            <Eyebrow>The Solution</Eyebrow>
            <h2 className="font-heading text-4xl font-bold text-foreground max-w-2xl mx-auto">
              4 stages that cut incident response from hours to seconds.
            </h2>
          </div>
          <div className="flex flex-col gap-20">
            {SOLUTION_STEPS.map((step, i) => {
              const Icon = step.icon;
              const reversed = i % 2 === 1;
              return (
                <div
                  key={step.num}
                  className={`grid md:grid-cols-2 gap-12 items-center ${
                    reversed ? "md:[direction:rtl]" : ""
                  }`}
                >
                  {/* Text side */}
                  <div className={reversed ? "[direction:ltr]" : ""}>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="font-heading text-6xl font-bold text-border select-none leading-none">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  {/* Visual side */}
                  <div className={`rounded-2xl border border-border bg-card p-8 shadow-sm flex items-center justify-center min-h-[200px] ${reversed ? "[direction:ltr]" : ""}`}>
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">{step.title} Stage</div>
                      <div className="text-xs text-muted-foreground max-w-[180px]">
                        {i === 0 && "Telemetry → Anomaly detection → Flag"}
                        {i === 1 && "Signals → Bayesian model → Risk score"}
                        {i === 2 && "Policy → Agent action → Containment"}
                        {i === 3 && "Timeline → Root cause → Audit report"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {[...Array(4)].map((_, j) => (
                          <div
                            key={j}
                            className={`h-1.5 rounded-full ${
                              j <= i ? "w-6 bg-primary" : "w-3 bg-border"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </section>

      {/* ── IMPACT ── */}
      <section id="impact" className="py-24 bg-background">
        <Section>
          <div className="text-center mb-16">
            <Eyebrow>The Impact</Eyebrow>
            <h2 className="font-heading text-4xl font-bold text-foreground max-w-xl mx-auto">
              What happens when detection and response are the same step.
            </h2>
            <p className="text-xs text-muted-foreground mt-3">
              Simulated / estimated figures from tabletop scenarios.
            </p>
          </div>
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
                  <Icon className="w-6 h-6 text-muted-foreground/60" />
                  <div className="font-heading text-5xl font-bold text-foreground">{stat.val}</div>
                  <div className="text-sm text-muted-foreground leading-snug max-w-[140px]">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </section>

      {/* ── ENTERPRISE ── */}
      <section id="enterprise" className="py-24 bg-secondary/30">
        <Section>
          <div className="text-center mb-14">
            <Eyebrow>Enterprise-Ready</Eyebrow>
            <h2 className="font-heading text-4xl font-bold text-foreground max-w-xl mx-auto">
              Built for regulated environments from day one.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ENTERPRISE_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.body}</p>
                </div>
              );
            })}
          </div>
        </Section>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-background">
        <Section>
          <div className="text-center mb-12">
            <Eyebrow>Illustrative Feedback</Eyebrow>
            <h2 className="font-heading text-3xl font-bold text-foreground">
              What a SOC lead would say.
            </h2>
            <p className="text-xs text-muted-foreground mt-2">
              Clearly fictional personas — for demo purposes only.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card p-7 shadow-sm"
              >
                <p className="text-base text-foreground leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="font-semibold text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.title}</div>
                  <div className="text-xs text-muted-foreground/60">{t.org}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 bg-primary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Eyebrow>
            <span className="text-white/50">Live Simulation</span>
          </Eyebrow>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            See SentinelGrid stop a live attack in real time.
          </h2>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-sm font-semibold uppercase tracking-wider gap-2 px-10"
            onClick={launchDemo}
          >
            Launch Live Demo <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-background py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-heading font-semibold text-sm">SentinelGrid</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              An autonomous multi-agent system for detecting and responding to threats against
              critical infrastructure. Built for CERT-In and India's national cyber resilience.
            </p>
          </div>

          {/* Product links */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Product
            </div>
            <div className="flex flex-col gap-2">
              {["Detect", "Predict", "Respond", "Recover"].map((l) => (
                <a
                  key={l}
                  href="#solution"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Learn more */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Learn More
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "How It Works", href: "#solution" },
                { label: "Impact", href: "#impact" },
                { label: "Enterprise", href: "#enterprise" },
                { label: "GitHub", href: "https://github.com", icon: Github },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  {l.icon && <l.icon className="w-3.5 h-3.5" />}
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            © 2025 SentinelGrid · Built for national hackathon demo purposes only.
          </p>
          <p className="text-xs text-muted-foreground">
            All sector names, personas, and statistics are fictional / simulated.
          </p>
        </div>
      </footer>
    </div>
  );
}
