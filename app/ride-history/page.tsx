import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function RideHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get rides where user was the driver (past rides only)
  const { data: driverRides } = await supabase
    .from("rides")
    .select("*, profiles!rides_driver_id_fkey(full_name, phone)")
    .eq("driver_id", user.id)
    .lt("departure_time", new Date().toISOString())
    .order("departure_time", { ascending: false })

  // Get ride requests where user was a passenger and request was accepted
  const { data: passengerRequests } = await supabase
    .from("ride_requests")
    .select("*, rides(*, profiles!rides_driver_id_fkey(full_name, phone))")
    .eq("passenger_id", user.id)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })

  // Filter passenger rides to only show past rides
  const passengerRides = passengerRequests?.filter(
    (request) => request.rides && new Date(request.rides.departure_time) < new Date(),
  )

  const allRides = [
    ...(driverRides?.map((ride) => ({ ...ride, role: "driver" as const })) || []),
    ...(passengerRides?.map((request) => ({ ...request.rides, role: "passenger" as const, request })) || []),
  ].sort((a, b) => new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime())

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tur historik</h1>
            <p className="text-muted-foreground">Se alle dine tidligere ture</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Tilbage til dashboard</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total ture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allRides.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Som chauffør</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{driverRides?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Som passager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{passengerRides?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Ride History List */}
        <Card>
          <CardHeader>
            <CardTitle>Alle ture</CardTitle>
            <CardDescription>Kronologisk oversigt over dine gennemførte ture</CardDescription>
          </CardHeader>
          <CardContent>
            {allRides.length > 0 ? (
              <div className="space-y-4">
                {allRides.map((ride) => (
                  <div key={ride.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {ride.departure_location} → {ride.destination}
                          </h3>
                          <Badge variant={ride.role === "driver" ? "default" : "secondary"}>
                            {ride.role === "driver" ? "Chauffør" : "Passager"}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>
                              {new Date(ride.departure_time).toLocaleDateString("da-DK", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {new Date(ride.departure_time).toLocaleTimeString("da-DK", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">{ride.price_per_seat} kr</p>
                        <p className="text-xs text-muted-foreground">per plads</p>
                      </div>
                    </div>

                    {ride.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ride.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
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
                          <span className="text-muted-foreground">{ride.available_seats} pladser</span>
                        </div>
                        {ride.role === "passenger" && ride.request && (
                          <div className="flex items-center gap-1">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-muted-foreground">
                              {ride.request.seats_requested} plads(er) booket
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {ride.status === "completed" ? "Gennemført" : "Afsluttet"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Ingen tur historik endnu</h3>
                <p className="text-muted-foreground mb-6">
                  Du har ikke gennemført nogen ture endnu. Start med at tilbyde eller finde en tur!
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/offer-ride">Tilbyd en tur</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/find-ride">Find en tur</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
