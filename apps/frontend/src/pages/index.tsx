import { useEffect, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RestaurantMap } from '@widgets/map';
import { RestaurantDashboard } from '@widgets/dashboard';

import { useMobileRestaurantSheetSync } from './hooks';

const MOBILE_SHEET_PEEK = 72;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const HomePage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [handleHeight, setHandleHeight] = useState(MOBILE_SHEET_PEEK);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startY: number;
    startOffset: number;
  } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(media.matches);

    sync();

    if ('addEventListener' in media) {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }

    const legacyMedia = media as MediaQueryList & {
      addListener: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    legacyMedia.addListener(sync);
    return () => legacyMedia.removeListener(sync);
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    const handle = handleRef.current;
    if (!sheet || !handle) return;

    const updateMeasurements = () => {
      setSheetHeight(sheet.getBoundingClientRect().height);
      setHandleHeight(handle.getBoundingClientRect().height);
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    resizeObserver.observe(sheet);
    resizeObserver.observe(handle);
    window.addEventListener('resize', updateMeasurements);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMeasurements);
    };
  }, []);

  useMobileRestaurantSheetSync({
    isMobile,
    setDrawerOpen,
    setDragOffset,
  });

  const collapsedOffset = Math.max(sheetHeight - handleHeight, 0);
  const restingOffset = drawerOpen ? 0 : collapsedOffset;
  const activeOffset = dragOffset ?? restingOffset;

  const settleSheet = (offset: number) => {
    setDrawerOpen(offset < collapsedOffset / 2);
    setDragOffset(null);
  };

  const handleSheetPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    suppressClickRef.current = false;
    dragState.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: activeOffset,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragOffset(activeOffset);
  };

  const handleSheetPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    const dragDistance = event.clientY - currentDrag.startY;
    if (Math.abs(dragDistance) > 4) {
      suppressClickRef.current = true;
    }

    setDragOffset(
      clamp(currentDrag.startOffset + dragDistance, 0, collapsedOffset)
    );
  };

  const handleSheetPointerEnd = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    const finalOffset = clamp(
      currentDrag.startOffset + (event.clientY - currentDrag.startY),
      0,
      collapsedOffset
    );

    dragState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    settleSheet(finalOffset);
  };

  const handleSheetPointerCancel = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    const currentDrag = dragState.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    dragState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragOffset(null);
  };

  const handleSheetClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setDrawerOpen((open) => !open);
  };

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden">
      <section aria-label="Restaurant Map" className="absolute inset-0 z-0">
        <RestaurantMap
          isMobile={isMobile}
          mobileSheetExpandedHeightPx={sheetHeight}
          mobileSheetCollapsedHeightPx={handleHeight}
        />
      </section>
      <section
        aria-label="Restaurant Dashboard"
        className="fixed inset-x-0 bottom-0 z-10 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] text-black sm:absolute sm:inset-auto sm:top-4 sm:left-4 sm:w-96 sm:px-0 sm:pb-0"
      >
        <div className="sm:hidden">
          <div
            ref={sheetRef}
            className={`flex h-[min(60dvh,34rem)] flex-col overflow-hidden rounded-t-[2rem] bg-red-50 shadow-[0_-10px_30px_rgba(0,0,0,0.14)] will-change-transform ${
              dragOffset === null
                ? 'transition-transform duration-200 ease-out'
                : ''
            }`}
            style={{ transform: `translateY(${activeOffset}px)` }}
          >
            {/* Measured sheet and handle heights drive both drag math and map occlusion math. */}
            <button
              ref={handleRef}
              type="button"
              aria-expanded={drawerOpen}
              aria-controls="restaurant-dashboard-panel"
              aria-label={drawerOpen ? 'Collapse dashboard' : 'Open dashboard'}
              className="flex w-full appearance-none justify-center border-0 bg-red-50 px-6 pb-4 pt-3 touch-none outline-none"
              onClick={handleSheetClick}
              onPointerDown={handleSheetPointerDown}
              onPointerMove={handleSheetPointerMove}
              onPointerUp={handleSheetPointerEnd}
              onPointerCancel={handleSheetPointerCancel}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-2 w-20 rounded-full bg-gray-500" />
                <div className="h-5" aria-hidden="true" />
              </div>
            </button>
            <div
              id="restaurant-dashboard-panel"
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <RestaurantDashboard />
            </div>
          </div>
        </div>
        <div className="hidden sm:block">
          <RestaurantDashboard />
        </div>
      </section>
    </main>
  );
};

export const Route = createFileRoute('/')({
  component: HomePage,
});
