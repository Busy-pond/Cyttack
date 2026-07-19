import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert, Cpu } from "lucide-react";
import { useLocation } from "wouter";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 grid-bg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-card border border-primary/30 mb-6 relative">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border border-primary rounded-xl animate-[ping_2s_ease-in-out_infinite] opacity-50" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight mb-2">SentinelGrid</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">National Cyber Resilience Center</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 shadow-[0_0_10px_rgba(0,229,199,0.5)] animate-[scan_4s_linear_infinite] z-0" />
          
          <h2 className="text-xl font-heading font-medium mb-6 relative z-10">Authentication Required</h2>
          
          <div className="space-y-4 relative z-10">
            <button
              onClick={() => setSelectedRole("SOC Analyst")}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${
                selectedRole === "SOC Analyst" 
                  ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,229,199,0.15)]" 
                  : "bg-background border-border hover:border-primary/50 hover:bg-secondary"
              }`}
            >
              <div className={`p-3 rounded-md ${selectedRole === "SOC Analyst" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <div className={`font-medium ${selectedRole === "SOC Analyst" ? "text-primary" : "text-foreground"}`}>SOC Analyst</div>
                <div className="text-sm text-muted-foreground">Tactical response & investigation</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("CISO")}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${
                selectedRole === "CISO" 
                  ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,229,199,0.15)]" 
                  : "bg-background border-border hover:border-primary/50 hover:bg-secondary"
              }`}
            >
              <div className={`p-3 rounded-md ${selectedRole === "CISO" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className={`font-medium ${selectedRole === "CISO" ? "text-primary" : "text-foreground"}`}>CISO / Director</div>
                <div className="text-sm text-muted-foreground">Strategic oversight & intelligence</div>
              </div>
            </button>
          </div>

          <div className="mt-8 relative z-10">
            <Button 
              className="w-full h-12 text-lg font-heading tracking-wide shadow-[0_0_15px_rgba(0,229,199,0.2)]" 
              onClick={handleLogin}
              disabled={!selectedRole}
            >
              Initialize Uplink
            </Button>
          </div>
          
          <div className="mt-6 flex justify-center items-center gap-2 text-xs font-mono text-muted-foreground/50">
            <Cpu className="w-4 h-4" />
            <span>SECURE ENCLAVE ACTIVE</span>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: -10px; }
          100% { top: 100%; }
        }
      `}} />
    </div>
  );
}

// Inline Terminal icon component since it wasn't imported from lucide-react in Login.tsx
function Terminal(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}
