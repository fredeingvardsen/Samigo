"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface RideRequestDialogProps {
  rideId: string
  departureLocation: string
  destination: string
  pickupSpots?: string[]
  availableSeats: number
}

export function RideRequestDialog({
  rideId,
  departureLocation,
  destination,
  pickupSpots,
  availableSeats,
}: RideRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    pickupLocation: "",
    seatsRequested: "1",
    message: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Du skal være logget ind")

      // Check for existing requests
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
        setIsLoading(false)
        return
      }

      const { error } = await supabase.from("ride_requests").insert({
        ride_id: rideId,
        passenger_id: user.id,
        pickup_location: formData.pickupLocation || departureLocation,
        seats_requested: Number.parseInt(formData.seatsRequested),
        message: formData.message || "Hej! Jeg vil gerne med på denne tur.",
      })

      if (error) throw error

      setOpen(false)
      alert("Din anmodning er sendt til chaufføren! Du kan følge status under 'Mine anmodninger'.")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error requesting ride:", error)
      alert("Der opstod en fejl ved afsendelse af anmodningen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Anmod om plads</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Anmod om plads</DialogTitle>
            <DialogDescription>
              {departureLocation} → {destination}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Afhentningssted</Label>
              {pickupSpots && pickupSpots.length > 0 ? (
                <Select
                  value={formData.pickupLocation}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, pickupLocation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg afhentningssted" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickupSpots.map((spot, index) => (
                      <SelectItem key={index} value={spot}>
                        {spot}
                      </SelectItem>
                    ))}
                    <SelectItem value={departureLocation}>Andet sted (skriv i besked)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{departureLocation}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seatsRequested">Antal pladser</Label>
              <Select
                value={formData.seatsRequested}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, seatsRequested: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.min(availableSeats, 4) }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? "plads" : "pladser"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Besked til chaufføren (valgfrit)</Label>
              <Textarea
                id="message"
                placeholder="F.eks. Jeg har meget bagage, kan du have plads til det?"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium mb-1">Hvad sker der nu?</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Din anmodning sendes til chaufføren</li>
                    <li>Chaufføren kan acceptere eller afvise din anmodning</li>
                    <li>Hvis accepteret, får du chaufførens kontaktoplysninger</li>
                    <li>I kan koordinere afhentning og andre detaljer</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Annuller
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sender..." : "Send anmodning"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
