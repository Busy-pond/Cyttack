import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  useGetDashboardSummary, 
  useGetRiskTrend, 
  useListAlerts,
  useStartAttackSimulation,
  getListAlertsQueryKey
} from "@workspace/api-client-react";
import { 
  ShieldAlert, 
  Activity, 
  Target, 
  Clock, 
  AlertTriangle,
  Play
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function Dashboard() {
  const { role } = useAuth();
  
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: riskTrend, isLoading: loadingTrend } = useGetRiskTrend();
  
  // Use polling for live alerts feed to simulate streaming
  const { data: recentAlerts, isLoading: loadingAlerts, refetch: refetchAlerts } = useListAlerts(undefined, { 
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

  // Animate stats on load
  useEffect(() => {
    if (!summary) return;
    
    const duration = 1500; // ms
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Easing function (easeOutExpo)
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

  const handleStartSimulation = () => {
    startSimulation.mutate(undefined, {
      onSuccess: () => {
        refetchAlerts();
      }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm uppercase tracking-wider">
            System Status: <span className="text-primary font-bold">Operational</span>
          </p>
        </div>
        
        <Button 
          variant="critical" 
          onClick={handleStartSimulation}
          disabled={startSimulation.isPending}
          className="font-heading"
        >
          {startSimulation.isPending ? (
            <Activity className="animate-spin w-4 h-4 mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Trigger Simulation
        </Button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard 
          title="Active Incidents" 
          value={animatedStats.activeIncidents} 
          icon={<ShieldAlert className="text-primary" />}
          loading={loadingSummary}
        />
        <StatCard 
          title="Critical Alerts" 
          value={animatedStats.criticalAlerts} 
          icon={<AlertTriangle className="text-critical animate-pulse" />}
          loading={loadingSummary}
          valueClass="text-critical"
        />
        <StatCard 
          title="Risk Score" 
          value={animatedStats.riskScore} 
          suffix="/100"
          icon={<Target className={summary?.riskScore && summary.riskScore > 70 ? "text-critical" : "text-primary"} />}
          loading={loadingSummary}
          valueClass={summary?.riskScore && summary.riskScore > 70 ? "text-critical" : ""}
        />
        <StatCard 
          title="MTTD (Mean Time to Detect)" 
          value={animatedStats.mttd} 
          suffix="m"
          icon={<Clock className="text-muted-foreground" />}
          loading={loadingSummary}
        />
        <StatCard 
          title="MTTR (Mean Time to Resolve)" 
          value={animatedStats.mttr} 
          suffix="h"
          icon={<Activity className="text-muted-foreground" />}
          loading={loadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Global Risk Index
          </h2>
          
          <div className="h-[300px] w-full">
            {loadingTrend ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrend || []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(val) => {
                      try { return format(new Date(val), 'HH:mm'); } catch(e) { return val; }
                    }}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    domain={[0, 100]}
                    tickMargin={10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                    labelFormatter={(val) => {
                      try { return format(new Date(val), 'MMM d, HH:mm:ss'); } catch(e) { return val; }
                    }}
                  />
                  <ReferenceLine y={70} stroke="hsl(var(--critical))" strokeDasharray="3 3" opacity={0.5} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-lg flex flex-col h-[400px] relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-critical"></span>
              </span>
              Live Feed
            </h2>
            <Badge variant="outline" className="font-mono text-[10px]">REAL-TIME</Badge>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 terminal-scroll">
            {loadingAlerts ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded bg-secondary/50 border border-border animate-pulse h-16" />
              ))
            ) : recentAlerts?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                <p>No active alerts</p>
              </div>
            ) : (
              recentAlerts?.slice(0, 20).map((alert, i) => (
                <div 
                  key={alert.id} 
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors animate-in slide-in-from-top-4 fade-in duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity as any} className="h-5 px-1.5 text-[10px] uppercase">
                        {alert.severity}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {format(new Date(alert.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                  <div className="font-medium text-sm mt-1 truncate" title={alert.description}>
                    {alert.description}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      Target: <span className="text-foreground">{alert.entityName}</span>
                    </span>
                    <span className="text-xs font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                      {alert.attackStage}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Role-specific section could go here */}
      {role === "CISO" && (
        <div className="mt-8 bg-card border border-border rounded-xl p-5 shadow-lg">
          <h2 className="text-xl font-heading font-semibold mb-4">Strategic Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Attack Stages Distribution</h3>
              {loadingSummary ? (
                <div className="h-32 bg-secondary/20 animate-pulse rounded" />
              ) : (
                <div className="space-y-2">
                  {summary?.alertsByStage.map((stage) => (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{stage.label.replace('_', ' ')}</span>
                        <span className="font-mono">{stage.count}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${Math.max(5, (stage.count / (summary.activeIncidents || 1)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sector Targeting</h3>
              <div className="p-4 bg-secondary/30 rounded-lg border border-border font-mono text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Energy Grid:</span> <span className="text-high">Elevated</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Financial:</span> <span className="text-primary">Normal</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Telecomm:</span> <span className="text-medium">Monitoring</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Defense:</span> <span className="text-primary">Normal</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  suffix = "", 
  icon, 
  loading,
  valueClass = "text-foreground"
}: { 
  title: string; 
  value: number; 
  suffix?: string; 
  icon: React.ReactNode;
  loading: boolean;
  valueClass?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground leading-tight">{title}</h3>
        <div className="p-2 bg-secondary rounded-lg">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        {loading ? (
          <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-heading font-bold ${valueClass}`}>
              {value.toLocaleString()}
            </span>
            {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
