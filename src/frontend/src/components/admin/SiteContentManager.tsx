import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Image as ImageIcon, Heart, Church } from 'lucide-react';
import { useGetSiteContent, useUpdateSiteContent } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Separator } from '@/components/ui/separator';
import ImageUploadEditor from './ImageUploadEditor';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function SiteContentManager() {
  const { data: siteContent, isLoading } = useGetSiteContent();
  const updateSiteContent = useUpdateSiteContent();

  // Hero content state
  const [headline, setHeadline] = useState('');
  const [introParagraph, setIntroParagraph] = useState('');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<ExternalBlob | null>(null);
  const [logoImage, setLogoImage] = useState<ExternalBlob | null>(null);

  // Footer content state
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');

  // Public sections state
  const [gravesDeclarationTitle, setGravesDeclarationTitle] = useState('');
  const [gravesDeclarationContent, setGravesDeclarationContent] = useState('');
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerContent, setPrayerContent] = useState('');
  const [cemeteryInfoTitle, setCemeteryInfoTitle] = useState('');
  const [cemeteryInfoContent, setCemeteryInfoContent] = useState('');

  // Load initial data
  useEffect(() => {
    if (siteContent) {
      setHeadline(siteContent.homepageHero.headline);
      setIntroParagraph(siteContent.homepageHero.introParagraph);
      setHeroBackgroundImage(siteContent.homepageHero.heroBackgroundImage || null);
      setLogoImage(siteContent.logoImage || null);

      setAddress(siteContent.footer.address);
      setPhoneNumber(siteContent.footer.phoneNumber);
      setEmail(siteContent.footer.email);
      setOfficeHours(siteContent.footer.officeHours);
      setBankAccountNumber(siteContent.footer.bankAccountNumber);
      setWebsiteLink(siteContent.footer.websiteLink);

      setGravesDeclarationTitle(siteContent.gravesDeclaration.title);
      setGravesDeclarationContent(siteContent.gravesDeclaration.content);
      setPrayerTitle(siteContent.prayerForTheDeceased.title);
      setPrayerContent(siteContent.prayerForTheDeceased.content);
      setCemeteryInfoTitle(siteContent.cemeteryInformation.title);
      setCemeteryInfoContent(siteContent.cemeteryInformation.content);
    }
  }, [siteContent]);

  const handleSaveLogoImage = async (blob: ExternalBlob) => {
    setLogoImage(blob);
  };

  const handleSaveHeroBackgroundImage = async (blob: ExternalBlob) => {
    setHeroBackgroundImage(blob);
  };

  const handleSave = async () => {
    if (!siteContent) return;

    const updatedContent = {
      homepageHero: {
        headline,
        introParagraph,
        backgroundImageUrl: siteContent.homepageHero.backgroundImageUrl,
        heroBackgroundImage: heroBackgroundImage || undefined,
        logoImage: logoImage || undefined,
      },
      footer: {
        address,
        phoneNumber,
        email,
        officeHours,
        bankAccountNumber,
        websiteLink,
      },
      logoImage: logoImage || undefined,
      gravesDeclaration: {
        title: gravesDeclarationTitle,
        content: gravesDeclarationContent,
      },
      prayerForTheDeceased: {
        title: prayerTitle,
        content: prayerContent,
      },
      cemeteryInformation: {
        title: cemeteryInfoTitle,
        content: cemeteryInfoContent,
      },
    };

    await updateSiteContent.mutateAsync(updatedContent);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="h-5 w-5" />
            Logo parafii
          </CardTitle>
          <CardDescription>
            Logo wyświetlane w nagłówku strony dla wszystkich odwiedzających
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploadEditor
            label="Logo parafii"
            currentImage={logoImage}
            onSave={handleSaveLogoImage}
            outputWidth={256}
            outputHeight={256}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Sekcja Hero (strona główna)
          </CardTitle>
          <CardDescription>
            Główna sekcja powitalna widoczna na stronie głównej
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Nagłówek</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Parafia św. Jana Chrzciciela..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="introParagraph">Tekst wprowadzający</Label>
            <Textarea
              id="introParagraph"
              value={introParagraph}
              onChange={(e) => setIntroParagraph(e.target.value)}
              placeholder="Nasza parafia prowadzi cmentarz..."
              rows={4}
            />
          </div>

          <ImageUploadEditor
            label="Obraz tła sekcji hero"
            currentImage={heroBackgroundImage}
            onSave={handleSaveHeroBackgroundImage}
            outputWidth={1920}
            outputHeight={1080}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sekcja: Orzeczenie cmentarza parafialnego</CardTitle>
          <CardDescription>
            Treść sekcji o orzeczeniu cmentarza (widoczna na stronie publicznej)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gravesDeclarationTitle">Tytuł sekcji</Label>
            <Input
              id="gravesDeclarationTitle"
              value={gravesDeclarationTitle}
              onChange={(e) => setGravesDeclarationTitle(e.target.value)}
              placeholder="Orzeczenie cmentarza parafialnego"
            />
          </div>

          <div className="space-y-2">
            <Label>Treść sekcji (HTML)</Label>
            <ReactQuill
              theme="snow"
              value={gravesDeclarationContent}
              onChange={setGravesDeclarationContent}
              className="bg-background"
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">Podgląd:</p>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: gravesDeclarationContent }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sekcja: Modlitwa za zmarłych</CardTitle>
          <CardDescription>
            Treść sekcji z modlitwą za zmarłych (widoczna na stronie publicznej)
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
            <Label>Treść sekcji (HTML)</Label>
            <ReactQuill
              theme="snow"
              value={prayerContent}
              onChange={setPrayerContent}
              className="bg-background"
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">Podgląd:</p>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: prayerContent }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sekcja: O naszym cmentarzu</CardTitle>
          <CardDescription>
            Treść sekcji informacyjnej o cmentarzu (widoczna na stronie publicznej)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cemeteryInfoTitle">Tytuł sekcji</Label>
            <Input
              id="cemeteryInfoTitle"
              value={cemeteryInfoTitle}
              onChange={(e) => setCemeteryInfoTitle(e.target.value)}
              placeholder="O naszym cmentarzu"
            />
          </div>

          <div className="space-y-2">
            <Label>Treść sekcji (HTML)</Label>
            <ReactQuill
              theme="snow"
              value={cemeteryInfoContent}
              onChange={setCemeteryInfoContent}
              className="bg-background"
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">Podgląd:</p>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: cemeteryInfoContent }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stopka - Dane kontaktowe</CardTitle>
          <CardDescription>
            Informacje kontaktowe wyświetlane w stopce strony
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Zbrosza Duża 57..."
              />
            </div>

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
              <Input
                id="officeHours"
                value={officeHours}
                onChange={(e) => setOfficeHours(e.target.value)}
                placeholder="Poniedziałek, czwartek..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Numer konta bankowego</Label>
              <Input
                id="bankAccountNumber"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Bank Pekao S.A. 06 1240..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteLink">Link do strony internetowej</Label>
              <Input
                id="websiteLink"
                type="url"
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
                placeholder="https://parafia.pl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateSiteContent.isPending}
          size="lg"
        >
          {updateSiteContent.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Save className="mr-2 h-4 w-4" />
          Zapisz wszystkie zmiany
        </Button>
      </div>
    </div>
  );
}
