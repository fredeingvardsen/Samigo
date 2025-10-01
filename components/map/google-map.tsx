"use client"

import { APIProvider, Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { getAllEfterskoler, type Efterskole } from "@/lib/efterskoler-service"
import { useEffect, useState } from "react"
import * as google from "googlemaps"

interface GoogleMapProps {
  height?: string
  selectedLocation?: {
    name: string
    lat: number
    lng: number
    address: string
  }
  rides?: Array<{
    id: string
    location: string
    destination: string
    location_lat: number
    location_lng: number
    destination_lat: number
    destination_lng: number
    available_seats: number
  }>
  showRadius?: {
    center: { lat: number; lng: number }
    radiusKm: number
  }
  rideRoute?: {
    start: { lat: number; lng: number }
    end: { lat: number; lng: number }
  }
  showEfterskoler?: boolean
}

function MapContent({
  selectedLocation,
  rides,
  showRadius,
  rideRoute,
  showEfterskoler = false,
}: Omit<GoogleMapProps, "height">) {
  const map = useMap()
  const [efterskoler, setEfterskoler] = useState<Efterskole[]>([])
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const directionsService = useMapsLibrary("routes")

  useEffect(() => {
    if (showEfterskoler) {
      getAllEfterskoler().then(setEfterskoler)
    }
  }, [showEfterskoler])

  // Handle route rendering
  useEffect(() => {
    if (!map || !directionsService || !rideRoute) {
      setDirections(null)
      return
    }

    const service = new google.maps.DirectionsService()
    service.route(
      {
        origin: rideRoute.start,
        destination: rideRoute.end,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result)
        } else {
          console.error("Directions request failed:", status)
          setDirections(null)
        }
      },
    )
  }, [map, directionsService, rideRoute])

  // Fit bounds to show all markers
  useEffect(() => {
    if (!map) return

    const bounds = new google.maps.LatLngBounds()
    let hasMarkers = false

    if (selectedLocation) {
      bounds.extend({ lat: selectedLocation.lat, lng: selectedLocation.lng })
      hasMarkers = true
    }

    if (rides && rides.length > 0) {
      rides.forEach((ride) => {
        if (ride.location_lat && ride.location_lng) {
          bounds.extend({ lat: ride.location_lat, lng: ride.location_lng })
          hasMarkers = true
        }
        if (ride.destination_lat && ride.destination_lng) {
          bounds.extend({ lat: ride.destination_lat, lng: ride.destination_lng })
          hasMarkers = true
        }
      })
    }

    if (showEfterskoler && efterskoler.length > 0) {
      efterskoler.forEach((efterskole) => {
        if (efterskole.latitude && efterskole.longitude) {
          bounds.extend({ lat: efterskole.latitude, lng: efterskole.longitude })
          hasMarkers = true
        }
      })
    }

    if (showRadius) {
      const radiusInMeters = showRadius.radiusKm * 1000
      const circle = new google.maps.Circle({
        center: showRadius.center,
        radius: radiusInMeters,
      })
      const circleBounds = circle.getBounds()
      if (circleBounds) {
        bounds.union(circleBounds)
      }
      hasMarkers = true
    }

    if (hasMarkers) {
      map.fitBounds(bounds)
      // Prevent zooming in too much for single markers
      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 15) {
          map.setZoom(15)
        }
      })
    }
  }, [map, selectedLocation, rides, efterskoler, showEfterskoler, showRadius])

  return (
    <>
      {/* Selected location marker */}
      {selectedLocation && (
        <Marker
          position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
          title={selectedLocation.name}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      )}

      {/* Radius circle */}
      {showRadius && <CircleOverlay center={showRadius.center} radiusKm={showRadius.radiusKm} />}

      {/* Efterskole markers */}
      {showEfterskoler &&
        efterskoler.map(
          (efterskole) =>
            efterskole.latitude &&
            efterskole.longitude && (
              <Marker
                key={efterskole.id}
                position={{ lat: efterskole.latitude, lng: efterskole.longitude }}
                title={efterskole.name}
                icon={{
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" strokeWidth="2"/>
                      <text x="16" y="21" fontSize="16" textAnchor="middle" fill="white">🏫</text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16),
                }}
              />
            ),
        )}

      {/* Ride markers */}
      {rides &&
        rides.map((ride) => (
          <div key={ride.id}>
            {ride.location_lat && ride.location_lng && (
              <Marker
                position={{ lat: ride.location_lat, lng: ride.location_lng }}
                title={`Afgang: ${ride.location}`}
                icon={{
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                      <text x="16" y="21" fontSize="16" textAnchor="middle" fill="white">🚗</text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16),
                }}
              />
            )}
            {ride.destination_lat && ride.destination_lng && (
              <Marker
                position={{ lat: ride.destination_lat, lng: ride.destination_lng }}
                title={`Destination: ${ride.destination}`}
                icon={{
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="white" strokeWidth="2"/>
                      <text x="16" y="21" fontSize="16" textAnchor="middle" fill="white">📍</text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16),
                }}
              />
            )}
          </div>
        ))}

      {/* Directions polyline */}
      {directions && <DirectionsRenderer directions={directions} />}
    </>
  )
}

// Custom CircleOverlay component using native Google Maps Circle
function CircleOverlay({ center, radiusKm }: { center: { lat: number; lng: number }; radiusKm: number }) {
  const map = useMap()
  const [circle, setCircle] = useState<google.maps.Circle | null>(null)

  useEffect(() => {
    if (!map) return

    const newCircle = new google.maps.Circle({
      map,
      center,
      radius: radiusKm * 1000, // Convert km to meters
      fillColor: "#4285F4",
      fillOpacity: 0.15,
      strokeColor: "#4285F4",
      strokeOpacity: 0.5,
      strokeWeight: 2,
    })

    setCircle(newCircle)

    return () => {
      newCircle.setMap(null)
    }
  }, [map, center, radiusKm])

  return null
}

function DirectionsRenderer({ directions }: { directions: google.maps.DirectionsResult }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !directions) return

    const renderer = new google.maps.DirectionsRenderer({
      map,
      directions,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#3b82f6",
        strokeWeight: 4,
        strokeOpacity: 0.7,
      },
    })

    return () => {
      renderer.setMap(null)
    }
  }, [map, directions])

  return null
}

export function GoogleMap({ height = "400px", ...props }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <div className="text-center p-4">
          <p className="text-sm text-destructive">Google Maps API key ikke konfigureret</p>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey} language="da" region="DK">
      <Map
        defaultCenter={{ lat: 55.6761, lng: 12.5683 }}
        defaultZoom={7}
        style={{ height, width: "100%", borderRadius: "0.5rem" }}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        gestureHandling="greedy"
      >
        <MapContent {...props} />
      </Map>
    </APIProvider>
  )
}
