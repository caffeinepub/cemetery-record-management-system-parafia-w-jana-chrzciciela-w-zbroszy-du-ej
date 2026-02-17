import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Banner component that indicates the app is running in Private Preview Mode
 * Displayed at the top of the application to clearly mark internal-only builds
 */
export default function PrivatePreviewBanner() {
  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500/20">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-900 dark:text-amber-100 font-medium">
        Private Preview Mode — This build is for internal testing only
      </AlertDescription>
    </Alert>
  );
}
