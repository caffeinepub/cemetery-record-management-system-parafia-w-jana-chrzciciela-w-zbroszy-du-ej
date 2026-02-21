import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ActorInitializationErrorScreenProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export default function ActorInitializationErrorScreen({
  onRetry,
  isRetrying,
}: ActorInitializationErrorScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-md w-full space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            Unable to Connect
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              The application failed to initialize. This may be due to a network issue or server problem.
            </p>
          </AlertDescription>
        </Alert>

        <Button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full"
          size="lg"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </>
          )}
        </Button>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            If the problem persists, please try:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Refreshing the page</li>
            <li>Checking your internet connection</li>
            <li>Trying a different browser</li>
            <li>Clearing your browser cache</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
