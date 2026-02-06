import { lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import ConnectionStatus from './components/ConnectionStatus';
import FloatingLoginControl from './components/FloatingLoginControl';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for better performance
const PublicPage = lazy(() => import('./pages/PublicPage'));
const ManagementPanel = lazy(() => import('./pages/AdminPanel'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6">
            <ConnectionStatus />
            {showProfileSetup ? (
              <ProfileSetupModal />
            ) : (
              <Suspense fallback={<LoadingFallback />}>
                {isAuthenticated ? <ManagementPanel /> : <PublicPage />}
              </Suspense>
            )}
          </div>
        </main>
        <Footer />
        {!isAuthenticated && <FloatingLoginControl />}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
