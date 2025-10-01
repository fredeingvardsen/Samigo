import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OfferRideForm } from "@/components/offer-ride-form"

export default async function OfferRidePage() {
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Tilbyd en tur</h1>
            <p className="text-muted-foreground">
              Udfyld formularen nedenfor for at tilbyde en tur til andre efterskoleelever
            </p>
          </div>
          <OfferRideForm />
        </div>
      </div>
    </div>
  )
}
