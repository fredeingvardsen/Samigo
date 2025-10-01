import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, efterskoler(name, city)")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Carpooling Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/profile">Profile</Link>
            </Button>
            <form action="/auth/logout" method="post">
              <Button type="submit" variant="outline">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">Welcome, {profile?.full_name}!</h2>
          <p className="text-muted-foreground">
            Your school: {profile?.efterskoler?.name} - {profile?.efterskoler?.city}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Offer a Ride</CardTitle>
              <CardDescription>Share your journey and help other students</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/rides/create">Create Ride</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Find a Ride</CardTitle>
              <CardDescription>Search for available rides to your destination</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/rides/search">Search Rides</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
