import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShieldAlert, 
  Activity, 
  Network, 
  ShieldHalf, 
  ListOrdered, 
  Terminal,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/attack-map", label: "Attack Map", icon: Network },
  { href: "/vulnerabilities", label: "Vulnerabilities", icon: ShieldHalf },
  { href: "/audit-log", label: "Audit Log", icon: ListOrdered },
  { href: "/ask-sentinel", label: "Ask SentinelGrid", icon: Terminal },
];

export function Sidebar() {
  const [location] = useLocation();
  const { role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
            <ShieldAlert size={20} />
          </div>
          <span className="font-heading font-bold text-lg">SentinelGrid</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col grid-bg",
        isOpen ? "translate-x-0 mt-16 md:mt-0" : "-translate-x-full"
      )}>
        <div className="h-16 hidden md:flex items-center gap-3 px-6 border-b border-border bg-background/50 backdrop-blur">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 text-primary relative">
            <ShieldAlert size={20} />
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10 animate-pulse-slow" />
          </div>
          <span className="font-heading font-bold text-lg tracking-wider">CERT-IN SOC</span>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="mb-6 px-2">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Active Profile</div>
            <div className="font-medium text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {role}
            </div>
          </div>
          
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider px-2 mb-2">Systems</div>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || (location.startsWith(link.href) && link.href !== '/');
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={18} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border bg-background/50 backdrop-blur">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut size={18} className="mr-3" />
            End Session
          </Button>
        </div>
      </div>
    </>
  );
}
