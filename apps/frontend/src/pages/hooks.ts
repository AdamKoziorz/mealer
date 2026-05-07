import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { useRMStore } from '@features/manage-restaurants/hooks';

type UseMobileRestaurantSheetSyncArgs = {
  isMobile: boolean;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setDragOffset: Dispatch<SetStateAction<number | null>>;
};

export const useMobileRestaurantSheetSync = ({
  isMobile,
  setDrawerOpen,
  setDragOffset,
}: UseMobileRestaurantSheetSyncArgs) => {
  const context = useRMStore((s) => s.context);

  useEffect(() => {
    if (!isMobile) return;

    // The drawer is page-local UI state, so the page reacts to feature context.
    if (context === 'rm/select-restaurant') {
      setDrawerOpen(true);
      setDragOffset(null);
      return;
    }

    // The map does not own the sheet; add and move flows simply free map space.
    if (
      context === 'rm/click-empty-to-add' ||
      context === 'rm/moving-restaurant'
    ) {
      setDrawerOpen(false);
      setDragOffset(null);
    }
  }, [context, isMobile, setDrawerOpen, setDragOffset]);
};
