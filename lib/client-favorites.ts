"use client";

import { useEffect, useMemo, useState } from "react";

type FavoriteState = {
  assets: string[];
  categories: string[];
  sources: string[];
};

const storageKey = "marketpulse:favorites";

function normalizeState(value: Partial<FavoriteState> | null | undefined): FavoriteState {
  return {
    assets: Array.isArray(value?.assets) ? value.assets : [],
    categories: Array.isArray(value?.categories) ? value.categories : [],
    sources: Array.isArray(value?.sources) ? value.sources : []
  };
}

function loadFavorites(): FavoriteState {
  if (typeof window === "undefined") {
    return normalizeState(null);
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeState(null);
  }
}

function saveFavorites(value: FavoriteState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("marketpulse:favorites-updated", { detail: value }));
}

function toggleValue(current: string[], value: string) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteState>(() => normalizeState(null));

  useEffect(() => {
    setFavorites(loadFavorites());

    const onStorage = () => setFavorites(loadFavorites());
    window.addEventListener("storage", onStorage);
    window.addEventListener("marketpulse:favorites-updated", onStorage as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("marketpulse:favorites-updated", onStorage as EventListener);
    };
  }, []);

  const api = useMemo(
    () => ({
      favorites,
      toggleAsset(value: string) {
        const next = { ...favorites, assets: toggleValue(favorites.assets, value) };
        setFavorites(next);
        saveFavorites(next);
      },
      toggleCategory(value: string) {
        const next = { ...favorites, categories: toggleValue(favorites.categories, value) };
        setFavorites(next);
        saveFavorites(next);
      },
      toggleSource(value: string) {
        const next = { ...favorites, sources: toggleValue(favorites.sources, value) };
        setFavorites(next);
        saveFavorites(next);
      }
    }),
    [favorites]
  );

  return api;
}
