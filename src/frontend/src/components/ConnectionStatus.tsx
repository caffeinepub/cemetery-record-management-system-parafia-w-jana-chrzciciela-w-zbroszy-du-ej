import { useBackendHealthCheck } from '../hooks/useBackendHealthCheck';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function ConnectionStatus() {
  const { status, recheck, hasActorError } = useBackendHealthCheck();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await recheck();
    } finally {
      // Keep showing retry state for a moment to prevent flashing
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  if (status === 'checking' && !isRetrying) {
    return (
      <Alert className="mb-4 mx-4 mt-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Connecting to server...</AlertDescription>
      </Alert>
    );
  }

  if (status === 'disconnected') {
    return (
      <Alert variant="destructive" className="mb-4 mx-4 mt-4">
        {hasActorError ? <AlertCircle className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>
            {hasActorError
              ? 'Failed to initialize connection. Please retry.'
              : 'Unable to reach the server. Please check your connection.'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="shrink-0"
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
