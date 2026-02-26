import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SiteContentLoadErrorBannerProps {
  message?: string;
}

export default function SiteContentLoadErrorBanner({ 
  message = 'Nie można załadować treści strony. Wyświetlane są domyślne informacje.' 
}: SiteContentLoadErrorBannerProps) {
  return (
    <Alert variant="default" className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
        {message}
      </AlertDescription>
    </Alert>
  );
}
