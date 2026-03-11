'use client';

import { useEffect, useRef, useState } from "react";

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
  center = [33.6844, 73.0479], // Defaulting center to Islamabad for your target market!
  zoom = 13,
  markers = [],
  routePoints,
  className = "",
  interactive = true,
  darkMode = false,
}: MapViewProps) {
  const [L, setL] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // The Route Fingerprint Lock (prevents auto-zooming when car moves)
  const lastBoundsKey = useRef<string>("");

  // 1. Load Leaflet ONLY on the client browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        setL(leaflet.default ? leaflet.default : leaflet);
      });
    }
  }, []);

  // 2. Initialize map
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

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, [L, interactive]);

  // 3. Update tile layer on dark mode change
  useEffect(() => {
    if (!L || !mapRef.current || !tileLayerRef.current) return;

    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    tileLayerRef.current.setUrl(tileUrl);
  }, [darkMode, L]);

  // 4. Update markers & Manage Camera
  useEffect(() => {
    if (!L || !mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

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

    const passengerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(66,133,244,0.25), 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

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
        case "user": return userIcon;
        case "passenger": return passengerIcon;
        default: return defaultIcon;
      }
    };

    // Draw the markers
    markers.forEach((m) => {
      L.marker(m.position, { icon: getIcon(m.type) }).addTo(markersLayerRef.current!);
    });

    // --- THE MAGIC FIX: Decouple camera movement from car movement ---
    
    // 1. Identify "anchor" markers (Start & End routes)
    const anchorMarkers = markers.filter(m => m.type !== "user" && m.type !== "passenger");
    
    // 2. Create a unique fingerprint for this specific set of anchors
    const currentRouteFingerprint = JSON.stringify(anchorMarkers.map(m => m.position));

    // 3. Only recenter the camera if the anchors actually changed (or on first load)
    if (lastBoundsKey.current !== currentRouteFingerprint && markers.length > 0) {
      if (markers.length >= 2) {
        // Frame ALL markers on the very first load so the car is in view!
        const bounds = L.latLngBounds(markers.map((m) => m.position));
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } else if (markers.length === 1) {
        mapRef.current.setView(markers[0].position, 14);
      }
      
      // Lock the camera!
      lastBoundsKey.current = currentRouteFingerprint;
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
        color: "#1A3C6E", // Solid Dark Blue
        weight: 6,        // Thicker line
        opacity: 0.9,     // Highly visible
        lineCap: "round", // Smooth edges
        lineJoin: "round" // Smooth corners when turning on a street
      }).addTo(mapRef.current);
    }
  }, [routePoints, L]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", zIndex: 0 }} />;
}