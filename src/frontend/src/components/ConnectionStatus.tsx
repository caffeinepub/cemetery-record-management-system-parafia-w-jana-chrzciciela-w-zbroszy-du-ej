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
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowWarning(false);
    }
  }, [actor, isFetching]);

  if (isFetching) {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Łączenie z serwerem...</AlertDescription>
      </Alert>
    );
  }

  if (showWarning && !actor) {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Brak połączenia z serwerem. Sprawdź połączenie internetowe i odśwież stronę.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
