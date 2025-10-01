"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SchoolSelector } from "@/components/school-selector"
import { useRouter } from "next/navigation"

interface ProfileFormProps {
  profile: {
    id: string
    full_name: string
    email: string
    phone: string
    school_id: string
    efterskoler?: {
      id: string
      name: string
      city: string
    }
  } | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [schoolId, setSchoolId] = useState(profile?.school_id || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
        school_id: schoolId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile?.id)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    // Refresh the page to show updated data
    setTimeout(() => {
      router.refresh()
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information and school</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile?.email} disabled className="bg-gray-100" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <SchoolSelector value={schoolId} onChange={setSchoolId} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">Profile updated successfully!</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
