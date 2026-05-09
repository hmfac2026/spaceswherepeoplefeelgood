declare module "mapbox-gl/dist/mapbox-gl-csp" {
  // The CSP-safe build ships the same runtime API as the regular build but
  // routes worker code through a separate file (workerUrl). It has no .d.ts
  // of its own; for typing we lean on "mapbox-gl" instead.
  import mapboxgl from "mapbox-gl";
  const m: typeof mapboxgl & { workerUrl: string };
  export default m;
}
