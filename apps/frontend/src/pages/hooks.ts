import { useLayoutEffect, useRef } from 'react';
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
  const prevContextRef = useRef(context);

  useLayoutEffect(() => {
    if (!isMobile) {
      prevContextRef.current = context;
      return;
    }

    const prev = prevContextRef.current;
    prevContextRef.current = context;

    // Skip the mount tick so the initial drawerOpen={true} is preserved.
    if (prev === context) return;

    if (context === 'rm/select-restaurant') {
      setDrawerOpen(true);
      setDragOffset(null);
      return;
    }

    // Add, move, and idle-after-flow all want the map back.
    setDrawerOpen(false);
    setDragOffset(null);
  }, [context, isMobile, setDrawerOpen, setDragOffset]);
};
