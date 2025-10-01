"use client"

import { Input } from "@/components/ui/input"
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps"
import { searchEfterskoler, type Efterskole } from "@/lib/efterskoler-service"
import { useEffect, useRef, useState } from "react"
import { google } from "google-maps"

interface GoogleLocationSearchProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect: (location: { name: string; lat: number; lng: number; address: string }) => void
  placeholder?: string
}

function LocationSearchInput({ value, onChange, onLocationSelect, placeholder }: GoogleLocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const places = useMapsLibrary("places")
  const [efterskoleSuggestions, setEfterskoleSuggestions] = useState<Efterskole[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Initialize autocomplete
  useEffect(() => {
    if (!places || !inputRef.current) return

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "dk" },
      fields: ["address_components", "geometry", "name", "formatted_address", "place_id"],
      types: ["geocode", "establishment"],
    })

    const denmarkBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(54.5, 8.0),
      new google.maps.LatLng(57.8, 15.2),
    )
    autocompleteRef.current.setBounds(denmarkBounds)

    const listener = autocompleteRef.current.addListener("place_changed", () => {
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

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener)
      }
    }
  }, [places, onLocationSelect, onChange])

  // Search efterskoler
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

  // Close suggestions on outside click
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
        placeholder={placeholder}
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

export function GoogleLocationSearch(props: GoogleLocationSearchProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="text-sm text-destructive p-2 border border-destructive rounded">
        Google Maps API key ikke konfigureret
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey} language="da" region="DK">
      <LocationSearchInput {...props} />
    </APIProvider>
  )
}
