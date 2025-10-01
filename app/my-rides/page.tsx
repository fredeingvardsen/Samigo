import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RideRequestActions } from "@/components/ride-request-actions"

export default async function MyRidesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user's rides
  const { data: rides } = await supabase
    .from("rides")
    .select("*")
    .eq("driver_id", user.id)
    .order("departure_time", { ascending: true })

  // Get ride requests for user's rides
  const { data: requests } = await supabase
    .from("ride_requests")
    .select(`
      *,
      passenger:profiles!ride_requests_passenger_id_fkey(full_name, phone, school_name),
      ride:rides!ride_requests_ride_id_fkey(departure_location, destination, departure_time)
    `)
    .in("ride_id", rides?.map((ride) => ride.id) || [])
    .order("created_at", { ascending: false })

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("da-DK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mine ture</h1>
              <p className="text-muted-foreground">Oversigt over dine tilbudte ture og anmodninger</p>
            </div>
            <Button asChild>
              <Link href="/offer-ride">Tilbyd ny tur</Link>
            </Button>
          </div>

          {/* Rides */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Dine tilbudte ture</h2>
              {rides && rides.length > 0 ? (
                <div className="grid gap-4">
                  {rides.map((ride) => (
                    <Card key={ride.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {ride.departure_location} → {ride.destination}
                            </CardTitle>
                            <CardDescription>{formatDateTime(ride.departure_time)}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(ride.status)}>
                            {ride.status === "active" && "Aktiv"}
                            {ride.status === "cancelled" && "Aflyst"}
                            {ride.status === "completed" && "Gennemført"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Ledige pladser:</span> {ride.available_seats}
                          </div>
                          <div>
                            <span className="font-medium">Pris:</span>{" "}
                            {ride.price_per_seat ? `${ride.price_per_seat} DKK` : "Gratis"}
                          </div>
                          <div>
                            <span className="font-medium">Anmodninger:</span>{" "}
                            {requests?.filter((req) => req.ride_id === ride.id).length || 0}
                          </div>
                        </div>
                        {ride.pickup_spots && ride.pickup_spots.length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Afhentningssteder:</span> {ride.pickup_spots.join(", ")}
                          </div>
                        )}
                        {ride.description && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Beskrivelse:</span> {ride.description}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Du har ikke tilbudt nogen ture endnu.</p>
                    <Button asChild>
                      <Link href="/offer-ride">Tilbyd din første tur</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ride Requests */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Anmodninger til dine ture</h2>
              {requests && requests.length > 0 ? (
                <div className="grid gap-4">
                  {requests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{request.passenger?.full_name || "Ukendt bruger"}</CardTitle>
                            <CardDescription>
                              {request.ride?.departure_location} → {request.ride?.destination}
                              <br />
                              {request.ride?.departure_time && formatDateTime(request.ride.departure_time)}
                            </CardDescription>
                          </div>
                          <Badge className={getRequestStatusColor(request.status)}>
                            {request.status === "pending" && "Afventer"}
                            {request.status === "accepted" && "Accepteret"}
                            {request.status === "rejected" && "Afvist"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Afhentningssted:</span> {request.pickup_location}
                            </div>
                            <div>
                              <span className="font-medium">Antal pladser:</span> {request.seats_requested}
                            </div>
                            <div>
                              <span className="font-medium">Efterskole:</span>{" "}
                              {request.passenger?.school_name || "Ikke angivet"}
                            </div>
                            <div>
                              <span className="font-medium">Anmodet:</span>{" "}
                              {new Date(request.created_at).toLocaleDateString("da-DK")}
                            </div>
                          </div>

                          {request.message && (
                            <div className="text-sm">
                              <span className="font-medium">Besked fra passager:</span>
                              <p className="mt-1 p-3 bg-muted/50 rounded-md">{request.message}</p>
                            </div>
                          )}

                          {request.status === "accepted" && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 text-green-800 mb-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="font-medium">Anmodning accepteret</span>
                              </div>
                              <div className="text-sm text-green-700 space-y-2">
                                <div>
                                  <span className="font-medium">Passager kontakt:</span>
                                </div>
                                <div className="bg-white/50 p-3 rounded border">
                                  <div>
                                    <strong>Navn:</strong> {request.passenger?.full_name}
                                  </div>
                                  {request.passenger?.phone && (
                                    <div>
                                      <strong>Telefon:</strong> {request.passenger.phone}
                                    </div>
                                  )}
                                  <div>
                                    <strong>Efterskole:</strong> {request.passenger?.school_name}
                                  </div>
                                </div>
                                <p className="text-xs mt-2 text-green-600">
                                  Kontakt passageren for at koordinere afhentning og andre detaljer.
                                </p>
                              </div>
                            </div>
                          )}

                          {request.status === "pending" && <RideRequestActions requestId={request.id} />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Du har ingen anmodninger endnu.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
