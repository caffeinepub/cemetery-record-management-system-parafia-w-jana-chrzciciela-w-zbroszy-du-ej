import { useEffect, useState } from 'react';
import { getSecretParameter, storeSessionParameter, getSessionParameter, clearSessionParameter } from '../utils/urlParams';

const PREVIEW_MODE_KEY = 'caffeinePrivatePreview';
const DISABLE_FLAG = 'disable';

/**
 * Hook to manage Private Preview Mode state
 * 
 * Enables preview mode via URL hash parameter: #caffeinePrivatePreview=true
 * Disables preview mode via: #caffeinePrivatePreview=disable
 * 
 * State persists in sessionStorage for the browser session
 * 
 * @returns boolean indicating whether Private Preview Mode is active
 */
export function usePrivatePreviewMode(): boolean {
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(() => {
    // Initialize from sessionStorage
    const stored = getSessionParameter(PREVIEW_MODE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    // Check for URL parameter
    const urlValue = getSecretParameter(PREVIEW_MODE_KEY);
    
    if (urlValue === DISABLE_FLAG) {
      // Explicit disable
      clearSessionParameter(PREVIEW_MODE_KEY);
      setIsPreviewMode(false);
    } else if (urlValue === 'true' || urlValue === '1') {
      // Enable preview mode
      storeSessionParameter(PREVIEW_MODE_KEY, 'true');
      setIsPreviewMode(true);
    }
    // If urlValue is null, keep current state from sessionStorage
  }, []);

  return isPreviewMode;
}
