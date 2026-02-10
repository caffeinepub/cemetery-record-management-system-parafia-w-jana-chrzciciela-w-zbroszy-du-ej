import { useState, lazy, Suspense, useRef } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import HeroSection from '../components/HeroSection';
import PublicSectionsTiles from '../components/PublicSectionsTiles';
import { Loader2, Heart, Church } from 'lucide-react';
import { useGetPublicSiteContent } from '../hooks/useQueries';

// Lazy load heavy components only when needed
const GraveSearch = lazy(() => import('../components/GraveSearch'));
const GraveTileMap = lazy(() => import('../components/GraveTileMap'));

function ComponentLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

type SectionId = 'map' | 'search' | 'prayer' | 'about';

export default function PublicPage() {
  const [activeTab, setActiveTab] = useState('search');
  const [showPrayer, setShowPrayer] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const prayerRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  const { data: siteContent } = useGetPublicSiteContent();

  const handleSectionSelect = (section: SectionId) => {
    switch (section) {
      case 'search':
        setActiveTab('search');
        setTimeout(() => {
          tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      case 'map':
        setActiveTab('map');
        setTimeout(() => {
          tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      case 'prayer':
        setShowPrayer(true);
        setTimeout(() => {
          prayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      case 'about':
        setShowAbout(true);
        setTimeout(() => {
          aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <HeroSection />

      <PublicSectionsTiles onSelect={handleSectionSelect} />

      <div ref={tabsRef} className="container mx-auto px-4 scroll-mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="search" className="mt-6">
            <Suspense fallback={<ComponentLoader />}>
              <GraveSearch />
            </Suspense>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <Suspense fallback={<ComponentLoader />}>
              <GraveTileMap />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {showPrayer && (
        <section
          ref={prayerRef}
          className="container mx-auto px-4 py-12 scroll-mt-8"
        >
          <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-lg p-8 border-2 border-border">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                {siteContent?.prayerForTheDeceased.title || 'Modlitwa za zmarłych'}
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: siteContent?.prayerForTheDeceased.content || 
                    'Wieczny odpoczynek racz im dać, Panie, a światłość wiekuista niechaj im świeci.\n\nNiech odpoczywają w pokoju wiecznym. Amen.'
                }}
              />
              
              {siteContent?.prayerForTheDeceased.memorialPrayer && 
               siteContent.prayerForTheDeceased.memorialPrayer.trim() !== '' && (
                <div className="mt-8 pt-8 border-t-2 border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Modlitwa wypominkowa
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                      {siteContent.prayerForTheDeceased.memorialPrayer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {showAbout && (
        <section
          ref={aboutRef}
          className="container mx-auto px-4 py-12 scroll-mt-8"
        >
          <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-lg p-8 border-2 border-border">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Church className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                {siteContent?.cemeteryInformation.title || 'Nasz cmentarz'}
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: siteContent?.cemeteryInformation.content || 
                    'Cmentarz parafialny przy Parafii św. Jana Chrzciciela w Zbroszy Dużej jest miejscem wiecznego spoczynku naszych parafian i ich bliskich.'
                }}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
