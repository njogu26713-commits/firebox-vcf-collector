import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/theme';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';
import Layout from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import Campaigns from '@/pages/campaigns';
import CreateCampaign from '@/pages/create-campaign';
import Analytics from '@/pages/analytics';
import Settings from '@/pages/settings';
import SubmitPage from '@/pages/submit';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#16a34a',
    colorForeground: '#111827',
    colorMutedForeground: '#6b7280',
    colorDanger: '#dc2626',
    colorBackground: '#ffffff',
    colorInput: '#f9fafb',
    colorInputForeground: '#111827',
    colorNeutral: '#e5e7eb',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white dark:bg-[#0f1117] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#e5e7eb] dark:border-[#1f2937]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-gray-900 font-bold',
    headerSubtitle: 'text-gray-500',
    socialButtonsBlockButtonText: 'text-gray-700 font-medium',
    formFieldLabel: 'text-gray-700 font-medium',
    footerActionLink: 'text-green-600 hover:text-green-700 font-semibold',
    footerActionText: 'text-gray-500',
    dividerText: 'text-gray-400',
    identityPreviewEditButton: 'text-green-600',
    formFieldSuccessText: 'text-green-600',
    alertText: 'text-gray-700',
    logoBox: 'flex justify-center mb-2',
    logoImage: 'h-10 w-10',
    socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50',
    formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-white font-semibold',
    formFieldInput: 'border-gray-200 bg-gray-50 text-gray-900',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-gray-200',
    alert: 'bg-red-50 border-red-200',
    otpCodeFieldInput: 'border-gray-200',
    formFieldRow: '',
    main: '',
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ProtectedDashboard() {
  return (
    <>
      <Show when="signed-in">
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
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public submission page — no auth needed */}
      <Route path="/submit/:token" component={SubmitPage} />

      {/* Clerk auth pages */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* All other routes require auth */}
      <Route component={ProtectedDashboard} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your Firebox account' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Start collecting VCF contacts today' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
