import { useEffect, useRef } from "react";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from "@tanstack/react-query";
import { getUserRestaurants } from "@entities";

import type { UUID } from "crypto";

// The UI and the handling of the pending/fetching/error states is very
// premature, and eventually, types will need to be added to the data.

export const RestaurantMap = () => {

    const { isPending, isError, data, error } = useQuery({
        queryKey: ["userRestaurants"],
        queryFn: getUserRestaurants,
    });

    // Only "load" the container when a DOM element is created
    const mapContainer = useRef<HTMLDivElement | null>(null);
    
    // Persist the map across re-renders
    const map = useRef<maplibregl.Map | null>(null);

    // Track markers across re-renders
    const markers = useRef<Map<UUID, maplibregl.Marker>>(new Map());
    
    // Initialize the map
    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/positron',
            center: [-78.83, 43.90],
            zoom: 9.5,
        });

        // For debugging purposes
        map.current.on('click', (e) => {
            console.log('Map clicked at:', e.lngLat);
        });

        // Clean up, including markers
        return () => {
            markers.current.forEach(marker => marker.remove());
            markers.current.clear();
            map.current?.remove();
            map.current = null;
        }
    }, []);


    // Manages the map's markers when data changes
    useEffect(() => {
        if (!data || !map.current) return;

        const currentMarkers = markers.current;
        const newDataIDs = new Set(data.map((restaurant) => restaurant.id));
        
        // Delete markers not in data
        for (const [id, marker] of currentMarkers) {
            if (!newDataIDs.has(id)) {
                marker.remove();
                currentMarkers.delete(id);
            }
        }

        // Look at the data to see if its corresponding markers is
        // present and accurate
        data.forEach((restaurant) => {
            const existingMarker = currentMarkers.get(restaurant.id);
            
            if (existingMarker) {
                // Update marker location if inaccurate
                const currentLngLat = existingMarker.getLngLat();
                if (currentLngLat.lng !== restaurant.longitude || 
                    currentLngLat.lat !== restaurant.latitude) {
                    existingMarker.setLngLat([restaurant.longitude, restaurant.latitude]);
                }
            } else {
                // Create new marker since it is not present
                const marker = new maplibregl.Marker()
                    .setLngLat([restaurant.longitude, restaurant.latitude])
                    .addTo(map.current!);
                
                currentMarkers.set(restaurant.id, marker);
            }
        });
    }, [data])

    if (isPending) {
        console.log("Loading...")
    }
    if (isError) {
        console.log(`Error: ${error}`)
    }

    return (
        <div
            ref = {mapContainer}
            className="w-full h-full"
        />
    );
};