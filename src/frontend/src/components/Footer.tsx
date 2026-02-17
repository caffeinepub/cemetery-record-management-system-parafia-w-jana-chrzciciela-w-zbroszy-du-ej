import { Heart, Phone, Mail, Copy, ExternalLink, Check } from 'lucide-react';
import { SiFacebook, SiYoutube, SiX } from 'react-icons/si';
import { useGetParishFooterContent } from '../hooks/useQueries';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Footer() {
  const { data: footerContent, isLoading } = useGetParishFooterContent();
  const [copied, setCopied] = useState(false);

  const handleCopyBankAccount = async () => {
    if (!footerContent?.bankAccountNumber) return;
    
    try {
      await navigator.clipboard.writeText(footerContent.bankAccountNumber);
      setCopied(true);
      toast.success('Numer konta skopiowany do schowka');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Nie udało się skopiować numeru konta');
    }
  };

  if (isLoading || !footerContent) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(window.location.hostname || 'parish-cemetery-app');

  return (
    <footer className="relative border-t-2 border-border bg-gradient-to-b from-card/50 to-card/80 backdrop-blur-sm mt-auto overflow-hidden">
      {/* Decorative background */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none bg-repeat"
        style={{
          backgroundImage: 'url(/assets/generated/parchment-texture.dim_1600x1200.jpg)',
          backgroundSize: '400px 300px',
        }}
      />
      
      <div className="container relative mx-auto px-6 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Parish Identity */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <img 
                src="/assets/generated/cross-golden-transparent.dim_64x64.png" 
                alt="" 
                className="w-8 h-8 mt-1 opacity-80"
              />
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {footerContent.parishName}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {footerContent.oneSentenceDescription}
                </p>
              </div>
            </div>
            
            <div className="pl-11">
              <p className="text-sm text-foreground font-medium">
                {footerContent.fullAddress}
              </p>
            </div>
          </div>

          {/* Mass Times & Contact */}
          <div className="space-y-4">
            {footerContent.massTimes && (
              <div>
                <h4 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
                  Godziny Mszy Świętych
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {footerContent.massTimes}
                </p>
              </div>
            )}

            <Separator className="my-3" />

            <div>
              <h4 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
                Kontakt
              </h4>
              <div className="space-y-2">
                {footerContent.phoneNumber && (
                  <a
                    href={`tel:${footerContent.phoneNumber}`}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
                  >
                    <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{footerContent.phoneNumber}</span>
                  </a>
                )}
                {footerContent.email && (
                  <a
                    href={`mailto:${footerContent.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
                  >
                    <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium break-all">{footerContent.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bank Account & Links */}
          <div className="space-y-4">
            {footerContent.bankAccountNumber && (
              <div>
                <h4 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
                  Numer konta bankowego
                </h4>
                <div className="flex items-start gap-2">
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed flex-1 break-all">
                    {footerContent.bankAccountNumber}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBankAccount}
                    className="h-8 w-8 p-0 shrink-0"
                    title="Kopiuj numer konta"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Separator className="my-3" />

            {/* Social & Web Links */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
                Odwiedź nas
              </h4>
              <div className="flex flex-wrap gap-2">
                {footerContent.websiteUrl && (
                  <a
                    href={footerContent.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Strona WWW
                  </a>
                )}
                {footerContent.facebookUrl && (
                  <a
                    href={footerContent.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                    title="Facebook"
                  >
                    <SiFacebook className="h-3.5 w-3.5" />
                    Facebook
                  </a>
                )}
                {footerContent.youtubeUrl && (
                  <a
                    href={footerContent.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                    title="YouTube"
                  >
                    <SiYoutube className="h-3.5 w-3.5" />
                    YouTube
                  </a>
                )}
                {footerContent.xUrl && (
                  <a
                    href={footerContent.xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                    title="X (Twitter)"
                  >
                    <SiX className="h-3.5 w-3.5" />
                    X
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Text Section */}
        {footerContent.bibleQuote && (
          <>
            <Separator className="my-6" />
            
            <div className="max-w-2xl mx-auto text-center mb-8">
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
                {footerContent.bibleQuote}
              </p>
            </div>
          </>
        )}

        <Separator className="my-6" />

        {/* Copyright & Attribution */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} {footerContent.parishName}
          </p>
          <p className="mt-2">
            Built with{' '}
            <Heart className="inline h-4 w-4 text-red-500 fill-red-500 mx-0.5" />{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
