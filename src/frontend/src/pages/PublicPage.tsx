import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import PublicSectionsTiles from '../components/PublicSectionsTiles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useGetPublicSiteContent } from '../hooks/useQueries';

const GraveSearch = lazy(() => import('../components/GraveSearch'));
const GraveTileMap = lazy(() => import('../components/GraveTileMap'));

type SectionId = 'map' | 'search' | 'prayer' | 'about';

export default function PublicPage() {
  const [activeTab, setActiveTab] = useState<SectionId>('search');
  const [visibleSections, setVisibleSections] = useState<Set<SectionId>>(new Set());
  const tabsRef = useRef<HTMLDivElement>(null);
  const prayerRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  const { data: siteContent } = useGetPublicSiteContent();

  const handleTileSelect = (section: SectionId) => {
    setVisibleSections((prev) => new Set(prev).add(section));

    if (section === 'map' || section === 'search') {
      setActiveTab(section);
      setTimeout(() => {
        tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (section === 'prayer') {
      setTimeout(() => {
        prayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (section === 'about') {
      setTimeout(() => {
        aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

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

      <PublicSectionsTiles onSelect={handleTileSelect} />

      <div ref={tabsRef} className="container mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SectionId)} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 mb-8 shadow-md">
            <TabsTrigger value="search" className="text-base font-semibold">
              Wyszukiwanie
            </TabsTrigger>
            <TabsTrigger value="map" className="text-base font-semibold">
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-0">
            <Suspense
              fallback={
                <Card className="shadow-lg">
                  <CardContent className="py-16 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              }
            >
              <GraveSearch isAdmin={false} />
            </Suspense>
          </TabsContent>

          <TabsContent value="map" className="mt-0">
            <Suspense
              fallback={
                <Card className="shadow-lg">
                  <CardContent className="py-16 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              }
            >
              <GraveTileMap />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {visibleSections.has('prayer') && (
        <section ref={prayerRef} className="container mx-auto px-6 py-12 scroll-mt-20">
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

      {visibleSections.has('about') && (
        <section ref={aboutRef} className="container mx-auto px-6 py-12 scroll-mt-20">
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
    </div>
  );
}
