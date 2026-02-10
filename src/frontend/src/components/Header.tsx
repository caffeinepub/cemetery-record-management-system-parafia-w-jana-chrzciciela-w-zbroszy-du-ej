import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPublicSiteContent } from '../hooks/useQueries';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: siteContent } = useGetPublicSiteContent();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Use custom logo if available, otherwise fallback to static asset
  const logoSrc = siteContent?.logoImage
    ? siteContent.logoImage.getDirectURL()
    : '/assets/generated/parish-logo.dim_256x256.png';

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt="Logo parafii"
              className="h-12 w-12 object-contain"
              loading="eager"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Parafia św. Jana Chrzciciela
              </h1>
              <p className="text-sm text-muted-foreground">Zbrosza Duża</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isAuthenticated && (
              <Button variant="outline" onClick={handleLogout}>
                Wyloguj
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
