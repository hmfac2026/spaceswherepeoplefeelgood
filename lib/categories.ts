export const CATEGORIES = [
  { value: "park_nature", label: "Park or nature", color: "#5f8a5b" },
  { value: "spiritual_site", label: "Spiritual site", color: "#7a6ea0" },
  { value: "cafe", label: "Café", color: "#b67a4a" },
  { value: "restaurant", label: "Restaurant", color: "#c45a3f" },
  { value: "bar", label: "Bar", color: "#8a3f4f" },
  { value: "hotel_stay", label: "Hotel or stay", color: "#3f6f8a" },
  { value: "wellness_studio", label: "Wellness studio", color: "#5a9a8e" },
  { value: "bookstore", label: "Bookstore", color: "#7a5a3f" },
  { value: "museum_gallery", label: "Museum or gallery", color: "#5a6a8a" },
  { value: "other", label: "Other", color: "#7a7a72" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [
  CategoryValue,
  ...CategoryValue[],
];

export function categoryLabel(value: CategoryValue): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}

export function categoryColor(value: CategoryValue): string {
  return CATEGORIES.find((c) => c.value === value)?.color ?? "#7a7a72";
}

const TYPE_TO_CATEGORY: Record<string, CategoryValue> = {
  park: "park_nature",
  national_park: "park_nature",
  state_park: "park_nature",
  hiking_area: "park_nature",
  nature_reserve: "park_nature",
  garden: "park_nature",
  beach: "park_nature",
  botanical_garden: "park_nature",

  church: "spiritual_site",
  mosque: "spiritual_site",
  synagogue: "spiritual_site",
  hindu_temple: "spiritual_site",
  buddhist_temple: "spiritual_site",
  place_of_worship: "spiritual_site",
  monastery: "spiritual_site",
  cemetery: "spiritual_site",

  cafe: "cafe",
  coffee_shop: "cafe",
  bakery: "cafe",
  tea_house: "cafe",

  restaurant: "restaurant",
  diner: "restaurant",
  pizzeria: "restaurant",
  food: "restaurant",
  meal_takeaway: "restaurant",

  bar: "bar",
  pub: "bar",
  wine_bar: "bar",
  brewery: "bar",
  night_club: "bar",

  hotel: "hotel_stay",
  motel: "hotel_stay",
  lodging: "hotel_stay",
  resort: "hotel_stay",
  inn: "hotel_stay",
  bed_and_breakfast: "hotel_stay",
  guest_house: "hotel_stay",
  hostel: "hotel_stay",

  spa: "wellness_studio",
  yoga_studio: "wellness_studio",
  wellness_center: "wellness_studio",
  gym: "wellness_studio",

  book_store: "bookstore",
  library: "bookstore",

  museum: "museum_gallery",
  art_gallery: "museum_gallery",
  history_museum: "museum_gallery",
  art_museum: "museum_gallery",
};

export function categoryFromGoogleTypes(
  types: readonly string[] | null | undefined,
): CategoryValue {
  if (!types) return "other";
  for (const t of types) {
    const mapped = TYPE_TO_CATEGORY[t];
    if (mapped) return mapped;
  }
  return "other";
}
