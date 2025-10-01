"use client"

import { Input } from "@/components/ui/input"
import { loadGoogleMapsAPI } from "@/lib/google-maps-loader"
import { searchEfterskoler, type Efterskole } from "@/lib/efterskoler-service"
import { useEffect, useRef, useState } from "react"
import { google } from "google-maps"

interface GoogleLocationSearchProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect: (location: { name: string; lat: number; lng: number; address: string }) => void
  placeholder?: string
}

export function GoogleLocationSearch({ value, onChange, onLocationSelect, placeholder }: GoogleLocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [efterskoleSuggestions, setEfterskoleSuggestions] = useState<Efterskole[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    async function initAutocomplete() {
      try {
        await loadGoogleMapsAPI()

        if (!mounted || !inputRef.current) return

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "dk" },
          fields: ["address_components", "geometry", "name", "formatted_address", "place_id"],
          types: ["geocode", "establishment"],
        })

        const denmarkBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(54.5, 8.0), // Southwest corner
          new google.maps.LatLng(57.8, 15.2), // Northeast corner
        )
        autocompleteRef.current.setBounds(denmarkBounds)

        // Listen for place selection
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace()

          if (place?.geometry?.location) {
            const location = {
              name: place.name || place.formatted_address || "",
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || "",
            }

            onLocationSelect(location)
            onChange(location.name)
            setShowSuggestions(false)
          }
        })

        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Failed to load Google Maps:", err)
        setError("Kunne ikke indlæse Google Maps")
        setIsLoading(false)
      }
    }

    initAutocomplete()

    return () => {
      mounted = false
    }
  }, [onLocationSelect, onChange])

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (value.length >= 2) {
        const results = await searchEfterskoler(value)
        setEfterskoleSuggestions(results)
        setShowSuggestions(results.length > 0)
      } else {
        setEfterskoleSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleEfterskoleSelect = (efterskole: Efterskole) => {
    if (efterskole.latitude && efterskole.longitude) {
      const location = {
        name: efterskole.name,
        lat: efterskole.latitude,
        lng: efterskole.longitude,
        address: `${efterskole.address}, ${efterskole.postal_code} ${efterskole.city}`,
      }
      onLocationSelect(location)
      onChange(efterskole.name)
      setShowSuggestions(false)
    }
  }

  if (error) {
    return <div className="text-sm text-destructive p-2 border border-destructive rounded">{error}</div>
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (efterskoleSuggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        placeholder={isLoading ? "Indlæser..." : placeholder}
        disabled={isLoading}
      />

      {showSuggestions && efterskoleSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <div className="p-2 text-xs font-medium text-muted-foreground border-b">Efterskoler</div>
          {efterskoleSuggestions.map((efterskole) => (
            <button
              key={efterskole.id}
              type="button"
              onClick={() => handleEfterskoleSelect(efterskole)}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors flex flex-col gap-1"
            >
              <div className="font-medium text-sm">{efterskole.name}</div>
              <div className="text-xs text-muted-foreground">
                {efterskole.city}
                {efterskole.region && ` • ${efterskole.region}`}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
