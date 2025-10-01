"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { SchoolSuggestionDialog } from "@/components/school-suggestion-dialog"

interface School {
  id: string
  name: string
  city: string
}

interface SchoolSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function SchoolSelector({ value, onChange }: SchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false)

  useEffect(() => {
    async function fetchSchools() {
      const supabase = createClient()
      const { data, error } = await supabase.from("efterskoler").select("id, name, city").order("name")

      if (!error && data) {
        setSchools(data)
      }
      setIsLoading(false)
    }

    fetchSchools()
  }, [])

  return (
    <div className="grid gap-2">
      <Label htmlFor="school">Your Efterskole</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id="school">
          <SelectValue placeholder="Select your school" />
        </SelectTrigger>
        <SelectContent>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name} - {school.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={() => setShowSuggestionDialog(true)}>
        Don&apos;t see your school? Suggest it here
      </Button>
      <SchoolSuggestionDialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog} />
    </div>
  )
}
