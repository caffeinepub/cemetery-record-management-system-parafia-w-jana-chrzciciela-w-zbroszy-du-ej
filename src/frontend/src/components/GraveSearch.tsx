import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useInfinitePaginatedGraves, useGetPublicGravesWithLocation } from '../hooks/useQueries';
import GraveResultsList from './GraveResultsList';
import { buildGraveSearchIndex, buildPublicGraveResultSearchIndex } from '../utils/graveFullTextSearch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { GraveRecord, PublicGraveResult } from '../backend';

interface GraveSearchProps {
  isAdmin?: boolean;
}

export default function GraveSearch({ isAdmin = false }: GraveSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 250);
  const pageSize = 50;

  // Admin: use paginated full grave records
  const {
    data: adminData,
    isLoading: adminLoading,
    isFetchingNextPage: adminFetchingNextPage,
    hasNextPage: adminHasNextPage,
    fetchNextPage: adminFetchNextPage,
  } = useInfinitePaginatedGraves(pageSize);

  // Public: use public grave results with location
  const {
    data: publicGraves = [],
    isLoading: publicLoading,
  } = useGetPublicGravesWithLocation();

  const isLoading = isAdmin ? adminLoading : publicLoading;
  const isFetchingNextPage = isAdmin ? adminFetchingNextPage : false;
  const hasNextPage = isAdmin ? adminHasNextPage : false;
  const fetchNextPage = isAdmin ? adminFetchNextPage : () => {};

  // Flatten all loaded pages for admin and build search index
  const allLoadedGraves = useMemo(() => {
    if (!isAdmin) return [];
    if (!adminData?.pages) return [];
    return adminData.pages.flatMap((page) => page.graves);
  }, [isAdmin, adminData]);

  // Build normalized search indices only when dataset changes
  const adminSearchIndices = useMemo(() => {
    if (!isAdmin) return new Map<string, string>();
    const map = new Map<string, string>();
    allLoadedGraves.forEach((grave) => {
      map.set(grave.id.toString(), buildGraveSearchIndex(grave));
    });
    return map;
  }, [isAdmin, allLoadedGraves]);

  const publicSearchIndices = useMemo(() => {
    if (isAdmin) return [];
    return publicGraves.map((grave) => buildPublicGraveResultSearchIndex(grave));
  }, [isAdmin, publicGraves]);

  // Apply in-memory search filter using debounced query and precomputed indices
  const filteredAdminGraves = useMemo(() => {
    if (!isAdmin) return [];
    if (!debouncedQuery || debouncedQuery.trim() === '') {
      return allLoadedGraves;
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    return allLoadedGraves.filter((grave) => {
      const searchIndex = adminSearchIndices.get(grave.id.toString()) || '';
      return searchIndex.includes(normalizedQuery);
    });
  }, [isAdmin, allLoadedGraves, debouncedQuery, adminSearchIndices]);

  const filteredPublicGraves = useMemo(() => {
    if (isAdmin) return [];
    if (!debouncedQuery || debouncedQuery.trim() === '') {
      return publicGraves;
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    return publicGraves.filter((grave, idx) => {
      const searchIndex = publicSearchIndices[idx] || '';
      return searchIndex.includes(normalizedQuery);
    });
  }, [isAdmin, publicGraves, debouncedQuery, publicSearchIndices]);

  const totalLoaded = isAdmin ? allLoadedGraves.length : publicGraves.length;
  const totalGraves = isAdmin && adminData?.pages[0]?.totalGraves ? Number(adminData.pages[0].totalGraves) : totalLoaded;
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
    ? 'Szukaj po nazwisku, adresie, alei, numerze grobu...'
    : 'Szukaj po nazwisku zmarłego lub roku śmierci...';

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
              Wyszukiwanie uruchamia się po krótkiej pauzie
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {debouncedQuery ? (
                <>
                  Wyświetlono <span className="font-semibold text-foreground">{filteredCount}</span> z{' '}
                  <span className="font-semibold text-foreground">{totalLoaded}</span> załadowanych grobów
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
