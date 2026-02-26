import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  GraveRecord,
  GraveStatus,
  UserProfile,
  SiteContent,
  HomepageHeroContent,
  ParishFooterContent,
  PublicHtmlSection,
  PrayerForTheDeceased,
  CemeteryView,
  PaginatedGravesResult,
  PublicGraveResult,
  PublicTileData,
  ExternalBlob,
} from '../backend';
import { toast } from 'sonner';

// ─── Auth error helpers ───────────────────────────────────────────────────────

export function isAuthorizationError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('unauthorized') ||
      msg.includes('only the boss') ||
      msg.includes('access denied') ||
      msg.includes('neither boss nor manager')
    );
  }
  return false;
}

export function isBossLockError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('only the boss');
  }
  return false;
}

// ─── Cemetery State ───────────────────────────────────────────────────────────

export function useGetCemeteryState() {
  const { actor, isFetching } = useActor();
  return useQuery<CemeteryView | null>({
    queryKey: ['cemeteryState'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCemeteryStateWithoutVerification();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Grave Statistics ─────────────────────────────────────────────────────────

export function useGetGraveStatistics() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['graveStatistics'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGraveStatistics();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── All Graves ───────────────────────────────────────────────────────────────

export function useGetAllGraves() {
  const { actor, isFetching } = useActor();
  return useQuery<GraveRecord[]>({
    queryKey: ['allGraves'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGraves();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Paginated Graves ─────────────────────────────────────────────────────────

export function useGetPaginatedGraves(offset: number, pageSize: number) {
  const { actor, isFetching } = useActor();
  return useQuery<PaginatedGravesResult | null>({
    queryKey: ['paginatedGraves', offset, pageSize],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPaginatedGraves(BigInt(offset), BigInt(pageSize));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Infinite Paginated Graves ────────────────────────────────────────────────

export function useInfinitePaginatedGraves(pageSize: number) {
  const { actor, isFetching } = useActor();
  return useInfiniteQuery<PaginatedGravesResult>({
    queryKey: ['infinitePaginatedGraves', pageSize],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPaginatedGraves(pageParam as bigint, BigInt(pageSize));
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: BigInt(0),
    enabled: !!actor && !isFetching,
  });
}

// ─── Single Grave ─────────────────────────────────────────────────────────────

export function useGetGrave(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<GraveRecord | null>({
    queryKey: ['grave', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getGrave(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

// ─── Public Tiles ─────────────────────────────────────────────────────────────

export function useGetPublicTiles() {
  const { actor, isFetching } = useActor();
  return useQuery<PublicTileData[]>({
    queryKey: ['publicTiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicTiles();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Public Graves With Location ──────────────────────────────────────────────

export function useGetPublicGravesWithLocation(surname: string | null, yearOfDeath: number | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PublicGraveResult[]>({
    queryKey: ['publicGravesWithLocation', surname, yearOfDeath],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchPublicGravesWithLocation(
        surname,
        yearOfDeath !== null ? BigInt(yearOfDeath) : null
      );
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Surnames Autocomplete ────────────────────────────────────────────────────

export function useGetSurnamesForAutocomplete() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ['surnamesAutocomplete'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSurnamesForAutocomplete();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Site Content ─────────────────────────────────────────────────────────────

export function useGetSiteContent() {
  const { actor, isFetching } = useActor();
  return useQuery<SiteContent | null>({
    queryKey: ['siteContent'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSiteContent();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for public access
export function useGetPublicSiteContent() {
  return useGetSiteContent();
}

export function useGetParishFooterContent() {
  const { actor, isFetching } = useActor();
  return useQuery<ParishFooterContent | null>({
    queryKey: ['parishFooter'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getParishFooterContent();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSiteContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newContent: SiteContent) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateSiteContent(newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['parishFooter'] });
      toast.success('Treść strony zaktualizowana');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień do edycji treści');
      } else {
        toast.error('Błąd podczas aktualizacji treści');
      }
    },
  });
}

export function useUpdateLogoImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLogo: ExternalBlob | null) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateLogoImage(newLogo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      toast.success('Logo zaktualizowane');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień');
      } else {
        toast.error('Błąd podczas aktualizacji logo');
      }
    },
  });
}

export function useUpdateHomepageHeroContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newContent: HomepageHeroContent) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateHomepageHeroContent(newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      toast.success('Treść hero zaktualizowana');
    },
    onError: () => {
      toast.error('Błąd podczas aktualizacji treści hero');
    },
  });
}

export function useUpdateParishFooterContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newContent: ParishFooterContent) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateParishFooterContent(newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['parishFooter'] });
      toast.success('Stopka zaktualizowana');
    },
    onError: () => {
      toast.error('Błąd podczas aktualizacji stopki');
    },
  });
}

export function useUpdateGravesDeclaration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSection: PublicHtmlSection) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateGravesDeclaration(newSection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      toast.success('Orzeczenie cmentarza zaktualizowane');
    },
    onError: () => {
      toast.error('Błąd podczas aktualizacji orzeczenia');
    },
  });
}

export function useUpdatePrayerForTheDeceased() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSection: PrayerForTheDeceased) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePrayerForTheDeceased(newSection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      toast.success('Modlitwa zaktualizowana');
    },
    onError: () => {
      toast.error('Błąd podczas aktualizacji modlitwy');
    },
  });
}

export function useUpdateCemeteryInformation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSection: PublicHtmlSection) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateCemeteryInformation(newSection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      toast.success('Informacje o cmentarzu zaktualizowane');
    },
    onError: () => {
      toast.error('Błąd podczas aktualizacji informacji o cmentarzu');
    },
  });
}

// ─── Alley Management ─────────────────────────────────────────────────────────

export function useAddAlley() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addAlley(name);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'duplicateAlley') {
          throw new Error(`Aleja "${err.duplicateAlley.alley}" już istnieje`);
        }
        throw new Error('Błąd podczas dodawania alei');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Aleja dodana');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień');
      } else {
        toast.error(error.message || 'Błąd podczas dodawania alei');
      }
    },
  });
}

export function useRemoveAlley() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.removeAlley(name);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'alleyNotEmpty') {
          throw new Error(`Aleja "${err.alleyNotEmpty.alley}" nie jest pusta`);
        }
        if (err.__kind__ === 'alleyNotFound') {
          throw new Error(`Aleja "${err.alleyNotFound.alley}" nie istnieje`);
        }
        throw new Error('Błąd podczas usuwania alei');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Aleja usunięta');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień');
      } else {
        toast.error(error.message || 'Błąd podczas usuwania alei');
      }
    },
  });
}

// ─── Grave Management ─────────────────────────────────────────────────────────

export function useAddGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alley, plotNumber }: { alley: string; plotNumber: number }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addGrave(alley, BigInt(plotNumber));
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'alleyNotFound') {
          throw new Error(`Aleja "${err.alleyNotFound.alley}" nie istnieje`);
        }
        throw new Error('Błąd podczas dodawania grobu');
      }
      return result.__kind__ === 'ok' ? result.ok : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['infinitePaginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['graveStatistics'] });
      toast.success('Grób dodany');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień');
      } else {
        toast.error(error.message || 'Błąd podczas dodawania grobu');
      }
    },
  });
}

export function useUpdateGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, record }: { id: bigint; record: GraveRecord }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.updateGrave(id, record);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'graveNotFound') {
          throw new Error('Grób nie został znaleziony');
        }
        if (err.__kind__ === 'invariantViolation') {
          throw new Error(`Błąd walidacji: ${err.invariantViolation.field}`);
        }
        throw new Error('Błąd podczas aktualizacji grobu');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['infinitePaginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['graveStatistics'] });
      toast.success('Grób zaktualizowany');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień');
      } else {
        toast.error(error.message || 'Błąd podczas aktualizacji grobu');
      }
    },
  });
}

export function useUpdateGraveLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newAlley,
      newPlotNumber,
    }: {
      id: bigint;
      newAlley: string;
      newPlotNumber: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.updateGraveLocation(id, newAlley, BigInt(newPlotNumber));
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'graveNotFound') {
          throw new Error('Grób nie został znaleziony');
        }
        if (err.__kind__ === 'alleyNotFound') {
          throw new Error(`Aleja "${err.alleyNotFound.alley}" nie istnieje`);
        }
        if (err.__kind__ === 'invariantViolation') {
          throw new Error(`Błąd walidacji: ${err.invariantViolation.field}`);
        }
        throw new Error('Błąd podczas zmiany lokalizacji grobu');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['infinitePaginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['graveStatistics'] });
      toast.success('Lokalizacja grobu zaktualizowana');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień');
      } else {
        toast.error(error.message || 'Błąd podczas zmiany lokalizacji grobu');
      }
    },
  });
}

export function useRemoveGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.removeGrave(id);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'graveNotFound') {
          throw new Error('Grób nie został znaleziony');
        }
        if (err.__kind__ === 'invariantViolation') {
          throw new Error('Można usunąć tylko wolny grób (status: wolny)');
        }
        throw new Error('Błąd podczas usuwania grobu');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['infinitePaginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['graveStatistics'] });
      toast.success('Grób usunięty');
    },
    onError: (error: Error) => {
      if (isAuthorizationError(error)) {
        toast.error('Brak uprawnień');
      } else {
        toast.error(error.message || 'Błąd podczas usuwania grobu');
      }
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profil zapisany');
    },
    onError: () => {
      toast.error('Błąd podczas zapisywania profilu');
    },
  });
}

// ─── Access Role ──────────────────────────────────────────────────────────────

export function useGetAccessRole() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['accessRole'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAccessRole();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// ─── Manager Delegation ───────────────────────────────────────────────────────

export function useGetManagers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getManagers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBoss() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['boss'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBoss();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddManager() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    // Accepts Principal object directly (from @dfinity/principal)
    mutationFn: async (principal: { toString(): string }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      const p = Principal.fromText(principal.toString());
      const result = await actor.addManager(p);
      if (!result) throw new Error('Nie udało się dodać managera');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager dodany');
    },
    onError: (error: Error) => {
      if (isBossLockError(error)) {
        toast.error('Brak uprawnień Boss');
      } else {
        toast.error(error.message || 'Błąd podczas dodawania managera');
      }
    },
  });
}

export function useRemoveManager() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    // Accepts Principal object directly (from @dfinity/principal)
    mutationFn: async (principal: { toString(): string }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      const p = Principal.fromText(principal.toString());
      const result = await actor.removeManager(p);
      if (!result) throw new Error('Nie udało się usunąć managera');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager usunięty');
    },
    onError: (error: Error) => {
      if (isBossLockError(error)) {
        toast.error('Brak uprawnień Boss');
      } else {
        toast.error(error.message || 'Błąd podczas usuwania managera');
      }
    },
  });
}
