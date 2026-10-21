"use client";

import { createContext, useContext, useEffect, useState } from "react";
const FAVORITES_KEY = "fgf:saved-chews";
type FavoritesContextValue = {
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
};
const FavoritesContext = createContext<FavoritesContextValue | null>(null);
function readFavorites(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
export function FavoritesProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFavoriteIds(readFavorites(window.localStorage.getItem(FAVORITES_KEY)));
    setLoaded(true);
    const syncFavorites = (event: StorageEvent) => {
      if (event.key === FAVORITES_KEY) setFavoriteIds(readFavorites(event.newValue));
    };
    window.addEventListener("storage", syncFavorites);
    return () => window.removeEventListener("storage", syncFavorites);
  }, []);
  useEffect(() => {
    if (loaded) window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, loaded]);
  function toggleFavorite(id: string) {
    setFavoriteIds(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);
  }
  return <FavoritesContext.Provider value={{
    favoriteIds,
    toggleFavorite
  }}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside FavoritesProvider");
  return value;
}
