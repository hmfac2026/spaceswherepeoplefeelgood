"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Map as LeafletMap } from "leaflet";
import type { MarkerClusterGroup } from "leaflet";
import { categoryColor } from "@/lib/categories";
import type { PlaceMapItem } from "@/lib/types";

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function PlaceMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
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
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [25, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        subdomains: "abcd",
        maxZoom: 20,
        detectRetina: true,
      }).addTo(map);

      mapRef.current = map;
    })().catch((e) => {
      if (!cancelled) setError((e as Error).message);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!places) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      const map = mapRef.current;
      if (cancelled || !map) return;

      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      const cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (c) => {
          const n = c.getChildCount();
          return L.divIcon({
            html: `<span class="swpfg-cluster">${n}</span>`,
            className: "swpfg-cluster-wrap",
            iconSize: [36, 36],
          });
        },
      });

      const bounds = L.latLngBounds([]);

      for (const p of places) {
        const icon = L.divIcon({
          className: "swpfg-marker-wrap",
          html: `<span class="swpfg-marker" style="background:${categoryColor(p.category)}"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker([p.lat, p.lng], {
          icon,
          title: p.name,
          alt: p.name,
        });
        marker.on("click", () => router.push(`/place/${p.id}`));
        cluster.addLayer(marker);
        bounds.extend([p.lat, p.lng]);
      }

      map.addLayer(cluster);
      clusterRef.current = cluster;

      if (places.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
      }
    })().catch((e) => {
      if (!cancelled) setError((e as Error).message);
    });

    return () => {
      cancelled = true;
    };
  }, [places, router]);

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
