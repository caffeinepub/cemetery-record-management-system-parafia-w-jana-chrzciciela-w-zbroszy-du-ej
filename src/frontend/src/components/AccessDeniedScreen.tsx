import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

/**
 * Access denied screen for non-Boss users attempting to access the single-admin locked application.
 * Displays a clear message and provides a logout action.
 */
export default function AccessDeniedScreen() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full mx-auto text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            This application is locked to a single administrator account.
          </p>
          <p className="text-sm text-muted-foreground">
            Only the first user who logged in has access to manage this system.
          </p>
        </div>

        <Button 
          onClick={handleLogout}
          variant="default"
          size="lg"
          className="w-full"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
