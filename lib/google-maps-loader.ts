// Google Maps API loader utility
import { getGoogleMapsApiKey } from "@/app/actions/maps"

let isLoading = false
let isLoaded = false
let google: any // Declare the google variable

export async function loadGoogleMapsAPI(): Promise<void> {
  // If already loaded, return immediately
  if (isLoaded) {
    return
  }

  // If currently loading, wait for it to complete
  if (isLoading) {
    return new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (isLoaded) {
          clearInterval(checkLoaded)
          resolve()
        }
      }, 100)
    })
  }

  isLoading = true

  return new Promise(async (resolve, reject) => {
    try {
      const apiKey = await getGoogleMapsApiKey()

      if (!apiKey) {
        isLoading = false
        reject(new Error("Google Maps API key not found"))
        return
      }

      // Create script element
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=da&region=DK&loading=async`
      script.async = true
      script.defer = true

      script.onload = () => {
        isLoaded = true
        isLoading = false
        resolve()
      }

      script.onerror = () => {
        isLoading = false
        reject(new Error("Failed to load Google Maps API"))
      }

      document.head.appendChild(script)
    } catch (error) {
      isLoading = false
      reject(error)
    }
  })
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && typeof google !== "undefined" && typeof google.maps !== "undefined"
}
