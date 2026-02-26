import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useAdminAuthorization } from './hooks/useAdminAuthorization';
import ProfileSetupModal from './components/ProfileSetupModal';
import ConnectionStatus from './components/ConnectionStatus';
import FloatingLoginControl from './components/FloatingLoginControl';
import PrivatePreviewBanner from './components/PrivatePreviewBanner';
import PrivatePreviewGate from './components/PrivatePreviewGate';
import ActorInitializationErrorScreen from './components/ActorInitializationErrorScreen';
import { usePrivatePreviewMode } from './hooks/usePrivatePreviewMode';
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
      staleTime: 5000,
    },
  },
});

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isPreviewMode = usePrivatePreviewMode();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const {
    isAllowed: isAdminAllowed,
    isLoading: authLoading,
  } = useAdminAuthorization();

  const [isRetryingActor, setIsRetryingActor] = useState(false);
  const [showActorError, setShowActorError] = useState(false);

  // Set a timeout to detect if actor is stuck loading
  useEffect(() => {
    if (!actor && !isInitializing && !actorFetching) {
      const timer = setTimeout(() => {
        if (!actor && !actorFetching) {
          setShowActorError(true);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    } else if (actor) {
      setShowActorError(false);
    }
  }, [actor, actorFetching, isInitializing]);

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Handle actor initialization retry
  const handleActorRetry = async () => {
    setIsRetryingActor(true);
    setShowActorError(false);
    try {
      await queryClient.invalidateQueries({ queryKey: ['actor'] });
      await queryClient.refetchQueries({ queryKey: ['actor'] });
    } finally {
      setTimeout(() => setIsRetryingActor(false), 1000);
    }
  };

  // Show initialization error screen if actor failed to load after timeout
  if (showActorError && !isInitializing) {
    return (
      <ActorInitializationErrorScreen
        onRetry={handleActorRetry}
        isRetrying={isRetryingActor}
      />
    );
  }

  // Show loading only while initializing identity or loading actor
  if (isInitializing || (!actor && !showActorError)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // Show access denied if authenticated but not authorized
  if (isAuthenticated && !authLoading && !isAdminAllowed) {
    return (
      <Suspense fallback={null}>
        <AccessDeniedScreen />
      </Suspense>
    );
  }

  // Private Preview Mode: gate public content when not authenticated
  const shouldShowGate = isPreviewMode && !isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isPreviewMode && <PrivatePreviewBanner />}

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
        ) : shouldShowGate ? (
          <PrivatePreviewGate />
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

      {!isAuthenticated && !shouldShowGate && <FloatingLoginControl />}

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
