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
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-transparent to-transparent">
      <div className="container mx-auto px-6 py-20 relative">
        {isError && (
          <SiteContentLoadErrorBanner />
        )}

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="relative h-72 mb-10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border">
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
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
              </>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-5">
              <Skeleton className="h-14 w-3/4 mx-auto" />
              <Skeleton className="h-7 w-full max-w-2xl mx-auto" />
              <Skeleton className="h-7 w-2/3 mx-auto" />
            </div>
          ) : (
            <>
              <h2 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
                {mainTitle}
              </h2>

              <div className="space-y-4 pt-2">
                <p className="text-xl text-muted-foreground italic font-light leading-relaxed">
                  „Ja jestem zmartwychwstaniem i życiem. Kto we Mnie wierzy, choćby i umarł, żyć będzie."
                </p>
                <p className="text-sm text-muted-foreground font-semibold tracking-wide">
                  J 11,25
                </p>
              </div>

              <div className="pt-6 space-y-4">
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
