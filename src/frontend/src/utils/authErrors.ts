/**
 * Utility to detect Boss-lock authorization errors from backend.
 * The backend traps with "Unauthorized: Only the Boss can perform this action"
 * when a non-Boss user tries to access privileged operations.
 */

const BOSS_LOCK_ERROR_PHRASE = 'Only the Boss can perform this action';

/**
 * Check if an error is a Boss-lock denial from the backend.
 * @param error - The error object from a failed query/mutation
 * @returns true if this is a Boss-lock authorization error
 */
export function isBossLockError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error?.message || String(error);
  return errorMessage.includes(BOSS_LOCK_ERROR_PHRASE);
}

/**
 * Check if an error indicates any authorization failure.
 * @param error - The error object from a failed query/mutation
 * @returns true if this is an authorization error
 */
export function isAuthorizationError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error?.message || String(error);
  return (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Only the Boss') ||
    errorMessage.includes('Only admins') ||
    errorMessage.includes('Only users')
  );
}

/**
 * Check if an error is a connectivity/network issue (not authorization).
 * @param error - The error object from a failed query/mutation
 * @returns true if this is a retryable connectivity error
 */
export function isConnectivityError(error: any): boolean {
  if (!error) return false;
  
  // Never treat authorization errors as connectivity issues
  if (isAuthorizationError(error)) {
    return false;
  }
  
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('actor not available') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('fetch')
  );
}
