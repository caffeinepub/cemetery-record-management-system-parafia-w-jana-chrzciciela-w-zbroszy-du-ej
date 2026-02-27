import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import { useGetPublicGravesWithLocation, useGetAllGraves } from '../hooks/useQueries';
import GraveResultsList from './GraveResultsList';
import { buildPublicGraveResultSearchIndex, searchPublicGraveResultsInMemory, buildGraveSearchIndex, searchGravesInMemory } from '../utils/graveFullTextSearch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { PublicGraveResult, GraveRecord } from '../backend';

interface GraveSearchProps {
  isAdmin?: boolean;
}

export default function GraveSearch({ isAdmin = false }: GraveSearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Public graves with location (for public mode)
  const {
    data: publicGraves = [],
    isLoading: publicLoading,
  } = useGetPublicGravesWithLocation(null, null);

  // Admin graves (for admin mode)
  const {
    data: adminGraves = [],
    isLoading: adminLoading,
  } = useGetAllGraves();

  const isLoading = isAdmin ? adminLoading : publicLoading;

  // Build search indices
  const publicSearchIndices = useMemo(() => {
    return publicGraves.map((grave) => buildPublicGraveResultSearchIndex(grave));
  }, [publicGraves]);

  const adminSearchIndices = useMemo(() => {
    return adminGraves.map((grave: GraveRecord) => buildGraveSearchIndex(grave));
  }, [adminGraves]);

  // Filter results based on debounced search
  const filteredPublicGraves = useMemo((): PublicGraveResult[] => {
    if (!debouncedSearch.trim()) return publicGraves;
    return searchPublicGraveResultsInMemory(publicGraves, debouncedSearch);
  }, [publicGraves, debouncedSearch, publicSearchIndices]);

  const filteredAdminGraves = useMemo((): GraveRecord[] => {
    if (!debouncedSearch.trim()) return adminGraves;
    return searchGravesInMemory(adminGraves, debouncedSearch);
  }, [adminGraves, debouncedSearch, adminSearchIndices]);

  const handleClear = () => {
    setSearchInput('');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Search className="h-6 w-6 text-primary" />
            {isAdmin ? 'Wyszukiwanie grobów (Admin)' : 'Wyszukaj grób'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-input" className="text-base font-semibold">
              Szukaj po nazwisku, imieniu, alei, numerze grobu...
            </Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="np. Kowalski, Aleja B, grób 42..."
                  className="pl-10 h-12 text-base"
                />
              </div>
              {searchInput && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="h-12 px-6 font-semibold"
                >
                  Wyczyść
                </Button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Ładowanie danych...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && (
        <>
          {isAdmin ? (
            <GraveResultsList
              results={filteredAdminGraves}
              isAdmin={true}
              showCount={true}
            />
          ) : (
            <GraveResultsList
              publicResults={filteredPublicGraves}
              isAdmin={false}
              showCount={true}
            />
          )}
        </>
      )}
    </div>
  );
}
