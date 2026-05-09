"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl, { type GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { CATEGORIES } from "@/lib/categories";
import type { PlaceMapItem } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const STYLE_URL = "mapbox://styles/mapbox/streets-v12";
const SOURCE_ID = "places";
const CLUSTER_LAYER = "clusters";
const COUNT_LAYER = "cluster-count";
const POINT_LAYER = "unclustered";

function categoryColorExpression(): mapboxgl.ExpressionSpecification {
  const expr: mapboxgl.ExpressionSpecification = [
    "match",
    ["get", "category"],
    ...CATEGORIES.flatMap((c) => [c.value, c.color] as [string, string]),
    "#7a7a72",
  ];
  return expr;
}

function toFeatureCollection(
  places: PlaceMapItem[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, name: p.name, category: p.category },
    })),
  };
}

export function PlaceMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
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
      projection: "mercator",
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

    map.on("style.load", () => {
      map.setProjection("mercator");
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !places) return;

    const data = toFeatureCollection(places);

    const setupLayers = () => {
      if (map.getSource(SOURCE_ID)) {
        (map.getSource(SOURCE_ID) as GeoJSONSource).setData(data);
      } else {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data,
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 8,
        });

        map.addLayer({
          id: CLUSTER_LAYER,
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#5f7a5b",
            "circle-opacity": 0.9,
            "circle-stroke-color": "#faf7f2",
            "circle-stroke-width": 2,
            "circle-radius": [
              "step",
              ["get", "point_count"],
              16,
              5,
              22,
              20,
              28,
            ],
          },
        });

        map.addLayer({
          id: COUNT_LAYER,
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          },
          paint: { "text-color": "#faf7f2" },
        });

        map.addLayer({
          id: POINT_LAYER,
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": categoryColorExpression(),
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              1,
              5,
              10,
              8,
              16,
              11,
            ],
            "circle-stroke-color": "#faf7f2",
            "circle-stroke-width": 2,
          },
        });

        map.on("click", CLUSTER_LAYER, (e) => {
          const f = map.queryRenderedFeatures(e.point, {
            layers: [CLUSTER_LAYER],
          })[0];
          if (!f) return;
          const clusterId = f.properties?.cluster_id as number;
          const src = map.getSource(SOURCE_ID) as GeoJSONSource;
          src.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom == null) return;
            const geom = f.geometry as GeoJSON.Point;
            map.easeTo({
              center: [geom.coordinates[0], geom.coordinates[1]],
              zoom,
            });
          });
        });

        map.on("click", POINT_LAYER, (e) => {
          const id = e.features?.[0]?.properties?.id as string | undefined;
          if (id) router.push(`/place/${id}`);
        });

        map.on("mouseenter", CLUSTER_LAYER, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", CLUSTER_LAYER, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", POINT_LAYER, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", POINT_LAYER, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      if (places.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        places.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 60, right: 60 },
          maxZoom: 6,
          duration: 800,
        });
      }
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("style.load", setupLayers);
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
