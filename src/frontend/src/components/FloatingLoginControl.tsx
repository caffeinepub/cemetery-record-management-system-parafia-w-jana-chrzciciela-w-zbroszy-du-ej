import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function FloatingLoginControl() {
  const { login, loginStatus } = useInternetIdentity();

  const disabled = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        // Handle edge case - will be cleared by the app
      }
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={disabled}
      size="icon"
      variant="outline"
      className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-lg bg-card/80 backdrop-blur-sm border-border hover:bg-accent z-40 transition-all"
    >
      <LogIn className="h-4 w-4" />
    </Button>
  );
}
