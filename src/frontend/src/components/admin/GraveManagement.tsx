import { useState, useMemo, lazy, Suspense } from 'react';
import { useInfinitePaginatedGraves } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search } from 'lucide-react';
import GraveResultsList from '../GraveResultsList';
import { buildGraveSearchIndex } from '../../utils/graveFullTextSearch';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// Lazy load the edit dialog only when needed
const GraveEditDialog = lazy(() => import('./GraveEditDialog'));

export default function GraveManagement() {
  const pageSize = 100;
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePaginatedGraves(pageSize);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);
  const [isCreating, setIsCreating] = useState(false);

  // Flatten all loaded pages into a single array
  const allLoadedGraves = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.graves);
  }, [data]);

  // Build normalized search indices only when dataset changes
  const searchIndices = useMemo(() => {
    const map = new Map<string, string>();
    allLoadedGraves.forEach((grave) => {
      map.set(grave.id.toString(), buildGraveSearchIndex(grave));
    });
    return map;
  }, [allLoadedGraves]);

  // Apply in-memory search filter using debounced term and precomputed indices
  const filteredGraves = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim() === '') {
      return allLoadedGraves;
    }

    const normalizedQuery = debouncedSearchTerm.toLowerCase().trim();
    return allLoadedGraves.filter((grave) => {
      const searchIndex = searchIndices.get(grave.id.toString()) || '';
      return searchIndex.includes(normalizedQuery);
    });
  }, [allLoadedGraves, debouncedSearchTerm, searchIndices]);

  const totalLoaded = allLoadedGraves.length;
  const totalGraves = data?.pages[0]?.totalGraves ? Number(data.pages[0].totalGraves) : 0;
  const filteredCount = filteredGraves.length;

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
          <CardTitle>Zarządzanie grobami</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Szukaj po alei, numerze, nazwisku, adresie..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nowy grób
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {debouncedSearchTerm ? (
                <>
                  Wyświetlono <span className="font-semibold text-foreground">{filteredCount}</span> z{' '}
                  <span className="font-semibold text-foreground">{totalLoaded}</span> załadowanych grobów
                </>
              ) : (
                <>
                  Załadowano <span className="font-semibold text-foreground">{totalLoaded}</span> z{' '}
                  <span className="font-semibold text-foreground">{totalGraves}</span> grobów
                </>
              )}
            </div>
            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                size="sm"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ładowanie...
                  </>
                ) : (
                  'Załaduj więcej'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <GraveResultsList results={filteredGraves} isAdmin={true} showCount={false} />

      {isCreating && (
        <Suspense fallback={<div>Loading...</div>}>
          <GraveEditDialog grave={null} open={isCreating} onClose={() => setIsCreating(false)} />
        </Suspense>
      )}
    </div>
  );
}
