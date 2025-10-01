import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function MyRequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user's ride requests
  const { data: requests } = await supabase
    .from("ride_requests")
    .select(`
      *,
      ride:rides!ride_requests_ride_id_fkey(
        departure_location,
        destination,
        departure_time,
        price_per_seat,
        driver:profiles!rides_driver_id_fkey(full_name, phone, school_name)
      )
    `)
    .eq("passenger_id", user.id)
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
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
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
              <h1 className="text-3xl font-bold mb-2">Mine anmodninger</h1>
              <p className="text-muted-foreground">Oversigt over ture du har anmodet om at deltage i</p>
            </div>
            <Button asChild>
              <Link href="/find-ride">Find flere ture</Link>
            </Button>
          </div>

          {requests && requests.length > 0 ? (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {request.ride?.departure_location} → {request.ride?.destination}
                        </CardTitle>
                        <CardDescription>
                          {request.ride?.departure_time && formatDateTime(request.ride.departure_time)}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status === "pending" && "Afventer svar"}
                        {request.status === "accepted" && "Accepteret"}
                        {request.status === "rejected" && "Afvist"}
                        {request.status === "cancelled" && "Aflyst"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Afhentningssted:</span> {request.pickup_location}
                        </div>
                        <div>
                          <span className="font-medium">Antal pladser:</span> {request.seats_requested}
                        </div>
                        <div>
                          <span className="font-medium">Pris:</span>{" "}
                          {request.ride?.price_per_seat
                            ? `${request.ride.price_per_seat * request.seats_requested} DKK`
                            : "Gratis"}
                        </div>
                      </div>

                      {request.message && (
                        <div className="text-sm">
                          <span className="font-medium">Din besked:</span> {request.message}
                        </div>
                      )}

                      <div className="text-sm">
                        <span className="font-medium">Chauffør:</span> {request.ride?.driver?.full_name || "Ukendt"}
                        {request.ride?.driver?.school_name && (
                          <span className="text-muted-foreground"> • {request.ride.driver.school_name}</span>
                        )}
                      </div>

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
                            <span className="font-medium">Din anmodning er accepteret!</span>
                          </div>
                          <div className="text-sm text-green-700 space-y-2">
                            <div>
                              <span className="font-medium">Chauffør kontakt:</span>
                            </div>
                            <div className="bg-white/50 p-3 rounded border">
                              <div>
                                <strong>Navn:</strong> {request.ride?.driver?.full_name}
                              </div>
                              {request.ride?.driver?.phone && (
                                <div>
                                  <strong>Telefon:</strong> {request.ride.driver.phone}
                                </div>
                              )}
                              <div>
                                <strong>Efterskole:</strong> {request.ride?.driver?.school_name}
                              </div>
                            </div>
                            <p className="text-xs mt-2 text-green-600">
                              Kontakt chaufføren for at koordinere afhentning. Husk at møde op til tiden!
                            </p>
                          </div>
                        </div>
                      )}

                      {request.status === "rejected" && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 text-red-800 mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="font-medium">Din anmodning blev afvist</span>
                          </div>
                          <div className="text-sm text-red-700">
                            <p>Chaufføren kunne desværre ikke tage dig med på denne tur.</p>
                            <p className="mt-1">Prøv at søge efter andre ture eller tilbyd din egen!</p>
                          </div>
                        </div>
                      )}
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
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Ingen anmodninger endnu</h3>
                <p className="text-muted-foreground mb-6">Du har ikke anmodet om at deltage i nogen ture endnu.</p>
                <Button asChild>
                  <Link href="/find-ride">Find din første tur</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
