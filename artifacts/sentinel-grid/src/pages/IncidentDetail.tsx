import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetAlert, useExecutePlaybook, useApprovePlaybookStep, getGetAlertQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Activity, 
  Server, 
  Network, 
  Cpu, 
  Users,
  Target,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  TerminalSquare
} from "lucide-react";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useEffect, useRef } from "react";
import type { PlaybookOverallStatus, PlaybookStepStatus } from "@workspace/api-client-react";

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: alert, isLoading } = useGetAlert(id || "", {
    query: { enabled: !!id, queryKey: getGetAlertQueryKey(id || "") }
  });

  const executeStep = useExecutePlaybook();
  const approveStep = useApprovePlaybookStep();

  const [isExecuting, setIsExecuting] = useState(false);
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getEntityIcon = (type?: string) => {
    switch(type) {
      case 'server': return <Server className="w-5 h-5" />;
      case 'network-segment': return <Network className="w-5 h-5" />;
      case 'ot-device': return <Cpu className="w-5 h-5" />;
      case 'user': return <Users className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  const handleRunPlaybook = () => {
    if (!alert?.playbook || isExecuting) return;
    setIsExecuting(true);
    
    // Auto-run first step if it's pending
    const firstPendingStepIdx = alert.playbook.steps.findIndex(s => s.status === 'pending');
    if (firstPendingStepIdx !== -1) {
      executeStep.mutate({ 
        id: alert.playbook.id, 
        data: { stepIndex: firstPendingStepIdx } 
      });
    }
  };

  const handleApprove = (stepIndex: number) => {
    if (!alert?.playbook) return;
    approveStep.mutate({ 
      id: alert.playbook.id, 
      data: { stepIndex } 
    });
  };

  // Simulate sequential execution of steps
  useEffect(() => {
    if (!alert?.playbook || !isExecuting) return;

    // Check if we need to advance to next step
    const currentRunning = alert.playbook.steps.find(s => s.status === 'running');
    const waitingApproval = alert.playbook.steps.find(s => s.status === 'awaiting_approval');
    const hasFailed = alert.playbook.steps.some(s => s.status === 'failed');
    const isDone = alert.playbook.overallStatus === 'completed';

    if (hasFailed || isDone || waitingApproval) {
      setIsExecuting(false);
      return;
    }

    // If nothing is running and we're executing, trigger the next pending step
    if (!currentRunning) {
      const nextPendingIndex = alert.playbook.steps.findIndex(s => s.status === 'pending');
      
      if (nextPendingIndex !== -1 && !executeStep.isPending) {
        // Add a slight delay to make it feel like real execution
        executionTimerRef.current = setTimeout(() => {
          if (!alert?.playbook) return;
          executeStep.mutate({ 
            id: alert.playbook.id, 
            data: { stepIndex: nextPendingIndex } 
          });
        }, 1500);
      }
    }

    return () => {
      if (executionTimerRef.current) clearTimeout(executionTimerRef.current);
    };
  }, [alert?.playbook, isExecuting, executeStep]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-secondary rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-secondary rounded-xl" />
              <div className="h-64 bg-secondary rounded-xl" />
            </div>
            <div className="h-96 bg-secondary rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!alert) return <AppLayout>Alert not found</AppLayout>;

  // Attack chain definition
  const attackStages = ['recon', 'initial_access', 'lateral_movement', 'exfiltration', 'impact'];
  const currentStageIndex = attackStages.indexOf(alert.attackStage);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/incidents">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant={alert.severity as any} className="uppercase text-xs px-2">
              {alert.severity}
            </Badge>
            <h1 className="text-2xl font-heading font-bold">INC-{alert.id.substring(0, 8).toUpperCase()}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono bg-card">
            {format(new Date(alert.timestamp), "yyyy-MM-dd HH:mm:ss 'UTC'")}
          </Badge>
          <Button variant="outline" className="gap-2">
            <TerminalSquare className="w-4 h-4" />
            Terminal
          </Button>
        </div>
      </div>

      {/* Attack Chain Timeline */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-md mb-6 overflow-x-auto">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">Kill Chain Progression</h3>
        <div className="flex items-center justify-between min-w-[600px] relative">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-secondary -z-10 rounded-full" />
          {attackStages.map((stage, idx) => {
            const isPast = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isFuture = idx > currentStageIndex;
            
            return (
              <div key={stage} className="flex flex-col items-center gap-3 bg-card px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                  ${isPast ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(0,229,199,0.5)]' : ''}
                  ${isCurrent ? 'bg-card border-critical text-critical animate-pulse shadow-[0_0_15px_rgba(255,77,77,0.5)]' : ''}
                  ${isFuture ? 'bg-card border-secondary text-muted-foreground' : ''}
                `}>
                  {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-mono uppercase tracking-wider
                  ${isCurrent ? 'text-critical font-bold' : 'text-muted-foreground'}
                `}>
                  {stage.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Entity & Data */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entity Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-primary/5">
                {getEntityIcon(alert.entity.type)}
              </div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Target Entity</h3>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-lg text-primary">
                  {getEntityIcon(alert.entity.type)}
                </div>
                <div>
                  <div className="text-xl font-heading font-semibold">{alert.entity.name}</div>
                  <div className="text-sm font-mono text-muted-foreground mt-1">{alert.entity.ipAddress || 'Unknown IP'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Type</div>
                  <div className="text-sm font-medium capitalize">{alert.entity.type.replace('-', ' ')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Criticality</div>
                  <Badge variant={alert.entity.criticality === 'critical' ? 'critical' : 'outline'} className="uppercase text-[10px]">
                    {alert.entity.criticality}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Location</div>
                  <div className="text-sm font-medium">{alert.entity.location || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <span className={`w-2 h-2 rounded-full ${alert.entity.status === 'anomalous' ? 'bg-medium animate-pulse' : 'bg-primary'}`} />
                    <span className="capitalize">{alert.entity.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign/Threat Intel */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                Threat Attribution
                {alert.campaignId && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">MATCH</Badge>}
              </h3>
              
              {alert.campaignId ? (
                <>
                  <div className="text-xl font-heading font-semibold text-critical mb-2">{alert.campaignName}</div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-sm text-muted-foreground">Confidence:</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-critical" 
                        style={{ width: `${alert.matchConfidence || 0}%` }} 
                      />
                    </div>
                    <div className="text-xs font-mono">{alert.matchConfidence}%</div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground mb-2">Identified MITRE TTPs:</div>
                    <div className="flex flex-wrap gap-2">
                      {alert.mitreTechniques?.map(t => (
                        <Badge key={t.id} variant="secondary" className="font-mono text-xs border border-border">
                          {t.id}: {t.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                  <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No APT attribution match</p>
                </div>
              )}
            </div>
          </div>

          {/* Behavior Chart */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6 flex items-center justify-between">
              Behavioral Deviation
              <div className="flex items-center gap-4 text-xs font-mono lowercase">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> baseline</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-critical" /> actual</div>
              </div>
            </h3>
            
            <div className="h-[250px] w-full">
              {alert.behaviorData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={alert.behaviorData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--critical))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--critical))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickFormatter={(val) => {
                        try { return format(new Date(val), 'HH:mm'); } catch(e) { return val; }
                      }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      labelFormatter={(val) => {
                        try { return format(new Date(val), 'HH:mm:ss'); } catch(e) { return val; }
                      }}
                    />
                    <Area type="monotone" dataKey="baseline" stroke="hsl(var(--primary))" fill="none" strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="actual" stroke="hsl(var(--critical))" fill="url(#colorActual)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded">
                  Insufficient telemetry data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Playbook */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl shadow-sm h-full flex flex-col overflow-hidden sticky top-6">
            <div className="p-5 border-b border-border bg-secondary/30">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-heading font-semibold">Response Playbook</h3>
                <Badge variant="outline" className={`
                  uppercase text-[10px]
                  ${alert.playbook?.overallStatus === 'completed' ? 'border-contained text-contained' : ''}
                  ${alert.playbook?.overallStatus === 'running' ? 'border-primary text-primary animate-pulse' : ''}
                `}>
                  {alert.playbook?.overallStatus || 'N/A'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{alert.playbook?.name}</p>
              
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  disabled={!alert.playbook || isExecuting || alert.playbook.overallStatus === 'completed'}
                  onClick={handleRunPlaybook}
                >
                  {isExecuting ? (
                    <><Activity className="w-4 h-4 mr-2 animate-spin" /> Executing...</>
                  ) : alert.playbook?.overallStatus === 'completed' ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Playbook Complete</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Execute Playbook</>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {alert.playbook ? (
                <div className="space-y-4">
                  {alert.playbook.steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`relative pl-8 pb-4 border-l-2 last:border-transparent last:pb-0
                        ${step.status === 'done' ? 'border-primary' : 'border-border'}
                      `}
                    >
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-card flex items-center justify-center
                        ${step.status === 'done' ? 'border-primary text-primary' : ''}
                        ${step.status === 'running' ? 'border-primary text-primary shadow-[0_0_10px_rgba(0,229,199,0.5)] animate-pulse' : ''}
                        ${step.status === 'awaiting_approval' ? 'border-high text-high' : ''}
                        ${step.status === 'pending' ? 'border-border' : ''}
                      `}>
                        {step.status === 'done' && <CheckCircle2 className="w-3 h-3 absolute" />}
                        {step.status === 'running' && <Activity className="w-3 h-3 absolute" />}
                        {step.status === 'awaiting_approval' && <AlertCircle className="w-3 h-3 absolute" />}
                      </div>
                      
                      <div className={`
                        p-3 rounded-lg border text-sm transition-colors
                        ${step.status === 'running' ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20'}
                        ${step.status === 'awaiting_approval' ? 'border-high bg-high/5' : ''}
                      `}>
                        <div className="font-medium mb-1">{step.action}</div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-mono uppercase
                            ${step.status === 'done' ? 'text-primary' : ''}
                            ${step.status === 'running' ? 'text-primary' : ''}
                            ${step.status === 'awaiting_approval' ? 'text-high' : 'text-muted-foreground'}
                          `}>
                            {step.status.replace('_', ' ')}
                          </span>
                          
                          {step.requiresApproval && <Badge variant="outline" className="text-[9px]">GATED</Badge>}
                        </div>

                        {step.status === 'awaiting_approval' && (
                          <Button 
                            size="sm" 
                            className="w-full mt-3 bg-high hover:bg-high/90 text-high-foreground"
                            onClick={() => handleApprove(idx)}
                            disabled={approveStep.isPending}
                          >
                            Approve & Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No playbook linked to this incident
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </AppLayout>
  );
}
