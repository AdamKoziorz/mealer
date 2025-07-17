import { useEffect, useRef } from "react";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export const Map = () => {
    
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);
    
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
        
        return () => {
            map.current?.remove();
            map.current = null;
        }
    }, []);

    
    return (
        <div
            ref = {mapContainer}
            className="w-full h-full"
        />
    );
};