import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-balance mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Samigo
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto mb-8">
            Nem samkørsel til og fra danske efterskoler. Spar penge, mød nye venner og hjælp miljøet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/signup">Kom i gang</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/auth/login">Log ind</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <CardTitle>Find ture</CardTitle>
              <CardDescription>Søg efter ledige pladser i biler der kører til din efterskole</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <CardTitle>Tilbyd ture</CardTitle>
              <CardDescription>Del din bil og tjen lidt ekstra ved at køre andre elever</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <CardTitle>Trygt og sikkert</CardTitle>
              <CardDescription>Kun for efterskoleelever med verificerede profiler</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Sådan fungerer det</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Opret profil</h3>
              <p className="text-muted-foreground text-sm">Tilmeld dig med din email og efterskole information</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Find eller tilbyd ture</h3>
              <p className="text-muted-foreground text-sm">Søg efter ture eller opret din egen</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Kør sammen</h3>
              <p className="text-muted-foreground text-sm">Mød op og nyd turen sammen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
