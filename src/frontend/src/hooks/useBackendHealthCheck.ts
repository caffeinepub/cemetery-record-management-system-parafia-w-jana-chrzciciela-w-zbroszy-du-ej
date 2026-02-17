import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useState, useCallback } from 'react';

export type HealthCheckStatus = 'checking' | 'connected' | 'disconnected';

export function useBackendHealthCheck() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [hasActorError, setHasActorError] = useState(false);

  const healthQuery = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.healthCheck();
        setHasActorError(false);
        return true;
      } catch (error) {
        setHasActorError(true);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 30000, // Check every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // If actor is not available after initial fetch, we're disconnected
  const status: HealthCheckStatus = 
    actorFetching || healthQuery.isLoading
      ? 'checking'
      : hasActorError || healthQuery.isError || (!actor && !actorFetching)
      ? 'disconnected'
      : healthQuery.isSuccess
      ? 'connected'
      : 'checking';

  const recheck = useCallback(async () => {
    // Force actor recreation by invalidating and refetching the actor query
    await queryClient.invalidateQueries({ queryKey: ['actor'] });
    await queryClient.refetchQueries({ queryKey: ['actor'] });
    // Then refetch health check
    await healthQuery.refetch();
  }, [queryClient, healthQuery]);

  return {
    status,
    isChecking: status === 'checking',
    isConnected: status === 'connected',
    isDisconnected: status === 'disconnected',
    recheck,
    error: healthQuery.error,
    hasActorError,
  };
}
