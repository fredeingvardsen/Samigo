"use client"

import type React from "react"
import { SchoolAutocomplete } from "@/components/school-autocomplete"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [selectedSchool, setSelectedSchool] = useState<{ id: string; name: string } | null>(null)
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Adgangskoderne matcher ikke")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Adgangskoden skal være mindst 6 tegn")
      setIsLoading(false)
      return
    }

    if (!selectedSchool) {
      setError("Vælg venligst din efterskole fra listen")
      setIsLoading(false)
      return
    }

    try {
      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            school_id: selectedSchool.id,
            school_name: selectedSchool.name,
            phone: phone,
          },
        },
      })
      if (error) throw error
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Der opstod en fejl")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Samigo
          </h1>
          <p className="text-muted-foreground mt-2">Opret din konto</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tilmeld dig</CardTitle>
            <CardDescription>Udfyld formularen for at oprette din konto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Fulde navn</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Dit fulde navn"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@email.dk"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schoolName">Efterskole</Label>
                  <SchoolAutocomplete
                    value={selectedSchool?.name || ""}
                    onSchoolSelect={(school) => setSelectedSchool(school ? { id: school.id, name: school.name } : null)}
                    placeholder="Søg efter din efterskole..."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefonnummer (valgfrit)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+45 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Adgangskode</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Bekræft adgangskode</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Opretter konto..." : "Opret konto"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm">
                Har du allerede en konto?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Log ind
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
