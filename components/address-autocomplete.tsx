"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { google } from "google-maps"

interface AddressAutocompleteProps {
  label: string
  placeholder?: string
  defaultValue?: string
  onAddressSelect: (address: {
    formatted_address: string
    lat: number
    lng: number
  }) => void
  required?: boolean
  id?: string
}

export function AddressAutocomplete({
  label,
  placeholder = "Indtast adresse...",
  defaultValue = "",
  onAddressSelect,
  required = false,
  id = "address-input",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    // Wait for Google Maps to load
    const initAutocomplete = () => {
      if (!inputRef.current || !window.google) return

      // Initialize autocomplete with Denmark bias
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "dk" },
        fields: ["formatted_address", "geometry", "name"],
        types: ["address"],
      })

      // Listen for place selection
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace()

        if (place?.geometry?.location) {
          const selectedAddress = {
            formatted_address: place.formatted_address || "",
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }

          setValue(selectedAddress.formatted_address)
          onAddressSelect(selectedAddress)
        }
      })
    }

    // Check if Google Maps is already loaded
    if (window.google) {
      initAutocomplete()
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleMaps)
          initAutocomplete()
        }
      }, 100)

      return () => clearInterval(checkGoogleMaps)
    }
  }, [onAddressSelect])

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        autoComplete="off"
      />
    </div>
  )
}
