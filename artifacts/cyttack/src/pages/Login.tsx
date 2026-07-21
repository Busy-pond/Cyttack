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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <ShieldAlert size={15} className="text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-base tracking-tight">Cyttack</span>
        </div>
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">National Cyber Resilience Platform</span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Eyebrow */}
          <div className="text-center mb-10">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">CERT-IN SOC Access</p>
            <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground mb-3 leading-tight">
              AI stops attacks<br />in real time.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Select your role to enter the command center. Detection-to-response in minutes, not days.
            </p>
          </div>

          {/* Role selection card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Choose your role</p>

            <div className="space-y-3">
              <button
                onClick={() => setSelectedRole("SOC Analyst")}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-150 text-left ${
                  selectedRole === "SOC Analyst"
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                    : "bg-background border-border hover:border-muted-foreground/30 hover:bg-secondary"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${selectedRole === "SOC Analyst" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <TerminalIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-medium text-sm ${selectedRole === "SOC Analyst" ? "text-primary" : "text-foreground"}`}>SOC Analyst</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Tactical response & investigation</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole("CISO")}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-150 text-left ${
                  selectedRole === "CISO"
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                    : "bg-background border-border hover:border-muted-foreground/30 hover:bg-secondary"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${selectedRole === "CISO" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-medium text-sm ${selectedRole === "CISO" ? "text-primary" : "text-foreground"}`}>CISO / Director</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Strategic oversight & intelligence</div>
                </div>
              </button>
            </div>

            <div className="mt-5">
              <Button
                className="w-full h-11 font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all group"
                onClick={handleLogin}
                disabled={!selectedRole}
              >
                Enter Command Center
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-6 p-4 bg-card border border-border rounded-xl shadow-sm">
            <p className="text-sm text-foreground leading-relaxed italic">
              "Response time went from days to seconds. Cyttack changed how our SOC operates."
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield size={12} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">CISO, Power Grid Authority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted-by strip */}
      <div className="border-t border-border py-6 px-8">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-4 font-medium">Trusted by critical national infrastructure</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {TRUSTED_BY.map((name) => (
            <span key={name} className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
