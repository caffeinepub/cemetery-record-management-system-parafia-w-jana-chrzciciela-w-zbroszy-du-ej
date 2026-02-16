import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import ProfileSetupModal from './components/ProfileSetupModal';
import ConnectionStatus from './components/ConnectionStatus';
import FloatingLoginControl from './components/FloatingLoginControl';
import { isBossLockError } from './utils/authErrors';
import { useActor } from './hooks/useActor';

const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const PublicPage = lazy(() => import('./pages/PublicPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AccessDeniedScreen = lazy(() => import('./components/AccessDeniedScreen'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    error: profileError,
  } = useGetCallerUserProfile();

  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (profileError && isBossLockError(profileError)) {
      setShowAccessDenied(true);
    } else {
      setShowAccessDenied(false);
    }
  }, [profileError]);

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing || !actor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (showAccessDenied) {
    return (
      <Suspense fallback={null}>
        <AccessDeniedScreen />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      <main className="flex-1">
        <ConnectionStatus />

        {isAuthenticated ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }
          >
            <AdminPanel />
          </Suspense>
        ) : (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }
          >
            <PublicPage />
          </Suspense>
        )}
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      {!isAuthenticated && <FloatingLoginControl />}

      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
