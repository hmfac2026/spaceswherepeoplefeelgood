"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { categoryColor } from "@/lib/categories";
import type { PlaceMapItem } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const STYLE_URL = "mapbox://styles/mapbox/light-v11";

export function PlaceMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [places, setPlaces] = useState<PlaceMapItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/places")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load places (${r.status})`);
        return r.json() as Promise<PlaceMapItem[]>;
      })
      .then((data) => {
        if (!cancelled) setPlaces(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      projection: { name: "mercator" },
      center: [0, 25],
      zoom: 1.6,
      minZoom: 1.2,
      maxZoom: 18,
      pitch: 0,
      bearing: 0,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false,
    });

    map.touchZoomRotate.disableRotation();

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !places) return;

    const addMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds = new mapboxgl.LngLatBounds();

      places.forEach((p) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "swpfg-marker";
        el.setAttribute("aria-label", `${p.name}`);
        el.style.background = categoryColor(p.category);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          router.push(`/place/${p.id}`);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        markersRef.current.push(marker);
        bounds.extend([p.lng, p.lat]);
      });

      if (places.length > 0) {
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 60, right: 60 },
          maxZoom: 6,
          duration: 800,
        });
      }
    };

    if (map.isStyleLoaded()) {
      addMarkers();
    } else {
      map.once("load", addMarkers);
    }
  }, [places, router]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="text-ink-soft flex h-full items-center justify-center text-sm">
        Map unavailable.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {places === null && !error && (
        <div className="bg-paper/80 text-ink-soft pointer-events-none absolute inset-0 flex items-center justify-center text-sm backdrop-blur-sm">
          Finding spaces…
        </div>
      )}
      {error && (
        <div className="bg-paper/80 absolute inset-0 flex items-center justify-center text-sm text-red-700 backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
}
