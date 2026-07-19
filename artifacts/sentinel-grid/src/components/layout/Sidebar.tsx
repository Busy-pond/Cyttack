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
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-5 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <ShieldAlert size={15} />
          </div>
          <span className="font-heading font-bold text-base tracking-tight">SentinelGrid</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0 mt-16 md:mt-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 hidden md:flex items-center gap-3 px-6 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <ShieldAlert size={15} />
          </div>
          <span className="font-heading font-bold text-base tracking-tight">SentinelGrid</span>
        </div>

        {/* Nav */}
        <div className="p-4 flex-1 flex flex-col gap-1 overflow-y-auto">
          <div className="mb-5 px-3 py-3 rounded-lg bg-secondary border border-border">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Active session</div>
            <div className="font-medium text-sm flex items-center gap-2 text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-low" />
              {role}
            </div>
          </div>

          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 mb-2">Navigation</div>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || (location.startsWith(link.href) && link.href !== '/');
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={16} className={cn(isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/8 text-sm"
            onClick={logout}
          >
            <LogOut size={16} className="mr-2.5" />
            Sign out
          </Button>
        </div>
      </div>
    </>
  );
}
