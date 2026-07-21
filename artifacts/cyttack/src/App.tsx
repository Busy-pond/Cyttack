import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/context/AuthContext';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Incidents from '@/pages/Incidents';
import IncidentDetail from '@/pages/IncidentDetail';
import AttackMap from '@/pages/AttackMap';
import Vulnerabilities from '@/pages/Vulnerabilities';
import AuditLog from '@/pages/AuditLog';
import AskSentinel from '@/pages/AskSentinel';

import { useEffect } from 'react';

const queryClient = new QueryClient();

function Router() {
  useEffect(() => {
    document.title = "Cyttack | Cyber Resilience Platform";
  }, []);

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/simulation" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/incidents" component={Incidents} />
      <Route path="/incidents/:id" component={IncidentDetail} />
      <Route path="/attack-map" component={AttackMap} />
      <Route path="/vulnerabilities" component={Vulnerabilities} />
      <Route path="/audit-log" component={AuditLog} />
      <Route path="/ask-sentinel" component={AskSentinel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
