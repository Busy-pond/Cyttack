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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-3">
            <ListOrdered className="w-8 h-8 text-primary" />
            System Audit Log
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm uppercase tracking-wider">Immutable chronological record of system events</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden font-mono text-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/80 border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[180px] text-muted-foreground">TIMESTAMP (UTC)</TableHead>
                <TableHead className="w-[120px] text-muted-foreground">ACTOR</TableHead>
                <TableHead className="w-[200px] text-muted-foreground">ACTION</TableHead>
                <TableHead className="text-muted-foreground">DETAILS</TableHead>
                <TableHead className="w-[120px] text-right text-muted-foreground">REF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="terminal-scroll">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-40 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-full bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-secondary animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-secondary/30">
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${
                        log.actor === 'system' ? 'border-muted text-muted-foreground' : 
                        log.actor === 'ciso' ? 'border-primary text-primary' : 'border-high text-high'
                      }`}>
                        {log.actor === 'system' && <Shield className="w-3 h-3 mr-1" />}
                        {log.actor}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-primary">{log.actionType}</TableCell>
                    <TableCell className="text-foreground">{log.description}</TableCell>
                    <TableCell className="text-right">
                      {log.relatedIncidentId ? (
                        <Link href={`/incidents/${log.relatedIncidentId}`} className="text-primary hover:underline">
                          {log.relatedIncidentId.substring(0, 8)}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
