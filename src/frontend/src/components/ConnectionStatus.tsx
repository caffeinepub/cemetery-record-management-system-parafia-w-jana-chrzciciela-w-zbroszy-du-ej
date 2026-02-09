import { useEffect, useState } from 'react';
import { useActor } from '../hooks/useActor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Loader2 } from 'lucide-react';

export default function ConnectionStatus() {
  const { actor, isFetching } = useActor();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Show warning if actor is not available after initial loading
    if (!isFetching && !actor) {
      const timer = setTimeout(() => {
        setShowWarning(true);
      }, 5000); // Wait 5 seconds before showing warning to avoid false positives
      return () => clearTimeout(timer);
    } else {
      setShowWarning(false);
    }
  }, [actor, isFetching]);

  if (isFetching) {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Connecting to server...</AlertDescription>
      </Alert>
    );
  }

  if (showWarning && !actor) {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Failed to communicate with backend. Please check your internet connection and refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
