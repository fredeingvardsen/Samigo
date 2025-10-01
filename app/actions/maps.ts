"use server"

export async function getGoogleMapsApiKey(): Promise<string> {
  const apiKey = process.env.MAPS_API_KEY

  if (!apiKey) {
    throw new Error("Google Maps API key not configured")
  }

  return apiKey
}
