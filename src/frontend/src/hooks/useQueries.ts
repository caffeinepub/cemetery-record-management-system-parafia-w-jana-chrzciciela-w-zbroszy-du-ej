import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { GraveRecord, UserProfile, GraveStatus, CemeteryView, AsyncResult, AsyncResult_1, PaginatedGravesResult, PublicGraveShape, PublicGraveResult, PublicTileData, HomepageHeroContent, FooterContent, SiteContent, PublicHtmlSection, PrayerForTheDeceased } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

// Cache configuration for optimal performance
const CACHE_CONFIG = {
  // User profile rarely changes
  userProfile: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  },
  // Cemetery structure changes infrequently
  cemeteryState: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  // Grave data can be cached for moderate time
  graves: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  // Surnames for autocomplete rarely change
  surnames: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  // Statistics can be slightly stale
  statistics: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  // Site content changes infrequently
  siteContent: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  // Public site content for anonymous users - refetch on mount to ensure fresh data
  publicSiteContent: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
};

// Retry configuration with exponential backoff
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
};

// Helper function to check if error is retryable
function isRetryableError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('actor not available') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('fetch')
  );
}

// Helper function to check if error is Boss-lock
function isBossLockError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  return errorMessage.includes('only the boss can perform this action');
}

// Helper function to wait with exponential backoff
async function waitWithBackoff(attemptIndex: number): Promise<void> {
  const delay = RETRY_CONFIG.retryDelay(attemptIndex);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Wrapper for mutations with retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry Boss-lock errors
      if (isBossLockError(error)) {
        throw error;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === RETRY_CONFIG.maxRetries - 1) {
        break;
      }

      // Show retry notification
      toast.info(`Ponowna próba ${operationName}... (${attempt + 1}/${RETRY_CONFIG.maxRetries})`);

      // Wait before retrying
      await waitWithBackoff(attempt);
    }
  }

  // All retries failed
  throw lastError;
}

// Helper to sanitize error messages for user display
function sanitizeErrorMessage(error: any): string {
  const message = error?.message || 'Nieznany błąd';

  // Boss-lock error
  if (isBossLockError(error)) {
    return 'Brak uprawnień: tylko administrator może wykonać tę operację';
  }

  // Network errors
  if (message.toLowerCase().includes('actor not available')) {
    return 'Połączenie z serwerem jest niedostępne. Sprawdź połączenie internetowe.';
  }

  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'Błąd połączenia sieciowego. Sprawdź połączenie internetowe.';
  }

  // Timeout errors
  if (message.toLowerCase().includes('timeout')) {
    return 'Przekroczono limit czasu operacji. Spróbuj ponownie.';
  }

  // Return original message if no specific pattern matched
  return message;
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
    ...CACHE_CONFIG.userProfile,
  });

  // Return custom state that properly reflects actor dependency
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
      await withRetry(
        () => actor.saveCallerUserProfile(profile),
        'zapisywania profilu'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profil został zapisany');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zapisać profilu: ${message}`);
    },
  });
}

// Cemetery State Queries
export function useGetCemeteryState() {
  const { actor, isFetching } = useActor();

  return useQuery<CemeteryView>({
    queryKey: ['cemeteryState'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCemeteryState();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      if (isBossLockError(error)) return false;
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.cemeteryState,
  });
}

// Alley Management Mutations
export function useAddAlley() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await withRetry(
        () => actor.addAlley(name),
        'dodawania alei'
      );

      if (result.__kind__ === 'err') {
        const error = result.err;
        if (error.__kind__ === 'duplicateAlley') {
          throw new Error(`Aleja "${error.duplicateAlley.alley}" już istnieje`);
        }
        throw new Error('Nie udało się dodać alei');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Aleja została dodana');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
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
      const result = await withRetry(
        () => actor.removeAlley(name),
        'usuwania alei'
      );

      if (result.__kind__ === 'err') {
        const error = result.err;
        if (error.__kind__ === 'alleyNotEmpty') {
          throw new Error(`Aleja "${error.alleyNotEmpty.alley}" nie jest pusta`);
        }
        if (error.__kind__ === 'alleyNotFound') {
          throw new Error(`Aleja "${error.alleyNotFound.alley}" nie została znaleziona`);
        }
        throw new Error('Nie udało się usunąć alei');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Aleja została usunięta');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(message);
    },
  });
}

// Grave Management Mutations
export function useAddGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alley, plotNumber }: { alley: string; plotNumber: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await withRetry(
        () => actor.addGrave(alley, plotNumber),
        'dodawania grobu'
      );

      if (result.__kind__ === 'err') {
        const error = result.err;
        if (error.__kind__ === 'alleyNotFound') {
          throw new Error(`Aleja "${error.alleyNotFound.alley}" nie została znaleziona`);
        }
        throw new Error('Nie udało się dodać grobu');
      }

      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['graves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      toast.success('Grób został dodany');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
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
      const result = await withRetry(
        () => actor.removeGrave(id),
        'usuwania grobu'
      );

      if (result.__kind__ === 'err') {
        const error = result.err;
        if (error.__kind__ === 'graveNotFound') {
          throw new Error(`Grób o ID ${error.graveNotFound.graveId} nie został znaleziony`);
        }
        if (error.__kind__ === 'invariantViolation') {
          throw new Error('Nie można usunąć grobu, który nie jest wolny');
        }
        throw new Error('Nie udało się usunąć grobu');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['graves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      toast.success('Grób został usunięty');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useUpdateGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedRecord: GraveRecord) => {
      if (!actor) throw new Error('Actor not available');
      const result = await withRetry(
        () => actor.updateGrave(updatedRecord.id, updatedRecord),
        'aktualizacji grobu'
      );

      if (result.__kind__ === 'err') {
        const error = result.err;
        if (error.__kind__ === 'graveNotFound') {
          throw new Error(`Grób o ID ${error.graveNotFound.graveId} nie został znaleziony`);
        }
        if (error.__kind__ === 'invariantViolation') {
          throw new Error(`Nieprawidłowe dane: pole "${error.invariantViolation.field}" nie może być zmienione`);
        }
        throw new Error('Nie udało się zaktualizować grobu');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graves'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      queryClient.invalidateQueries({ queryKey: ['publicGravesWithLocation'] });
      toast.success('Grób został zaktualizowany');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(message);
    },
  });
}

// Grave Queries
export function useGetAllGraves() {
  const { actor, isFetching } = useActor();

  return useQuery<GraveRecord[]>({
    queryKey: ['graves', 'all'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllGraves();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      if (isBossLockError(error)) return false;
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.graves,
  });
}

export function useInfinitePaginatedGraves(pageSize: number = 50) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery<PaginatedGravesResult>({
    queryKey: ['graves', 'paginated', pageSize],
    queryFn: async ({ pageParam = 0n }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPaginatedGraves(pageParam as bigint, BigInt(pageSize));
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0n,
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      if (isBossLockError(error)) return false;
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.graves,
  });
}

export function useGetGrave(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<GraveRecord | null>({
    queryKey: ['graves', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getGrave(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    retry: (failureCount, error: any) => {
      if (isBossLockError(error)) return false;
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.graves,
  });
}

// Public Grave Queries
export function useGetPublicGraves() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicGraveShape[]>({
    queryKey: ['publicGraves'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPublicGraves();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.graves,
  });
}

// New hook for public graves with location
export function useGetPublicGravesWithLocation() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicGraveResult[]>({
    queryKey: ['publicGravesWithLocation'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchPublicGravesWithLocation(null, null);
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.graves,
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
    retry: (failureCount, error: any) => {
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.graves,
  });
}

// Statistics Query
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
    retry: (failureCount, error: any) => {
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.statistics,
  });
}

// Surnames Query
export function useGetSurnamesForAutocomplete() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['surnames'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSurnamesForAutocomplete();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.surnames,
  });
}

// Site Content Queries (Admin)
export function useGetSiteContent() {
  const { actor, isFetching } = useActor();

  return useQuery<SiteContent>({
    queryKey: ['siteContent'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSiteContent();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      if (isBossLockError(error)) return false;
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.siteContent,
  });
}

// Public Site Content Query (for anonymous users)
export function useGetPublicSiteContent() {
  const { actor, isFetching } = useActor();

  return useQuery<SiteContent>({
    queryKey: ['publicSiteContent'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSiteContent();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    ...CACHE_CONFIG.publicSiteContent,
  });
}

export function useUpdateSiteContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newContent: SiteContent) => {
      if (!actor) throw new Error('Actor not available');
      await withRetry(
        () => actor.updateSiteContent(newContent),
        'aktualizacji treści strony'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Treść strony została zaktualizowana');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zaktualizować treści: ${message}`);
    },
  });
}

export function useUpdateHomepageHeroContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newContent: HomepageHeroContent) => {
      if (!actor) throw new Error('Actor not available');
      await withRetry(
        () => actor.updateHomepageHeroContent(newContent),
        'aktualizacji treści hero'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Treść sekcji hero została zaktualizowana');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zaktualizować treści hero: ${message}`);
    },
  });
}

export function useGetFooterContent() {
  const { actor, isFetching } = useActor();

  return useQuery<FooterContent>({
    queryKey: ['footerContent'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFooterContent();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error: any) => {
      return failureCount < RETRY_CONFIG.maxRetries && isRetryableError(error);
    },
    ...CACHE_CONFIG.publicSiteContent,
  });
}

export function useUpdateFooterContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newFooterContent: FooterContent) => {
      if (!actor) throw new Error('Actor not available');
      await withRetry(
        () => actor.updateFooterContent(newFooterContent),
        'aktualizacji stopki'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      queryClient.invalidateQueries({ queryKey: ['footerContent'] });
      toast.success('Stopka została zaktualizowana');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zaktualizować stopki: ${message}`);
    },
  });
}

export function useUpdateLogoImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLogo: ExternalBlob | null) => {
      if (!actor) throw new Error('Actor not available');
      await withRetry(
        () => actor.updateLogoImage(newLogo),
        'aktualizacji logo'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Logo zostało zaktualizowane');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zaktualizować logo: ${message}`);
    },
  });
}

export function useUpdatePrayerForTheDeceased() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSection: PrayerForTheDeceased) => {
      if (!actor) throw new Error('Actor not available');
      await withRetry(
        () => actor.updatePrayerForTheDeceased(newSection),
        'aktualizacji modlitwy'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Modlitwa została zaktualizowana');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zaktualizować modlitwy: ${message}`);
    },
  });
}

export function useUpdateCemeteryInformation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSection: PublicHtmlSection) => {
      if (!actor) throw new Error('Actor not available');
      await withRetry(
        () => actor.updateCemeteryInformation(newSection),
        'aktualizacji informacji o cmentarzu'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Informacje o cmentarzu zostały zaktualizowane');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zaktualizować informacji: ${message}`);
    },
  });
}

export function useUpdateGravesDeclaration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSection: PublicHtmlSection) => {
      if (!actor) throw new Error('Actor not available');
      await withRetry(
        () => actor.updateGravesDeclaration(newSection),
        'aktualizacji orzeczenia'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Orzeczenie zostało zaktualizowane');
    },
    onError: (error: any) => {
      const message = sanitizeErrorMessage(error);
      toast.error(`Nie udało się zaktualizować orzeczenia: ${message}`);
    },
  });
}
