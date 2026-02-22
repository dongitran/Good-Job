import { createContext, useContext } from 'react';

/** Context so child pages can trigger the Give Kudos modal */
export const KudosModalContext = createContext<() => void>(() => {});

/**
 * Hook for child components to open the Give Kudos modal
 * managed by DashboardLayout.
 */
export function useOpenKudosModal() {
  return useContext(KudosModalContext);
}
