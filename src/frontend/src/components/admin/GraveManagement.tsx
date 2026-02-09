import { useState, useMemo, lazy, Suspense } from 'react';
import { 
  useInfinitePaginatedGraves,
  useInfiniteSearchGravesPaginated 
} from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search } from 'lucide-react';
import GraveResultsList from '../GraveResultsList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// Lazy load the edit dialog only when needed
const GraveEditDialog = lazy(() => import('./GraveEditDialog'));

export default function GraveManagement() {
  const pageSize = 100;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [isCreating, setIsCreating] = useState(false);

  const hasQuery = debouncedSearchTerm.trim().length > 0;

  // Paginated browsing when no query
  const {
    data: browseData,
    isLoading: browseLoading,
    isFetchingNextPage: browseFetchingNextPage,
    hasNextPage: browseHasNextPage,
    fetchNextPage: browseFetchNextPage,
  } = useInfinitePaginatedGraves(pageSize, hasQuery);

  // Paginated search when query present
  const {
    data: searchData,
    isLoading: searchLoading,
    isFetchingNextPage: searchFetchingNextPage,
    hasNextPage: searchHasNextPage,
    fetchNextPage: searchFetchNextPage,
  } = useInfiniteSearchGravesPaginated(debouncedSearchTerm, pageSize, !hasQuery);

  // Determine which data source to use
  const data = hasQuery ? searchData : browseData;
  const isLoading = hasQuery ? searchLoading : browseLoading;
  const isFetchingNextPage = hasQuery ? searchFetchingNextPage : browseFetchingNextPage;
  const hasNextPage = hasQuery ? searchHasNextPage : browseHasNextPage;
  const fetchNextPage = hasQuery ? searchFetchNextPage : browseFetchNextPage;

  // Flatten all loaded pages into a single array
  const allLoadedGraves = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.graves);
  }, [data]);

  const totalLoaded = allLoadedGraves.length;
  const totalGraves = data?.pages[0]?.totalGraves ? Number(data.pages[0].totalGraves) : 0;

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
              {hasQuery ? (
                <>
                  Znaleziono <span className="font-semibold text-foreground">{totalLoaded}</span>{' '}
                  {totalGraves > totalLoaded && (
                    <>z <span className="font-semibold text-foreground">{totalGraves}</span></>
                  )}{' '}
                  grobów
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

      <GraveResultsList results={allLoadedGraves} isAdmin={true} showCount={false} />

      {isCreating && (
        <Suspense fallback={null}>
          <GraveEditDialog
            grave={null}
            open={isCreating}
            onClose={() => setIsCreating(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
