"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SchoolSuggestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SchoolSuggestionDialog({ open, onOpenChange }: SchoolSuggestionDialogProps) {
  const [schoolName, setSchoolName] = useState("")
  const [city, setCity] = useState("")
  const [region, setRegion] = useState("")
  const [website, setWebsite] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to suggest a school")
      setIsSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from("school_suggestions").insert({
      user_id: user.id,
      school_name: schoolName,
      city,
      region,
      website,
      email,
      phone,
      additional_info: additionalInfo,
    })

    if (insertError) {
      setError(insertError.message)
      setIsSubmitting(false)
      return
    }

    setSuccess(true)
    setIsSubmitting(false)

    // Reset form after 2 seconds and close dialog
    setTimeout(() => {
      setSchoolName("")
      setCity("")
      setRegion("")
      setWebsite("")
      setEmail("")
      setPhone("")
      setAdditionalInfo("")
      setSuccess(false)
      onOpenChange(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest a School</DialogTitle>
          <DialogDescription>
            Help us add your efterskole to our list. We&apos;ll review your suggestion and add it soon.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="py-6 text-center">
            <p className="text-green-600 font-medium">Thank you! Your suggestion has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="school-name">School Name *</Label>
              <Input
                id="school-name"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Efterskole Name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="region">Region</Label>
              <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@school.dk"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+45 12 34 56 78"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="additional-info">Additional Information</Label>
              <Textarea
                id="additional-info"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any other details that might help..."
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
