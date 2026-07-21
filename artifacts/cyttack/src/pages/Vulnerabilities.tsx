import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListVulnerabilities } from "@workspace/api-client-react";
import { ShieldHalf, ExternalLink, AlertTriangle } from "lucide-react";

export default function Vulnerabilities() {
  const { data: vulnerabilities, isLoading } = useListVulnerabilities();

  const getCriticalityClass = (crit: string) => {
    switch(crit) {
      case 'critical': return 'text-critical';
      case 'high': return 'text-high';
      case 'medium': return 'text-medium';
      case 'low': return 'text-low';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="mb-10">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">ENTERPRISE-READY</p>
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Vulnerability Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">Prioritized patching queue based on business criticality.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/60">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[160px] text-[10px] font-medium uppercase tracking-widest text-muted-foreground">CVE ID</TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Asset</TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">CVSS</TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Exploitability</TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Business Impact</TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Action</TableHead>
                <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><div className="h-4 w-24 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-12 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-12 bg-secondary animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-secondary animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-secondary animate-pulse rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                vulnerabilities?.sort((a, b) => b.cvssScore - a.cvssScore).map((vuln) => (
                  <TableRow key={vuln.id} className="border-border hover:bg-secondary/40 transition-colors">
                    <TableCell className="font-mono text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {vuln.cvssScore > 9 && <AlertTriangle className="w-3.5 h-3.5 text-critical shrink-0" />}
                        <a 
                          href={`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {vuln.cveId} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{vuln.assetName}</TableCell>
                    <TableCell>
                      <span className={`font-mono font-bold text-sm ${
                        vuln.cvssScore >= 9.0 ? 'text-critical' : 
                        vuln.cvssScore >= 7.0 ? 'text-high' : 
                        vuln.cvssScore >= 4.0 ? 'text-medium' : 'text-muted-foreground'
                      }`}>
                        {vuln.cvssScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{vuln.exploitabilityScore.toFixed(1)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${getCriticalityClass(vuln.businessCriticality)}`}>
                        {vuln.businessCriticality}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${
                        vuln.recommendedAction === 'patch_now' ? 'border-critical/30 text-critical bg-critical/5' : 
                        vuln.recommendedAction === 'monitor' ? 'border-primary/30 text-primary bg-primary/5' : ''
                      }`}>
                        {vuln.recommendedAction.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${
                        vuln.patchStatus === 'patched' ? 'border-contained/30 text-contained bg-contained/5' : 'border-border text-muted-foreground'
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
