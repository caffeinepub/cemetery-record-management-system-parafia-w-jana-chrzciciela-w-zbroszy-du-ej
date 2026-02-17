import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

export interface AdminAuthorizationState {
  isAllowed: boolean;
  isBoss: boolean;
  isManager: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook to determine if the current authenticated principal is authorized
 * to access admin functionality (Boss or delegated manager).
 */
export function useAdminAuthorization(): AdminAuthorizationState {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: accessRole, isLoading, isError, error } = useQuery<string>({
    queryKey: ['accessRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAccessRole();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isBoss = accessRole === 'boss';
  const isManager = accessRole === 'manager';
  const isAllowed = isBoss || isManager;

  return {
    isAllowed,
    isBoss,
    isManager,
    isLoading: actorFetching || isLoading,
    isError,
    error: error as Error | null,
  };
}
