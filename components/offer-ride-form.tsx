"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GoogleLocationSearch } from "@/components/map/google-location-search"
import { GoogleMap } from "@/components/map/google-map"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function OfferRideForm() {
  const [direction, setDirection] = useState<"to_school" | "from_school">("to_school")
  const [userProfile, setUserProfile] = useState<{
    school_id: string | null
    school_name: string | null
    home_address: string | null
    home_lat: number | null
    home_lng: number | null
  } | null>(null)

  const [formData, setFormData] = useState({
    departureLocation: "",
    destination: "",
    departureTime: "",
    availableSeats: "",
    pricePerSeat: "",
    pickupSpots: "",
    description: "",
  })
  const [selectedLocations, setSelectedLocations] = useState<{
    departure?: { name: string; lat: number; lng: number; address: string }
    destination?: { name: string; lat: number; lng: number; address: string }
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const router = useRouter()

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

          if (direction === "to_school" && profile.home_address) {
            setFormData((prev) => ({ ...prev, departureLocation: profile.home_address || "" }))
            if (profile.home_lat && profile.home_lng) {
              setSelectedLocations((prev) => ({
                ...prev,
                departure: {
                  name: profile.home_address || "",
                  lat: profile.home_lat!,
                  lng: profile.home_lng!,
                  address: profile.home_address || "",
                },
              }))
            }
          }
        }
      }
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    if (!userProfile) return

    if (direction === "to_school") {
      if (userProfile.home_address) {
        setFormData((prev) => ({ ...prev, departureLocation: userProfile.home_address || "" }))
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
        setFormData((prev) => ({ ...prev, destination: userProfile.school_name || "" }))
      }
    } else {
      if (userProfile.school_name) {
        setFormData((prev) => ({ ...prev, departureLocation: userProfile.school_name || "" }))
      }
      if (userProfile.home_address) {
        setFormData((prev) => ({ ...prev, destination: userProfile.home_address || "" }))
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationChange = (field: "departureLocation" | "destination", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLocationSelect =
    (field: "departure" | "destination") => (location: { name: string; lat: number; lng: number; address: string }) => {
      setSelectedLocations((prev) => ({ ...prev, [field]: location }))
      setFormData((prev) => ({
        ...prev,
        [field === "departure" ? "departureLocation" : "destination"]: location.name,
      }))

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Du skal være logget ind")

      const pickupSpotsArray = formData.pickupSpots
        .split(",")
        .map((spot) => spot.trim())
        .filter((spot) => spot.length > 0)

      const rideData = {
        driver_id: user.id,
        departure_location: formData.departureLocation,
        destination: formData.destination,
        departure_time: new Date(formData.departureTime).toISOString(),
        available_seats: Number.parseInt(formData.availableSeats),
        price_per_seat: formData.pricePerSeat ? Number.parseFloat(formData.pricePerSeat) : null,
        pickup_spots: pickupSpotsArray,
        description: formData.description || null,
        departure_lat: selectedLocations.departure?.lat || null,
        departure_lng: selectedLocations.departure?.lng || null,
        destination_lat: selectedLocations.destination?.lat || null,
        destination_lng: selectedLocations.destination?.lng || null,
      }

      const { error } = await supabase.from("rides").insert(rideData)

      if (error) throw error

      router.push("/dashboard?success=ride-created")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Der opstod en fejl")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tur detaljer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Retning</Label>
              <RadioGroup
                value={direction}
                onValueChange={(value) => setDirection(value as "to_school" | "from_school")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="to_school" id="to_school" />
                  <Label htmlFor="to_school" className="font-normal cursor-pointer">
                    Til skole (Hjem → {userProfile?.school_name || "Efterskole"})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="from_school" id="from_school" />
                  <Label htmlFor="from_school" className="font-normal cursor-pointer">
                    Fra skole ({userProfile?.school_name || "Efterskole"} → Hjem)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departureLocation">
                  Afgangssted * {direction === "to_school" && userProfile?.home_address && "(Gemt hjemmeadresse)"}
                </Label>
                <GoogleLocationSearch
                  value={formData.departureLocation}
                  onChange={(value) => handleLocationChange("departureLocation", value)}
                  onLocationSelect={handleLocationSelect("departure")}
                  placeholder={
                    direction === "to_school" ? "Din hjemmeadresse" : userProfile?.school_name || "F.eks. København H"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">
                  Destination * {direction === "from_school" && userProfile?.home_address && "(Gemt hjemmeadresse)"}
                </Label>
                <GoogleLocationSearch
                  value={formData.destination}
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
              <div className="flex items-center justify-between">
                <Label>Vis på kort</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
                  {showMap ? "Skjul kort" : "Vis kort"}
                </Button>
              </div>

              {showMap && (
                <GoogleMap
                  height="300px"
                  rideRoute={
                    selectedLocations.departure && selectedLocations.destination
                      ? {
                          start: selectedLocations.departure,
                          end: selectedLocations.destination,
                        }
                      : undefined
                  }
                />
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departureTime">Afgangs tid *</Label>
                <Input
                  id="departureTime"
                  name="departureTime"
                  type="datetime-local"
                  required
                  value={formData.departureTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableSeats">Ledige pladser *</Label>
                <Input
                  id="availableSeats"
                  name="availableSeats"
                  type="number"
                  min="1"
                  max="8"
                  placeholder="F.eks. 3"
                  required
                  value={formData.availableSeats}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerSeat">Pris per plads (DKK) - valgfrit</Label>
              <Input
                id="pricePerSeat"
                name="pricePerSeat"
                type="number"
                min="0"
                step="0.01"
                placeholder="F.eks. 150"
                value={formData.pricePerSeat}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">Lad feltet være tomt hvis turen er gratis</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupSpots">Afhentningssteder</Label>
              <Input
                id="pickupSpots"
                name="pickupSpots"
                placeholder="F.eks. Nørreport Station, Roskilde Station"
                value={formData.pickupSpots}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">
                Adskil flere steder med komma. Dette hjælper passagerer med at finde dig.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse - valgfrit</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="F.eks. Kører direkte til skolen, har plads til bagage..."
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Opretter tur..." : "Opret tur"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuller
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
