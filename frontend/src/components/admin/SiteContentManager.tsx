import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Image as ImageIcon, Heart, Church, Mail } from 'lucide-react';
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

  // Parish Footer state
  const [parishName, setParishName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [oneSentenceDescription, setOneSentenceDescription] = useState('');
  const [massTimes, setMassTimes] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [bibleQuote, setBibleQuote] = useState('');
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
      
      setParishName(siteContent.parishFooter.parishName);
      setFullAddress(siteContent.parishFooter.fullAddress);
      setOneSentenceDescription(siteContent.parishFooter.oneSentenceDescription);
      setMassTimes(siteContent.parishFooter.massTimes);
      setPhoneNumber(siteContent.parishFooter.phoneNumber);
      setEmail(siteContent.parishFooter.email);
      setBankAccountNumber(siteContent.parishFooter.bankAccountNumber);
      setWebsiteUrl(siteContent.parishFooter.websiteUrl);
      setFacebookUrl(siteContent.parishFooter.facebookUrl);
      setYoutubeUrl(siteContent.parishFooter.youtubeUrl);
      setXUrl(siteContent.parishFooter.xUrl);
      setBibleQuote(siteContent.parishFooter.bibleQuote);
      
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
        parishFooter: {
          parishName,
          fullAddress,
          oneSentenceDescription,
          massTimes,
          phoneNumber,
          email,
          bankAccountNumber,
          websiteUrl,
          facebookUrl,
          youtubeUrl,
          xUrl,
          bibleQuote,
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

      {/* Parish Footer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Stopka Parafii - Pełne Informacje
          </CardTitle>
          <CardDescription>
            Edytuj wszystkie informacje wyświetlane w stopce strony: dane parafii, godziny Mszy, kontakt, media społecznościowe i cytat biblijny
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parish Identity */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-foreground">
              Tożsamość Parafii
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="parishName">Nazwa parafii</Label>
              <Input
                id="parishName"
                value={parishName}
                onChange={(e) => setParishName(e.target.value)}
                placeholder="Parafia św. Jana Chrzciciela w Zbroszy Dużej"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullAddress">Pełny adres</Label>
              <Input
                id="fullAddress"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="Zbrosza Duża 57, 05-650 Chynów"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oneSentenceDescription">Krótki opis (jedno zdanie)</Label>
              <Textarea
                id="oneSentenceDescription"
                value={oneSentenceDescription}
                onChange={(e) => setOneSentenceDescription(e.target.value)}
                placeholder="Parafia rzymskokatolicka prowadząca cmentarz katolicki w Zbroszy Dużej."
                rows={2}
              />
            </div>
          </div>

          {/* Mass Times */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-foreground">
              Godziny Mszy Świętych
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="massTimes">Godziny Mszy (możesz używać wielu linii)</Label>
              <Textarea
                id="massTimes"
                value={massTimes}
                onChange={(e) => setMassTimes(e.target.value)}
                placeholder="Niedziela: 8:00, 10:00, 12:00&#10;Dni powszednie: 18:00"
                rows={4}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-foreground">
              Dane Kontaktowe
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Numer telefonu</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+48 48 662 70 01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="zbroszaduza@archidiecezja.waw.pl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Numer konta bankowego</Label>
              <Input
                id="bankAccountNumber"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Bank Pekao S.A. 06 1240 3259 1111 0010 7422 2925"
              />
              <p className="text-xs text-muted-foreground">
                Numer będzie klikalny - użytkownicy będą mogli go skopiować jednym kliknięciem
              </p>
            </div>
          </div>

          {/* Social Media & Web Links */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-foreground">
              Linki do Mediów Społecznościowych i Strony WWW
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Strona internetowa parafii</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://zbroszaduza.parafialnastrona.pl/"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input
                id="facebookUrl"
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://www.facebook.com/parafiazbroszaduza/"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube</Label>
              <Input
                id="youtubeUrl"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/channel/UC..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="xUrl">X (Twitter)</Label>
              <Input
                id="xUrl"
                type="url"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/parafia..."
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Pozostaw puste pola dla mediów społecznościowych, których parafia nie używa
            </p>
          </div>

          {/* Bible Quote */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-foreground">
              Cytat Biblijny
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="bibleQuote">Cytat biblijny lub modlitwa</Label>
              <Textarea
                id="bibleQuote"
                value={bibleQuote}
                onChange={(e) => setBibleQuote(e.target.value)}
                placeholder="Wieczny odpoczynek racz im dać, Panie, a światłość wiekuista niechaj im świeci."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Ten cytat będzie wyświetlany w eleganckim stylu w stopce strony
              </p>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleFooterSave}
            disabled={isUpdatingFooter}
            className="w-full"
            size="lg"
          >
            {isUpdatingFooter ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Zapisywanie stopki...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Zapisz wszystkie informacje stopki
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
