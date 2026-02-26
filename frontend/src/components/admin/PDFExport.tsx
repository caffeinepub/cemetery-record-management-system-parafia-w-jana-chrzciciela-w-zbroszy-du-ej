import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useGetAllGraves, useGetCemeteryState } from '../../hooks/useQueries';
import { toast } from 'sonner';

export default function PDFExport() {
  const { data: graves = [] } = useGetAllGraves();
  const { data: cemetery } = useGetCemeteryState();
  const [isGenerating, setIsGenerating] = useState(false);

  // Memoize grave lookup for performance
  const graveMap = useMemo(() => {
    const map = new Map<string, typeof graves[0]>();
    graves.forEach((grave) => {
      map.set(grave.id.toString(), grave);
    });
    return map;
  }, [graves]);

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return '-';
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('pl-PL');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Opłacone',
      unpaid: 'Nieopłacone',
      free: 'Wolne',
      reserved: 'Zarezerwowane',
    };
    return labels[status] || 'Nieznany';
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ewidencja Cmentarza - ${cemetery?.cemeteryName || 'Parafia'}</title>
          <style>
            @page {
              size: A4;
              margin: 2cm 2.5cm;
            }
            body {
              font-family: 'Arial', sans-serif;
              font-size: 10pt;
              line-height: 1.4;
              color: #000;
            }
            h1 {
              text-align: center;
              font-size: 16pt;
              margin-bottom: 0.5cm;
              border-bottom: 2px solid #000;
              padding-bottom: 0.3cm;
            }
            h2 {
              font-size: 12pt;
              margin-top: 0.8cm;
              margin-bottom: 0.3cm;
              border-bottom: 1px solid #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0.5cm;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td {
              border: 1px solid #000;
              padding: 0.2cm;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .deceased-list {
              margin: 0;
              padding-left: 1em;
            }
            .footer {
              margin-top: 1cm;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>${cemetery?.cemeteryName || 'Parafia św. Jana Chrzciciela w Zbroszy Dużej'}</h1>
          <h2>Ewidencja Grobów Cmentarza Parafialnego</h2>
          <p style="text-align: center; margin-bottom: 1cm;">
            Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}
          </p>

          ${cemetery?.alleys
            .map(
              (alley) => `
            <h2>Aleja ${alley.name}</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">Nr grobu</th>
                  <th style="width: 30%;">Osoby spoczywające</th>
                  <th style="width: 25%;">Właściciel</th>
                  <th style="width: 12%;">Status</th>
                  <th style="width: 15%;">Opłacone do</th>
                </tr>
              </thead>
              <tbody>
                ${alley.graveIds
                  .map((graveId) => {
                    const grave = graveMap.get(graveId.toString());
                    if (!grave) return '';
                    return `
                    <tr>
                      <td>${grave.plotNumber}</td>
                      <td>
                        ${
                          grave.deceasedPersons.length > 0
                            ? `<ul class="deceased-list">
                            ${grave.deceasedPersons
                              .map(
                                (p) =>
                                  `<li>${p.firstName} ${p.lastName} (${p.yearOfDeath})</li>`
                              )
                              .join('')}
                          </ul>`
                            : '-'
                        }
                      </td>
                      <td>
                        ${
                          grave.owner
                            ? `${grave.owner.firstName} ${grave.owner.lastName}<br/>
                           ${grave.owner.address}${grave.owner.phone ? `<br/>${grave.owner.phone}` : ''}`
                            : '-'
                        }
                      </td>
                      <td>${getStatusLabel(grave.status)}</td>
                      <td>${formatDate(grave.paymentValidUntil)}</td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          `
            )
            .join('')}

          <div class="footer">
            <p>Dokument wygenerowany automatycznie przez system zarządzania cmentarzem</p>
            <p>${cemetery?.cemeteryName || 'Parafia św. Jana Chrzciciela w Zbroszy Dużej'}</p>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ewidencja-cmentarza-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Plik HTML został wygenerowany. Otwórz go w przeglądarce i wydrukuj jako PDF.');
    } catch (error) {
      toast.error('Błąd podczas generowania pliku');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Eksport do PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Wygeneruj elegancki raport PDF zawierający pełną ewidencję grobów cmentarza parafialnego.
          Dokument będzie zawierał wszystkie aleje, groby oraz szczegółowe informacje o osobach
          spoczywających i właścicielach.
        </p>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Zawartość raportu:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Podział na aleje</li>
            <li>Numery grobów</li>
            <li>Dane osób spoczywających (imię, nazwisko, rok śmierci)</li>
            <li>Informacje o właścicielach grobów</li>
            <li>Status opłat i daty ważności</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generatePDF}
            disabled={isGenerating || graves.length === 0}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generowanie...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generuj raport HTML (do druku PDF)
              </>
            )}
          </Button>
        </div>

        {graves.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Brak danych do eksportu. Dodaj groby, aby wygenerować raport.
          </p>
        )}

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p className="font-medium mb-1">Instrukcja:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Kliknij przycisk "Generuj raport HTML"</li>
            <li>Otwórz pobrany plik HTML w przeglądarce</li>
            <li>Użyj funkcji drukowania przeglądarki (Ctrl+P)</li>
            <li>Wybierz "Zapisz jako PDF" jako drukarkę</li>
            <li>Dostosuj ustawienia (marginesy 2-2.5 cm) i zapisz</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
