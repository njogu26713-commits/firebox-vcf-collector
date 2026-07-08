import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/theme';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Layout from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import Campaigns from '@/pages/campaigns';
import CreateCampaign from '@/pages/create-campaign';
import Analytics from '@/pages/analytics';
import Settings from '@/pages/settings';
import SubmitPage from '@/pages/submit';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public submission page — no dashboard layout */}
      <Route path="/submit/:token" component={SubmitPage} />

      {/* Dashboard routes */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/campaigns" component={Campaigns} />
            <Route path="/create" component={CreateCampaign} />
            <Route path="/edit/:id" component={CreateCampaign} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;