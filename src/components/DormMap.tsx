"use client";

"use client";

import { useEffect, useRef } from "react";

interface DormMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  height?: string;
}

export function DormMap({ latitude, longitude, name, address, height = "300px" }: DormMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import of Leaflet (client-side only — no window issues)
    async function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      LRef.current = L;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>${name}</b><br/>${address}`);

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, name, address]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
      className="border border-gray-200"
    />
  );
}


