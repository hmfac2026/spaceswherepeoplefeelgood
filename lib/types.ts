import type { CategoryValue } from "./categories";

export type PlaceMapItem = {
  id: string;
  name: string;
  category: CategoryValue;
  lat: number;
  lng: number;
};

export type EntryDetail = {
  id: string;
  displayName: string | null;
  specialToYou: string;
  energy: string;
  whatToDo: string;
  createdAt: string;
};

export type PlaceDetail = {
  id: string;
  name: string;
  category: CategoryValue;
  lat: number;
  lng: number;
  address: string | null;
  photoUrl: string | null;
  createdAt: string;
  entries: EntryDetail[];
};
