import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListVulnerabilities } from "@workspace/api-client-react";
import { ShieldHalf, ExternalLink, AlertTriangle } from "lucide-react";

export default function Vulnerabilities() {
  const { data: vulnerabilities, isLoading } = useListVulnerabilities();

  const getCriticalityColor = (crit: string) => {
    switch(crit) {
      case 'critical': return 'text-critical';
      case 'high': return 'text-high';
      case 'medium': return 'text-medium';
      case 'low': return 'text-low';
      default: return '';
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-3">
            <ShieldHalf className="w-8 h-8 text-primary" />
            Vulnerability Queue
          </h1>
          <p className="text-muted-foreground mt-1">Prioritized patching queue based on business criticality.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border">
                <TableHead className="w-[150px] font-mono text-xs uppercase tracking-wider text-muted-foreground">CVE ID</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Asset</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">CVSS</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Exploitability</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Biz Impact</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><div className="h-4 w-24 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-12 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-12 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-6 w-24 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-6 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                vulnerabilities?.sort((a, b) => b.cvssScore - a.cvssScore).map((vuln) => (
                  <TableRow key={vuln.id} className="border-border hover:bg-secondary/30">
                    <TableCell className="font-mono text-primary font-medium flex items-center gap-2">
                      {vuln.cvssScore > 9 && <AlertTriangle className="w-4 h-4 text-critical animate-pulse" />}
                      <a href={`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                        {vuln.cveId} <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell className="font-medium">{vuln.assetName}</TableCell>
                    <TableCell>
                      <div className={`font-mono font-bold ${
                        vuln.cvssScore >= 9.0 ? 'text-critical' : 
                        vuln.cvssScore >= 7.0 ? 'text-high' : 
                        vuln.cvssScore >= 4.0 ? 'text-medium' : 'text-low'
                      }`}>
                        {vuln.cvssScore.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{vuln.exploitabilityScore.toFixed(1)}</TableCell>
                    <TableCell>
                      <span className={`uppercase text-xs font-bold tracking-wider ${getCriticalityColor(vuln.businessCriticality)}`}>
                        {vuln.businessCriticality}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`uppercase text-[10px] ${
                        vuln.recommendedAction === 'patch_now' ? 'border-critical text-critical bg-critical/10' : 
                        vuln.recommendedAction === 'monitor' ? 'border-primary text-primary' : ''
                      }`}>
                        {vuln.recommendedAction.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`uppercase text-[10px] ${
                        vuln.patchStatus === 'patched' ? 'bg-contained/20 text-contained' : ''
                      }`}>
                        {vuln.patchStatus.replace('_', ' ')}
                      </Badge>
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
