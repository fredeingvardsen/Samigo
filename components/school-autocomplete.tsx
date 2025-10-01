"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface School {
  id: string
  name: string
  city: string
  region: string
  address: string
}

interface SchoolAutocompleteProps {
  value: string
  onSchoolSelect: (school: School | null) => void
  placeholder?: string
  required?: boolean
}

export function SchoolAutocomplete({ value, onSchoolSelect, placeholder, required }: SchoolAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [schools, setSchools] = useState<School[]>([])
  const [filteredSchools, setFilteredSchools] = useState<School[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [showSuggestDialog, setShowSuggestDialog] = useState(false)
  const [suggestionForm, setSuggestionForm] = useState({
    schoolName: "",
    city: "",
    region: "",
    website: "",
    email: "",
    phone: "",
    additionalInfo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestionSuccess, setSuggestionSuccess] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load all schools on mount
  useEffect(() => {
    const loadSchools = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("efterskoler").select("id, name, city, region, address").order("name")

      if (!error && data) {
        setSchools(data)
      }
    }
    loadSchools()
  }, [])

  // Filter schools based on input
  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          school.city.toLowerCase().includes(inputValue.toLowerCase()) ||
          school.region.toLowerCase().includes(inputValue.toLowerCase()),
      )
      setFilteredSchools(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      setFilteredSchools([])
      setShowDropdown(false)
    }
  }, [inputValue, schools])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedSchool(null)
    onSchoolSelect(null)
  }

  const handleSchoolSelect = (school: School) => {
    setInputValue(school.name)
    setSelectedSchool(school)
    setShowDropdown(false)
    onSchoolSelect(school)
  }

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Du skal være logget ind")

      const { error } = await supabase.from("school_suggestions").insert({
        user_id: user.id,
        school_name: suggestionForm.schoolName,
        city: suggestionForm.city,
        region: suggestionForm.region,
        website: suggestionForm.website || null,
        email: suggestionForm.email || null,
        phone: suggestionForm.phone || null,
        additional_info: suggestionForm.additionalInfo || null,
        status: "pending",
      })

      if (error) throw error

      setSuggestionSuccess(true)
      setTimeout(() => {
        setShowSuggestDialog(false)
        setSuggestionSuccess(false)
        setSuggestionForm({
          schoolName: "",
          city: "",
          region: "",
          website: "",
          email: "",
          phone: "",
          additionalInfo: "",
        })
      }, 2000)
    } catch (error) {
      console.error("[v0] Error submitting school suggestion:", error)
      alert("Der opstod en fejl ved indsendelse af forslaget")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder || "Søg efter din efterskole..."}
            required={required}
            className={selectedSchool ? "border-green-500" : ""}
          />
          {selectedSchool && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        <Dialog open={showSuggestDialog} onOpenChange={setShowSuggestDialog}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Foreslå skole
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Foreslå en efterskole</DialogTitle>
              <DialogDescription>
                Kan du ikke finde din efterskole? Udfyld formularen nedenfor, så tilføjer vi den hurtigst muligt.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">Skolens navn *</Label>
                <Input
                  id="schoolName"
                  value={suggestionForm.schoolName}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, schoolName: e.target.value })}
                  placeholder="F.eks. Roskilde Efterskole"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">By *</Label>
                  <Input
                    id="city"
                    value={suggestionForm.city}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, city: e.target.value })}
                    placeholder="F.eks. Roskilde"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Input
                    id="region"
                    value={suggestionForm.region}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, region: e.target.value })}
                    placeholder="F.eks. Sjælland"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Hjemmeside</Label>
                <Input
                  id="website"
                  type="url"
                  value={suggestionForm.website}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={suggestionForm.email}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, email: e.target.value })}
                    placeholder="kontakt@skole.dk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={suggestionForm.phone}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, phone: e.target.value })}
                    placeholder="+45 12 34 56 78"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Yderligere information</Label>
                <Textarea
                  id="additionalInfo"
                  value={suggestionForm.additionalInfo}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, additionalInfo: e.target.value })}
                  placeholder="Eventuelle yderligere oplysninger..."
                  rows={3}
                />
              </div>
              {suggestionSuccess && (
                <p className="text-sm text-green-600">Tak for dit forslag! Vi gennemgår det hurtigst muligt.</p>
              )}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Sender..." : "Send forslag"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {showDropdown && filteredSchools.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredSchools.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => handleSchoolSelect(school)}
              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
            >
              <div className="font-medium">{school.name}</div>
              <div className="text-sm text-muted-foreground">
                {school.city}, {school.region}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedSchool && (
        <p className="text-sm text-muted-foreground mt-1">
          {selectedSchool.address || `${selectedSchool.city}, ${selectedSchool.region}`}
        </p>
      )}
    </div>
  )
}
