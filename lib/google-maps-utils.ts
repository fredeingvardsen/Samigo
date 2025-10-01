// Google Maps utility functions
import { google } from "google-maps"

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!google?.maps?.geometry) {
    // Fallback to Haversine formula if Google Maps not loaded
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const from = new google.maps.LatLng(lat1, lng1)
  const to = new google.maps.LatLng(lat2, lng2)
  return google.maps.geometry.spherical.computeDistanceBetween(from, to) / 1000 // Convert to km
}

export async function geocodeAddress(address: string): Promise<{
  lat: number
  lng: number
  formattedAddress: string
} | null> {
  if (!google?.maps) {
    return null
  }

  const geocoder = new google.maps.Geocoder()

  return new Promise((resolve) => {
    geocoder.geocode(
      {
        address,
        region: "DK", // Prioritize Denmark
        componentRestrictions: { country: "DK" },
      },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address,
          })
        } else {
          resolve(null)
        }
      },
    )
  })
}
