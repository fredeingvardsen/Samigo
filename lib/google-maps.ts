// Import Google Maps library
import { google } from "google-maps"

export interface RoutePoint {
  location: string
  lat: number
  lng: number
  distanceFromStart: number
}

/**
 * Calculate route and suggest pickup points along the way
 */
export async function calculateRouteWithPickupPoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  pickupOptions: string[],
): Promise<RoutePoint[]> {
  if (!window.google) {
    throw new Error("Google Maps not loaded")
  }

  const directionsService = new google.maps.DirectionsService()
  const geocoder = new google.maps.Geocoder()

  try {
    const result = await directionsService.route({
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: google.maps.TravelMode.DRIVING,
    })

    if (!result.routes[0]) {
      return []
    }

    const route = result.routes[0]
    const pickupPoints: RoutePoint[] = []

    // If "along-route" is selected, suggest points along the route
    if (pickupOptions.includes("along-route")) {
      const legs = route.legs[0]
      const steps = legs.steps

      // Suggest pickup points at roughly 25%, 50%, and 75% of the route
      const intervals = [0.25, 0.5, 0.75]

      for (const interval of intervals) {
        const targetDistance = legs.distance!.value * interval
        let accumulatedDistance = 0

        for (const step of steps) {
          accumulatedDistance += step.distance!.value

          if (accumulatedDistance >= targetDistance) {
            const location = step.end_location

            // Reverse geocode to get address
            try {
              const geocodeResult = await geocoder.geocode({
                location: { lat: location.lat(), lng: location.lng() },
              })

              if (geocodeResult.results[0]) {
                pickupPoints.push({
                  location: geocodeResult.results[0].formatted_address,
                  lat: location.lat(),
                  lng: location.lng(),
                  distanceFromStart: accumulatedDistance,
                })
              }
            } catch (error) {
              console.error("Geocoding error:", error)
            }

            break
          }
        }
      }
    }

    return pickupPoints
  } catch (error) {
    console.error("Route calculation error:", error)
    return []
  }
}

/**
 * Geocode an address to get coordinates
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!window.google) {
    throw new Error("Google Maps not loaded")
  }

  const geocoder = new google.maps.Geocoder()

  try {
    const result = await geocoder.geocode({ address })

    if (result.results[0]?.geometry?.location) {
      return {
        lat: result.results[0].geometry.location.lat(),
        lng: result.results[0].geometry.location.lng(),
      }
    }

    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}
