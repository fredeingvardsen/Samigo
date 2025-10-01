import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="w-full max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold text-balance text-gray-900">Carpooling for Efterskole Students</h1>
        <p className="mb-8 text-xl text-pretty text-gray-600">
          Connect with other students traveling to and from your efterskole. Share rides, save money, and make friends
          along the way.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
