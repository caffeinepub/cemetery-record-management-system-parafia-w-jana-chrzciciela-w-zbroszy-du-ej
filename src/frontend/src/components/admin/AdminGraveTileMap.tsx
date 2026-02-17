import { useMemo, useState } from 'react';
import { useGetAllGraves, useGetCemeteryState } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, MapPin } from 'lucide-react';
import GraveEditDialog from './GraveEditDialog';
import type { GraveRecord } from '../../backend';
import { GraveStatus } from '../../backend';
import { getGraveStatusStyles, getStatusLabel, getStatusLegendColor } from '../../utils/graveStatusStyles';
import LazyMount from '../LazyMount';

export default function AdminGraveTileMap() {
  const { data: graves = [], isLoading: gravesLoading } = useGetAllGraves();
  const { data: cemetery, isLoading: cemeteryLoading } = useGetCemeteryState();
  const [selectedGrave, setSelectedGrave] = useState<GraveRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Memoize grave lookup for performance
  const graveMap = useMemo(() => {
    const map = new Map<string, GraveRecord>();
    graves.forEach((grave) => {
      map.set(grave.id.toString(), grave);
    });
    return map;
  }, [graves]);

  const getGraveById = (id: bigint): GraveRecord | undefined => {
    return graveMap.get(id.toString());
  };

  const formatDate = (timestamp?: bigint) => {
    if (!timestamp) return null;
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('pl-PL');
  };

  const handleTileClick = (grave: GraveRecord) => {
    setSelectedGrave(grave);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Small delay before clearing selection to prevent flash
    setTimeout(() => setSelectedGrave(null), 150);
  };

  if (gravesLoading || cemeteryLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!cemetery || cemetery.alleys.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Brak danych o układzie cmentarza.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interaktywna mapa cmentarza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Kliknij na grób, aby edytować jego dane. Podświetlenie zmienia kolor zgodnie ze statusem grobu.
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getStatusLegendColor(GraveStatus.paid)}`} />
                <span className="text-sm">Opłacone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getStatusLegendColor(GraveStatus.unpaid)}`} />
                <span className="text-sm">Nieopłacone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getStatusLegendColor(GraveStatus.free)}`} />
                <span className="text-sm">Wolne</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getStatusLegendColor(GraveStatus.reserved)}`} />
                <span className="text-sm">Zarezerwowane</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {cemetery.alleys.map((alley) => (
            <LazyMount key={alley.name} rootMargin="600px">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aleja {alley.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 overflow-x-auto">
                      {alley.graveIds.map((graveId) => {
                        const grave = getGraveById(graveId);
                        if (!grave) return null;

                        const styles = getGraveStatusStyles(grave.status);

                        return (
                          <Tooltip key={graveId.toString()}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleTileClick(grave)}
                                className={`
                                  aspect-square rounded-md transition-all cursor-pointer
                                  ${styles.background}
                                  ${styles.hoverRing}
                                  ${styles.text}
                                  hover:scale-105
                                  flex items-center justify-center text-xs font-medium shadow-sm
                                  focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-2
                                `}
                              >
                                {grave.plotNumber.toString()}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
                              <div className="space-y-2">
                                <p className="font-semibold">
                                  Aleja {grave.alley}, Grób {grave.plotNumber.toString()}
                                </p>
                                <Badge variant="outline">{getStatusLabel(grave.status)}</Badge>
                                {grave.deceasedPersons.length > 0 && (
                                  <div className="text-sm">
                                    <p className="font-medium">Spoczywają:</p>
                                    {grave.deceasedPersons.map((person, idx) => (
                                      <p key={idx} className="text-popover-foreground font-bold">
                                        {person.firstName} {person.lastName} ({person.yearOfDeath.toString()})
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {grave.owner && (
                                  <div className="text-sm">
                                    <p className="font-medium">Właściciel:</p>
                                    <p className="text-muted-foreground">
                                      {grave.owner.firstName} {grave.owner.lastName}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {grave.owner.address}
                                    </p>
                                    {grave.owner.phone && (
                                      <p className="text-muted-foreground text-xs">
                                        Tel: {grave.owner.phone}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {grave.paymentValidUntil && (
                                  <p className="text-sm text-muted-foreground">
                                    Opłacone do: {formatDate(grave.paymentValidUntil)}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground italic mt-2">
                                  Kliknij, aby edytować
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </LazyMount>
          ))}
        </div>
      </div>

      <GraveEditDialog 
        grave={selectedGrave} 
        open={dialogOpen} 
        onClose={handleCloseDialog}
      />
    </>
  );
}
