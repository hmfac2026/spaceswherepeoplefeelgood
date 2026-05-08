const API_BASE = "https://places.googleapis.com/v1";

function apiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not set");
  return key;
}

async function resolvePhotoUrl(photoName: string): Promise<string | null> {
  const res = await fetch(
    `${API_BASE}/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true`,
    { headers: { "X-Goog-Api-Key": apiKey() } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { photoUri?: string };
  return data.photoUri ?? null;
}

export type AutocompletePrediction = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export async function autocomplete(
  input: string,
): Promise<AutocompletePrediction[]> {
  if (!input.trim()) return [];

  const res = await fetch(`${API_BASE}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    console.error("Autocomplete failed", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as {
    suggestions?: {
      placePrediction?: {
        placeId: string;
        structuredFormat?: {
          mainText?: { text: string };
          secondaryText?: { text: string };
        };
      };
    }[];
  };

  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      placeId: p.placeId,
      mainText: p.structuredFormat?.mainText?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

export type GooglePlaceDetails = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  types: string[];
  photoUrl: string | null;
};

export async function placeDetails(
  placeId: string,
): Promise<GooglePlaceDetails | null> {
  const res = await fetch(`${API_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,types,photos",
    },
  });

  if (!res.ok) {
    console.error("Place details failed", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    types?: string[];
    photos?: { name: string }[];
  };

  if (!data.location) return null;

  let photoUrl: string | null = null;
  const firstPhoto = data.photos?.[0];
  if (firstPhoto?.name) {
    photoUrl = await resolvePhotoUrl(firstPhoto.name);
  }

  return {
    placeId: data.id,
    name: data.displayName?.text ?? "",
    address: data.formattedAddress ?? null,
    lat: data.location.latitude,
    lng: data.location.longitude,
    types: data.types ?? [],
    photoUrl,
  };
}
