import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, User, Calendar, Phone, Home } from 'lucide-react';
import type { GraveRecord, PublicGraveShape } from '../backend';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import GraveEditDialog from './admin/GraveEditDialog';

interface GraveResultsListProps {
  results?: GraveRecord[];
  publicResults?: PublicGraveShape[];
  isAdmin?: boolean;
  showCount?: boolean;
}

export default function GraveResultsList({ results = [], publicResults = [], isAdmin = false, showCount = true }: GraveResultsListProps) {
  const [editingGrave, setEditingGrave] = useState<GraveRecord | null>(null);

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
  if (!isAdmin && publicResults.length > 0) {
    return (
      <div className="space-y-4">
        {showCount && (
          <h3 className="text-lg font-semibold">
            Znaleziono {publicResults.length} {publicResults.length === 1 ? 'wynik' : 'wyników'}
          </h3>
        )}

        {publicResults.map((publicGrave, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    {publicGrave.firstName} {publicGrave.lastName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(publicGrave.status)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {publicGrave.yearOfDeath && (
                <div className="text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Year of death: {publicGrave.yearOfDeath.toString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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

        {results.map((grave) => (
          <Card key={grave.id.toString()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    Aleja {grave.alley}, Grób nr {grave.plotNumber.toString()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(grave.status)}
                  </div>
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
