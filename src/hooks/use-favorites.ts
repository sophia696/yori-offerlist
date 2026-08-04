"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "yori_bidrunner_favorites"

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load favorites from localStorage", e)
    }
  }, [])

  const toggleFavorite = (campaignName: string) => {
    setFavorites((prev) => {
      const next = prev.includes(campaignName)
        ? prev.filter((name) => name !== campaignName)
        : [...prev, campaignName]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (e) {
        console.error("Failed to save favorites to localStorage", e)
      }
      return next
    })
  }

  const isFavorite = (campaignName: string) => favorites.includes(campaignName)

  return { favorites, toggleFavorite, isFavorite }
}
