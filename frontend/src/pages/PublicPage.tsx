import { lazy, Suspense, useState } from 'react';
import HeroSection from '../components/HeroSection';
import PublicNavigationBar from '../components/PublicNavigationBar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useGetPublicSiteContent } from '../hooks/useQueries';

const GraveSearch = lazy(() => import('../components/GraveSearch'));
const GraveTileMap = lazy(() => import('../components/GraveTileMap'));

type SectionId = 'map' | 'search' | 'prayer' | 'about';

const SectionLoader = () => (
  <Card className="shadow-lg">
    <CardContent className="py-16 flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
    </CardContent>
  </Card>
);

export default function PublicPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('search');

  const { data: siteContent } = useGetPublicSiteContent();

  const prayerContent = siteContent?.prayerForTheDeceased || {
    title: 'Modlitwa za zmarłych',
    content: 'Wieczny odpoczynek racz im dać, Panie...',
    memorialPrayer: '',
  };

  const cemeteryInfo = siteContent?.cemeteryInformation || {
    title: 'O naszym cmentarzu',
    content: 'Cmentarz parafialny znajduje się w Zbroszy Dużej.',
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <PublicNavigationBar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="container mx-auto px-6 py-10">
        {/* Mapa grobów */}
        {activeSection === 'map' && (
          <section>
            <Suspense fallback={<SectionLoader />}>
              <GraveTileMap />
            </Suspense>
          </section>
        )}

        {/* Wyszukiwanie */}
        {activeSection === 'search' && (
          <section>
            <Suspense fallback={<SectionLoader />}>
              <GraveSearch isAdmin={false} />
            </Suspense>
          </section>
        )}

        {/* Modlitwa za zmarłych */}
        {activeSection === 'prayer' && (
          <section>
            <Card className="max-w-4xl mx-auto shadow-xl border-2">
              <CardContent className="p-8 md:p-12 space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
                  {prayerContent.title}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div
                    className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-center text-lg"
                    dangerouslySetInnerHTML={{ __html: prayerContent.content }}
                  />
                </div>

                {prayerContent.memorialPrayer && prayerContent.memorialPrayer.trim() !== '' && (
                  <div className="mt-10 pt-8 border-t-2 border-border">
                    <h3 className="text-2xl font-bold text-center mb-6 text-foreground">
                      Modlitwa wypominkowa
                    </h3>
                    <div className="bg-muted/50 rounded-xl p-6 max-h-96 overflow-y-auto shadow-inner">
                      <div
                        className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-base"
                        dangerouslySetInnerHTML={{ __html: prayerContent.memorialPrayer }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Nasz cmentarz */}
        {activeSection === 'about' && (
          <section>
            <Card className="max-w-4xl mx-auto shadow-xl border-2">
              <CardContent className="p-8 md:p-12 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
                  {cemeteryInfo.title}
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div
                    className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: cemeteryInfo.content }}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
