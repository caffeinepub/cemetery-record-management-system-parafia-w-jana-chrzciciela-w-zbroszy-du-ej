import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MapPin, User, Calendar, Phone, Home, ChevronDown } from 'lucide-react';
import type { GraveRecord, PublicGraveResult } from '../backend';
import { useState, useMemo } from 'react';
import GraveEditDialog from './admin/GraveEditDialog';
import { getStatusLabel } from '../utils/graveStatusStyles';

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
      paid: { variant: 'default', label: getStatusLabel(status as any) },
      unpaid: { variant: 'destructive', label: getStatusLabel(status as any) },
      free: { variant: 'secondary', label: getStatusLabel(status as any) },
      reserved: { variant: 'outline', label: getStatusLabel(status as any) },
    };
    const config = variants[status] || variants.free;
    return <Badge variant={config.variant} className="font-semibold px-3 py-1">{config.label}</Badge>;
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
      <Card className="shadow-lg">
        <CardContent className="py-16 text-center text-muted-foreground text-lg">
          Nie znaleziono grobów spełniających kryteria wyszukiwania.
        </CardContent>
      </Card>
    );
  }

  // Render public results
  if (!isAdmin && visiblePublicResults.length > 0) {
    return (
      <div className="space-y-5">
        {showCount && (
          <h3 className="text-xl font-bold">
            Znaleziono {publicResults.length} {publicResults.length === 1 ? 'wynik' : 'wyników'}
          </h3>
        )}

        {visiblePublicResults.map((publicGrave, idx) => (
          <Card 
            key={idx} 
            className="shadow-md hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 hover:-translate-y-1"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <User className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="font-bold">{publicGrave.firstName} {publicGrave.lastName}</span>
                  </CardTitle>
                  <div className="flex items-center gap-3 flex-wrap">
                    {getStatusBadge(publicGrave.status)}
                  </div>
                  <div className="flex items-center gap-2 text-base text-foreground bg-muted/50 px-4 py-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-bold">
                      Aleja {publicGrave.alley}, Grób nr {publicGrave.plotNumber.toString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            {publicGrave.yearOfDeath && (
              <CardContent className="pt-0">
                <div className="text-sm bg-muted/30 px-4 py-2 rounded-lg">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Rok śmierci: {publicGrave.yearOfDeath.toString()}</span>
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleLoadMore} 
              variant="outline" 
              size="lg"
              className="font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <ChevronDown className="mr-2 h-5 w-5" />
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
      <div className="space-y-5">
        {showCount && (
          <h3 className="text-xl font-bold">
            Znaleziono {results.length} {results.length === 1 ? 'grób' : 'grobów'}
          </h3>
        )}

        {visibleResults.map((grave) => (
          <Card 
            key={grave.id.toString()} 
            className="shadow-md hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-base text-foreground bg-primary/10 px-4 py-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-bold">
                      Aleja {grave.alley}, Grób nr {grave.plotNumber.toString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {getStatusBadge(grave.status)}
                  </div>
                  {grave.deceasedPersons.length > 0 ? (
                    <CardTitle className="flex items-center gap-3 text-xl pt-1">
                      <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      <div>
                        <span className="font-bold">
                          {grave.deceasedPersons[0].firstName} {grave.deceasedPersons[0].lastName}
                        </span>
                        {grave.deceasedPersons.length > 1 && (
                          <span className="text-base text-muted-foreground font-normal ml-2">
                            i {grave.deceasedPersons.length - 1} {grave.deceasedPersons.length === 2 ? 'inna osoba' : 'inne osoby'}
                          </span>
                        )}
                      </div>
                    </CardTitle>
                  ) : (
                    <div className="text-base text-muted-foreground italic pl-1">
                      Brak osób spoczywających
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingGrave(grave)}
                    className="font-medium shrink-0"
                  >
                    Edytuj
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {grave.deceasedPersons.length > 0 && (
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-base">
                    <User className="h-5 w-5 text-primary" />
                    Osoby spoczywające:
                  </h4>
                  <div className="space-y-3">
                    {grave.deceasedPersons.map((person, idx) => (
                      <div key={idx} className="pl-7 text-sm bg-muted/30 py-2 rounded-lg">
                        <p className="font-semibold text-base">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
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
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-base">
                      <Home className="h-5 w-5 text-primary" />
                      Właściciel grobu:
                    </h4>
                    <div className="pl-7 text-sm space-y-1 bg-muted/30 py-2 rounded-lg">
                      <p className="font-semibold text-base">
                        {grave.owner.firstName} {grave.owner.lastName}
                      </p>
                      <p className="text-muted-foreground">{grave.owner.address}</p>
                      {grave.owner.phone && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
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
                  <div className="text-sm bg-muted/30 px-4 py-2 rounded-lg">
                    <span className="text-muted-foreground">Opłacone do: </span>
                    <span className="font-semibold">{formatDate(grave.paymentValidUntil)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleLoadMore} 
              variant="outline" 
              size="lg"
              className="font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <ChevronDown className="mr-2 h-5 w-5" />
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
