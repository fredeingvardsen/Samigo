import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FindRideSearch } from "@/components/find-ride-search"

export default async function FindRidePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find en tur</h1>
            <p className="text-muted-foreground">
              Søg efter ledige pladser til din destination og vælg den radius du er villig til at køre
            </p>
          </div>
          <FindRideSearch />
        </div>
      </div>
    </div>
  )
}
