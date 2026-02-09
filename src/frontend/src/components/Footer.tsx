import { Heart, ExternalLink } from 'lucide-react';
import { useGetPublicSiteContent } from '../hooks/useQueries';
import { Separator } from '@/components/ui/separator';
import SiteContentLoadErrorBanner from './SiteContentLoadErrorBanner';

export default function Footer() {
  const { data: siteContent, isLoading, isError } = useGetPublicSiteContent();

  // Fallback content for when data cannot be loaded
  const fallbackContent = {
    address: 'Zbrosza Duża 57, 05-650 Chynów',
    phoneNumber: '+48 48 662 70 01',
    email: 'zbroszaduza@archidiecezja.waw.pl',
    officeHours: 'Poniedziałek, czwartek i piątek w godz. 16.30-18.00',
    bankAccountNumber: 'Bank Pekao S.A. 06 1240 3259 1111 0010 7422 2925',
    websiteLink: 'https://zbroszaduza.parafialnastrona.pl/',
  };

  const content = siteContent?.footer || fallbackContent;

  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        {isError && (
          <SiteContentLoadErrorBanner message="Nie można załadować aktualnych danych kontaktowych. Wyświetlane są podstawowe informacje." />
        )}

        {!isLoading && (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Adres</h3>
                <p className="text-muted-foreground">{content.address}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Kontakt</h3>
                <div className="space-y-1 text-muted-foreground">
                  <p>Tel: {content.phoneNumber}</p>
                  <p>Email: {content.email}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Kancelaria parafialna</h3>
                <p className="text-muted-foreground">{content.officeHours}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Numer konta bankowego</h3>
                <p className="text-muted-foreground font-mono text-xs">{content.bankAccountNumber}</p>
              </div>
              
              {content.websiteLink && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Strona internetowa</h3>
                  <a
                    href={content.websiteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Odwiedź naszą stronę
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <div className="text-center text-sm text-muted-foreground">
          © 2026. Built with{' '}
          <Heart className="inline h-4 w-4 text-red-500 fill-red-500" />{' '}
          using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
