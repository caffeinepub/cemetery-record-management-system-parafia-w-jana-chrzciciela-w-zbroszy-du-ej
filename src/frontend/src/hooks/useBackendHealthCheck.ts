import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export type HealthCheckStatus = 'checking' | 'connected' | 'disconnected';

export function useBackendHealthCheck() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const healthQuery = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.healthCheck();
      return true;
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 30000, // Check every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const status: HealthCheckStatus = actorFetching || healthQuery.isLoading
    ? 'checking'
    : healthQuery.isSuccess
    ? 'connected'
    : 'disconnected';

  const recheck = async () => {
    // Force actor recreation by invalidating and refetching the actor query
    await queryClient.invalidateQueries({ queryKey: ['actor'] });
    await queryClient.refetchQueries({ queryKey: ['actor'] });
    // Then refetch health check
    await healthQuery.refetch();
  };

  return {
    status,
    isChecking: status === 'checking',
    isConnected: status === 'connected',
    isDisconnected: status === 'disconnected',
    recheck,
    error: healthQuery.error,
  };
}
