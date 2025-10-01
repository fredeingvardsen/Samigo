// Service for fetching and searching efterskoler data
import { createClient } from "@/lib/supabase/client"

export interface Efterskole {
  id: string
  name: string
  city: string
  address: string
  postal_code: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
}

export async function searchEfterskoler(query: string): Promise<Efterskole[]> {
  if (!query || query.length < 2) return []

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("efterskoler")
      .select("*")
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
      .limit(10)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("[v0] Error searching efterskoler:", error)
    return []
  }
}

export async function getAllEfterskoler(): Promise<Efterskole[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("efterskoler").select("*").order("name")

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("[v0] Error fetching efterskoler:", error)
    return []
  }
}

export async function getEfterskoleByName(name: string): Promise<Efterskole | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("efterskoler").select("*").ilike("name", name).single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("[v0] Error fetching efterskole:", error)
    return null
  }
}
