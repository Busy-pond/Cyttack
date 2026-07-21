import { AppLayout } from "@/components/layout/AppLayout";
import { useListEntities } from "@workspace/api-client-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Network, Shield, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Entity } from "@workspace/api-client-react";

// Custom Node Component
function EntityNode({ data }: { data: any }) {
  const isAnomalous = data.status === 'anomalous';
  const isContained = data.status === 'contained';
  
  return (
    <div className={`
      px-4 py-3 rounded-xl border bg-card min-w-[150px] shadow-sm transition-all
      ${isAnomalous ? 'border-critical/40 bg-critical/5 shadow-md' : ''}
      ${isContained ? 'border-contained/40 bg-contained/5' : ''}
      ${!isAnomalous && !isContained ? 'border-border' : ''}
    `}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-primary/60" />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${
          isAnomalous ? 'bg-critical/10 text-critical' : 
          isContained ? 'bg-contained/10 text-contained' : 
          'bg-secondary text-muted-foreground'
        }`}>
          {data.icon}
        </div>
        <div className="text-xs font-semibold text-foreground truncate max-w-[100px]">{data.label}</div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{data.type}</div>
        <div className={`w-2 h-2 rounded-full ${
          isAnomalous ? 'bg-critical' : 
          isContained ? 'bg-contained' : 
          'bg-low'
        }`} />
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-primary/60" />
    </div>
  );
}

const nodeTypes = {
  entityNode: EntityNode,
};

export default function AttackMap() {
  const { data: entities, isLoading } = useListEntities();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // Generate graph data from entities
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!entities) return { initialNodes: [], initialEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Layout logic: Group by type
    const groups: Record<string, Entity[]> = {};
    entities.forEach(e => {
      if (!groups[e.type]) groups[e.type] = [];
      groups[e.type].push(e);
    });

    const typeOrder = ['network-segment', 'server', 'workstation', 'ot-device', 'user'];
    
    let yOffset = 0;
    
    typeOrder.forEach(type => {
      const groupEntities = groups[type] || [];
      const totalWidth = groupEntities.length * 200;
      let xOffset = -totalWidth / 2;

      groupEntities.forEach((entity, index) => {
        nodes.push({
          id: entity.id,
          type: 'entityNode',
          position: { x: xOffset + (index * 200), y: yOffset },
          data: { 
            label: entity.name,
            type: entity.type,
            status: entity.status,
            icon: entity.type === 'server' ? <ServerIcon /> : 
                  entity.type === 'network-segment' ? <NetworkIcon /> :
                  entity.type === 'workstation' ? <WorkstationIcon /> :
                  entity.type === 'user' ? <UserIcon /> : <CpuIcon />
          },
        });

        // Add edges connecting layers
        if (type !== 'network-segment') {
          // Connect to a random network segment to form a topology
          const networkSegments = groups['network-segment'] || [];
          if (networkSegments.length > 0) {
            const targetSegment = networkSegments[index % networkSegments.length];
            edges.push({
              id: `e-${targetSegment.id}-${entity.id}`,
              source: targetSegment.id,
              target: entity.id,
              animated: entity.status === 'anomalous',
              style: { 
                stroke: entity.status === 'anomalous' ? 'hsl(var(--critical))' : 
                        entity.status === 'contained' ? 'hsl(var(--contained))' : 
                        'hsl(var(--primary))', 
                strokeWidth: entity.status === 'anomalous' ? 2 : 1 
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: entity.status === 'anomalous' ? 'hsl(var(--critical))' : 
                       entity.status === 'contained' ? 'hsl(var(--contained))' : 
                       'hsl(var(--primary))',
              },
            });
          }
        }
      });
      yOffset += 150;
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [entities]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Simulation logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating) {
      timer = setTimeout(() => {
        setNodes((nds) => 
          nds.map((node, i) => {
            // Gradually infect nodes based on step
            if (i % 3 === simulationStep % 3) {
              return {
                ...node,
                data: { ...node.data, status: 'anomalous' }
              };
            }
            return node;
          })
        );
        
        setEdges((eds) => 
          eds.map((edge, i) => {
            if (i % 3 === simulationStep % 3) {
              return {
                ...edge,
                animated: true,
                style: { stroke: 'hsl(var(--critical))', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--critical))' }
              };
            }
            return edge;
          })
        );

        setSimulationStep(s => (s + 1) % 5);
      }, 1500);
    } else if (simulationStep > 0) {
      // Reset if stopped
      setNodes(initialNodes);
      setEdges(initialEdges);
      setSimulationStep(0);
    }
    
    return () => clearTimeout(timer);
  }, [isSimulating, simulationStep, setNodes, setEdges, initialNodes, initialEdges]);

  const handleMitigate = () => {
    setIsSimulating(false);
    setNodes((nds) => 
      nds.map((node) => {
        if (node.data.status === 'anomalous') {
          return {
            ...node,
            data: { ...node.data, status: 'contained' }
          };
        }
        return node;
      })
    );
    setEdges((eds) => 
      eds.map((edge) => {
        if (edge.animated) {
          return {
            ...edge,
            animated: false,
            style: { stroke: 'hsl(var(--contained))', strokeWidth: 1 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--contained))' }
          };
        }
        return edge;
      })
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-6 gap-4 shrink-0">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">AI PREDICTION</p>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Attack Map</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time network topology and lateral movement tracking.</p>
          </div>

          <div className="flex gap-3 shrink-0">
            <Button 
              variant={isSimulating ? "outline" : "default"}
              className={isSimulating ? "" : "bg-critical/90 text-white hover:bg-critical border-0"}
              onClick={() => setIsSimulating(!isSimulating)}
            >
              {isSimulating ? "Stop Simulation" : "Simulate Attack Path"}
            </Button>
            
            <Button 
              variant="outline" 
              className="border-contained/40 text-contained hover:bg-contained/8"
              onClick={handleMitigate}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Apply Mitigation
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Badge variant="outline" className="bg-card/90 backdrop-blur text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-low mr-1.5 inline-block" /> Normal
            </Badge>
            <Badge variant="outline" className="bg-card/90 backdrop-blur text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-critical mr-1.5 inline-block" /> Compromised
            </Badge>
            <Badge variant="outline" className="bg-card/90 backdrop-blur text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-contained mr-1.5 inline-block" /> Contained
            </Badge>
          </div>

          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-card">
              <Activity className="w-8 h-8 text-muted-foreground animate-pulse mb-3" />
              <div className="text-sm text-muted-foreground">Rendering topology…</div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background"
              proOptions={{ hideAttribution: true }}
            >
              <Background color="hsl(var(--border))" gap={20} size={1} />
              <Controls className="bg-card border border-border shadow-sm" />
              <MiniMap 
                nodeColor={(node) => {
                  if (node.data?.status === 'anomalous') return 'hsl(var(--critical))';
                  if (node.data?.status === 'contained') return 'hsl(var(--contained))';
                  return 'hsl(var(--primary))';
                }}
                maskColor="rgba(250,250,249,0.8)"
                className="bg-card border border-border rounded-lg shadow-sm"
              />
            </ReactFlow>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Inline Icons for Nodes
const ServerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>;
const NetworkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path></svg>;
const WorkstationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CpuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>;