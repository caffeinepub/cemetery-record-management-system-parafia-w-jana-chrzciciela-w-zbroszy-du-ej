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
      <Card className="shadow-lg">
        <CardContent className="py-16 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!cemetery || cemetery.alleys.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-16 text-center text-muted-foreground text-lg">
          Brak danych o układzie cmentarza.
        </CardContent>
      </Card>
    );
  }

  // Legend items using shared utilities
  const legendItems: Array<{ status: GraveStatus; label: string; color: string }> = [
    { status: GraveStatus.paid, label: getStatusLabel(GraveStatus.paid), color: getStatusLegendColor(GraveStatus.paid) },
    { status: GraveStatus.unpaid, label: getStatusLabel(GraveStatus.unpaid), color: getStatusLegendColor(GraveStatus.unpaid) },
    { status: GraveStatus.reserved, label: getStatusLabel(GraveStatus.reserved), color: getStatusLegendColor(GraveStatus.reserved) },
    { status: GraveStatus.free, label: getStatusLabel(GraveStatus.free), color: getStatusLegendColor(GraveStatus.free) },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <MapPin className="h-6 w-6 text-primary" />
            Mapa cmentarza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <h3 className="font-bold text-base">Legenda statusów:</h3>
            <div className="flex flex-wrap gap-4">
              {legendItems.map((item) => (
                <div key={item.status} className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg">
                  <div className={`w-6 h-6 rounded-md ${item.color} shadow-sm ring-1 ring-border`} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {cemetery.alleys.map((alley) => (
          <LazyMount key={alley.name} rootMargin="200px">
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold">Aleja {alley.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                  {alley.graveIds.map((graveId) => {
                    const tile = tileMap.get(graveId.toString());
                    if (!tile) return null;

                    const styles = getGraveStatusStyles(tile.status);
                    const deceasedNames = tile.deceasedPersons
                      .map((p) => `${p.firstName} ${p.lastName}`)
                      .join(', ');

                    return (
                      <TooltipProvider key={graveId.toString()}>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <button
                              className={`
                                aspect-square rounded-lg ${styles.background} ${styles.text}
                                flex items-center justify-center text-sm font-bold
                                transition-all duration-200
                                hover:scale-110 ${styles.hoverRing}
                                shadow-md hover:shadow-xl
                                focus:outline-none focus-visible:scale-110
                              `}
                              aria-label={`Grób ${tile.plotNumber}, ${getStatusLabel(tile.status)}`}
                            >
                              {tile.plotNumber.toString()}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="max-w-xs bg-popover border-2 shadow-xl p-4"
                          >
                            <div className="space-y-2">
                              <p className="font-bold text-base text-popover-foreground">
                                Grób nr {tile.plotNumber.toString()}
                              </p>
                              <Badge variant={styles.background.includes('green') ? 'default' : styles.background.includes('red') ? 'destructive' : 'secondary'} className="font-semibold">
                                {getStatusLabel(tile.status)}
                              </Badge>
                              {deceasedNames && (
                                <p className="text-sm text-popover-foreground/75 leading-relaxed font-medium">
                                  {deceasedNames}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </LazyMount>
        ))}
      </div>
    </div>
  );
}
