"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

interface RideCreationFormProps {
  profile: {
    id: string
    efterskoler?: {
      id: string
      name: string
      city: string
      latitude: number
      longitude: number
    }
  } | null
}

const PICKUP_OPTIONS = [
  { id: "along-route", label: "Along the route" },
  { id: "highway-stops", label: "At highway pickup points" },
  { id: "train-station", label: "At train/bus stations" },
  { id: "school-location", label: "At the school" },
  { id: "flexible", label: "Flexible - we'll arrange pickup details later" },
]

export function RideCreationForm({ profile }: RideCreationFormProps) {
  const [destination, setDestination] = useState("")
  const [departureTime, setDepartureTime] = useState("")
  const [availableSeats, setAvailableSeats] = useState("3")
  const [pricePerSeat, setPricePerSeat] = useState("")
  const [description, setDescription] = useState("")
  const [pickupSpots, setPickupSpots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handlePickupToggle = (optionId: string) => {
    setPickupSpots((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (pickupSpots.length === 0) {
      setError("Please select at least one pickup option")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const schoolName = profile?.efterskoler?.name || "Your School"
    const schoolCity = profile?.efterskoler?.city || ""

    const { error: insertError } = await supabase.from("rides").insert({
      driver_id: profile?.id,
      departure_location: `${schoolName}, ${schoolCity}`,
      departure_lat: profile?.efterskoler?.latitude,
      departure_lng: profile?.efterskoler?.longitude,
      destination: destination,
      departure_time: departureTime,
      available_seats: Number.parseInt(availableSeats),
      price_per_seat: Number.parseFloat(pricePerSeat),
      description: description,
      pickup_spots: pickupSpots,
      status: "active",
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offer a Ride</CardTitle>
        <CardDescription>Share your journey from {profile?.efterskoler?.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="departure">Departure From</Label>
            <Input
              id="departure"
              value={`${profile?.efterskoler?.name}, ${profile?.efterskoler?.city}`}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-muted-foreground">Your school is automatically set as the departure location</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              type="text"
              placeholder="Copenhagen, Denmark"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="departure-time">Departure Time</Label>
            <Input
              id="departure-time"
              type="datetime-local"
              required
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label>Pickup Locations</Label>
            <p className="text-sm text-muted-foreground">Select where passengers can join the ride</p>
            <div className="space-y-3">
              {PICKUP_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={pickupSpots.includes(option.id)}
                    onCheckedChange={() => handlePickupToggle(option.id)}
                  />
                  <Label htmlFor={option.id} className="cursor-pointer font-normal leading-relaxed">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="seats">Available Seats</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="8"
                required
                value={availableSeats}
                onChange={(e) => setAvailableSeats(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price per Seat (DKK)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={pricePerSeat}
                onChange={(e) => setPricePerSeat(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="Any additional information about the ride..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Ride..." : "Create Ride"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
