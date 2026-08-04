import { NextResponse } from "next/server"
import {
  getOffersFromSupabase,
  addOfferToSupabase,
  updateOfferInSupabase,
  deleteOfferFromSupabase,
} from "@/lib/offers-service"

// 1. GET ALL OFFERS (FROM SUPABASE)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filterStatus = searchParams.get("status")
    const filterGeo = searchParams.get("geo")

    let data = await getOffersFromSupabase()

    if (filterStatus && filterStatus !== "all") {
      data = data.filter(
        (offer) => offer.status?.toLowerCase() === filterStatus.toLowerCase()
      )
    }
    if (filterGeo) {
      data = data.filter(
        (offer) => offer.geo.toLowerCase().includes(filterGeo.toLowerCase())
      )
    }

    return NextResponse.json({
      data,
      updatedAt: new Date().toISOString(),
      isMockData: false,
    })
  } catch (error: any) {
    console.error("API GET Error in /api/offers:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch offers from Supabase" },
      { status: 500 }
    )
  }
}

// 2. CREATE NEW OFFER
export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.campaign) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 })
    }

    const newOffer = await addOfferToSupabase(body)
    return NextResponse.json({ success: true, data: newOffer }, { status: 201 })
  } catch (error: any) {
    console.error("API POST Error in /api/offers:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create offer" },
      { status: 500 }
    )
  }
}

// 3. UPDATE OFFER
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: "Offer ID is required for update" }, { status: 400 })
    }

    const updated = await updateOfferInSupabase(id, updates)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error("API PUT Error in /api/offers:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update offer" },
      { status: 500 }
    )
  }
}

// 4. DELETE OFFER
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Offer ID is required for deletion" }, { status: 400 })
    }

    await deleteOfferFromSupabase(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API DELETE Error in /api/offers:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete offer" },
      { status: 500 }
    )
  }
}

