import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  GraveRecord,
  UserProfile,
  CemeteryView,
  PaginatedGravesResult,
  PublicGraveResult,
  PublicTileData,
  SiteContent,
  HomepageHeroContent,
  ParishFooterContent,
  PublicHtmlSection,
  PrayerForTheDeceased,
  ExternalBlob,
  GraveStatus,
} from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// Helper to detect authorization errors
function isAuthorizationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('only the boss') ||
      message.includes('boss-lock') ||
      message.includes('access denied') ||
      message.includes('neither boss nor manager')
    );
  }
  return false;
}

// Helper to format error messages
function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for authorization errors first
    if (isAuthorizationError(error)) {
      return message; // Keep authorization errors in English
    }
    
    // Check for connectivity issues
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('Failed to fetch') ||
      message.includes('NetworkError')
    ) {
      return 'Connection error. Please check your internet connection.';
    }
    
    // Return Polish business logic errors as-is
    return message;
  }
  return 'An unknown error occurred';
}

// Manager Delegation Queries (Boss-only)
export function useGetBoss() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal | null>({
    queryKey: ['boss'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBoss();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetManagers() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['managers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getManagers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddManager() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addManager(principal);
      if (!result) {
        throw new Error('Manager already exists or invalid principal');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager added successfully');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(`Failed to add manager: ${message}`);
    },
  });
}

export function useRemoveManager() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.removeManager(principal);
      if (!result) {
        throw new Error('Manager not found');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast.success('Manager removed successfully');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(`Failed to remove manager: ${message}`);
    },
  });
}

// Site Content Queries
export function useGetSiteContent() {
  const { actor, isFetching } = useActor();

  return useQuery<SiteContent>({
    queryKey: ['siteContent'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSiteContent();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// Alias for public access (same as useGetSiteContent since backend doesn't require auth for reading)
export function useGetPublicSiteContent() {
  return useGetSiteContent();
}

export function useUpdateSiteContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newContent: SiteContent) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSiteContent(newContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['homepageHero'] });
      queryClient.invalidateQueries({ queryKey: ['parishFooter'] });
      queryClient.invalidateQueries({ queryKey: ['gravesDeclaration'] });
      queryClient.invalidateQueries({ queryKey: ['prayerForTheDeceased'] });
      queryClient.invalidateQueries({ queryKey: ['cemeteryInformation'] });
      toast.success('Treść strony została zaktualizowana');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(`Błąd aktualizacji: ${message}`);
    },
  });
}

export function useUpdateLogoImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLogo: ExternalBlob | null) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLogoImage(newLogo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['homepageHero'] });
      toast.success('Logo zostało zaktualizowane');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(`Błąd aktualizacji logo: ${message}`);
    },
  });
}

export function useGetHomepageHeroContent() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageHeroContent>({
    queryKey: ['homepageHero'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getHomepageHeroContent();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetParishFooterContent() {
  const { actor, isFetching } = useActor();

  return useQuery<ParishFooterContent>({
    queryKey: ['parishFooter'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getParishFooterContent();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetGravesDeclaration() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicHtmlSection>({
    queryKey: ['gravesDeclaration'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGravesDeclaration();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetPrayerForTheDeceased() {
  const { actor, isFetching } = useActor();

  return useQuery<PrayerForTheDeceased>({
    queryKey: ['prayerForTheDeceased'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPrayerForTheDeceased();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetCemeteryInformation() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicHtmlSection>({
    queryKey: ['cemeteryInformation'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCemeteryInformation();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// Legacy footer query (kept for backward compatibility, but now uses parishFooter)
export function useGetFooterContent() {
  return useGetParishFooterContent();
}

// User Profile Queries
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
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profil został zapisany');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(`Błąd zapisu profilu: ${message}`);
    },
  });
}

// Cemetery Structure Queries
export function useGetCemeteryState() {
  const { actor, isFetching } = useActor();

  return useQuery<CemeteryView>({
    queryKey: ['cemeteryState'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCemeteryStateWithoutVerification();
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddAlley() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addAlley(name);
      if (result.__kind__ === 'err') {
        throw new Error(`Błąd dodawania alei: ${JSON.stringify(result.err)}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Aleja została dodana');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(message);
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
        throw new Error(`Błąd usuwania alei: ${JSON.stringify(result.err)}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Aleja została usunięta');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(message);
    },
  });
}

// Grave Management Queries
export function useGetAllGraves() {
  const { actor, isFetching } = useActor();

  return useQuery<GraveRecord[]>({
    queryKey: ['allGraves'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllGraves();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1 * 60 * 1000,
  });
}

export function useGetPaginatedGraves(offset: bigint, pageSize: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<PaginatedGravesResult>({
    queryKey: ['paginatedGraves', offset.toString(), pageSize.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPaginatedGraves(offset, pageSize);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1 * 60 * 1000,
  });
}

// Infinite query for paginated graves
export function useInfinitePaginatedGraves(pageSize: number) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery<PaginatedGravesResult>({
    queryKey: ['infinitePaginatedGraves', pageSize],
    queryFn: async ({ pageParam = 0n }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPaginatedGraves(pageParam as bigint, BigInt(pageSize));
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: !!actor && !isFetching,
    initialPageParam: 0n,
    staleTime: 1 * 60 * 1000,
  });
}

export function useAddGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alley, plotNumber }: { alley: string; plotNumber: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addGrave(alley, plotNumber);
      if (result.__kind__ === 'err') {
        throw new Error(`Błąd dodawania grobu: ${JSON.stringify(result.err)}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['infinitePaginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['publicGravesWithLocation'] });
      toast.success('Grób został dodany');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(message);
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
        throw new Error(`Błąd usuwania grobu: ${JSON.stringify(result.err)}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['infinitePaginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['publicGravesWithLocation'] });
      toast.success('Grób został usunięty');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(message);
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
        throw new Error(`Błąd aktualizacji grobu: ${JSON.stringify(result.err)}`);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['infinitePaginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['publicGravesWithLocation'] });
      toast.success('Grób został zaktualizowany');
    },
    onError: (error: unknown) => {
      const message = formatErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useSearchGraves(
  surname: string | null,
  yearOfDeath: bigint | null,
  owner: string | null,
  status: GraveStatus | null,
  locality: string | null
) {
  const { actor, isFetching } = useActor();

  return useQuery<GraveRecord[]>({
    queryKey: ['searchGraves', surname, yearOfDeath?.toString(), owner, status, locality],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchGraves(surname, yearOfDeath, owner, status, locality);
    },
    enabled: !!actor && !isFetching,
  });
}

// Public Queries (no auth required)
export function useGetPublicGravesWithLocation(surname: string | null, yearOfDeath: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicGraveResult[]>({
    queryKey: ['publicGravesWithLocation', surname, yearOfDeath?.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchPublicGravesWithLocation(surname, yearOfDeath);
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetPublicTiles() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTileData[]>({
    queryKey: ['publicTiles'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPublicTiles();
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetGraveStatistics() {
  const { actor, isFetching } = useActor();

  return useQuery<{
    total: bigint;
    paid: bigint;
    unpaid: bigint;
    free: bigint;
    reserved: bigint;
  }>({
    queryKey: ['graveStatistics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGraveStatistics();
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}
