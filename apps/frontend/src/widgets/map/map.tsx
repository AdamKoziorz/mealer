import "./map.css";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { UUID } from "crypto";
import { createPortal } from "react-dom";
import { UserRestaurantAPI } from "@entities/restaurant";
import { useRestaurantManagerStore } from "@features/manage-restaurants";
import { useQuery } from "@tanstack/react-query";
import { AddRestaurantPopUp } from "@features/manage-restaurants";
import { ViewRestaurantPopUp } from "@features/manage-restaurants";



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
  const {  
    context,
    activeMapPopup,
    setContext,
    setClickLocation,
    setPopup 
  } = useRestaurantManagerStore();

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
    mapInstance.on("click", (e: maplibregl.MapMouseEvent & Object) => {
      const popupNode = document.createElement("div");
      const popup = new maplibregl.Popup({
        maxWidth: "none",
        className: "popup",
      })
        .setLngLat(e.lngLat)
        .setDOMContent(popupNode)
        .addTo(mapInstance);

      setContext('adding-restaurant');
      setClickLocation(e.lngLat)
      setPopup({element: popupNode, instance: popup})
    });

    // Cleanup
    return () => {
      mapInstance.remove();
      map.current = null;
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
    };
  }, []);

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
      } else {
        const marker = new maplibregl.Marker()
          .setLngLat([restaurant.longitude, restaurant.latitude])
          .addTo(map.current!)

        currentMarkers.set(restaurant.id, marker);
      }
    });
  }, [data]);

  // Pending and Error states (not implemented)
  if (isPending) console.log("Loading...");
  if (isError) console.error(`Error: ${error}`);


  // Our map is a div with its ref set to the mapContainer, with
  // a restaurant popup inside of it that appears if the popup state
  // is not null (ie. the user has clicked on the map)
  //
  // createPortal allows the app providers to be available to the popup
  // component even though maplibre gl dynamically adds elements
  // directly to the DOM
  //
  // We will choose which React component to render (for the popup)
  // depending on the current user context.
  const clickPopUp = (() => {
    switch (context) {
      case 'adding-restaurant':
        return <AddRestaurantPopUp/>
      
      case 'viewing-restaurant':
        return <ViewRestaurantPopUp/>
      
      default:
        return null;
    }
  })();

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
    >
    { (clickPopUp && activeMapPopup) ? 
      createPortal(clickPopUp, activeMapPopup.element) : null}
    </div>
  );
};
