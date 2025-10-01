"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface RideRequestActionsProps {
  requestId: string
}

export function RideRequestActions({ requestId }: RideRequestActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRequestAction = async (action: "accepted" | "rejected") => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("ride_requests").update({ status: action }).eq("id", requestId)

      if (error) throw error

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      console.error("Error updating request:", error)
      alert("Der opstod en fejl ved opdatering af anmodningen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2 mt-4 pt-4 border-t">
      <Button onClick={() => handleRequestAction("accepted")} disabled={isLoading} size="sm" className="flex-1">
        {isLoading ? "Behandler..." : "Accepter"}
      </Button>
      <Button
        onClick={() => handleRequestAction("rejected")}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex-1 bg-transparent"
      >
        {isLoading ? "Behandler..." : "Afvis"}
      </Button>
    </div>
  )
}
