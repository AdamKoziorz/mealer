import "./map.css";

import { useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

import { useQuery } from "@tanstack/react-query";

import maplibregl from "maplibre-gl";
import type { UUID } from "crypto";

import MarkerIcon from "@mui/icons-material/Room";

import { UserRestaurantAPI } from "@entities/restaurant";
import { useRMStore } from "@features/manage-restaurants/hooks";
import { AddRestaurantPopUp, MoveRestaurantPopUp } from "@features/manage-restaurants/ui";
import { fetchMe } from "@entities/user/api";


// This widget allows users to view their restaurants on a map
export const RestaurantMap = () => {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["userRestaurants"],
    queryFn: UserRestaurantAPI.get,
  });

  const { data: current_user_id } = useQuery({queryKey: ["me"], queryFn: fetchMe});

  // Ref to track current user
  const authenticatedUser = useRef(current_user_id);

  // Refs that will store data concerning the map
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<UUID, maplibregl.Marker>>(new Map());

  // Slices of our RMStore that may trigger rerenders
  const context = useRMStore((s) => s.context);
  const activeMapPopup = useRMStore((s) => s.activeMapPopup);
  const selectedRestaurant = useRMStore((s) => s.selectedRestaurant);
  const clickLocation = useRMStore((s) => s.clickLocation);
  const dragStart = useRMStore((s) => s.dragStart);
  const dispatch = useRMStore((s) => s.dispatch);


  // Simple useeffect to track the current user. Should be null
  // if unauthenticated
  useEffect(() => {
    authenticatedUser.current = current_user_id;
  }, [current_user_id]);


  // This effect is responsible for initializing the map, including
  // the pop up effect for when the user wants to add a restaurant
  // to the map.
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [-78.83, 43.9],
      zoom: 9.5,
    });

    map.current = mapInstance;

    // When the user clicks on the map, we will evaluate the current
    // context that the user is in to determine what context to switch
    // to, updating the UI accordingly
    const handleMapClick = (e: maplibregl.MapMouseEvent & Object) => {

      // If the user is not authenticated, we do not allow interactions
      // with the map
      if (!authenticatedUser.current) {
        e.originalEvent.stopPropagation();
        return;
      }
      
      // Get the current state and context that we are in
      const currentState = useRMStore.getState();

      e.originalEvent.stopPropagation();

      switch (currentState.context) {
        // If we are in an idle state, then the user "intends" to add a
        // restaurant to the map by clicking on it.
        case 'rm/set-idle':
          const popupNode = document.createElement("div");

          const popup = new maplibregl.Popup(
            { 
              maxWidth: "none",
              className: "popup"
            }
          ) .setLngLat(e.lngLat)
            .setDOMContent(popupNode)
            .addTo(map.current!);

          // Switch contexts to 'click-empty-to-add'
          dispatch({
            type: "rm/click-empty-to-add",
            clickLocation: e.lngLat,
            activeMapPopup: { element: popupNode, instance: popup},
          })
          break;

        // If the user is dragging yet has decided to click the map,
        // then we will set to idle. Note that the "diff" in the
        // next useEffect() will take care of the unsaved location
        case 'rm/moving-restaurant':
          dispatch({ type: "rm/set-idle" });
          break;

        // We remove the pop up in this context to enable "toggling"
        case 'rm/click-empty-to-add':
          currentState.activeMapPopup?.instance.remove();
          dispatch({ type: "rm/set-idle" });
          break;
        
        // We go to idle if the user clicks on the map while selecting
        // a restaurant
        case 'rm/select-restaurant':
          dispatch({ type: "rm/set-idle" });
          break;
      }
    };

    mapInstance.on("click", handleMapClick);

    // Cleaning up the map and its markers on unmount
    return () => {
      mapInstance.off("click", handleMapClick);
      mapInstance.remove();
      map.current = null;
      markers.current.forEach((m) => {
        const clickHandler = (m as any).clickHandler;
        if (clickHandler) {
          m.getElement().removeEventListener("click", clickHandler);
        }
        m.remove()
      });
      markers.current.clear();
    };
  }, []);


  
  // This effect is responsible for managing the markers that are
  // visualized on the map, including their creation and deletion.
  // Whenever the data (userRestaurants) changes, the markers are
  // updated through a "diff". Here is also we will set up event
  // listeners for the markers.
  useEffect(() => {
    if (!map.current) return;

    if (!current_user_id) {
      // User logged out → remove all markers
      markers.current.forEach((m) => {
        const clickHandler = (m as any).clickHandler;
        if (clickHandler) m.getElement().removeEventListener("click", clickHandler);
        m.remove();
      });
      markers.current.clear();
      return;
    }

    if (!data) return;

    const currentMarkers = markers.current;
    const newDataIDs = new Set(data.map(r => r.user_restaurant_id));

    // Delete stale markers and clean up their listeners
    for (const [id, marker] of currentMarkers) {
      if (!newDataIDs.has(id)) {
        const clickHandler = (marker as any).clickHandler;
        if (clickHandler) {
          marker.getElement().removeEventListener("click", clickHandler);
        }
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    data.forEach((restaurant) => {
      const existing = currentMarkers.get(restaurant.user_restaurant_id);

      // Check if we need to update
      if (existing) {
        const lngLat = existing.getLngLat();

        // If the location has changed, then we need to reset the
        // location of the marker
        if ((lngLat.lng !== restaurant.longitude) || 
            (lngLat.lat !== restaurant.latitude)) {
          
          existing.setLngLat([restaurant.longitude, restaurant.latitude]);
        }

      // We will need to create a new marker and set up an event
      // handler for when somebody clicks on the marker, which should
      // take the user to the "select-restaurant" context.
      } else {

        const markerDiv = document.createElement("div");
        const markerRoot = createRoot(markerDiv);

        markerRoot.render(
          <div className="!flex !flex-col !items-center">
            <div className="!label text-black !bg-red-50 !py-2 !px-4
            rounded shadow font-sans font-normal leading-snug">
              {restaurant.name}
            </div>
            <MarkerIcon 
              className="!w-12 !h-12 !align-center !justify-center"
              sx={{ color: "red" }}
            />
          </div>
        );

        const marker = new maplibregl.Marker(
          { element: markerDiv,
            anchor: 'bottom'}
          )
          .setLngLat([restaurant.longitude, restaurant.latitude])
          .addTo(map.current!);



        // When the user clicks on the marker, we will evaluate the current
        // context that the user is in to determine what context to switch
        // to, updating the UI accordingly
        const handleMarkerClick = (e: MouseEvent) => {
          e.stopPropagation();

          const currentState = useRMStore.getState();
          const markerLngLat = marker.getLngLat();

          switch (currentState.context) {

            // If we are in a moving state, we do not do anything.
            case 'rm/moving-restaurant':
              break;

            // If the user is currently adding a restaurant, yet has
            // clicked a marker, then we are going to clear the
            // current popup and continue
            // 
            // @ts-ignore This is supposed to be a fallthrough case
            case 'rm/click-empty-to-add':
              currentState.activeMapPopup?.instance.remove()

            default:
              dispatch({
                type: "rm/select-restaurant",
                selectedRestaurant: restaurant.user_restaurant_id,
                clickLocation: markerLngLat
              });

              const zoomLevel = Math.max(18, map.current!.getZoom());
              map.current?.flyTo({
                center: markerLngLat,
                zoom: zoomLevel,
                essential: true
              });
            }
        };

        marker.getElement().addEventListener("click", handleMarkerClick);
        currentMarkers.set(restaurant.user_restaurant_id, marker);
      }
    });

    return;
  }, [data, current_user_id, context]);





  // This effect is responsible for managing the dragging of the
  // currently selected restaurant's marker. This really only
  // applies when the user is in the moving restaurant state.
  useEffect(() => {
  
    // Ensure the selected marker, restaurant, and map exists
    if (!map.current || !selectedRestaurant) return;
    const restaurantMarker = markers.current.get(selectedRestaurant!);
    if (!restaurantMarker) return;

    // We only enable draggable and set up the moving restaurant
    // popup when user intentionally clicked move restaurant on
    // the dashboard
    if (context === "rm/moving-restaurant") {

      restaurantMarker.setDraggable(true);

      const popupNode = document.createElement("div");

      const popup = new maplibregl.Popup(
        { maxWidth: "none",
          className: "popup-move",
          anchor: "top"
        })
        .setLngLat(restaurantMarker.getLngLat())
        .setDOMContent(popupNode)
        .addTo(map.current!);

      // We "re-dispatch" to include the new popup, since the original
      // dispatcher does not have access to the active popup. Is there a way
      // to prevent us from having to do this?
      dispatch({ type: "rm/moving-restaurant",
          dragLocation: clickLocation,
          clickLocation: clickLocation,
          dragStart: clickLocation,
          activeMapPopup: { element: popupNode, instance: popup}
      });

      // We regularly update the location of the active popup within
      // our RMStore as restaurant is being dragged.
      const handleRestaurantDrag = () => {
        const newLngLat = restaurantMarker.getLngLat();
        popup.setLngLat(newLngLat);

        dispatch({ type: "rm/moving-restaurant",
            dragLocation: newLngLat,
            clickLocation: clickLocation,
            dragStart: dragStart,
            activeMapPopup: { element: popupNode, instance: popup}
        });
      };

      restaurantMarker.on("drag", handleRestaurantDrag);

      // Cleanup - get rid of the drag listeners and popup, and
      // reset dragging state back to normal
      return () => {
        restaurantMarker.off("drag", handleRestaurantDrag);
        restaurantMarker.setDraggable(false);

        const currentState = useRMStore.getState();
        if (currentState.activeMapPopup?.element === popupNode) {
          dispatch({ type: 'rm/set-idle' });
        }
      };
    }

    return;
  
  }, [context, selectedRestaurant]);





  // Whenever the user's context changes, we will determine the 
  // popup to be displayed through createPortal accordingly
  const clickPopUp = useMemo(() => {
    switch (context) {
      case "rm/click-empty-to-add":
        return <AddRestaurantPopUp />;
      case "rm/moving-restaurant":
        return <MoveRestaurantPopUp />;
      default:
        return null;
    }
  }, [context, activeMapPopup]);


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
  return (
    <div ref={mapContainer} className="w-full h-full">
      {
        activeMapPopup &&
        activeMapPopup.element &&
        createPortal(clickPopUp, activeMapPopup.element)
      }
    </div>
  );
};
