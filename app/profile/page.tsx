import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, efterskoler(id, name, city)")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-6 py-8">
        <ProfileForm profile={profile} />
      </main>
    </div>
  )
}
