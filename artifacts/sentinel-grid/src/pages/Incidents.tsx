import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListAlerts } from "@workspace/api-client-react";
import { format } from "date-fns";
import { AlertTriangle, Filter, Search, ShieldAlert, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Incidents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { data: alerts, isLoading } = useListAlerts();

  const filteredAlerts = alerts?.filter(alert => 
    alert.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" />
            Active Incidents
          </h1>
          <p className="text-muted-foreground mt-1">Investigate and respond to detected anomalies.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search entity, ID, description..." 
              className="pl-9 bg-card border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[120px] font-mono text-xs uppercase tracking-wider text-muted-foreground">ID</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Entity</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Severity</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Score</TableHead>
                <TableHead className="hidden md:table-cell font-mono text-xs uppercase tracking-wider text-muted-foreground">Stage</TableHead>
                <TableHead className="hidden lg:table-cell font-mono text-xs uppercase tracking-wider text-muted-foreground">Description</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><div className="h-4 w-16 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-16 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-8 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="h-6 w-24 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><div className="h-4 w-48 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-secondary animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAlerts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No incidents matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts?.map((alert) => (
                  <TableRow 
                    key={alert.id} 
                    className="border-border hover:bg-secondary/30 cursor-pointer group"
                    onClick={() => setLocation(`/incidents/${alert.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {alert.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {alert.severity === 'critical' && <AlertTriangle className="w-4 h-4 text-critical animate-pulse" />}
                        {alert.entityName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={alert.severity as any} className="uppercase text-[10px]">
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${alert.anomalyScore > 80 ? 'text-critical' : alert.anomalyScore > 60 ? 'text-high' : 'text-primary'}`}>
                        {alert.anomalyScore}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground border border-border capitalize">
                        {alert.attackStage.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px]" title={alert.description}>
                      {alert.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${alert.status === 'new' ? 'border-primary text-primary' : ''}
                        ${alert.status === 'investigating' ? 'border-medium text-medium' : ''}
                        ${alert.status === 'contained' ? 'border-contained text-contained bg-contained/10' : ''}
                        ${alert.status === 'resolved' ? 'border-muted text-muted-foreground' : ''}
                        capitalize
                      `}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
