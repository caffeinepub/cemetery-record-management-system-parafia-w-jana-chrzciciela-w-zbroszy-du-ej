import { useMemo } from 'react';
import { useGetCemeteryState, useGetPublicTiles } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, MapPin } from 'lucide-react';
import type { PublicTileData } from '../backend';
import { GraveStatus } from '../backend';
import { getGraveStatusStyles, getStatusLabel, getStatusLegendColor } from '../utils/graveStatusStyles';
import LazyMount from './LazyMount';

export default function GraveTileMap() {
  const { data: publicTiles = [], isLoading: tilesLoading } = useGetPublicTiles();
  const { data: cemetery, isLoading: cemeteryLoading } = useGetCemeteryState();

  // Build a map of grave ID to tile data for fast lookup
  const tileMap = useMemo(() => {
    const map = new Map<string, PublicTileData>();
    publicTiles.forEach((tile) => {
      map.set(tile.id.toString(), tile);
    });
    return map;
  }, [publicTiles]);

  if (tilesLoading || cemeteryLoading) {
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

  // Legend items using shared utilities
  const legendItems: Array<{ status: GraveStatus; label: string }> = [
    { status: GraveStatus.paid, label: 'Opłacone' },
    { status: GraveStatus.unpaid, label: 'Nieopłacone' },
    { status: GraveStatus.free, label: 'Wolne' },
    { status: GraveStatus.reserved, label: 'Zarezerwowane' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa cmentarza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            {legendItems.map(({ status, label }) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getStatusLegendColor(status)}`} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
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
                      // Get tile data for this grave ID, or create a free tile if not found
                      const tile = tileMap.get(graveId.toString()) || {
                        id: graveId,
                        alley: alley.name,
                        plotNumber: graveId,
                        status: GraveStatus.free,
                        deceasedPersons: [],
                      };

                      const styles = getGraveStatusStyles(tile.status);

                      return (
                        <Tooltip key={graveId.toString()}>
                          <TooltipTrigger asChild>
                            <button
                              className={`
                                aspect-square rounded-md transition-all cursor-default
                                ${styles.background}
                                ${styles.hoverRing}
                                ${styles.text}
                                hover:scale-105
                                flex items-center justify-center text-xs font-medium shadow-sm
                                focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-2
                              `}
                            >
                              {tile.plotNumber.toString()}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
                            <div className="space-y-2">
                              <p className="font-semibold">
                                Aleja {tile.alley}, Grób {tile.plotNumber.toString()}
                              </p>
                              <Badge variant="outline">{getStatusLabel(tile.status)}</Badge>
                              {tile.deceasedPersons.length > 0 && (
                                <div className="text-sm">
                                  <p className="font-medium">Spoczywają:</p>
                                  {tile.deceasedPersons.map((person, idx) => (
                                    <p key={idx} className="text-muted-foreground">
                                      {person.firstName} {person.lastName}
                                      {person.yearOfDeath > 0 && ` (${person.yearOfDeath.toString()})`}
                                    </p>
                                  ))}
                                </div>
                              )}
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
  );
}
