import { useGetPublicSiteContent } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import SiteContentLoadErrorBanner from './SiteContentLoadErrorBanner';

export default function HeroSection() {
  const { data: siteContent, isLoading, isError, error } = useGetPublicSiteContent();

  const defaultImage = '/assets/generated/parish-church.dim_800x600.jpg';
  
  // Prefer uploaded hero background, fallback to URL, then default
  const backgroundImage = siteContent?.homepageHero.heroBackgroundImage
    ? siteContent.homepageHero.heroBackgroundImage.getDirectURL()
    : siteContent?.homepageHero.backgroundImageUrl || defaultImage;

  // Use persisted headline or fallback
  const mainTitle = siteContent?.homepageHero.headline || 'Wieczny odpoczynek';
  const introParagraph = siteContent?.homepageHero.introParagraph || 'Nasza parafia prowadzi cmentarz katolicki, w którym spoczywają nasi bliscy zmarli i parafianie.';

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 py-16 relative">
        {isError && (
          <SiteContentLoadErrorBanner />
        )}

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="relative h-64 mb-8 rounded-lg overflow-hidden shadow-2xl">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <>
                <img
                  src={backgroundImage}
                  alt="Kościół parafialny"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
              <Skeleton className="h-6 w-2/3 mx-auto" />
            </div>
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                {mainTitle}
              </h2>

              <div className="space-y-3">
                <p className="text-lg text-muted-foreground italic">
                  „Ja jestem zmartwychwstaniem i życiem. Kto we Mnie wierzy, choćby i umarł, żyć będzie."
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  J 11,25
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {introParagraph}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
