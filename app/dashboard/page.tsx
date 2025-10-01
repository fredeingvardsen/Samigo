import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's recent rides
  const { data: userRides } = await supabase
    .from("rides")
    .select("*")
    .eq("driver_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  // Get pending requests count
  const { count: pendingRequestsCount } = await supabase
    .from("ride_requests")
    .select("*", { count: "exact", head: true })
    .in("ride_id", userRides?.map((ride) => ride.id) || [])
    .eq("status", "pending")

  // Get user's ride requests
  const { count: userRequestsCount } = await supabase
    .from("ride_requests")
    .select("*", { count: "exact", head: true })
    .eq("passenger_id", user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Velkommen, {profile?.full_name || "Bruger"}!</h1>
            <p className="text-muted-foreground">Hvad vil du gerne gøre i dag?</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/profile">Min profil</Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">
                Log ud
              </Button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <CardTitle>Tilbyd en tur</CardTitle>
              <CardDescription>Har du plads i bilen? Tilbyd en tur til andre elever</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/offer-ride">Opret tur</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <CardTitle>Find en tur</CardTitle>
              <CardDescription>Søg efter ledige pladser til din destination</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/find-ride">Søg ture</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mine ture</CardTitle>
              <CardDescription>Se og administrer dine tilbudte ture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {userRides?.length ? `${userRides.length} aktive ture` : "Ingen aktive ture"}
                  {pendingRequestsCount && pendingRequestsCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      {pendingRequestsCount} nye anmodninger
                    </span>
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/my-rides">Se alle</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mine anmodninger</CardTitle>
              <CardDescription>Ture du har anmodet om at deltage i</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">{userRequestsCount || 0} anmodninger</div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/my-requests">Se alle</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ride History card */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tur historik</CardTitle>
              <CardDescription>Se alle dine tidligere ture som chauffør og passager</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/ride-history">Se tur historik</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Seneste aktivitet</CardTitle>
            <CardDescription>Oversigt over dine seneste ture og anmodninger</CardDescription>
          </CardHeader>
          <CardContent>
            {userRides && userRides.length > 0 ? (
              <div className="space-y-4">
                {userRides.map((ride) => (
                  <div key={ride.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {ride.departure_location} → {ride.destination}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ride.departure_time).toLocaleDateString("da-DK")}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">{ride.available_seats} pladser</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Du har ingen ture endnu.</p>
                <p className="text-sm mt-2">Opret eller find din første tur for at komme i gang!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
