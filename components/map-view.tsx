'use client';

import { useMemo, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Car, Loader2 } from 'lucide-react';

type MarkerType = "start" | "end" | "user" | "default";

type MapViewProps = {
  center: [number, number];
  zoom: number;
  markers: { position: [number, number]; type: MarkerType }[];
  routePoints?: [number, number][];
  interactive?: boolean;
  darkMode?: boolean;
  className?: string;
};

export function MapView({ 
  center, 
  zoom, 
  markers, 
  routePoints, 
  interactive = false, 
  darkMode = false, 
  className 
}: MapViewProps) {
  
  const mapRef = useRef<MapRef>(null);

  // 1. CRASH PROTECTION: Ensure center exists and is valid
  const validCenter = useMemo(() => {
    if (Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      return [center[1], center[0]]; // MapLibre needs [lng, lat]
    }
    return [73.0479, 33.6844]; // Fallback to Islamabad
  }, [center]);

  // 2. ROUTE LOGIC: Fixed to handle Offer Ride preview lines
  const geojsonRoute = useMemo(() => {
    // Only draw if we have at least 2 valid points
    if (!routePoints || !Array.isArray(routePoints) || routePoints.length < 2) return null;
    
    // Filter out any invalid points to prevent WebGL errors
    const coords = routePoints
      .filter(p => Array.isArray(p) && p.length === 2)
      .map(p => [p[1], p[0]]); // Swap to [lng, lat]

    if (coords.length < 2) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    };
  }, [routePoints]);

  // 3. SMART AUTO-FIT: Prevents map from resetting user zoom when live data arrives
  const routeDestinationStr = useMemo(() => {
    return routePoints && routePoints.length > 0
      ? JSON.stringify(routePoints[routePoints.length - 1])
      : null;
  }, [routePoints]);
  
  const centerStr = JSON.stringify(validCenter);
  const hasFittedRoute = useRef<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // SCENARIO A: We have a route (Ride Details / Offer Ride)
    if (routePoints && routePoints.length >= 2) {
      // ONLY fit bounds if this is a completely new destination. 
      // If the car is just moving along the same route, leave the camera alone!
      if (routeDestinationStr !== hasFittedRoute.current) {
        hasFittedRoute.current = routeDestinationStr;

        const lats = routePoints.map(p => p[0]);
        const lngs = routePoints.map(p => p[1]);

        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 40, duration: 1000 }
        );
      }
    } 
    // SCENARIO B: Following the driver or user center (Home Page)
    else {
      // Smoothly slide to the new location, but PRESERVE the user's custom zoom level!
      const currentZoom = map.getZoom(); 
      
      map.flyTo({
        center: [validCenter[0], validCenter[1]],
        zoom: currentZoom > 0 ? currentZoom : zoom, // The Magic Fix ✨
        duration: 800
      });
    }
  }, [routeDestinationStr, centerStr, routePoints, validCenter, zoom]);

  const mapStyle = darkMode
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ''}`}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: validCenter[0],
          latitude: validCenter[1],
          zoom: zoom,
          pitch: 40,
        }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        interactive={interactive}
        dragRotate={interactive}
        touchZoomRotate={interactive}
        attributionControl={false}
      >
        
        {geojsonRoute && (
          <Source id="route" type="geojson" data={geojsonRoute as any}>
            <Layer
              id="route-line-blur"
              type="line"
              paint={{
                "line-color": darkMode ? "#00C9B1" : "#1A3C6E",
                "line-width": 6,
                "line-opacity": 0.3,
                "line-blur": 3
              }}
            />
            <Layer
              id="route-line"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": darkMode ? "#00C9B1" : "#1A3C6E",
                "line-width": 3,
              }}
            />
          </Source>
        )}

        {/* --- DYNAMIC MARKERS --- */}
        {markers.map((marker, idx) => {
          if (!marker.position || isNaN(marker.position[0])) return null;
          
          return (
            <Marker 
              key={idx} 
              longitude={marker.position[1]} 
              latitude={marker.position[0]} 
              anchor="center"
            >
              <div className="relative flex items-center justify-center">
                
                {/* 1. PASSENGER PICKUP (Green Dot) */}
                {marker.type === "start" && (
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 bg-[#00C9B1] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </div>
                )}

                {/* 2. DESTINATION (Red Dot) */}
                {marker.type === "end" && (
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </div>
                )}

                {/* 3. MOVING DRIVER (Glowing Car) */}
                {marker.type === "user" && (
                  <div className="relative flex items-center justify-center">
                    {/* The "Glow" Pulse Effect from Leaflet */}
                    <div className="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-pulse" />
                    
                    {/* The Car Icon Container */}
                    <div className="relative bg-[#1A3C6E] p-1.5 rounded-xl border-2 border-white shadow-2xl z-10 transition-all duration-500">
                      <Car className="w-5 h-5 text-white" />
                    </div>

                    {/* Directional Indicator */}
                    <div className="absolute -top-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[#1A3C6E] z-20" />
                  </div>
                )}

              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}