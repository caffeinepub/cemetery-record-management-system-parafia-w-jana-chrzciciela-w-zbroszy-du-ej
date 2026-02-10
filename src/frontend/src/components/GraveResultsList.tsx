import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MapPin, User, Calendar, Phone, Home, ChevronDown } from 'lucide-react';
import type { GraveRecord, PublicGraveResult } from '../backend';
import { useState, useMemo } from 'react';
import GraveEditDialog from './admin/GraveEditDialog';

interface GraveResultsListProps {
  results?: GraveRecord[];
  publicResults?: PublicGraveResult[];
  isAdmin?: boolean;
  showCount?: boolean;
}

const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_INCREMENT = 30;

export default function GraveResultsList({ results = [], publicResults = [], isAdmin = false, showCount = true }: GraveResultsListProps) {
  const [editingGrave, setEditingGrave] = useState<GraveRecord | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      paid: { variant: 'default', label: 'Opłacone' },
      unpaid: { variant: 'destructive', label: 'Nieopłacone' },
      free: { variant: 'secondary', label: 'Wolne' },
      reserved: { variant: 'outline', label: 'Zarezerwowane' },
    };
    const config = variants[status] || variants.free;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return null;
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('pl-PL');
  };

  const totalResults = isAdmin ? results.length : publicResults.length;

  // Slice results to only render visible items
  const visibleResults = useMemo(() => {
    return isAdmin ? results.slice(0, visibleCount) : [];
  }, [isAdmin, results, visibleCount]);

  const visiblePublicResults = useMemo(() => {
    return isAdmin ? [] : publicResults.slice(0, visibleCount);
  }, [isAdmin, publicResults, visibleCount]);

  const hasMore = visibleCount < totalResults;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_INCREMENT, totalResults));
  };

  if (totalResults === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nie znaleziono grobów spełniających kryteria wyszukiwania.
        </CardContent>
      </Card>
    );
  }

  // Render public results
  if (!isAdmin && visiblePublicResults.length > 0) {
    return (
      <div className="space-y-4">
        {showCount && (
          <h3 className="text-lg font-semibold">
            Znaleziono {publicResults.length} {publicResults.length === 1 ? 'wynik' : 'wyników'}
          </h3>
        )}

        {visiblePublicResults.map((publicGrave, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    {publicGrave.firstName} {publicGrave.lastName}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(publicGrave.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">
                      Aleja {publicGrave.alley}, Grób nr {publicGrave.plotNumber.toString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            {publicGrave.yearOfDeath && (
              <CardContent>
                <div className="text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Rok śmierci: {publicGrave.yearOfDeath.toString()}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button onClick={handleLoadMore} variant="outline" size="lg">
              <ChevronDown className="mr-2 h-4 w-4" />
              Załaduj więcej ({visibleCount} z {totalResults})
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render admin results
  return (
    <>
      <div className="space-y-4">
        {showCount && (
          <h3 className="text-lg font-semibold">
            Znaleziono {results.length} {results.length === 1 ? 'grób' : 'grobów'}
          </h3>
        )}

        {visibleResults.map((grave) => (
          <Card key={grave.id.toString()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    Aleja {grave.alley}, Grób nr {grave.plotNumber.toString()}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(grave.status)}
                  </div>
                  {grave.deceasedPersons.length > 0 ? (
                    <div className="text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {grave.deceasedPersons[0].firstName} {grave.deceasedPersons[0].lastName}
                        </span>
                        {grave.deceasedPersons.length > 1 && (
                          <span className="text-muted-foreground">
                            {' '}i {grave.deceasedPersons.length - 1} {grave.deceasedPersons.length === 2 ? 'inna osoba' : 'inne osoby'}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Brak osób spoczywających
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setEditingGrave(grave)}>
                    Edytuj
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {grave.deceasedPersons.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Osoby spoczywające:
                  </h4>
                  <div className="space-y-2">
                    {grave.deceasedPersons.map((person, idx) => (
                      <div key={idx} className="pl-6 text-sm">
                        <p className="font-medium">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(person.dateOfDeath) || `Rok: ${person.yearOfDeath}`}
                          {person.placeOfDeath && ` • ${person.placeOfDeath}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {grave.owner && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Właściciel grobu:
                    </h4>
                    <div className="pl-6 text-sm space-y-1">
                      <p className="font-medium">
                        {grave.owner.firstName} {grave.owner.lastName}
                      </p>
                      <p className="text-muted-foreground">{grave.owner.address}</p>
                      {grave.owner.phone && (
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {grave.owner.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {grave.paymentValidUntil && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Opłacone do: </span>
                    <span className="font-medium">{formatDate(grave.paymentValidUntil)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button onClick={handleLoadMore} variant="outline" size="lg">
              <ChevronDown className="mr-2 h-4 w-4" />
              Załaduj więcej ({visibleCount} z {totalResults})
            </Button>
          </div>
        )}
      </div>

      {editingGrave && (
        <GraveEditDialog
          grave={editingGrave}
          open={!!editingGrave}
          onClose={() => setEditingGrave(null)}
        />
      )}
    </>
  );
}
