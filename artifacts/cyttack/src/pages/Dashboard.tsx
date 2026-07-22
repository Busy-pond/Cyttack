import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  SimulationAdvanceInputStage,
  useGetDashboardSummary, 
  useGetRiskTrend, 
  useListAlerts,
  useStartAttackSimulation,
  useAdvanceSimulation,
  getListAlertsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRiskTrendQueryKey,
} from "@workspace/api-client-react";
import { 
  ShieldAlert, 
  Activity, 
  Target, 
  Clock, 
  AlertTriangle,
  Play,
  ArrowRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const advanceSimulation = useAdvanceSimulation();
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simulationStageRef = useRef(0);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: riskTrend, isLoading: loadingTrend } = useGetRiskTrend();
  
  const { data: recentAlerts, isLoading: loadingAlerts } = useListAlerts(undefined, { 
    query: { refetchInterval: 10000, queryKey: getListAlertsQueryKey() } 
  });
  
  const startSimulation = useStartAttackSimulation();
  
  const [animatedStats, setAnimatedStats] = useState({
    activeIncidents: 0,
    criticalAlerts: 0,
    riskScore: 0,
    mttd: 0,
    mttr: 0
  });

  useEffect(() => {
    if (!summary) return;
    const duration = 1200;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        activeIncidents: Math.floor(summary.activeIncidents * ease),
        criticalAlerts: Math.floor(summary.criticalAlerts * ease),
        riskScore: Math.floor(summary.riskScore * ease),
        mttd: Math.floor(summary.mttd * ease),
        mttr: Math.floor(summary.mttr * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [summary]);

  const clearSimulationTimer = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
  };

  useEffect(() => {
    return () => clearSimulationTimer();
  }, []);

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRiskTrendQueryKey() });
  };

  const beginAutoAdvance = (incidentId: string) => {
    const stages: SimulationAdvanceInputStage[] = ["lateral_movement", "exfiltration", "impact"];
    simulationStageRef.current = 0;
    setIsSimulating(true);

    simulationTimerRef.current = setInterval(() => {
      const stage = stages[simulationStageRef.current];
      if (!stage) {
        clearSimulationTimer();
        toast({
          title: "Simulation complete",
          description: "Attack reached impact stage. Review the Live Feed and take containment action.",
        });
        return;
      }

      advanceSimulation.mutate(
        { data: { incidentId, stage } },
        {
          onSuccess: () => {
            invalidateDashboard();
            simulationStageRef.current++;
          },
          onError: (error) => {
            const message = (error as any)?.data?.error ?? error?.message ?? "Advance failed";
            toast({
              variant: "destructive",
              title: "Simulation advance failed",
              description: message,
            });
            clearSimulationTimer();
          },
        }
      );
    }, 5000);
  };

  const handleStartSimulation = () => {
    startSimulation.mutate(undefined, {
      onSuccess: (alert) => {
        toast({
          title: "Simulation started",
          description: `Initial access detected on ${alert.entityName}.`,
        });
        invalidateDashboard();
        beginAutoAdvance(alert.id);
      },
      onError: (error) => {
        const message = (error as any)?.data?.error ?? error?.message ?? "Simulation failed";
        toast({
          variant: "destructive",
          title: "Simulation failed",
          description: message,
        });
      },
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-critical';
      case 'high': return 'text-high';
      case 'medium': return 'text-medium';
      case 'low': return 'text-low';
      default: return 'text-primary';
    }
  };

  return (
    <AppLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-10 gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">LIVE SIMULATION</p>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Watch Cyttack Stop an Attack</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            System status: <span className="text-low font-medium">Operational</span>
          </p>
        </div>
        
        <Button 
          onClick={handleStartSimulation}
          disabled={startSimulation.isPending || isSimulating}
          className="btn-gradient text-primary-foreground rounded-lg font-medium shrink-0 group border-0"
        >
          {startSimulation.isPending || isSimulating ? (
            <Activity className="animate-spin w-4 h-4 mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isSimulating ? "Simulation in progress…" : "Start Live Attack Simulation"}
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>

      {/* Stats grid — Surface-style: big numbers, no card borders */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10 px-2">
        <StatBlock 
          label="Active Incidents" 
          value={animatedStats.activeIncidents} 
          icon={<ShieldAlert className="w-4 h-4 text-muted-foreground" />}
          loading={loadingSummary}
        />
        <StatBlock 
          label="Critical Alerts" 
          value={animatedStats.criticalAlerts} 
          icon={<AlertTriangle className="w-4 h-4 text-critical" />}
          loading={loadingSummary}
          valueClass="text-critical"
        />
        <StatBlock 
          label="Risk Score" 
          value={animatedStats.riskScore} 
          suffix="/100"
          icon={<Target className={`w-4 h-4 ${summary?.riskScore && summary.riskScore > 70 ? "text-critical" : "text-muted-foreground"}`} />}
          loading={loadingSummary}
          valueClass={summary?.riskScore && summary.riskScore > 70 ? "text-critical" : ""}
        />
        <StatBlock 
          label="MTTD" 
          value={animatedStats.mttd} 
          suffix="m"
          sublabel="Mean Time to Detect"
          icon={<Clock className="w-4 h-4 text-muted-foreground" />}
          loading={loadingSummary}
        />
        <StatBlock 
          label="MTTR" 
          value={animatedStats.mttr} 
          suffix="h"
          sublabel="Mean Time to Resolve"
          icon={<Activity className="w-4 h-4 text-muted-foreground" />}
          loading={loadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart — framed like a product screenshot */}
        <div className="lg:col-span-2 glow-card ambient-glow rounded-xl p-6 shadow-lg overflow-hidden">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">ACTIVE INCIDENT</p>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Global Risk Index</h2>
          
          <div className="h-[280px] w-full">
            {loadingTrend ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrend || []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickFormatter={(val) => {
                      try { return format(new Date(val), 'HH:mm'); } catch(e) { return val; }
                    }}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11} 
                    domain={[0, 100]}
                    tickMargin={10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                    labelFormatter={(val) => {
                      try { return format(new Date(val), 'MMM d, HH:mm:ss'); } catch(e) { return val; }
                    }}
                  />
                  <ReferenceLine y={70} stroke="hsl(var(--critical))" strokeDasharray="4 4" opacity={0.4} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 0 }}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="glow-card ambient-glow rounded-xl p-5 shadow-lg flex flex-col h-[400px] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">AI PREDICTION</p>
              <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-critical" />
                </span>
                Live Feed
              </h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium">REAL-TIME</Badge>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 surface-scroll">
            {loadingAlerts ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary border border-border animate-pulse h-16" />
              ))
            ) : recentAlerts?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShieldAlert className="w-7 h-7 mb-2 opacity-30" />
                <p className="text-sm">No active alerts</p>
              </div>
            ) : (
              recentAlerts?.slice(0, 20).map((alert, i) => (
                <div 
                  key={alert.id} 
                  className="p-3 rounded-lg border border-border hover:bg-secondary/60 transition-colors animate-in slide-in-from-top-2 fade-in duration-300"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant={alert.severity as any} className="h-5 px-2 text-[10px] uppercase">
                      {alert.severity}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {format(new Date(alert.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground mt-1 truncate" title={alert.description}>
                    {alert.description}
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-muted-foreground truncate max-w-[130px]">
                      {alert.entityName}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border capitalize">
                      {alert.attackStage.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* CISO Strategic overview */}
      {role === "CISO" && (
        <div className="mt-8 bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">MISSION OUTCOME</p>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-6">Strategic Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Attack Stage Distribution</h3>
              {loadingSummary ? (
                <div className="h-32 bg-secondary animate-pulse rounded-lg" />
              ) : (
                <div className="space-y-3">
                  {summary?.alertsByStage.map((stage) => (
                    <div key={stage.label} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground capitalize">{stage.label.replace('_', ' ')}</span>
                        <span className="font-mono text-muted-foreground text-xs">{stage.count}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-700" 
                          style={{ width: `${Math.max(5, (stage.count / (summary.activeIncidents || 1)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Sector Targeting</h3>
              <div className="space-y-2">
                {[
                  { name: 'Energy Grid', status: 'Elevated', cls: 'text-high' },
                  { name: 'Financial', status: 'Normal', cls: 'text-low' },
                  { name: 'Telecomm', status: 'Monitoring', cls: 'text-medium' },
                  { name: 'Defence', status: 'Normal', cls: 'text-low' },
                ].map(s => (
                  <div key={s.name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{s.name}</span>
                    <span className={`text-xs font-medium ${s.cls}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatBlock({ 
  label, 
  value, 
  suffix = "", 
  sublabel,
  icon, 
  loading,
  valueClass = "text-foreground"
}: { 
  label: string; 
  value: number; 
  suffix?: string;
  sublabel?: string;
  icon: React.ReactNode;
  loading: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      {loading ? (
        <div className="h-10 w-20 bg-secondary animate-pulse rounded" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-heading font-bold ${valueClass}`}
            style={
              valueClass.includes("critical")
                ? { backgroundImage: "var(--gradient-critical)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
                : { backgroundImage: "var(--gradient-accent)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
            }
          >
            {value.toLocaleString()}
          </span>
          {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
        </div>
      )}
      {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
    </div>
  );
}
