import { useEffect, useRef } from "react";
import maplibregl, { Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from "@tanstack/react-query";
import { getUserRestaurants } from "@entities";

// The UI and the handling of the pending/fetching/error states is very
// premature, and eventually, types will need to be added to the data.

export const Map = () => {

    const { isPending, isError, data, error } = useQuery({ queryKey: ['userRestaurants'], queryFn: getUserRestaurants})

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);

    // Maintaining an array of markers, which will get properly managed
    // in a future commit.
    const markers = useRef<maplibregl.Marker[]>([]);
    
    // This effect initializes the map
    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/positron',
            center: [-78.83, 43.90],
            zoom: 9.5,
        });

        map.current.on('click', (e) => {
            console.log('Map clicked at:', e.lngLat);
        });
        
        // Clean up, including markers
        return () => {
            markers.current.forEach(marker => marker.remove());
            markers.current = [];
            map.current?.remove();
            map.current = null;
        }
    }, []);


    // This effect populates the map with markers when data changes
    useEffect(() => {
        if (!data || !map.current) return;

        // TODO: Only add markers not present in markers, and ensure that
        // markers get properly updated/removed later on
        data.forEach((restaurant: any) => {
            let marker = new Marker().setLngLat([restaurant.longitude, restaurant.latitude]);
            marker.addTo(map.current!)
        });
    }, [data])

    // Very very rough state handling...
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