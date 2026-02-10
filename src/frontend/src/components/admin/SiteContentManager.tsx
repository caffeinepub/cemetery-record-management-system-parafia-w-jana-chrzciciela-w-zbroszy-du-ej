import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Image as ImageIcon, Heart, Church } from 'lucide-react';
import { useGetSiteContent, useUpdateSiteContent, useUpdateLogoImage } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Separator } from '@/components/ui/separator';
import ImageUploadEditor from './ImageUploadEditor';

export default function SiteContentManager() {
  const { data: siteContent, isLoading } = useGetSiteContent();
  const updateSiteContent = useUpdateSiteContent();
  const updateLogoImage = useUpdateLogoImage();

  // Hero content state
  const [headline, setHeadline] = useState('');
  const [introParagraph, setIntroParagraph] = useState('');
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Footer content state
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [isUpdatingFooter, setIsUpdatingFooter] = useState(false);

  // Prayer section state
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerContent, setPrayerContent] = useState('');
  const [memorialPrayer, setMemorialPrayer] = useState('');
  const [isUpdatingPrayer, setIsUpdatingPrayer] = useState(false);

  // Cemetery section state
  const [cemeteryTitle, setCemeteryTitle] = useState('');
  const [cemeteryContent, setCemeteryContent] = useState('');
  const [isUpdatingCemetery, setIsUpdatingCemetery] = useState(false);

  // Initialize form with current site content
  useEffect(() => {
    if (siteContent) {
      setHeadline(siteContent.homepageHero.headline);
      setIntroParagraph(siteContent.homepageHero.introParagraph);
      setAddress(siteContent.footer.address);
      setPhoneNumber(siteContent.footer.phoneNumber);
      setEmail(siteContent.footer.email);
      setOfficeHours(siteContent.footer.officeHours);
      setBankAccountNumber(siteContent.footer.bankAccountNumber);
      setWebsiteLink(siteContent.footer.websiteLink);
      setPrayerTitle(siteContent.prayerForTheDeceased.title);
      setPrayerContent(siteContent.prayerForTheDeceased.content);
      setMemorialPrayer(siteContent.prayerForTheDeceased.memorialPrayer || '');
      setCemeteryTitle(siteContent.cemeteryInformation.title);
      setCemeteryContent(siteContent.cemeteryInformation.content);
    }
  }, [siteContent]);

  const handleLogoSave = async (blob: ExternalBlob | null) => {
    await updateLogoImage.mutateAsync(blob);
  };

  const handleHeroBackgroundSave = async (blob: ExternalBlob | null) => {
    if (!siteContent) return;

    setIsUploadingHero(true);
    try {
      await updateSiteContent.mutateAsync({
        ...siteContent,
        homepageHero: {
          ...siteContent.homepageHero,
          headline,
          introParagraph,
          heroBackgroundImage: blob || undefined,
        },
      });
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleHeroTextSave = async () => {
    if (!siteContent) return;

    setIsUploadingHero(true);
    try {
      await updateSiteContent.mutateAsync({
        ...siteContent,
        homepageHero: {
          ...siteContent.homepageHero,
          headline,
          introParagraph,
        },
      });
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleFooterSave = async () => {
    if (!siteContent) return;

    setIsUpdatingFooter(true);
    try {
      await updateSiteContent.mutateAsync({
        ...siteContent,
        footer: {
          address,
          phoneNumber,
          email,
          officeHours,
          bankAccountNumber,
          websiteLink,
        },
      });
    } finally {
      setIsUpdatingFooter(false);
    }
  };

  const handlePrayerSave = async () => {
    if (!siteContent) return;

    setIsUpdatingPrayer(true);
    try {
      await updateSiteContent.mutateAsync({
        ...siteContent,
        prayerForTheDeceased: {
          title: prayerTitle,
          content: prayerContent,
          memorialPrayer: memorialPrayer,
        },
      });
    } finally {
      setIsUpdatingPrayer(false);
    }
  };

  const handleCemeterySave = async () => {
    if (!siteContent) return;

    setIsUpdatingCemetery(true);
    try {
      await updateSiteContent.mutateAsync({
        ...siteContent,
        cemeteryInformation: {
          title: cemeteryTitle,
          content: cemeteryContent,
        },
      });
    } finally {
      setIsUpdatingCemetery(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo Parafii
          </CardTitle>
          <CardDescription>
            Wgraj logo parafii, które będzie wyświetlane w nagłówku strony
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploadEditor
            label="Logo parafii"
            currentImage={siteContent?.logoImage}
            onSave={handleLogoSave}
            outputWidth={256}
            outputHeight={256}
            disabled={updateLogoImage.isPending}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sekcja Główna (Hero)</CardTitle>
          <CardDescription>
            Edytuj nagłówek, tekst wprowadzający i zdjęcie tła strony głównej
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Nagłówek główny</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Wieczny odpoczynek"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="introParagraph">Tekst wprowadzający</Label>
              <Textarea
                id="introParagraph"
                value={introParagraph}
                onChange={(e) => setIntroParagraph(e.target.value)}
                placeholder="Nasza parafia prowadzi cmentarz katolicki..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleHeroTextSave}
              disabled={isUploadingHero}
              className="w-full"
            >
              {isUploadingHero ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz teksty
                </>
              )}
            </Button>
          </div>

          <Separator />

          <ImageUploadEditor
            label="Zdjęcie tła"
            currentImage={siteContent?.homepageHero.heroBackgroundImage}
            onSave={handleHeroBackgroundSave}
            outputWidth={1920}
            outputHeight={1080}
            disabled={isUploadingHero}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Prayer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Sekcja: Modlitwa za zmarłych
          </CardTitle>
          <CardDescription>
            Edytuj tytuł i treść sekcji modlitwy za zmarłych. Możesz używać HTML do formatowania (np. &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;, &lt;blockquote&gt;).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prayerTitle">Tytuł sekcji</Label>
            <Input
              id="prayerTitle"
              value={prayerTitle}
              onChange={(e) => setPrayerTitle(e.target.value)}
              placeholder="Modlitwa za zmarłych"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prayerContent">Treść sekcji (HTML)</Label>
            <Textarea
              id="prayerContent"
              value={prayerContent}
              onChange={(e) => setPrayerContent(e.target.value)}
              placeholder="<p>Wieczny odpoczynek racz im dać, Panie...</p>"
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Możesz używać HTML: &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;blockquote&gt;, &lt;ul&gt;, &lt;li&gt;
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="memorialPrayer">Modlitwa wypominkowa (lista zmarłych)</Label>
            <Textarea
              id="memorialPrayer"
              value={memorialPrayer}
              onChange={(e) => setMemorialPrayer(e.target.value)}
              placeholder="Jan Kowalski&#10;Maria Nowak&#10;Piotr Wiśniewski&#10;..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Wpisz listę zmarłych, każde imię i nazwisko w osobnej linii. Lista może być dowolnie długa.
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Podgląd</Label>
            <div className="border rounded-lg p-4 bg-muted/30">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: prayerContent || '<p className="text-muted-foreground">Brak treści do wyświetlenia</p>' }}
              />
              {memorialPrayer && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm font-semibold text-foreground mb-3">Modlitwa wypominkowa:</p>
                  <div className="bg-background/50 rounded p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {memorialPrayer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handlePrayerSave}
            disabled={isUpdatingPrayer}
            className="w-full"
          >
            {isUpdatingPrayer ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Zapisz sekcję modlitwy
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Cemetery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="h-5 w-5" />
            Sekcja: O naszym cmentarzu
          </CardTitle>
          <CardDescription>
            Edytuj tytuł i treść sekcji informacyjnej o cmentarzu. Możesz używać HTML do formatowania.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cemeteryTitle">Tytuł sekcji</Label>
            <Input
              id="cemeteryTitle"
              value={cemeteryTitle}
              onChange={(e) => setCemeteryTitle(e.target.value)}
              placeholder="O naszym cmentarzu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cemeteryContent">Treść sekcji (HTML)</Label>
            <Textarea
              id="cemeteryContent"
              value={cemeteryContent}
              onChange={(e) => setCemeteryContent(e.target.value)}
              placeholder="<p>Cmentarz parafialny znajduje się...</p>"
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Możesz używać HTML: &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;blockquote&gt;, &lt;ul&gt;, &lt;li&gt;
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Podgląd</Label>
            <div className="border rounded-lg p-4 bg-muted/30">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: cemeteryContent || '<p className="text-muted-foreground">Brak treści do wyświetlenia</p>' }}
              />
            </div>
          </div>

          <Button
            onClick={handleCemeterySave}
            disabled={isUpdatingCemetery}
            className="w-full"
          >
            {isUpdatingCemetery ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Zapisz sekcję cmentarza
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Footer Section */}
      <Card>
        <CardHeader>
          <CardTitle>Stopka - Dane kontaktowe</CardTitle>
          <CardDescription>
            Edytuj informacje kontaktowe wyświetlane w stopce strony
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ul. Przykładowa 1, 00-000 Miasto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Numer telefonu</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+48 123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kontakt@parafia.pl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="officeHours">Godziny otwarcia kancelarii</Label>
            <Textarea
              id="officeHours"
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              placeholder="Poniedziałek - Piątek: 9:00 - 17:00"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Numer konta bankowego</Label>
            <Input
              id="bankAccountNumber"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="00 0000 0000 0000 0000 0000 0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteLink">Link do strony parafii</Label>
            <Input
              id="websiteLink"
              type="url"
              value={websiteLink}
              onChange={(e) => setWebsiteLink(e.target.value)}
              placeholder="https://parafia.pl"
            />
          </div>

          <Button
            onClick={handleFooterSave}
            disabled={isUpdatingFooter}
            className="w-full"
          >
            {isUpdatingFooter ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Zapisz dane kontaktowe
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
