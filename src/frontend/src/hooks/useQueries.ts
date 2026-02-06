import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { GraveRecord, UserProfile, GraveStatus, CemeteryView, AsyncResult, AsyncResult_1, PaginatedGravesResult, PublicGraveShape, PublicTileData, HomepageHeroContent, FooterContent, SiteContent, PublicHtmlSection } from '../backend';
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

// Helper to format domain errors from backend
function formatDomainError(error: any): string {
  if (error.__kind__ === 'duplicateAlley') {
    return `Alejka "${error.duplicateAlley.alley}" już istnieje. Proszę wybrać inną nazwę.`;
  }
  if (error.__kind__ === 'alleyNotFound') {
    return `Alejka "${error.alleyNotFound.alley}" nie istnieje.`;
  }
  if (error.__kind__ === 'alleyNotEmpty') {
    return `Alejka "${error.alleyNotEmpty.alley}" zawiera groby i nie może zostać usunięta.`;
  }
  if (error.__kind__ === 'graveNotFound') {
    return `Grób o ID ${error.graveNotFound.graveId} nie został znaleziony.`;
  }
  if (error.__kind__ === 'invariantViolation') {
    const field = error.invariantViolation.field;
    if (field === 'alley') {
      return `Nie można zmienić alejki istniejącego grobu. To pole jest niezmienne.`;
    }
    if (field === 'plotNumber') {
      return `Nie można zmienić numeru miejsca istniejącego grobu. To pole jest niezmienne.`;
    }
    if (field === 'id') {
      return `Nie można zmienić ID grobu. To pole jest niezmienne.`;
    }
    if (field === 'status') {
      return `Nie można usunąć grobu, który nie jest wolny. Tylko wolne groby mogą być usunięte.`;
    }
    return `Naruszenie integralności danych: pole "${field}" nie może być zmodyfikowane.`;
  }
  if (error.__kind__ === 'inconsistentAlleyGraves') {
    return `Wykryto niespójność danych: Grób ${error.inconsistentAlleyGraves.graveId} nie jest prawidłowo powiązany z alejką "${error.inconsistentAlleyGraves.alley}". Proszę skontaktować się z pomocą techniczną.`;
  }
  return 'Wystąpił nieznany błąd domenowy.';
}

// Helper to sanitize technical/authorization errors
function sanitizeTechnicalError(error: any): string {
  const errorMessage = error?.message || '';
  
  // Check for authorization errors (traps from backend)
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only admins')) {
    return 'Nie masz uprawnień do wykonania tej operacji. Wymagany dostęp administratora.';
  }
  
  if (errorMessage.includes('Only users')) {
    return 'Musisz być zalogowany, aby wykonać tę operację.';
  }
  
  // Network/connection errors
  if (errorMessage.includes('actor not available') || errorMessage.includes('Actor not available')) {
    return 'Połączenie z backendem niedostępne. Sprawdź połączenie i spróbuj ponownie.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Wystąpił błąd sieci. Sprawdź połączenie i spróbuj ponownie.';
  }
  
  // Return sanitized generic message for other technical errors
  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
}

// Helper to sanitize site content load errors for public display
function sanitizeSiteContentError(error: any): string {
  const errorMessage = error?.message || '';
  
  if (errorMessage.includes('actor not available') || errorMessage.includes('Actor not available')) {
    return 'Nie można połączyć się z serwerem. Treść strony może być nieaktualna.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return 'Wystąpił problem z połączeniem. Treść strony może być nieaktualna.';
  }
  
  return 'Nie można załadować treści strony. Wyświetlane są domyślne informacje.';
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.userProfile.staleTime,
    gcTime: CACHE_CONFIG.userProfile.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      return withRetry(
        () => actor.saveCallerUserProfile(profile),
        'zapisywanie profilu'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      const message = sanitizeTechnicalError(error);
      toast.error(`Nie udało się zapisać profilu: ${message}`);
    },
  });
}

export function useGetCemeteryState() {
  const { actor, isFetching } = useActor();

  return useQuery<CemeteryView>({
    queryKey: ['cemeteryState'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCemeteryStateWithoutVerification();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.cemeteryState.staleTime,
    gcTime: CACHE_CONFIG.cemeteryState.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useGetAllGraves() {
  const { actor, isFetching } = useActor();

  return useQuery<GraveRecord[]>({
    queryKey: ['allGraves'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGraves();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.graves.staleTime,
    gcTime: CACHE_CONFIG.graves.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useInfinitePaginatedGraves(pageSize: number = 50) {
  const { actor, isFetching: actorFetching } = useActor();

  return useInfiniteQuery<PaginatedGravesResult>({
    queryKey: ['paginatedGraves', pageSize],
    queryFn: async ({ pageParam = 0n }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPaginatedGraves(pageParam as bigint, BigInt(pageSize));
    },
    enabled: !!actor && !actorFetching,
    initialPageParam: 0n,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.graves.staleTime,
    gcTime: CACHE_CONFIG.graves.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useSearchGraves() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      surname: string | null;
      yearOfDeath: bigint | null;
      owner: string | null;
      status: GraveStatus | null;
      locality: string | null;
    }) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      return withRetry(
        () =>
          actor.searchGraves(
            params.surname,
            params.yearOfDeath,
            params.owner,
            params.status,
            params.locality
          ),
        'wyszukiwanie'
      );
    },
    onError: (error: any) => {
      const message = sanitizeTechnicalError(error);
      toast.error(`Wyszukiwanie nie powiodło się: ${message}`);
    },
  });
}

export function useGetSurnamesForAutocomplete() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['surnames'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSurnamesForAutocomplete();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.surnames.staleTime,
    gcTime: CACHE_CONFIG.surnames.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useGetGraveStatistics() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['graveStatistics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGraveStatistics();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.statistics.staleTime,
    gcTime: CACHE_CONFIG.statistics.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddAlley() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      
      try {
        const result: AsyncResult = await actor.addAlley(name);
        
        // Handle domain errors from backend
        if (result.__kind__ === 'err') {
          const errorMessage = formatDomainError(result.err);
          throw new Error(errorMessage);
        }
        
        return result.ok;
      } catch (error: any) {
        // Check if it's already a formatted domain error
        if (error.message && (
          error.message.includes('już istnieje') ||
          error.message.includes('nie istnieje') ||
          error.message.includes('nie może')
        )) {
          throw error;
        }
        // Otherwise sanitize technical/authorization errors
        const sanitized = sanitizeTechnicalError(error);
        throw new Error(sanitized);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Alejka została dodana pomyślnie');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nie udało się dodać alejki');
    },
  });
}

export function useRemoveAlley() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      
      try {
        const result: AsyncResult = await actor.removeAlley(name);
        
        // Handle domain errors from backend
        if (result.__kind__ === 'err') {
          const errorMessage = formatDomainError(result.err);
          throw new Error(errorMessage);
        }
        
        return result.ok;
      } catch (error: any) {
        // Check if it's already a formatted domain error
        if (error.message && (
          error.message.includes('już istnieje') ||
          error.message.includes('nie istnieje') ||
          error.message.includes('nie może')
        )) {
          throw error;
        }
        // Otherwise sanitize technical/authorization errors
        const sanitized = sanitizeTechnicalError(error);
        throw new Error(sanitized);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      toast.success('Alejka została usunięta pomyślnie');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nie udało się usunąć alejki');
    },
  });
}

export function useAddGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { alley: string; plotNumber: bigint }) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      
      try {
        const result: AsyncResult_1 = await actor.addGrave(params.alley, params.plotNumber);
        
        // Handle domain errors from backend
        if (result.__kind__ === 'err') {
          const errorMessage = formatDomainError(result.err);
          throw new Error(errorMessage);
        }
        
        return result.ok;
      } catch (error: any) {
        // Check if it's already a formatted domain error
        if (error.message && (
          error.message.includes('już istnieje') ||
          error.message.includes('nie istnieje') ||
          error.message.includes('nie może') ||
          error.message.includes('integralności') ||
          error.message.includes('niespójność')
        )) {
          throw error;
        }
        // Otherwise sanitize technical/authorization errors
        const sanitized = sanitizeTechnicalError(error);
        throw new Error(sanitized);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['graveStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      toast.success('Grób został dodany pomyślnie');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nie udało się dodać grobu');
    },
  });
}

export function useRemoveGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      
      try {
        const result: AsyncResult = await actor.removeGrave(id);
        
        // Handle domain errors from backend
        if (result.__kind__ === 'err') {
          const errorMessage = formatDomainError(result.err);
          throw new Error(errorMessage);
        }
        
        return result.ok;
      } catch (error: any) {
        // Check if it's already a formatted domain error
        if (error.message && (
          error.message.includes('już istnieje') ||
          error.message.includes('nie istnieje') ||
          error.message.includes('nie może') ||
          error.message.includes('integralności') ||
          error.message.includes('niespójność')
        )) {
          throw error;
        }
        // Otherwise sanitize technical/authorization errors
        const sanitized = sanitizeTechnicalError(error);
        throw new Error(sanitized);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cemeteryState'] });
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['graveStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      toast.success('Grób został usunięty pomyślnie');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nie udało się usunąć grobu');
    },
  });
}

export function useUpdateGrave() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; updatedRecord: GraveRecord }) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      
      try {
        const result: AsyncResult = await actor.updateGrave(params.id, params.updatedRecord);
        
        // Handle domain errors from backend
        if (result.__kind__ === 'err') {
          const errorMessage = formatDomainError(result.err);
          throw new Error(errorMessage);
        }
        
        return result.ok;
      } catch (error: any) {
        // Check if it's already a formatted domain error
        if (error.message && (
          error.message.includes('już istnieje') ||
          error.message.includes('nie istnieje') ||
          error.message.includes('nie może') ||
          error.message.includes('integralności') ||
          error.message.includes('niespójność') ||
          error.message.includes('niezmienne')
        )) {
          throw error;
        }
        // Otherwise sanitize technical/authorization errors
        const sanitized = sanitizeTechnicalError(error);
        throw new Error(sanitized);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGraves'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedGraves'] });
      queryClient.invalidateQueries({ queryKey: ['graveStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['publicTiles'] });
      toast.success('Grób został zaktualizowany pomyślnie');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nie udało się zaktualizować grobu');
    },
  });
}

export function useGetGrave(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<GraveRecord | null>({
    queryKey: ['grave', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getGrave(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.graves.staleTime,
    gcTime: CACHE_CONFIG.graves.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Public queries - no authentication required
export function useGetPublicGraves() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicGraveShape[]>({
    queryKey: ['publicGraves'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicGraves();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.graves.staleTime,
    gcTime: CACHE_CONFIG.graves.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useGetPublicTiles() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTileData[]>({
    queryKey: ['publicTiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicTiles();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.graves.staleTime,
    gcTime: CACHE_CONFIG.graves.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useSearchPublicGraves() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      surname: string | null;
      yearOfDeath: bigint | null;
    }) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      return withRetry(
        () => actor.searchPublicGraves(params.surname, params.yearOfDeath),
        'wyszukiwanie publiczne'
      );
    },
    onError: (error: any) => {
      const message = sanitizeTechnicalError(error);
      toast.error(`Wyszukiwanie nie powiodło się: ${message}`);
    },
  });
}

// Public site content query - optimized for anonymous visitors
export function useGetPublicSiteContent() {
  const { actor, isFetching } = useActor();

  return useQuery<SiteContent>({
    queryKey: ['publicSiteContent'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSiteContent();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.publicSiteContent.staleTime,
    gcTime: CACHE_CONFIG.publicSiteContent.gcTime,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// Site content queries (admin)
export function useGetSiteContent() {
  const { actor, isFetching } = useActor();

  return useQuery<SiteContent>({
    queryKey: ['siteContent'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSiteContent();
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < RETRY_CONFIG.maxRetries;
    },
    retryDelay: RETRY_CONFIG.retryDelay,
    staleTime: CACHE_CONFIG.siteContent.staleTime,
    gcTime: CACHE_CONFIG.siteContent.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpdateSiteContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: SiteContent) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      return withRetry(
        () => actor.updateSiteContent(content),
        'aktualizacja treści strony'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Treść strony została zaktualizowana pomyślnie');
    },
    onError: (error: any) => {
      const message = sanitizeTechnicalError(error);
      toast.error(`Nie udało się zaktualizować treści strony: ${message}`);
    },
  });
}

export function useUpdateLogoImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logo: ExternalBlob | null) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      return withRetry(
        () => actor.updateLogoImage(logo),
        'aktualizacja logo'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Logo zostało zaktualizowane pomyślnie');
    },
    onError: (error: any) => {
      const message = sanitizeTechnicalError(error);
      toast.error(`Nie udało się zaktualizować logo: ${message}`);
    },
  });
}

// Deprecated - kept for backward compatibility, use useGetSiteContent instead
export function useGetHomepageHeroContent() {
  const { data: siteContent, ...rest } = useGetSiteContent();
  return {
    ...rest,
    data: siteContent?.homepageHero,
  };
}

// Deprecated - kept for backward compatibility, use useUpdateSiteContent instead
export function useUpdateHomepageHeroContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: HomepageHeroContent) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      return withRetry(
        () => actor.updateHomepageHeroContent(content),
        'aktualizacja treści strony głównej'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Treść strony głównej została zaktualizowana pomyślnie');
    },
    onError: (error: any) => {
      const message = sanitizeTechnicalError(error);
      toast.error(`Nie udało się zaktualizować treści strony głównej: ${message}`);
    },
  });
}

// Footer content queries
export function useGetFooterContent() {
  const { data: siteContent, ...rest } = useGetPublicSiteContent();
  return {
    ...rest,
    data: siteContent?.footer,
  };
}

export function useUpdateFooterContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: FooterContent) => {
      if (!actor) {
        throw new Error('Aktor backendu jest niedostępny. Sprawdź połączenie i spróbuj ponownie.');
      }
      return withRetry(
        () => actor.updateFooterContent(content),
        'aktualizacja stopki'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
      toast.success('Stopka została zaktualizowana pomyślnie');
    },
    onError: (error: any) => {
      const message = sanitizeTechnicalError(error);
      toast.error(`Nie udało się zaktualizować stopki: ${message}`);
    },
  });
}

// Authorization helper
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    retry: false,
    staleTime: CACHE_CONFIG.userProfile.staleTime,
    gcTime: CACHE_CONFIG.userProfile.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
