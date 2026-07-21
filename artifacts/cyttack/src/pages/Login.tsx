import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const TRUSTED_BY = [
  "Power Grid Authority",
  "AIIMS",
  "Indian Railways",
  "CBSE",
  "SEBI",
  "NTPC",
];

// Inline Terminal SVG for the role card
function TerminalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

export default function Login() {
  const { setRole } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"SOC Analyst" | "CISO" | null>(null);

  const handleLogin = () => {
    if (selectedRole) {
      setRole(selectedRole);
      setLocation("/dashboard");
    }
  };

  const isSocSelected = selectedRole === "SOC Analyst";
  const isCisoSelected = selectedRole === "CISO";

  return (
    <div className="min-h-screen login-bg-grid flex flex-col text-[#e2e8f0]">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-[#1e293b] bg-[#0d1117]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#00e5a0]/10 flex items-center justify-center login-shield-glow">
            <ShieldAlert size={15} className="text-[#00e5a0]" />
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-white">
            Cyttack
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] text-[#00e5a0] uppercase tracking-[0.2em] font-mono font-semibold">
          National Cyber Resilience Platform
        </span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16 relative">
        <div className="w-full max-w-md">
          {/* Eyebrow */}
          <div className="text-center mb-10">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.18em] text-[#00e5a0]/90 mb-4">
              CERT-IN SOC Access
            </p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-white mb-3 leading-[1.1]">
              AI stops attacks<br />in real time.
            </h1>
            <p className="text-[#94a3b8] text-sm md:text-base leading-relaxed max-w-sm mx-auto">
              Select your role to enter the command center. Detection-to-response in minutes, not days.
            </p>
          </div>

          {/* Role selection card */}
          <div className="login-card p-6 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-4">
              Choose your role
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedRole("SOC Analyst")}
                className={`login-focus w-full flex items-center gap-4 p-4 rounded-lg border text-left relative overflow-hidden login-card-interactive ${
                  isSocSelected
                    ? "selected bg-[#00e5a0]/[0.04] border-[#00e5a0]/55 login-scan-line"
                    : "bg-[#0d1117] border-[#1e293b] hover:bg-[#161f2e]"
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 transition-colors duration-200 ${
                    isSocSelected
                      ? "bg-[#00e5a0]/15 text-[#00e5a0]"
                      : "bg-[#1e293b] text-[#64748b]"
                  }`}
                >
                  <TerminalIcon className="w-5 h-5" />
                </div>
                <div className="relative z-10">
                  <div
                    className={`font-medium text-sm transition-colors duration-200 ${
                      isSocSelected ? "text-[#00e5a0]" : "text-[#e2e8f0]"
                    }`}
                  >
                    SOC Analyst
                  </div>
                  <div className="text-xs text-[#94a3b8] mt-0.5 font-mono">
                    Tactical response & investigation
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("CISO")}
                className={`login-focus w-full flex items-center gap-4 p-4 rounded-lg border text-left relative overflow-hidden login-card-interactive ${
                  isCisoSelected
                    ? "selected bg-[#00e5a0]/[0.04] border-[#00e5a0]/55 login-scan-line"
                    : "bg-[#0d1117] border-[#1e293b] hover:bg-[#161f2e]"
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 transition-colors duration-200 ${
                    isCisoSelected
                      ? "bg-[#00e5a0]/15 text-[#00e5a0]"
                      : "bg-[#1e293b] text-[#64748b]"
                  }`}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div className="relative z-10">
                  <div
                    className={`font-medium text-sm transition-colors duration-200 ${
                      isCisoSelected ? "text-[#00e5a0]" : "text-[#e2e8f0]"
                    }`}
                  >
                    CISO / Director
                  </div>
                  <div className="text-xs text-[#94a3b8] mt-0.5 font-mono">
                    Strategic oversight & intelligence
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-5">
              <Button
                className="w-full h-11 font-semibold rounded-lg bg-[#00e5a0] text-[#0a0e14] hover:bg-[#00ffaa] transition-all login-btn-glow disabled:opacity-35 disabled:cursor-not-allowed disabled:bg-[#1e293b] disabled:text-[#64748b] group focus-visible:ring-[#00e5a0] focus-visible:ring-offset-[#0a0e14]"
                onClick={handleLogin}
                disabled={!selectedRole}
              >
                Enter Command Center
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>

          {/* Testimonial */}
          <div className="login-card mt-6 p-4 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
            <p className="text-sm text-[#e2e8f0] leading-relaxed italic">
              "Response time went from days to seconds. Cyttack changed how our SOC operates."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#00e5a0]/10 flex items-center justify-center">
                <Shield size={12} className="text-[#00e5a0]" />
              </div>
              <span className="text-xs text-[#94a3b8] font-mono">
                CISO, Power Grid Authority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted-by strip */}
      <div className="border-t border-[#1e293b] bg-[#0d1117]/60 backdrop-blur-sm py-6 px-8">
        <p className="text-center text-[10px] text-[#64748b] uppercase tracking-[0.2em] mb-4 font-mono font-semibold">
          Trusted by critical national infrastructure
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUSTED_BY.map((name) => (
            <span
              key={name}
              className="login-trusted-item text-[11px] font-semibold text-[#64748b]/80 uppercase tracking-wider whitespace-nowrap cursor-default"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
