'use client';

import { useEffect, useRef } from "react";
import L from "leaflet";


// Fix default marker icons for Leaflet in bundled environments
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

const userIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(66,133,244,0.25), 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function getIcon(type: string) {
  switch (type) {
    case "start":
      return startIcon;
    case "end":
      return endIcon;
    case "user":
      return userIcon;
    default:
      return defaultIcon;
  }
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: { position: [number, number]; type: "start" | "end" | "user" | "default" }[];
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

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
  }, []);

  // Update tile layer on dark mode change
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    tileLayerRef.current.setUrl(tileUrl);
  }, [darkMode]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

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
  }, [markers]);

  // Update polyline
  useEffect(() => {
    if (!mapRef.current) return;

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
  }, [routePoints]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />;
}

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
