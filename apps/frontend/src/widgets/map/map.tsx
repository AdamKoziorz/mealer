import "./map.css";

import MarkerIcon from "@mui/icons-material/Room"

import maplibregl from "maplibre-gl";
import type { UUID } from "crypto";

import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef } from "react";

import { useQuery } from "@tanstack/react-query";

import { UserRestaurantAPI } from "@entities/restaurant";

import { useRMStore } from "@features/manage-restaurants/hooks";
import { AddRestaurantPopUp } from "@features/manage-restaurants/ui";



// This widget allows users to view their restaurants on a map
export const RestaurantMap = () => {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["userRestaurants"],
    queryFn: UserRestaurantAPI.get,
  });

  // Note: We use refs because we want these to persist across renders,
  // and they are specific to this widget only so we have not lifted
  // their state upward
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<UUID, maplibregl.Marker>>(new Map());

  // Manages the state of the add restaurants popup. A pop up requires
  // maplibre gl to handle the style/lifecycle/creation of the pop up,
  // and React to handle the rendering, hence why we need to track the
  // HTML element and MaplibreGL.Popup instance.
  const RMStore = useRMStore();



  // This effect is responsible for initializing the map, including
  // the pop up effect for when the user wants to add a restaurant
  // to the map
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [-78.83, 43.9],
      zoom: 9.5,
    });

    map.current = mapInstance;

    // When the user clicks on the map, we set the popup state
    // to the specific pop up that map libre gl created along with
    // the coordinates of where the user clicked. When this popup state
    // is not null, React will render the AddRestaurantPopUp component
    // content via. createPortal
    mapInstance.on("click", handleMapClick)

    // Cleanup
    return () => {
      mapInstance.remove();
      map.current = null;
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
    };
  }, []);


  // Handles any clicks to the map
  const handleMapClick = (e: maplibregl.MapMouseEvent & Object) => {
    e.originalEvent.stopPropagation();
    
    const currentState = useRMStore.getState()

    // Only if we are in an idle state should we create the popup to
    // add the restaurant. This enables toggling.
    if (currentState.context === 'rm/set-idle') {
        const popupNode = document.createElement("div");
        const popup = new maplibregl.Popup({
            maxWidth: "none",
            className: "popup",
        })
            .setLngLat(e.lngLat)
            .setDOMContent(popupNode)
            .addTo(map.current!);

        RMStore.dispatch({
            type: 'rm/click-empty-to-add',
            clickLocation: e.lngLat,
            activeMapPopup: { element: popupNode, instance: popup },
        });

    // In all other cases, when the map is clicked, we should idle.
    // This enables toggling.
    } else {
        currentState.activeMapPopup?.instance.remove();
        RMStore.dispatch({ type: 'rm/set-idle' });
    }
  }



  // This effect is responsible for managing the markers that are
  // visualized on the map. Whenever the data (userRestaurants) changes,
  // the markers are updated through a "diff"
  useEffect(() => {
    if (!data || !map.current) return;

    const currentMarkers = markers.current;
    const newDataIDs = new Set(data.map((restaurant) => restaurant.id));

    // Deletion
    for (const [id, marker] of currentMarkers) {
      if (!newDataIDs.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    data.forEach((restaurant) => {
      const existingMarker = currentMarkers.get(restaurant.id);

      // Modification (or Unchanged)
      if (existingMarker) {
        const currentLngLat = existingMarker.getLngLat();
        if (
          currentLngLat.lng !== restaurant.longitude ||
          currentLngLat.lat !== restaurant.latitude
        ) {
          existingMarker.setLngLat([restaurant.longitude, restaurant.latitude]);
        }

        // Creation
        // Here, we will attach a listener to the new marker 
        // for when it is clicked.
      } else {
          
        // We want to create a custom Marker on the map
        // Use createRoot to allow React components to be used
        // for DOM elements that MapLibre GL creates
        const markerDiv = document.createElement('div');
        const markerRoot = createRoot(markerDiv);
        
        markerRoot.render(
          <div className="flex flex-col items-center !-mt-18">
            <div className="!label text-black !bg-red-50 !py-2 !px-4 rounded shadow font-sans font-normal leading-snug">{restaurant.name}</div>
            <MarkerIcon className="!w-12 !h-12 align-center justify-center" sx={{color: "red"}}/>
          </div>
        )

        const marker = new maplibregl.Marker({element: markerDiv})
          .setLngLat([restaurant.longitude, restaurant.latitude])
          .addTo(map.current!)
        
        marker.getElement().addEventListener('click', (e) => {
          e.stopPropagation();

          const currentState = useRMStore.getState()
          const lngLat = new maplibregl.LngLat(restaurant.longitude, restaurant.latitude)

          // If there is currently a popup, then we want to clean it up before
          // selecting the restaurant
          if (currentState.context === 'rm/click-empty-to-add') {
            currentState.activeMapPopup?.instance.remove();
          } 
          
          RMStore.dispatch({
            type: 'rm/select-restaurant',
            selectedRestaurant: restaurant.id,
            clickLocation: lngLat
          });
          
          const zoomLevel = Math.max(18, map.current!.getZoom());

          map.current?.flyTo({
            center: lngLat,
            zoom: zoomLevel,
            essential: true
          })
        })

        currentMarkers.set(restaurant.id, marker);
      }
    });
  }, [data]);


  // Pending and Error states (not implemented)
  if (isPending) console.log("Loading...");
  if (isError) console.error(`Error: ${error}`);

  // Our map is a div with its ref set to the mapContainer, with
  // a restaurant popup inside of it that appears if the popup state
  // is not null (ie. the user has clicked on the map).
  //
  // createPortal allows the app providers to be available to the popup
  // component even though maplibre gl dynamically adds elements
  // directly to the DOM.
  //
  // We will choose which React component to render (for the popup)
  // depending on the current user context.

  const clickPopUp = useMemo(() => {
    if (RMStore.context === 'rm/click-empty-to-add') {
      return <AddRestaurantPopUp/>;
    }
    return null;
  }, [RMStore.context]);


  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
    >
    { (RMStore.activeMapPopup) && 
      createPortal(clickPopUp, RMStore.activeMapPopup.element) }
    </div>
  );
};
