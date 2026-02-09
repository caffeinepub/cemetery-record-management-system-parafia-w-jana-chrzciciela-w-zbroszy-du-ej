import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  useInfinitePaginatedGraves, 
  useGetPublicGraves,
  useInfiniteSearchGravesPaginated,
  useInfiniteSearchPublicGravesPaginated 
} from '../hooks/useQueries';
import GraveResultsList from './GraveResultsList';
import { searchGravesInMemory, searchPublicGravesInMemory } from '../utils/graveFullTextSearch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { GraveRecord, PublicGraveShape } from '../backend';

interface GraveSearchProps {
  isAdmin?: boolean;
}

export default function GraveSearch({ isAdmin = false }: GraveSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const pageSize = 50;

  const hasQuery = debouncedSearchQuery.trim().length > 0;

  // Admin mode: paginated browsing when no query, paginated search when query present
  const {
    data: adminBrowseData,
    isLoading: adminBrowseLoading,
    isFetchingNextPage: adminBrowseFetchingNextPage,
    hasNextPage: adminBrowseHasNextPage,
    fetchNextPage: adminBrowseFetchNextPage,
  } = useInfinitePaginatedGraves(pageSize, !isAdmin || hasQuery);

  const {
    data: adminSearchData,
    isLoading: adminSearchLoading,
    isFetchingNextPage: adminSearchFetchingNextPage,
    hasNextPage: adminSearchHasNextPage,
    fetchNextPage: adminSearchFetchNextPage,
  } = useInfiniteSearchGravesPaginated(debouncedSearchQuery, pageSize, !isAdmin || !hasQuery);

  // Public mode: load all public graves and filter in memory
  const {
    data: publicGraves = [],
    isLoading: publicLoading,
  } = useGetPublicGraves(!isAdmin);

  // Determine which data source to use
  const isLoading = isAdmin 
    ? (hasQuery ? adminSearchLoading : adminBrowseLoading)
    : publicLoading;

  const isFetchingNextPage = isAdmin 
    ? (hasQuery ? adminSearchFetchingNextPage : adminBrowseFetchingNextPage)
    : false;

  const hasNextPage = isAdmin 
    ? (hasQuery ? adminSearchHasNextPage : adminBrowseHasNextPage)
    : false;

  const fetchNextPage = isAdmin 
    ? (hasQuery ? adminSearchFetchNextPage : adminBrowseFetchNextPage)
    : () => {};

  // Flatten all loaded pages for admin
  const allLoadedAdminGraves = useMemo(() => {
    if (!isAdmin) return [];
    const data = hasQuery ? adminSearchData : adminBrowseData;
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.graves);
  }, [isAdmin, hasQuery, adminSearchData, adminBrowseData]);

  // For admin: when using paginated search, results are already filtered by backend
  // For admin browsing: apply in-memory filter to loaded data
  const filteredAdminGraves = useMemo(() => {
    if (!isAdmin) return [];
    if (hasQuery) {
      // Backend already filtered, return as-is
      return allLoadedAdminGraves;
    }
    // No query in browse mode, return all loaded
    return allLoadedAdminGraves;
  }, [isAdmin, hasQuery, allLoadedAdminGraves]);

  // For public: always filter in memory
  const filteredPublicGraves = useMemo(() => {
    if (isAdmin) return [];
    return searchPublicGravesInMemory(publicGraves, debouncedSearchQuery);
  }, [isAdmin, publicGraves, debouncedSearchQuery]);

  const totalLoaded = isAdmin ? allLoadedAdminGraves.length : publicGraves.length;
  const totalGraves = isAdmin 
    ? (hasQuery 
        ? (adminSearchData?.pages[0]?.totalGraves ? Number(adminSearchData.pages[0].totalGraves) : totalLoaded)
        : (adminBrowseData?.pages[0]?.totalGraves ? Number(adminBrowseData.pages[0].totalGraves) : totalLoaded))
    : totalLoaded;
  const filteredCount = isAdmin ? filteredAdminGraves.length : filteredPublicGraves.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const placeholderText = isAdmin
    ? 'Search by surname, address, alley, plot number...'
    : 'Search by deceased surname or year of death...';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Wyszukiwanie grobów
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Szukaj</Label>
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholderText}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Wyszukiwanie działa natychmiast po wpisaniu tekstu
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {hasQuery && isAdmin ? (
                <>
                  Znaleziono <span className="font-semibold text-foreground">{filteredCount}</span>{' '}
                  {totalGraves > filteredCount && (
                    <>z <span className="font-semibold text-foreground">{totalGraves}</span></>
                  )}{' '}
                  grobów
                </>
              ) : hasQuery && !isAdmin ? (
                <>
                  Wyświetlono <span className="font-semibold text-foreground">{filteredCount}</span> z{' '}
                  <span className="font-semibold text-foreground">{totalLoaded}</span> grobów
                </>
              ) : (
                <>
                  Załadowano <span className="font-semibold text-foreground">{totalLoaded}</span>{' '}
                  {isAdmin && (
                    <>
                      z <span className="font-semibold text-foreground">{totalGraves}</span>
                    </>
                  )}{' '}
                  grobów
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

      <GraveResultsList
        results={isAdmin ? filteredAdminGraves : []}
        publicResults={isAdmin ? [] : filteredPublicGraves}
        isAdmin={isAdmin}
        showCount={false}
      />
    </div>
  );
}
