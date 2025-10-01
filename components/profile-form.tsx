"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SchoolAutocomplete } from "@/components/school-autocomplete"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  school_name: string | null
  school_id: string | null
}

interface ProfileFormProps {
  profile: Profile | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    phone: profile?.phone || "",
  })
  const [selectedSchool, setSelectedSchool] = useState<{ id: string; name: string } | null>(
    profile?.school_id && profile?.school_name ? { id: profile.school_id, name: profile.school_name } : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (!selectedSchool) {
      setError("Vælg venligst din efterskole fra listen")
      setIsLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Du skal være logget ind")

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone: formData.phone || null,
          school_id: selectedSchool.id,
          school_name: selectedSchool.name,
        })
        .eq("id", user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Der opstod en fejl")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil oplysninger</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile?.email || ""} disabled className="bg-muted" />
            <p className="text-sm text-muted-foreground">Email kan ikke ændres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Fulde navn *</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Dit fulde navn"
              required
              value={formData.fullName}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolName">Efterskole *</Label>
            <SchoolAutocomplete
              value={selectedSchool?.name || ""}
              onSchoolSelect={(school) => setSelectedSchool(school ? { id: school.id, name: school.name } : null)}
              placeholder="Søg efter din efterskole..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+45 12 34 56 78"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <p className="text-sm text-muted-foreground">
              Dit telefonnummer deles kun med andre brugere når I bliver matchet til en tur
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Profil opdateret! Omdirigerer til dashboard...</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Gemmer..." : "Gem ændringer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuller
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
