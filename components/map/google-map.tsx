"use client"

import { loadGoogleMapsAPI } from "@/lib/google-maps-loader"
import { getAllEfterskoler, type Efterskole } from "@/lib/efterskoler-service"
import { useEffect, useRef, useState } from "react"

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

export function GoogleMap({
  height = "400px",
  selectedLocation,
  rides,
  showRadius,
  rideRoute,
  showEfterskoler = false,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markersRef = useRef<any[]>([])
  const circleRef = useRef<any | null>(null)
  const directionsRendererRef = useRef<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [efterskoler, setEfterskoler] = useState<Efterskole[]>([])

  useEffect(() => {
    if (showEfterskoler) {
      getAllEfterskoler().then(setEfterskoler)
    }
  }, [showEfterskoler])

  // Initialize map
  useEffect(() => {
    let mounted = true

    async function initMap() {
      try {
        await loadGoogleMapsAPI()

        if (!mounted || !mapRef.current) return

        // Create map centered on Denmark
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 55.6761, lng: 12.5683 }, // Copenhagen
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        mapInstanceRef.current = map
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Failed to initialize map:", err)
        setError("Kunne ikke indlæse kortet")
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      mounted = false
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
      if (circleRef.current) {
        circleRef.current.setMap(null)
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
    }
  }, [])

  // Update map with selected location
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return

    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Add marker for selected location
    const marker = new window.google.maps.Marker({
      position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
      map,
      title: selectedLocation.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    })

    markersRef.current.push(marker)

    // Center map on location
    map.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng })
    map.setZoom(12)
  }, [selectedLocation])

  // Update radius circle
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove existing circle
    if (circleRef.current) {
      circleRef.current.setMap(null)
      circleRef.current = null
    }

    if (showRadius) {
      const circle = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: showRadius.center,
        radius: showRadius.radiusKm * 1000, // Convert km to meters
        fillColor: "#4285F4",
        fillOpacity: 0.15,
        strokeColor: "#4285F4",
        strokeOpacity: 0.5,
        strokeWeight: 2,
      })

      circleRef.current = circle

      // Fit map to circle bounds
      mapInstanceRef.current.fitBounds(circle.getBounds()!)
    }
  }, [showRadius])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear existing markers (except selected location)
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const bounds = new window.google.maps.LatLngBounds()
    let hasMarkers = false

    // Add markers for efterskoler
    if (showEfterskoler && efterskoler.length > 0) {
      efterskoler.forEach((efterskole) => {
        if (efterskole.latitude && efterskole.longitude) {
          const marker = new window.google.maps.Marker({
            position: { lat: efterskole.latitude, lng: efterskole.longitude },
            map,
            title: efterskole.name,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" strokeWidth="2"/>
                  <text x="16" y="21" fontSize="16" textAnchor="middle" fill="white">🏫</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16),
            },
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <strong style="font-size: 14px;">${efterskole.name}</strong><br/>
                <span style="color: #666; font-size: 12px;">${efterskole.city}, ${efterskole.region || ""}</span><br/>
                <span style="color: #888; font-size: 11px;">${efterskole.address}</span>
              </div>
            `,
          })

          marker.addListener("click", () => {
            infoWindow.open(map, marker)
          })

          markersRef.current.push(marker)
          bounds.extend(marker.getPosition()!)
          hasMarkers = true
        }
      })
    }

    // Add markers for each ride
    if (rides && rides.length > 0) {
      rides.forEach((ride) => {
        if (ride.location_lat && ride.location_lng) {
          // Departure marker
          const departureMarker = new window.google.maps.Marker({
            position: { lat: ride.location_lat, lng: ride.location_lng },
            map,
            title: `Afgang: ${ride.location}`,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                  <text x="16" y="21" fontSize="16" textAnchor="middle" fill="white">🚗</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16),
            },
          })

          const departureInfo = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <strong style="font-size: 14px;">Afgang: ${ride.location}</strong><br/>
                <span style="color: #666; font-size: 12px;">Destination: ${ride.destination}</span><br/>
                <span style="color: #3b82f6; font-size: 12px; font-weight: 500;">${ride.available_seats} ledige pladser</span>
              </div>
            `,
          })

          departureMarker.addListener("click", () => {
            departureInfo.open(map, departureMarker)
          })

          markersRef.current.push(departureMarker)
          bounds.extend(departureMarker.getPosition()!)
          hasMarkers = true

          // Destination marker
          if (ride.destination_lat && ride.destination_lng) {
            const destinationMarker = new window.google.maps.Marker({
              position: { lat: ride.destination_lat, lng: ride.destination_lng },
              map,
              title: `Destination: ${ride.destination}`,
              icon: {
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="white" strokeWidth="2"/>
                    <text x="16" y="21" fontSize="16" textAnchor="middle" fill="white">📍</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16),
              },
            })

            const destinationInfo = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px;">
                  <strong style="font-size: 14px;">Destination: ${ride.destination}</strong>
                </div>
              `,
            })

            destinationMarker.addListener("click", () => {
              destinationInfo.open(map, destinationMarker)
            })

            markersRef.current.push(destinationMarker)
            bounds.extend(destinationMarker.getPosition()!)
          }
        }
      })
    }

    // Fit map to show all markers if we have any
    if (hasMarkers && !showRadius) {
      map.fitBounds(bounds)
      // Prevent zooming in too much for single markers
      const listener = window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom()! > 15) {
          map.setZoom(15)
        }
      })
    }
  }, [rides, efterskoler, showEfterskoler, showRadius])

  // Update route
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove existing route
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }

    if (rideRoute) {
      const directionsService = new window.google.maps.DirectionsService()
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#3b82f6",
          strokeWeight: 4,
          strokeOpacity: 0.7,
        },
      })

      directionsRendererRef.current = directionsRenderer

      directionsService.route(
        {
          origin: rideRoute.start,
          destination: rideRoute.end,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRenderer.setDirections(result)
          } else {
            console.error("[v0] Directions request failed:", status)
          }
        },
      )
    }
  }, [rideRoute])

  if (error) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <div className="text-center p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Indlæser kort...</p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-lg" />
}
