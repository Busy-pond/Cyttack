import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListAuditLog } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ListOrdered, Shield } from "lucide-react";
import { Link } from "wouter";

export default function AuditLog() {
  const { data: logs, isLoading } = useListAuditLog();

  return (
    <AppLayout>
      <div className="mb-10">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">ENTERPRISE-READY</p>
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Immutable chronological record of all system events.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/60">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[180px] text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Timestamp (UTC)</TableHead>
                <TableHead className="w-[120px] text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Actor</TableHead>
                <TableHead className="w-[200px] text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Action</TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Details</TableHead>
                <TableHead className="w-[120px] text-right text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-40 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-full bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-secondary animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-secondary/40 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${
                        log.actor === 'system' ? 'border-border text-muted-foreground' : 
                        log.actor === 'ciso' ? 'border-primary/30 text-primary bg-primary/5' : 
                        'border-high/30 text-high bg-high/5'
                      }`}>
                        {log.actor === 'system' && <Shield className="w-3 h-3 mr-1" />}
                        {log.actor}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{log.actionType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.description}</TableCell>
                    <TableCell className="text-right">
                      {log.relatedIncidentId ? (
                        <Link href={`/incidents/${log.relatedIncidentId}`} className="text-xs text-primary hover:underline font-mono">
                          {log.relatedIncidentId.substring(0, 8)}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
