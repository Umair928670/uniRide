'use client';

import { useEffect, useRef, useState } from "react";

// Predefined location coordinates for the mock data
export const LOCATION_COORDS: Record<string, [number, number]> = {
  "Engineering Block": [37.4285, -122.1725],
  "Downtown Metro": [37.4435, -122.164],
  "Library Gate": [37.4265, -122.168],
  "City Mall": [37.4455, -122.158],
  "Sports Complex": [37.431, -122.175],
  "Airport Terminal": [37.6213, -122.379],
  "Hostel Block A": [37.425, -122.171],
  "Central Station": [37.45, -122.14],
  "Main Gate": [37.427, -122.165],
  "Tech Park": [37.402, -122.148],
  "Campus Gate": [37.4268, -122.166],
  "Train Station": [37.4435, -122.1645],
  Library: [37.4265, -122.168],
  "Shopping Center": [37.448, -122.156],
};

export default function getRoutePoints(from: string, to: string): [number, number][] {
  const start = LOCATION_COORDS[from];
  const end = LOCATION_COORDS[to];
  if (!start || !end) return [];

  const midLat = (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 0.005;
  const midLng = (start[1] + end[1]) / 2 + (Math.random() - 0.5) * 0.005;

  return [start, [midLat, midLng], end];
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: { position: [number, number]; type: "start" | "end" | "user" | "passenger" | "default" }[];
  routePoints?: [number, number][];
  className?: string;
  interactive?: boolean;
  darkMode?: boolean;
}

export function MapView({
  center = [37.4275, -122.1697],
  zoom = 13,
  markers = [],
  routePoints,
  className = "",
  interactive = true,
  darkMode = false,
}: MapViewProps) {
  // We use state to hold the Leaflet library so it never runs on the server
  const [L, setL] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // 1. Load Leaflet ONLY on the client browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        setL(leaflet.default ? leaflet.default : leaflet);
      });
    }
  }, []);

  // 2. Initialize map (Only runs once L is loaded)
  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
    });

    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const tileLayer = L.tileLayer(tileUrl).addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersLayer;

    // Force a resize check after mount
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, interactive]);

  // 3. Update tile layer on dark mode change
  useEffect(() => {
    if (!L || !mapRef.current || !tileLayerRef.current) return;

    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    tileLayerRef.current.setUrl(tileUrl);
  }, [darkMode, L]);

  // 4. Update markers & Define Icons safely
  useEffect(() => {
    if (!L || !mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Safely defined inside the component where Leaflet (L) is guaranteed to exist
    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const startIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:20px;height:20px;background:#1A3C6E;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const endIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:20px;height:20px;background:#00C9B1;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // The Passenger tracking icon (Blue Dot)
    const passengerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(66,133,244,0.25), 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    // The Driver tracking icon (Car SVG)
    const userIcon = L.divIcon({
      className: "bg-transparent",
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute inset-0 rounded-full bg-[#00C9B1] animate-ping opacity-20"></div>
          <div class="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-[#1A3C6E] rounded-full shadow-md text-[#1A3C6E]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const getIcon = (type: string) => {
      switch (type) {
        case "start": return startIcon;
        case "end": return endIcon;
        case "user": return userIcon;         // Maps to the Driver's Car
        case "passenger": return passengerIcon; // Maps to the Passenger's Blue Dot
        default: return defaultIcon;
      }
    };

    markers.forEach((m) => {
      L.marker(m.position, { icon: getIcon(m.type) }).addTo(markersLayerRef.current!);
    });

    // Fit bounds if multiple markers
    if (markers.length >= 2) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (markers.length === 1) {
      mapRef.current.setView(markers[0].position, 14);
    }
  }, [markers, L]);

  // 5. Update polyline
  useEffect(() => {
    if (!L || !mapRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routePoints && routePoints.length >= 2) {
      polylineRef.current = L.polyline(routePoints, {
        color: "#1A3C6E",
        weight: 4,
        opacity: 0.8,
        dashArray: "8, 12",
      }).addTo(mapRef.current);
    }
  }, [routePoints, L]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", zIndex: 0 }} />;
}