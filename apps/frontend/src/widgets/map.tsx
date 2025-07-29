import "./map.css";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UUID } from "crypto";
import { createPortal } from "react-dom";
import { UserRestaurantAPI, type UserRestaurants } from "@entities";

import { Input } from "@shared/ui";
import { Button } from "@shared/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui";

// This app uses zod + react hook forms for client side input validation
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const AddRestaurantPopupFormSchema = z.object({
  restaurantName: z.string().min(1, {
    message: "Please input a non-empty name!",
  }),
});

interface AddRestaurantPopUpProps {
  onClose: () => void;
  lnglat: maplibregl.LngLat;
}

// This popup provides a form to the user that allows them to add restaurants
// onto the map. Requires the location of where the popup opened, and a
// function that determines the closing behaviour of the popup if successful
const AddRestaurantPopUp = ({ onClose, lnglat }: AddRestaurantPopUpProps) => {
  const queryClient = useQueryClient();

  // Eventually, we are also going to have to do some state handling
  // (We do not have any Pending/Error state handling yet)
  const createMutation = useMutation({
    mutationFn: UserRestaurantAPI.post,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRestaurants"] });
      onClose();
    },
  });

  const addRestaurantPopUpForm = useForm<
    z.infer<typeof AddRestaurantPopupFormSchema>
  >({
    resolver: zodResolver(AddRestaurantPopupFormSchema),
    defaultValues: {
      restaurantName: "",
    },
  });

  function onSubmit(data: z.infer<typeof AddRestaurantPopupFormSchema>) {
    createMutation.mutate({
      id: crypto.randomUUID(), // TODO: Should be on backend
      name: data.restaurantName,
      address: "Placeholder", // Placeholder
      longitude: lnglat.lng,
      latitude: lnglat.lat,
      rating: 5, // Placeholder
      price_range: 2, // Placeholder
      tags: [], // Placeholder
      notable_items: [], // Placeholder
    } as unknown as UserRestaurants);
  }

  return (
    <div role="form" className="text-black p-16 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Add Restaurant</h1>
      <Form {...addRestaurantPopUpForm}>
        <form
          onSubmit={addRestaurantPopUpForm.handleSubmit(onSubmit)}
          className="space-y-6 flex flex-col gap-4"
        >
          <FormField
            control={addRestaurantPopUpForm.control}
            name="restaurantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurant Name</FormLabel>
                <FormControl>
                  <Input placeholder="Yummies" {...field}></Input>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <Button type="submit" className="text-white w-1/3">
            Create
          </Button>
        </form>
      </Form>
    </div>
  );
};

// This widget allows users to view their restaurants on a map
export const RestaurantMap = () => {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["userRestaurants"],
    queryFn: UserRestaurantAPI.get,
  });

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<UUID, maplibregl.Marker>>(new Map());

  // Manages the state of the add restaurants popup. A pop up requires
  // maplibre gl to handle the style/lifecycle/creation of the pop up,
  // and React to handle the rendering, hence why we need to track the
  // HTML element and MaplibreGL.Popup instance.
  const [popupState, setPopupState] = useState<{
    element: HTMLDivElement;
    instance: maplibregl.Popup;
    lnglat: maplibregl.LngLat;
  } | null>(null);

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
        className: "add-restaurant-popup",
      })
        .setLngLat(e.lngLat)
        .setDOMContent(popupNode)
        .addTo(mapInstance);

      setPopupState({
        element: popupNode,
        instance: popup,
        lnglat: e.lngLat,
      });
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
          .addTo(map.current!);
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
  return (
    <section
      aria-label="Restaurant Map"
      ref={mapContainer}
      className="w-full h-full"
    >
      {popupState &&
        createPortal(
          <AddRestaurantPopUp
            onClose={() => {
              popupState.instance?.remove();
              setPopupState(null);
            }}
            lnglat={popupState.lnglat}
          />,
          popupState.element,
        )}
    </section>
  );
};
