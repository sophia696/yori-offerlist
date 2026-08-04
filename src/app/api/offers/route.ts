import { NextResponse } from "next/server"
import { fetchOffersFromSheet } from "@/lib/google-sheets"
import { apiResponseSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filterStatus = searchParams.get("status")
    const filterGeo = searchParams.get("geo")

    // Fetch data (from Google Sheets or mock fallback)
    const { data, isMock } = await fetchOffersFromSheet()

    // Apply optional filtering
    let filteredData = data
    if (filterStatus && filterStatus !== "all") {
      filteredData = filteredData.filter(
        (offer) => offer.status?.toLowerCase() === filterStatus.toLowerCase()
      )
    }
    if (filterGeo) {
      filteredData = filteredData.filter(
        (offer) => offer.geo.toLowerCase().includes(filterGeo.toLowerCase())
      )
    }

    // Validate and structure the response using Zod
    const responsePayload = {
      data: filteredData,
      updatedAt: new Date().toISOString(),
      isMockData: isMock,
    }

    const validatedResponse = apiResponseSchema.parse(responsePayload)

    // Send with minimal caching headers so TanStack query can manage the cache
    return NextResponse.json(validatedResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    })
  } catch (error) {
    console.error("API Error in /api/offers:", error)
    return NextResponse.json(
      { error: "Failed to fetch offers data" },
      { status: 500 }
    )
  }
}
