"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { GoogleLocationSearch } from "@/components/map/google-location-search"
import { GoogleMap } from "@/components/map/google-map"
import { RideRequestDialog } from "@/components/ride-request-dialog"
import { calculateDistance } from "@/lib/google-maps-utils"
import { getGoogleMapsApiKey } from "@/lib/actions/get-maps-key"
import { useState, useEffect } from "react"

interface Ride {
  id: string
  departure_location: string
  destination: string
  departure_time: string
  available_seats: number
  price_per_seat: number | null
  pickup_spots: string[] | null
  description: string | null
  departure_lat: number | null
  departure_lng: number | null
  destination_lat: number | null
  destination_lng: number | null
  driver: {
    full_name: string
    school_name: string
  }
}

export function FindRideSearch() {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("")
  const [direction, setDirection] = useState<"to_school" | "from_school">("to_school")
  const [userProfile, setUserProfile] = useState<{
    school_id: string | null
    school_name: string | null
    home_address: string | null
    home_lat: number | null
    home_lng: number | null
  } | null>(null)

  const [searchData, setSearchData] = useState({
    departure: "",
    destination: "",
    radius: "10",
  })
  const [selectedLocations, setSelectedLocations] = useState<{
    departure?: { name: string; lat: number; lng: number; address: string }
    destination?: { name: string; lat: number; lng: number; address: string }
  }>({})
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    getGoogleMapsApiKey().then(setGoogleMapsApiKey)
  }, [])

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("school_id, school_name, home_address, home_lat, home_lng")
          .eq("id", user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }
      }
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    if (!userProfile) return

    if (direction === "to_school") {
      if (userProfile.home_address) {
        setSearchData((prev) => ({ ...prev, departure: userProfile.home_address || "" }))
        if (userProfile.home_lat && userProfile.home_lng) {
          setSelectedLocations((prev) => ({
            ...prev,
            departure: {
              name: userProfile.home_address || "",
              lat: userProfile.home_lat!,
              lng: userProfile.home_lng!,
              address: userProfile.home_address || "",
            },
          }))
        }
      }
      if (userProfile.school_name) {
        setSearchData((prev) => ({ ...prev, destination: userProfile.school_name || "" }))
      }
    } else {
      if (userProfile.school_name) {
        setSearchData((prev) => ({ ...prev, departure: userProfile.school_name || "" }))
      }
      if (userProfile.home_address) {
        setSearchData((prev) => ({ ...prev, destination: userProfile.home_address || "" }))
        if (userProfile.home_lat && userProfile.home_lng) {
          setSelectedLocations((prev) => ({
            ...prev,
            destination: {
              name: userProfile.home_address || "",
              lat: userProfile.home_lat!,
              lng: userProfile.home_lng!,
              address: userProfile.home_address || "",
            },
          }))
        }
      }
    }
  }, [direction, userProfile])

  const handleLocationChange = (field: "departure" | "destination", value: string) => {
    setSearchData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLocationSelect =
    (field: "departure" | "destination") => (location: { name: string; lat: number; lng: number; address: string }) => {
      setSelectedLocations((prev) => ({ ...prev, [field]: location }))
      setSearchData((prev) => ({ ...prev, [field]: location.name }))

      if (field === "departure" && direction === "to_school") {
        saveHomeAddress(location)
      }
      if (field === "destination" && direction === "from_school") {
        saveHomeAddress(location)
      }
    }

  const saveHomeAddress = async (location: { name: string; lat: number; lng: number; address: string }) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from("profiles")
        .update({
          home_address: location.address,
          home_lat: location.lat,
          home_lng: location.lng,
        })
        .eq("id", user.id)

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              home_address: location.address,
              home_lat: location.lat,
              home_lng: location.lng,
            }
          : null,
      )
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setSearchData((prev) => ({ ...prev, [name]: value }))
  }

  const searchRides = async () => {
    if (!searchData.departure || !searchData.destination) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("rides")
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey(full_name, school_name)
        `)
        .eq("status", "active")
        .gte("departure_time", new Date().toISOString())
        .order("departure_time", { ascending: true })

      if (error) throw error

      let filteredRides = data || []

      if (selectedLocations.departure && selectedLocations.destination) {
        const radiusKm = Number.parseInt(searchData.radius)

        filteredRides = filteredRides.filter((ride) => {
          const departureMatch =
            ride.departure_lat && ride.departure_lng
              ? calculateDistance(
                  selectedLocations.departure!.lat,
                  selectedLocations.departure!.lng,
                  ride.departure_lat,
                  ride.departure_lng,
                ) <= radiusKm
              : false

          const destinationMatch =
            ride.destination_lat && ride.destination_lng
              ? calculateDistance(
                  selectedLocations.destination!.lat,
                  selectedLocations.destination!.lng,
                  ride.destination_lat,
                  ride.destination_lng,
                ) <= radiusKm
              : false

          const textMatch =
            ride.departure_location.toLowerCase().includes(searchData.departure.toLowerCase()) &&
            ride.destination.toLowerCase().includes(searchData.destination.toLowerCase())

          return (departureMatch && destinationMatch) || textMatch
        })
      } else {
        filteredRides = filteredRides.filter(
          (ride) =>
            ride.departure_location.toLowerCase().includes(searchData.departure.toLowerCase()) &&
            ride.destination.toLowerCase().includes(searchData.destination.toLowerCase()),
        )
      }

      setRides(filteredRides)
      setHasSearched(true)
    } catch (error) {
      console.error("[v0] Error searching rides:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchRides()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("da-DK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const requestRide = async (rideId: string) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Du skal være logget ind")

      const ride = rides.find((r) => r.id === rideId)
      if (!ride) return

      const { data: existingRequest } = await supabase
        .from("ride_requests")
        .select("id, status")
        .eq("ride_id", rideId)
        .eq("passenger_id", user.id)
        .in("status", ["pending", "accepted"])
        .single()

      if (existingRequest) {
        if (existingRequest.status === "accepted") {
          alert("Du har allerede en accepteret anmodning for denne tur!")
        } else {
          alert("Du har allerede en afventende anmodning for denne tur!")
        }
        return
      }

      const { error } = await supabase.from("ride_requests").insert({
        ride_id: rideId,
        passenger_id: user.id,
        pickup_location: ride.departure_location,
        seats_requested: 1,
        message: "Hej! Jeg vil gerne med på denne tur.",
      })

      if (error) throw error

      alert("Din anmodning er sendt til chaufføren! Du kan følge status under 'Mine anmodninger'.")
      searchRides()
    } catch (error) {
      console.error("[v0] Error requesting ride:", error)
      alert("Der opstod en fejl ved afsendelse af anmodningen")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Søg efter ture</CardTitle>
          <CardDescription>Indtast dit afgangssted og destination for at finde ledige ture</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-3">
              <Label>Retning</Label>
              <RadioGroup
                value={direction}
                onValueChange={(value) => setDirection(value as "to_school" | "from_school")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="to_school" id="search_to_school" />
                  <Label htmlFor="search_to_school" className="font-normal cursor-pointer">
                    Til skole (Hjem → {userProfile?.school_name || "Efterskole"})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="from_school" id="search_from_school" />
                  <Label htmlFor="search_from_school" className="font-normal cursor-pointer">
                    Fra skole ({userProfile?.school_name || "Efterskole"} → Hjem)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure">
                  Fra (afgangssted) {direction === "to_school" && userProfile?.home_address && "(Gemt hjemmeadresse)"}
                </Label>
                <GoogleLocationSearch
                  googleMapsApiKey={googleMapsApiKey}
                  value={searchData.departure}
                  onChange={(value) => handleLocationChange("departure", value)}
                  onLocationSelect={handleLocationSelect("departure")}
                  placeholder={
                    direction === "to_school"
                      ? "Din hjemmeadresse"
                      : userProfile?.school_name || "F.eks. København, Roskilde"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">
                  Til (destination) {direction === "from_school" && userProfile?.home_address && "(Gemt hjemmeadresse)"}
                </Label>
                <GoogleLocationSearch
                  googleMapsApiKey={googleMapsApiKey}
                  value={searchData.destination}
                  onChange={(value) => handleLocationChange("destination", value)}
                  onLocationSelect={handleLocationSelect("destination")}
                  placeholder={
                    direction === "from_school"
                      ? "Din hjemmeadresse"
                      : userProfile?.school_name || "F.eks. Roskilde Efterskole"
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Søgeradius</Label>
              <Select value={searchData.radius} onValueChange={(value) => handleInputChange("radius", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 km</SelectItem>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="30">30 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Finder ture hvor både afgang og destination er inden for denne radius
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vis søgeområde på kort</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
                  {showMap ? "Skjul kort" : "Vis kort"}
                </Button>
              </div>

              {showMap && (selectedLocations.departure || selectedLocations.destination) && (
                <GoogleMap
                  googleMapsApiKey={googleMapsApiKey}
                  height="300px"
                  selectedLocation={selectedLocations.departure || selectedLocations.destination}
                  showRadius={
                    selectedLocations.departure
                      ? {
                          center: {
                            lat: selectedLocations.departure.lat,
                            lng: selectedLocations.departure.lng,
                          },
                          radiusKm: Number.parseInt(searchData.radius),
                        }
                      : undefined
                  }
                />
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Søger..." : "Søg ture"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched && rides.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ture på kort</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
                {showMap ? "Skjul kort" : "Vis kort"}
              </Button>
            </div>
          </CardHeader>
          {showMap && (
            <CardContent>
              <GoogleMap
                googleMapsApiKey={googleMapsApiKey}
                height="400px"
                rides={rides.map((ride) => ({
                  id: ride.id,
                  location: ride.departure_location,
                  destination: ride.destination,
                  location_lat: ride.departure_lat || 0,
                  location_lng: ride.departure_lng || 0,
                  destination_lat: ride.destination_lat || 0,
                  destination_lng: ride.destination_lng || 0,
                  available_seats: ride.available_seats,
                }))}
                showEfterskoler={true}
                showRadius={
                  selectedLocations.departure
                    ? {
                        center: {
                          lat: selectedLocations.departure.lat,
                          lng: selectedLocations.departure.lng,
                        },
                        radiusKm: Number.parseInt(searchData.radius),
                      }
                    : undefined
                }
              />
            </CardContent>
          )}
        </Card>
      )}

      {hasSearched && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Søgeresultater ({rides.length} {rides.length === 1 ? "tur" : "ture"} fundet)
          </h2>

          {rides.length > 0 ? (
            <div className="grid gap-4">
              {rides.map((ride) => (
                <Card key={ride.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {ride.departure_location} → {ride.destination}
                        </CardTitle>
                        <CardDescription>
                          {formatDateTime(ride.departure_time)} • {ride.driver.full_name}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {ride.price_per_seat ? `${ride.price_per_seat} DKK` : "Gratis"}
                        </div>
                        <div className="text-sm text-muted-foreground">per plads</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>{ride.available_seats} ledige pladser</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span>{ride.driver.school_name}</span>
                        </div>
                      </div>

                      {ride.pickup_spots && ride.pickup_spots.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Afhentningssteder:</div>
                          <div className="flex flex-wrap gap-2">
                            {ride.pickup_spots.map((spot, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spot}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {ride.description && (
                        <div>
                          <div className="text-sm font-medium mb-1">Beskrivelse:</div>
                          <p className="text-sm text-muted-foreground">{ride.description}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-muted-foreground">Chauffør: {ride.driver.full_name}</div>
                        <RideRequestDialog
                          rideId={ride.id}
                          departureLocation={ride.departure_location}
                          destination={ride.destination}
                          pickupSpots={ride.pickup_spots || undefined}
                          availableSeats={ride.available_seats}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Ingen ture fundet</h3>
                <p className="text-muted-foreground mb-4">
                  Vi kunne ikke finde nogen ture der matcher dine søgekriterier.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Prøv at:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Udvide din søgeradius</li>
                    <li>Ændre dine søgeord</li>
                    <li>Søge på en anden dato</li>
                  </ul>
                </div>
                <Button asChild className="mt-6">
                  <a href="/offer-ride">Tilbyd din egen tur i stedet</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
