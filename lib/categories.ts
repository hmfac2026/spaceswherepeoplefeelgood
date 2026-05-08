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
