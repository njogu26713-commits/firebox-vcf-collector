import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/theme';
import { AuthProvider, useAuth } from '@/contexts/auth';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import Layout from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import Campaigns from '@/pages/campaigns';
import CreateCampaign from '@/pages/create-campaign';
import Analytics from '@/pages/analytics';
import Settings from '@/pages/settings';
import CampaignContacts from '@/pages/campaign-contacts';
import SubmitPage from '@/pages/submit';
import SignInPage from '@/pages/sign-in';
import SignUpPage from '@/pages/sign-up';
import { Flame } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <Flame className="w-8 h-8 text-primary animate-pulse" />
    </div>
  );
}

function ProtectedDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return <Redirect to="/sign-in" />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/create" component={CreateCampaign} />
        <Route path="/edit/:id" component={CreateCampaign} />
        <Route path="/campaigns/:id/contacts" component={CampaignContacts} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (user) return <Redirect to="/" />;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public submission page — no auth needed */}
      <Route path="/submit/:token" component={SubmitPage} />

      {/* Auth pages */}
      <Route path="/sign-in">
        <AuthGate>
          <SignInPage />
        </AuthGate>
      </Route>
      <Route path="/sign-up">
        <AuthGate>
          <SignUpPage />
        </AuthGate>
      </Route>

      {/* All other routes require auth */}
      <Route component={ProtectedDashboard} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
