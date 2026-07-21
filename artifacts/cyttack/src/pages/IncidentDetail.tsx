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
  TerminalSquare,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useEffect, useRef } from "react";
import type { PlaybookOverallStatus, PlaybookStepStatus } from "@workspace/api-client-react";

// Numbered step labels for the kill chain — Surface-style
const STAGE_LABELS: Record<string, { num: number; title: string; desc: string }> = {
  recon:            { num: 1, title: 'Detect',   desc: 'Reconnaissance observed' },
  initial_access:   { num: 2, title: 'Predict',  desc: 'Initial access attempt' },
  lateral_movement: { num: 3, title: 'Contain',  desc: 'Lateral movement underway' },
  exfiltration:     { num: 4, title: 'Respond',  desc: 'Data exfiltration detected' },
  impact:           { num: 5, title: 'Recover',  desc: 'Impact stage reached' },
};

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
    const firstPendingStepIdx = alert.playbook.steps.findIndex(s => s.status === 'pending');
    if (firstPendingStepIdx !== -1) {
      executeStep.mutate({ id: alert.playbook.id, data: { stepIndex: firstPendingStepIdx } });
    }
  };

  const handleApprove = (stepIndex: number) => {
    if (!alert?.playbook) return;
    approveStep.mutate({ id: alert.playbook.id, data: { stepIndex } });
  };

  useEffect(() => {
    if (!alert?.playbook || !isExecuting) return;
    const currentRunning = alert.playbook.steps.find(s => s.status === 'running');
    const waitingApproval = alert.playbook.steps.find(s => s.status === 'awaiting_approval');
    const hasFailed = alert.playbook.steps.some(s => s.status === 'failed');
    const isDone = alert.playbook.overallStatus === 'completed';
    if (hasFailed || isDone || waitingApproval) { setIsExecuting(false); return; }
    if (!currentRunning) {
      const nextPendingIndex = alert.playbook.steps.findIndex(s => s.status === 'pending');
      if (nextPendingIndex !== -1 && !executeStep.isPending) {
        executionTimerRef.current = setTimeout(() => {
          if (!alert?.playbook) return;
          executeStep.mutate({ id: alert.playbook.id, data: { stepIndex: nextPendingIndex } });
        }, 1500);
      }
    }
    return () => { if (executionTimerRef.current) clearTimeout(executionTimerRef.current); };
  }, [alert?.playbook, isExecuting, executeStep]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-secondary rounded-lg" />
          <div className="h-32 bg-secondary rounded-xl" />
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

  if (!alert) return <AppLayout><div className="text-muted-foreground">Alert not found</div></AppLayout>;

  const attackStages = ['recon', 'initial_access', 'lateral_movement', 'exfiltration', 'impact'];
  const currentStageIndex = attackStages.indexOf(alert.attackStage);

  return (
    <AppLayout>
      {/* Breadcrumb / header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/incidents">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={alert.severity as any} className="uppercase text-[10px] px-2">
              {alert.severity}
            </Badge>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <h1 className="text-xl font-heading font-bold">INC-{alert.id.substring(0, 8).toUpperCase()}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono hidden md:block">
            {format(new Date(alert.timestamp), "yyyy-MM-dd HH:mm 'UTC'")}
          </span>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <TerminalSquare className="w-3.5 h-3.5" />
            Terminal
          </Button>
        </div>
      </div>

      {/* Problem → Solution framing */}
      <div className="mb-8 p-5 bg-destructive/5 border border-destructive/15 rounded-xl">
        <p className="text-[10px] font-medium uppercase tracking-widest text-destructive/70 mb-1">THE PROBLEM</p>
        <p className="text-sm font-medium text-foreground">{alert.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Detected on <span className="font-medium text-foreground">{alert.entityName}</span> · Anomaly score <span className="font-semibold text-critical">{alert.anomalyScore}/100</span>
        </p>
      </div>

      {/* Kill Chain — numbered steps Surface-style */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-5">KILL CHAIN PROGRESSION</p>
        <div className="flex items-start justify-between gap-2 overflow-x-auto min-w-0 pb-2">
          {attackStages.map((stage, idx) => {
            const isPast = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isFuture = idx > currentStageIndex;
            const info = STAGE_LABELS[stage];
            
            return (
              <div key={stage} className="flex flex-col items-center gap-2 min-w-[80px] text-center px-1">
                {/* Number circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${isPast ? 'bg-low/10 border-low text-low' : ''}
                  ${isCurrent ? 'bg-critical/10 border-critical text-critical' : ''}
                  ${isFuture ? 'bg-secondary border-border text-muted-foreground' : ''}
                `}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : info?.num ?? idx + 1}
                </div>
                {/* Label */}
                <span className={`text-[10px] font-semibold uppercase tracking-wider
                  ${isCurrent ? 'text-critical' : isPast ? 'text-low' : 'text-muted-foreground'}
                `}>
                  {info?.title ?? stage.replace('_', ' ')}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {info?.desc ?? ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Entity */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-4">Target Entity</p>
              <div className="flex items-start gap-3 mb-5">
                <div className="p-2.5 bg-secondary rounded-lg text-muted-foreground shrink-0">
                  {getEntityIcon(alert.entity.type)}
                </div>
                <div>
                  <div className="text-lg font-heading font-semibold text-foreground">{alert.entity.name}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">{alert.entity.ipAddress || 'Unknown IP'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Type</div>
                  <div className="text-sm font-medium capitalize">{alert.entity.type.replace('-', ' ')}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Criticality</div>
                  <Badge variant={alert.entity.criticality === 'critical' ? 'critical' : 'outline'} className="text-[10px] uppercase">
                    {alert.entity.criticality}
                  </Badge>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Location</div>
                  <div className="text-sm font-medium">{alert.entity.location || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${alert.entity.status === 'anomalous' ? 'bg-medium' : 'bg-low'}`} />
                    <span className="capitalize">{alert.entity.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Threat Attribution */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Threat Attribution</p>
                {alert.campaignId && (
                  <Badge className="text-[10px] bg-primary/5 text-primary border-primary/20 border">MATCH</Badge>
                )}
              </div>
              
              {alert.campaignId ? (
                <>
                  <div className="text-lg font-heading font-semibold text-critical mb-3">{alert.campaignName}</div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-semibold text-foreground">{alert.matchConfidence}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-critical/70 transition-all duration-700" 
                        style={{ width: `${alert.matchConfidence || 0}%` }} 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">MITRE TTPs</div>
                    <div className="flex flex-wrap gap-1.5">
                      {alert.mitreTechniques?.map(t => (
                        <Badge key={t.id} variant="secondary" className="font-mono text-[10px] border border-border">
                          {t.id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                  <ShieldAlert className="w-7 h-7 mb-2 opacity-30" />
                  <p className="text-sm">No APT attribution match</p>
                </div>
              )}
            </div>
          </div>

          {/* Behavioral Deviation chart */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Behavioral Deviation</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-[2px] rounded bg-primary inline-block" style={{borderStyle:'dashed'}} /> baseline
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-0.5 rounded bg-critical inline-block" /> actual
                </div>
              </div>
            </div>
            <h3 className="text-sm font-medium text-foreground mb-5">Entity behaviour vs. established baseline</h3>
            
            <div className="h-[240px] w-full">
              {alert.behaviorData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={alert.behaviorData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--critical))" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="hsl(var(--critical))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickFormatter={(val) => {
                        try { return format(new Date(val), 'HH:mm'); } catch(e) { return val; }
                      }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      labelFormatter={(val) => {
                        try { return format(new Date(val), 'HH:mm:ss'); } catch(e) { return val; }
                      }}
                    />
                    <Area type="monotone" dataKey="baseline" stroke="hsl(var(--primary))" strokeDasharray="5 5" fill="none" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="actual" stroke="hsl(var(--critical))" fill="url(#colorActual)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                  Insufficient telemetry data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Playbook */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl shadow-sm sticky top-6 overflow-hidden">
            {/* Playbook header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between mb-1">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">AI PREDICTION</p>
                <Badge variant="outline" className={`text-[10px] uppercase
                  ${alert.playbook?.overallStatus === 'completed' ? 'border-contained/30 text-contained bg-contained/5' : ''}
                  ${alert.playbook?.overallStatus === 'running' ? 'border-primary/30 text-primary' : ''}
                `}>
                  {alert.playbook?.overallStatus || 'N/A'}
                </Badge>
              </div>
              <h3 className="text-base font-heading font-semibold text-foreground">Response Playbook</h3>
              <p className="text-xs text-muted-foreground mt-1">{alert.playbook?.name}</p>
              
              <Button 
                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-sm"
                disabled={!alert.playbook || isExecuting || alert.playbook.overallStatus === 'completed'}
                onClick={handleRunPlaybook}
              >
                {isExecuting ? (
                  <><Activity className="w-4 h-4 mr-2 animate-spin" /> Executing…</>
                ) : alert.playbook?.overallStatus === 'completed' ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Playbook Complete</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Execute Playbook →</>
                )}
              </Button>
            </div>

            {/* Steps — numbered Surface-style */}
            <div className="p-5 overflow-y-auto max-h-[500px] surface-scroll">
              {alert.playbook ? (
                <div className="space-y-3">
                  {alert.playbook.steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`relative pl-8 pb-3 border-l-2 last:border-transparent last:pb-0 transition-colors
                        ${step.status === 'done' ? 'border-low/40' : 'border-border'}
                      `}
                    >
                      {/* Step indicator */}
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-card flex items-center justify-center text-[9px] font-bold
                        ${step.status === 'done' ? 'border-low text-low' : ''}
                        ${step.status === 'running' ? 'border-primary text-primary' : ''}
                        ${step.status === 'awaiting_approval' ? 'border-high text-high' : ''}
                        ${step.status === 'pending' ? 'border-border text-muted-foreground' : ''}
                      `}>
                        {step.status === 'done' ? <CheckCircle2 className="w-2.5 h-2.5" /> : 
                         step.status === 'running' ? <Activity className="w-2.5 h-2.5" /> :
                         step.status === 'awaiting_approval' ? <AlertCircle className="w-2.5 h-2.5" /> : idx + 1}
                      </div>
                      
                      <div className={`p-3 rounded-lg border text-sm transition-colors
                        ${step.status === 'running' ? 'border-primary/30 bg-primary/5' : ''}
                        ${step.status === 'awaiting_approval' ? 'border-high/30 bg-high/5' : ''}
                        ${step.status === 'done' ? 'border-border/60 bg-secondary/30' : ''}
                        ${step.status === 'pending' ? 'border-border bg-card' : ''}
                      `}>
                        <div className="font-medium text-foreground mb-1.5">{step.action}</div>
                        
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-medium uppercase tracking-wider
                            ${step.status === 'done' ? 'text-low' : ''}
                            ${step.status === 'running' ? 'text-primary' : ''}
                            ${step.status === 'awaiting_approval' ? 'text-high' : ''}
                            ${step.status === 'pending' ? 'text-muted-foreground' : ''}
                          `}>
                            {step.status.replace('_', ' ')}
                          </span>
                          {step.requiresApproval && (
                            <Badge variant="outline" className="text-[9px] border-high/30 text-high">GATED</Badge>
                          )}
                        </div>

                        {step.status === 'awaiting_approval' && (
                          <Button 
                            size="sm" 
                            className="w-full mt-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8"
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
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-8">
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
